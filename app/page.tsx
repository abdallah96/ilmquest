"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ilmquest_username");
      if (saved) {
        setUsername(saved);
      }
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-rose-700">IlmQuest</h1>
        <p className="text-sm text-rose-700/80 mt-1">Quiz islamique multijoueur – mobile d'abord</p>
      </div>

      <section className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
        <label className="block text-sm font-medium text-rose-800 mb-1">Votre prénom</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ex: Abdallah, Fatima"
          className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 outline-none focus:border-rose-400"
        />

        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            disabled={isCreateDisabled}
            onClick={handleCreateRoom}
            className="h-11 rounded-lg bg-rose-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition"
          >
            Créer une salle
          </button>

          <div className="flex items-center gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code à 5 caractères"
              maxLength={5}
              className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 outline-none focus:border-rose-400 tracking-[0.2em] uppercase"
            />
            <button
              disabled={isJoinDisabled}
              onClick={handleJoinRoom}
              className="h-11 px-4 rounded-lg bg-rose-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition"
            >
              Rejoindre
            </button>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-rose-700/70 mt-6">Entrez votre prénom pour continuer</p>
    </main>
  );
}
