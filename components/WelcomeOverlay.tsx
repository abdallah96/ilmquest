"use client";

import { useEffect, useState } from "react";

type Props = {
  onDismiss: () => void;
};

export default function WelcomeOverlay({ onDismiss }: Props) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,#ffdbe7_0%,#fff5f9_60%,#fff5f9_100%)]">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-rose-200 bg-white/80 backdrop-blur shadow-sm p-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌙</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-rose-700">Bienvenue</h2>
          <p className="mt-1 text-sm text-rose-700/80">IlmQuest – Quiz islamique multijoueur</p>
          <button
            onClick={onDismiss}
            className="mt-5 w-full h-11 rounded-lg bg-rose-600 text-white font-medium active:scale-[0.99] transition"
          >
            Bismillah, commencer
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-rose-700/70 text-xs">
          <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-bounce" />
          <div className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-bounce [animation-delay:120ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-rose-200 animate-bounce [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}


