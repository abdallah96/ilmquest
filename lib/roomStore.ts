import { customAlphabet } from "nanoid";
import { questionBank, QuizQuestion } from "@/data/questions";

export type RoomPhase = "lobby" | "active" | "level-complete" | "ended";

export type PlayerProfile = {
  id: string;
  socketId: string;
  displayName: string;
  score: number;
  joinedAt: number;
};

export type AnswerSnapshot = {
  playerId: string;
  questionId: string;
  chosenIndex: number;
  correctIndex: number;
  isCorrect: boolean;
};

export type RoomSnapshot = {
  code: string;
  phase: RoomPhase;
  hostId: string;
  players: PlayerProfile[];
  turnId: string | null;
  activeQuestion: QuizQuestion | null;
  levelIndex: number; // 0-based
  totalLevels: number;
  questionInLevel: number; // 0..questionsPerLevel-1
  questionsPerLevel: number;
  lastAnswer: AnswerSnapshot | null;
};

type RoomRecord = {
  data: RoomSnapshot;
  levels: QuizQuestion[][]; // levels[levelIndex][questionInLevel]
};

const codeGenerator = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

const PLAYER_LIMIT = 4;
const MIN_PLAYERS = 2;

export type JoinOutcome =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; reason: "room-not-found" | "room-full" | "room-started" };

export type StartOutcome =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; reason: "room-not-found" | "not-host" | "missing-players" };

export type AnswerOutcome =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; reason: "room-not-found" | "not-active" | "not-your-turn" | "unknown-player" };

export type LeaveOutcome =
  | { code: string; snapshot: RoomSnapshot }
  | { code: string; snapshot: null }
  | null;

const questionBuckets: Record<QuizQuestion["difficulty"], QuizQuestion[]> = {
  easy: questionBank.filter((item) => item.difficulty === "easy"),
  medium: questionBank.filter((item) => item.difficulty === "medium"),
  hard: questionBank.filter((item) => item.difficulty === "hard"),
};

const DEFAULT_LEVELS = 25;
const DEFAULT_QUESTIONS_PER_LEVEL = 5;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildLevels(totalLevels: number, questionsPerLevel: number): QuizQuestion[][] {
  const difficultiesPattern: QuizQuestion["difficulty"][] = [
    "easy",
    "easy",
    "medium",
    "medium",
    "hard",
  ];
  const levels: QuizQuestion[][] = [];
  for (let lvl = 0; lvl < totalLevels; lvl += 1) {
    const levelQuestions: QuizQuestion[] = [];
    for (let idx = 0; idx < questionsPerLevel; idx += 1) {
      const difficulty = difficultiesPattern[idx % difficultiesPattern.length];
      const pool = questionBuckets[difficulty];
      levelQuestions.push(pickRandom(pool));
    }
    levels.push(levelQuestions);
  }
  return levels;
}

function rotateTurn(room: RoomRecord): string | null {
  const identifiers = room.data.players.map((entry) => entry.id);
  if (identifiers.length === 0) {
    return null;
  }
  if (!room.data.turnId) {
    return identifiers[0];
  }
  const index = identifiers.indexOf(room.data.turnId);
  if (index === -1) {
    return identifiers[0];
  }
  const nextIndex = (index + 1) % identifiers.length;
  return identifiers[nextIndex];
}

export class RoomStore {
  private rooms = new Map<string, RoomRecord>();

  createRoom(hostSocketId: string, hostName: string): RoomSnapshot {
    const code = this.generateUnusedCode();
    const hostProfile: PlayerProfile = {
      id: hostSocketId,
      socketId: hostSocketId,
      displayName: hostName,
      score: 0,
      joinedAt: Date.now(),
    };
    const levels = buildLevels(DEFAULT_LEVELS, DEFAULT_QUESTIONS_PER_LEVEL);
    const room: RoomRecord = {
      data: {
        code,
        phase: "lobby",
        hostId: hostSocketId,
        players: [hostProfile],
        turnId: null,
        activeQuestion: null,
        levelIndex: 0,
        totalLevels: levels.length,
        questionInLevel: 0,
        questionsPerLevel: DEFAULT_QUESTIONS_PER_LEVEL,
        lastAnswer: null,
      },
      levels,
    };
    this.rooms.set(code, room);
    return room.data;
  }

