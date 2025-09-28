"use client";

import { useState } from "react";

type Props = {
  onDismiss: () => void;
};

export default function WelcomeOverlay({ onDismiss }: Props) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onDismiss();
    }, 700);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-700
        bg-gradient-to-br from-rose-50/95 to-rose-100/95 backdrop-blur-md
        ${isAnimatingOut ? "opacity-0" : "opacity-100"}`}
    >
      <div 
        className={`w-full max-w-sm transform transition-all duration-700
          ${isAnimatingOut ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}
      >
        <div className="rounded-3xl border-2 border-rose-200 bg-white/95 backdrop-blur-sm shadow-2xl p-8 text-center animate-fade-in">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-xl animate-bounce-in">
              <span className="text-3xl text-white">🕌</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-rose-700 mb-3 animate-fade-in" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
            Bienvenue à IlmQuest !
          </h2>
          
          <p className="text-sm text-rose-700/80 mb-6 leading-relaxed animate-fade-in" style={{animationDelay: '400ms', animationFillMode: 'both'}}>
            Quiz islamique multijoueur – Testez vos connaissances avec vos amis !
          </p>
          
          <div className="space-y-2 mb-6 animate-fade-in" style={{animationDelay: '600ms', animationFillMode: 'both'}}>
            <div className="flex items-center justify-center text-xs text-rose-700">
              <span className="mr-2">🎯</span> 25 niveaux • 5 questions chacun
            </div>
            <div className="flex items-center justify-center text-xs text-rose-700">
              <span className="mr-2">👥</span> Jusqu&apos;à 4 joueurs simultanément
            </div>
            <div className="flex items-center justify-center text-xs text-rose-700">
              <span className="mr-2">🏆</span> Difficulté croissante
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-bounce-in"
            style={{animationDelay: '800ms', animationFillMode: 'both'}}
          >
            ✨ Bismillah, commencer
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 animate-fade-in" style={{animationDelay: '1000ms', animationFillMode: 'both'}}>
          <div className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-rose-300 animate-pulse" style={{animationDelay: '200ms'}} />
          <div className="h-2 w-2 rounded-full bg-rose-200 animate-pulse" style={{animationDelay: '400ms'}} />
        </div>
      </div>
    </div>
  );
}


