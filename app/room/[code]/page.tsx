"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import RoomLobby from "@/components/RoomLobby";
import QuestionCard from "@/components/QuestionCard";

type Snapshot = import("@/lib/roomStore").RoomSnapshot;

let clientSocket: Socket | null = null;

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params?.code || "-----").toString().toUpperCase();

  const [username, setUsername] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  // removed unused connecting state

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ilmquest_username");
      if (saved) setUsername(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!username) return;
    if (!clientSocket) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "";
      clientSocket = url ? io(url, { path: "/api/socket" }) : io({ path: "/api/socket" });
    }
    const s = clientSocket;
    const onUpdate = (snap: Snapshot) => {
      setSnapshot(snap);
      if (snap.code && snap.code !== code) {
        router.replace(`/room/${snap.code}`);
      }
    };
    const onError = (reason: string) => {
      if (reason === "room-not-found") {
        s.emit("room:create", { code, name: username });
      }
    };
    s.on("room:update", onUpdate);
    s.on("room:error", onError);
    s.emit("room:join", { code, name: username });
    s.emit("room:snapshot", { code });
    // socket ready
    return () => {
      s.off("room:update", onUpdate);
      s.off("room:error", onError);
    };
  }, [username, code, router]);

  const isHost = useMemo(() => {
    if (!snapshot) return false;
    return snapshot.hostId === (clientSocket?.id ?? "");
  }, [snapshot]);

  function startGame() {
    clientSocket?.emit("room:start", { code });
  }

  const myChoice = useMemo(() => {
    if (!snapshot) return null;
    const myId = clientSocket?.id ?? "";
    const chosen = snapshot.reveal?.choices?.find?.((c) => c.playerId === myId)?.chosenIndex;
    return typeof chosen === "number" ? chosen : null;
  }, [snapshot]);

  function submitAnswer(index: number) {
    clientSocket?.emit("room:answer", { code, optionIndex: index });
  }

  return (
    <main className="mx-auto max-w-md w-full px-4 py-10 sm:py-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-rose-700">Salle {code}</h1>
        <p className="text-sm text-rose-700/80 mt-1">
          {snapshot?.phase === "active" ? "Partie en cours" : snapshot?.phase === "ended" ? "Partie terminée" : "En attente des joueurs…"}
        </p>
      </div>

      {!snapshot || snapshot.phase === "lobby" ? (
        <RoomLobby
          code={code}
          players={(snapshot?.players ?? []).map((p) => ({ id: p.id, name: p.displayName }))}
          isHost={isHost}
          onStart={startGame}
          selectedLevelIndex={snapshot?.selectedLevelIndex ?? null}
          onSelectLevel={(levelIndex) => clientSocket?.emit("room:select-level", { code, levelIndex })}
        />
      ) : snapshot.phase === "active" ? (
        <>
          <QuestionCard
            question={{
              id: snapshot.activeQuestion?.id ?? "",
              prompt: snapshot.activeQuestion?.prompt ?? "",
              options: snapshot.activeQuestion?.options ?? [],
            }}
            onSelect={submitAnswer}
            disabled={!!snapshot.reveal || myChoice !== null}
            reveal={snapshot.reveal ? { correctIndex: snapshot.reveal.correctIndex, chosenIndex: myChoice } : null}
          />
          {myChoice !== null && !snapshot.reveal && (
            <p className="mt-3 text-center text-xs text-rose-700/70">
              En attente des autres joueurs ({snapshot.answeredCount}/{snapshot.players.length})…
            </p>
          )}
          {isHost && snapshot.reveal && (
            <button
              onClick={() => clientSocket?.emit("room:next-question", { code })}
              className="mt-4 w-full h-11 rounded-lg bg-rose-600 text-white font-medium"
            >
              Question suivante
            </button>
          )}
        </>
      ) : snapshot.phase === "level-complete" ? (
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100 text-center">
          <p className="text-sm text-rose-800">Niveau {snapshot.levelIndex + 1} terminé.</p>
          <p className="text-xs text-rose-700/70 mt-1">
            Score: {snapshot.players.map((p) => `${p.displayName}: ${p.score}`).join(" · ")}
          </p>
          {isHost ? (
            <button onClick={() => clientSocket?.emit("room:next-level", { code })} className="mt-5 w-full h-11 rounded-lg bg-rose-600 text-white font-medium">
              Démarrer le niveau suivant
            </button>
          ) : (
            <p className="mt-4 text-xs text-rose-700/70">En attente de l’hôte…</p>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100 text-center">
          <p className="text-sm text-rose-800">Partie terminée.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(snapshot?.players ?? []).map((p, index) => (
              <div key={p.id} className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
                <p className="text-xs text-rose-700/70 truncate">{p.displayName}</p>
                <p className="text-2xl font-semibold text-rose-800">{p.score}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}




