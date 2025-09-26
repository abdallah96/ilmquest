"use client";

type RoomLobbyProps = {
  code: string;
  players: { id: string; name: string }[];
  isHost: boolean;
  onStart: () => void;
};

export default function RoomLobby({ code, players, isHost, onStart }: RoomLobbyProps) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-rose-700">Salle {code}</h2>
        <span className="text-xs text-rose-700/70">Partagez le code</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.map((p) => (
          <div key={p.id} className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
            <p className="text-xs text-rose-700/70">Joueur</p>
            <p className="text-sm font-medium text-rose-800 truncate">{p.name}</p>
          </div>
        ))}
        {players.length < 2 && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
            <p className="text-xs text-rose-700/70">Joueur</p>
            <p className="text-sm font-medium text-rose-800">En attente…</p>
          </div>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={!isHost || players.length < 2}
        className="mt-5 w-full h-11 rounded-lg bg-rose-500 text-white font-medium disabled:opacity-40"
      >
        Démarrer la partie
      </button>
    </div>
  );
}


