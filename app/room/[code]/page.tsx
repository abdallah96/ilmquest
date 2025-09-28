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
  const [myAnswer, setMyAnswer] = useState<number | null>(null);

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
      // Reset answer when new question starts
      if (snap.phase === "active" && !snap.reveal && snap.answeredCount === 0) {
        setMyAnswer(null);
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
    if (myAnswer !== null) return; // Already answered
    setMyAnswer(index);
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
            disabled={!!snapshot.reveal || myAnswer !== null}
            reveal={snapshot.reveal ? { correctIndex: snapshot.reveal.correctIndex, chosenIndex: myChoice } : null}
            myAnswer={myAnswer}
          />
          {myAnswer !== null && !snapshot.reveal && (
            <p className="mt-3 text-center text-xs text-rose-700/70">
              En attente des autres joueurs ({snapshot.answeredCount}/{snapshot.players.length})…
            </p>
          )}
          {isHost && snapshot.reveal && (
            <button
              onClick={() => clientSocket?.emit("room:next-question", { code })}
              className="mt-4 w-full h-11 rounded-lg bg-rose-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              Question suivante
            </button>
          )}
        </>
      ) : snapshot.phase === "level-complete" ? (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-rose-100 text-center animate-fade-in">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center animate-bounce-in">
              <span className="text-2xl text-white">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-rose-800 mb-2">Niveau {snapshot.levelIndex + 1} terminé !</h3>
            <p className="text-sm text-rose-700/80">
              Score: {snapshot.players.map((p) => `${p.displayName}: ${p.score}`).join(" · ")}
            </p>
          </div>
          
          <div className="space-y-3">
            {isHost && snapshot.levelIndex < snapshot.totalLevels - 1 && (
              <button 
                onClick={() => clientSocket?.emit("room:next-level", { code })} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              >
                Démarrer le niveau suivant
              </button>
            )}
            
            <button 
              onClick={() => router.push("/")} 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              Retour au menu principal
            </button>
            
            {!isHost && snapshot.levelIndex < snapshot.totalLevels - 1 && (
              <p className="text-xs text-rose-700/70 mt-2">En attente de l&apos;hôte…</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-rose-100 text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-in">
              <span className="text-3xl text-white">🏆</span>
            </div>
            <h3 className="text-2xl font-bold text-rose-800 mb-2">Partie terminée !</h3>
            <p className="text-sm text-rose-700/80">Félicitations à tous les participants</p>
          </div>

          <div className="space-y-4 mb-6">
            {(snapshot?.players ?? [])
              .sort((a, b) => b.score - a.score)
              .map((player, index) => {
                const isWinner = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                return (
                  <div
                    key={player.id}
                    className={`relative rounded-2xl p-4 transition-all duration-500 transform hover:scale-[1.02] animate-fade-in ${
                      isWinner
                        ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-lg"
                        : isSecond
                        ? "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-400 shadow-md"
                        : isThird
                        ? "bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-400 shadow-md"
                        : "bg-gradient-to-r from-rose-50 to-rose-100 border-2 border-rose-300 shadow-sm"
                    }`}
                    style={{
                      animationDelay: `${index * 200}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                          isWinner
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : isSecond
                            ? "bg-gradient-to-br from-gray-400 to-gray-600"
                            : isThird
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : "bg-gradient-to-br from-rose-400 to-rose-600"
                        }`}>
                          {isWinner ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : `${index + 1}`}
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold truncate ${
                            isWinner ? "text-yellow-800" : isSecond ? "text-gray-800" : isThird ? "text-orange-800" : "text-rose-800"
                          }`}>
                            {player.displayName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {index === 0 ? "Champion" : index === 1 ? "Vice-champion" : index === 2 ? "Troisième place" : `${index + 1}ème place`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          isWinner ? "text-yellow-800" : isSecond ? "text-gray-800" : isThird ? "text-orange-800" : "text-rose-800"
                        }`}>
                          {player.score}
                        </p>
                        <p className="text-xs text-gray-600">points</p>
                      </div>
                    </div>
                    
                    {isWinner && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-white text-sm">👑</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              🏠 Retour au menu principal
            </button>
            
            <p className="text-xs text-rose-700/70">Merci d&apos;avoir joué à IlmQuest !</p>
          </div>
        </div>
      )}
    </main>
  );
}




