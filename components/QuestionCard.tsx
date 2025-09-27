"use client";

export type Question = {
  id: string;
  prompt: string;
  options: string[];
};

type Props = {
  question: Question;
  onSelect: (index: number) => void;
  disabled?: boolean;
  reveal?: { correctIndex: number; chosenIndex?: number | null } | null;
};

export default function QuestionCard({ question, onSelect, disabled, reveal = null }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <p className="text-base font-medium text-rose-800">{question.prompt}</p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {question.options.map((opt, idx) => {
          const isCorrect = reveal ? idx === reveal.correctIndex : false;
          const isMine = reveal && reveal.chosenIndex != null ? idx === reveal.chosenIndex : false;
          return (
            <button
              key={idx}
              disabled={disabled || !!reveal}
              onClick={() => onSelect(idx)}
              className={`h-11 rounded-lg border text-rose-900 active:scale-[0.99] transition disabled:opacity-70 ${
                reveal
                  ? isCorrect
                    ? "bg-emerald-50 border-emerald-300"
                    : isMine
                    ? "bg-rose-50 border-rose-300"
                    : "bg-rose-50 border-rose-200"
                  : "bg-rose-50 border-rose-200 hover:bg-rose-100"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}


