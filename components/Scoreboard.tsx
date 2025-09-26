"use client";

type Props = {
  players: { id: string; name: string; score: number }[];
};

export default function Scoreboard({ players }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <h2 className="text-lg font-semibold text-rose-700 mb-3">Résultats</h2>
      <div className="grid grid-cols-2 gap-3">
        {players.map((p) => (
          <div key={p.id} className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
            <p className="text-xs text-rose-700/70 truncate">{p.name}</p>
            <p className="text-2xl font-semibold text-rose-800">{p.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


