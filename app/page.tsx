"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WelcomeOverlay from "@/components/WelcomeOverlay";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return window.localStorage.getItem("ilmquest_welcome_dismissed") !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ilmquest_username");
      if (saved) {
        setUsername(saved);
      }
      const dismissed = window.localStorage.getItem("ilmquest_welcome_dismissed");
      if (dismissed === "1") setShowWelcome(false);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (username.trim().length > 0) {
        window.localStorage.setItem("ilmquest_username", username.trim());
      }
    } catch {}
  }, [username]);

  function handleCreateRoom() {
    const generated = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "QURAN";
    try {
      // Ensure socket server is initialized
      fetch("/api/socket");
    } catch {}
    router.push(`/room/${generated}`);
  }

  function handleJoinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length === 5) {
      router.push(`/room/${code}`);
    }
  }

  const isCreateDisabled = useMemo(() => username.trim().length === 0, [username]);
  const isJoinDisabled = useMemo(() => username.trim().length === 0 || joinCode.trim().length !== 5, [username, joinCode]);

  return (
    <main className="mx-auto max-w-md w-full px-4 py-10 sm:py-12">
      <div className="text-center mb-8 animate-fade-in">
        <div className="mb-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <span className="text-3xl text-white">🕌</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-rose-700 mb-2 animate-fade-in" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
          IlmQuest
        </h1>
        <p className="text-sm text-rose-700/80 animate-fade-in" style={{animationDelay: '400ms', animationFillMode: 'both'}}>
          Quiz islamique multijoueur – mobile d&apos;abord
        </p>
      </div>

      <section className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-rose-100 animate-fade-in" style={{animationDelay: '600ms', animationFillMode: 'both'}}>
        <label className="block text-sm font-medium text-rose-800 mb-1">Votre prénom</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ex: Abdallah, Fatima"
          className="w-full rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 outline-none focus:border-rose-400 focus:bg-white transition-all duration-300 animate-fade-in"
          style={{animationDelay: '800ms', animationFillMode: 'both'}}
        />

        <div className="mt-6 grid grid-cols-1 gap-4">
          <button
            disabled={isCreateDisabled}
            onClick={handleCreateRoom}
            className="h-12 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-500 animate-fade-in"
            style={{animationDelay: '1000ms', animationFillMode: 'both'}}
          >
            🎮 Créer une salle
          </button>

          <div className="flex items-center gap-3 animate-fade-in" style={{animationDelay: '1200ms', animationFillMode: 'both'}}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code à 5 caractères"
              maxLength={5}
              className="flex-1 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 outline-none focus:border-rose-400 focus:bg-white tracking-[0.2em] uppercase font-mono font-bold transition-all duration-300"
            />
            <button
              disabled={isJoinDisabled}
              onClick={handleJoinRoom}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-500"
            >
              🚪 Rejoindre
            </button>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-rose-700/70 mt-6 animate-fade-in" style={{animationDelay: '1400ms', animationFillMode: 'both'}}>
        Entrez votre prénom pour continuer
      </p>

      {showWelcome && (
        <WelcomeOverlay
          onDismiss={() => {
            setShowWelcome(false);
            try { window.localStorage.setItem("ilmquest_welcome_dismissed", "1"); } catch {}
          }}
        />
      )}
    </main>
  );
}