  joinRoom(code: string, socketId: string, displayName: string): JoinOutcome {
    const formattedCode = code.trim().toUpperCase();
    const entry = this.rooms.get(formattedCode);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.phase !== "lobby") {
      return { ok: false, reason: "room-started" };
    }
    if (entry.data.players.length >= PLAYER_LIMIT) {
      return { ok: false, reason: "room-full" };
    }
    const existing = entry.data.players.find((player) => player.socketId === socketId);
    if (existing) {
      existing.displayName = displayName;
      return { ok: true, snapshot: entry.data };
    }
    const profile: PlayerProfile = {
      id: socketId,
      socketId,
      displayName,
      score: 0,
      joinedAt: Date.now(),
    };
    entry.data.players.push(profile);
    entry.data.players.sort((left, right) => left.joinedAt - right.joinedAt);
    return { ok: true, snapshot: entry.data };
  }

  leaveRoom(socketId: string): LeaveOutcome {
    for (const [code, entry] of this.rooms.entries()) {
      const index = entry.data.players.findIndex((player) => player.socketId === socketId);
      if (index !== -1) {
        const [removed] = entry.data.players.splice(index, 1);
        if (entry.data.hostId === removed.id) {
          entry.data.hostId = entry.data.players[0]?.id ?? "";
        }
        if (entry.data.players.length === 0) {
          this.rooms.delete(code);
          return { code, snapshot: null };
        }
        if (entry.data.turnId === removed.id) {
          entry.data.turnId = rotateTurn(entry);
        }
        if (entry.data.phase === "active" && entry.data.players.length < MIN_PLAYERS) {
          entry.data.phase = "ended";
          entry.data.turnId = null;
          entry.data.activeQuestion = null;
        }
        return { code, snapshot: entry.data };
      }
    }
    return null;
  }

  startGame(code: string, initiatorId: string): StartOutcome {
    const entry = this.rooms.get(code);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.hostId !== initiatorId) {
      return { ok: false, reason: "not-host" };
    }
    if (entry.data.players.length < MIN_PLAYERS) {
      return { ok: false, reason: "missing-players" };
    }
    entry.data.phase = "active";
    entry.data.levelIndex = 0;
    entry.data.questionInLevel = 0;
    entry.data.lastAnswer = null;
    entry.data.turnId = entry.data.players[0]?.id || null;
    entry.data.activeQuestion = entry.levels[0]?.[0] || null;
    entry.data.players = entry.data.players.map((player) => ({
      ...player,
      score: 0,
    }));
    return { ok: true, snapshot: entry.data };
  }

  submitAnswer(code: string, playerId: string, optionIndex: number): AnswerOutcome {
    const entry = this.rooms.get(code);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.phase !== "active") {
      return { ok: false, reason: "not-active" };
    }
    if (entry.data.turnId !== playerId) {
      return { ok: false, reason: "not-your-turn" };
    }
    const playerExists = entry.data.players.some((player) => player.id === playerId);
    if (!playerExists) {
      return { ok: false, reason: "unknown-player" };
    }
    const currentQuestion = entry.levels[entry.data.levelIndex]?.[entry.data.questionInLevel];
    if (!currentQuestion) {
      return { ok: false, reason: "not-active" };
    }
    const isCorrect = currentQuestion.answerIndex === optionIndex;
    if (isCorrect) {
      entry.data.players = entry.data.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              score: player.score + 1,
            }
          : player,
      );
    }
    entry.data.lastAnswer = {
      playerId,
      questionId: currentQuestion.id,
      chosenIndex: optionIndex,
      correctIndex: currentQuestion.answerIndex,
      isCorrect,
    };
    const nextQuestionInLevel = entry.data.questionInLevel + 1;
    if (nextQuestionInLevel >= entry.data.questionsPerLevel) {
      entry.data.phase = "level-complete";
      entry.data.turnId = null;
      entry.data.activeQuestion = null;
      return { ok: true, snapshot: entry.data };
    }
    entry.data.questionInLevel = nextQuestionInLevel;
    entry.data.turnId = rotateTurn(entry);
    entry.data.activeQuestion = entry.levels[entry.data.levelIndex]?.[nextQuestionInLevel] ?? null;
    return { ok: true, snapshot: entry.data };
  }

  nextLevel(code: string, initiatorId: string): StartOutcome {
    const entry = this.rooms.get(code);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.hostId !== initiatorId) {
      return { ok: false, reason: "not-host" };
    }
    if (entry.data.phase !== "level-complete") {
      return { ok: true, snapshot: entry.data };
    }
    const nextLevelIndex = entry.data.levelIndex + 1;
    if (nextLevelIndex >= entry.data.totalLevels) {
      entry.data.phase = "ended";
      entry.data.turnId = null;
      entry.data.activeQuestion = null;
      return { ok: true, snapshot: entry.data };
    }
    entry.data.levelIndex = nextLevelIndex;
    entry.data.questionInLevel = 0;
    entry.data.phase = "active";
    entry.data.turnId = rotateTurn(entry);
    entry.data.activeQuestion = entry.levels[entry.data.levelIndex]?.[0] ?? null;
    return { ok: true, snapshot: entry.data };
  }

  snapshot(code: string): RoomSnapshot | null {
    return this.rooms.get(code)?.data ?? null;
  }

  private generateUnusedCode(): string {
    let attempt = codeGenerator();
    while (this.rooms.has(attempt)) {
      attempt = codeGenerator();
    }
    return attempt;
  }
}

export const roomStore = new RoomStore();

