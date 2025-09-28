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

export type RevealSnapshot = {
  correctIndex: number;
  choices: { playerId: string; chosenIndex: number }[];
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
  selectedLevelIndex: number | null;
  answeredCount: number;
  reveal: RevealSnapshot | null;
};

type RoomRecord = {
  data: RoomSnapshot;
  levels: QuizQuestion[][]; // levels[levelIndex][questionInLevel]
  answers: Map<string, number>; // playerId -> chosen option index for current question
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

export type LevelSelectOutcome =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; reason: "room-not-found" | "not-host" | "invalid-level" };

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

function shuffleQuestion(question: QuizQuestion): QuizQuestion {
  const correctAnswer = question.options[question.answerIndex];
  const shuffledOptions = [...question.options];
  
  // Fisher-Yates shuffle
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  // Find new index of correct answer
  const newAnswerIndex = shuffledOptions.indexOf(correctAnswer);
  
  return {
    ...question,
    options: shuffledOptions,
    answerIndex: newAnswerIndex,
  };
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
          const randomQuestion = pickRandom(pool);
          levelQuestions.push(shuffleQuestion(randomQuestion));
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

  createRoom(hostSocketId: string, hostName: string, preferredCode?: string): RoomSnapshot {
    const requested = (preferredCode || "").trim().toUpperCase();
    const code = requested && !this.rooms.has(requested) ? requested : this.generateUnusedCode();
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
        selectedLevelIndex: null,
        answeredCount: 0,
        reveal: null,
      },
      levels,
      answers: new Map<string, number>(),
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
    entry.data.levelIndex = entry.data.selectedLevelIndex ?? 0;
    entry.data.questionInLevel = 0;
    entry.data.lastAnswer = null;
    entry.data.turnId = null;
    entry.data.activeQuestion = entry.levels[entry.data.levelIndex]?.[0] || null;
    entry.answers.clear();
    entry.data.answeredCount = 0;
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
    const playerExists = entry.data.players.some((player) => player.id === playerId);
    if (!playerExists) {
      return { ok: false, reason: "unknown-player" };
    }
    const currentQuestion = entry.levels[entry.data.levelIndex]?.[entry.data.questionInLevel];
    if (!currentQuestion) {
      return { ok: false, reason: "not-active" };
    }
    if (entry.answers.has(playerId)) {
      return { ok: true, snapshot: entry.data };
    }
    entry.answers.set(playerId, optionIndex);
    entry.data.answeredCount = entry.answers.size;
    if (entry.answers.size < entry.data.players.length) {
      return { ok: true, snapshot: entry.data };
    }
    const choicesArray: { playerId: string; chosenIndex: number }[] = [];
    for (const [pid, choice] of entry.answers.entries()) {
      choicesArray.push({ playerId: pid, chosenIndex: choice });
      if (currentQuestion.answerIndex === choice) {
        entry.data.players = entry.data.players.map((p) =>
          p.id === pid ? { ...p, score: p.score + 1 } : p,
        );
      }
    }
    entry.data.reveal = {
      correctIndex: currentQuestion.answerIndex,
      choices: choicesArray,
    };
    entry.data.lastAnswer = {
      playerId,
      questionId: currentQuestion.id,
      chosenIndex: optionIndex,
      correctIndex: currentQuestion.answerIndex,
      isCorrect: false,
    };
    // Stay on reveal until host advances
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
    entry.data.turnId = null;
    entry.data.activeQuestion = entry.levels[entry.data.levelIndex]?.[0] ?? null;
    entry.answers.clear();
    entry.data.answeredCount = 0;
    return { ok: true, snapshot: entry.data };
  }

  nextQuestion(code: string, initiatorId: string): StartOutcome {
    const entry = this.rooms.get(code);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.hostId !== initiatorId) {
      return { ok: false, reason: "not-host" };
    }
    if (entry.data.phase !== "active") {
      return { ok: false, reason: "not-host" };
    }
    const nextQuestionInLevel = entry.data.questionInLevel + 1;
    entry.answers.clear();
    entry.data.answeredCount = 0;
    entry.data.reveal = null;
    if (nextQuestionInLevel >= entry.data.questionsPerLevel) {
      entry.data.phase = "level-complete";
      entry.data.turnId = null;
      entry.data.activeQuestion = null;
      return { ok: true, snapshot: entry.data };
    }
    entry.data.questionInLevel = nextQuestionInLevel;
    entry.data.turnId = null;
    entry.data.activeQuestion = entry.levels[entry.data.levelIndex]?.[nextQuestionInLevel] ?? null;
    return { ok: true, snapshot: entry.data };
  }

  selectLevel(code: string, initiatorId: string, levelIndex: number): LevelSelectOutcome {
    const entry = this.rooms.get(code);
    if (!entry) {
      return { ok: false, reason: "room-not-found" };
    }
    if (entry.data.hostId !== initiatorId) {
      return { ok: false, reason: "not-host" };
    }
    const maxIndex = entry.data.totalLevels - 1;
    if (levelIndex < 0 || levelIndex > maxIndex) {
      return { ok: false, reason: "invalid-level" };
    }
    entry.data.selectedLevelIndex = levelIndex;
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

