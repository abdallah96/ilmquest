"use client";

type RoomLobbyProps = {
  code: string;
  players: { id: string; name: string }[];
  isHost: boolean;
  onStart: () => void;
  selectedLevelIndex?: number | null;
  onSelectLevel?: (levelIndex: number) => void;
};

export default function RoomLobby({ code, players, isHost, onStart, selectedLevelIndex = null, onSelectLevel }: RoomLobbyProps) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <div className="mt-3">
        <p className="text-sm font-medium text-rose-800 mb-2">Sélection du niveau</p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => (
            <button
              key={i}
              disabled={!isHost}
              onClick={() => onSelectLevel?.(i)}
              className={`h-9 rounded-md text-xs border transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                selectedLevelIndex === i 
                  ? "bg-rose-600 text-white border-rose-600 shadow-md" 
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
              } ${!isHost ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {!isHost && <p className="text-[11px] text-rose-700/70 mt-1">En attente du choix de l’hôte…</p>}
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-rose-700">Salle {code}</h2>
        <span className="text-xs text-rose-700/70">Partagez le code</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => {
          const player = players[index];
          return (
            <div key={index} className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
              <p className="text-xs text-rose-700/70">Joueur {index + 1}</p>
              <p className="text-sm font-medium text-rose-800 truncate">
                {player ? player.name : "En attente…"}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onStart}
        disabled={!isHost || players.length < 2 || selectedLevelIndex === null}
        className="mt-5 w-full h-11 rounded-lg bg-rose-500 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        Démarrer la partie
      </button>
    </div>
  );
}


