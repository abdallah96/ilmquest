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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-rose-100 transform transition-all duration-500 hover:shadow-xl">
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

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, index) => {
          const player = players[index];
          return (
            <div 
              key={index} 
              className={`rounded-xl border-2 p-4 text-center transition-all duration-500 transform hover:scale-105 ${
                player 
                  ? "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-300 shadow-md animate-fade-in" 
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 opacity-60"
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              <p className="text-xs font-medium text-rose-700/80 mb-1">Joueur {index + 1}</p>
              <p className="text-sm font-semibold text-rose-800 truncate">
                {player ? (
                  <span className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    {player.name}
                  </span>
                ) : (
                  <span className="text-gray-500">En attente…</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onStart}
        disabled={!isHost || players.length < 2 || selectedLevelIndex === null}
        className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
      >
        {selectedLevelIndex !== null ? "Démarrer la partie" : "Sélectionnez un niveau"}
      </button>
    </div>
  );
}


