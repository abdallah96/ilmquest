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
};

export default function QuestionCard({ question, onSelect, disabled }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <p className="text-base font-medium text-rose-800">{question.prompt}</p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelect(idx)}
            className="h-11 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 active:scale-[0.99] transition disabled:opacity-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}


