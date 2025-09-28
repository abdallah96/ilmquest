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
  myAnswer?: number | null;
};

export default function QuestionCard({ question, onSelect, disabled, reveal = null, myAnswer = null }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm border border-rose-100">
      <p className="text-base font-medium text-rose-800">{question.prompt}</p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {question.options.map((opt, idx) => {
          const isCorrect = reveal ? idx === reveal.correctIndex : false;
          const isMine = reveal && reveal.chosenIndex != null ? idx === reveal.chosenIndex : false;
          const isMyAnswer = myAnswer === idx;
          const isWrongChoice = reveal && isMine && !isCorrect;
          
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelect(idx)}
              className={`h-11 rounded-lg border text-rose-900 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 ${
                reveal
                  ? isCorrect
                    ? "bg-green-100 border-green-400 text-green-800 shadow-md"
                    : isWrongChoice
                    ? "bg-red-100 border-red-400 text-red-800 shadow-md"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                  : isMyAnswer
                  ? "bg-rose-200 border-rose-400 shadow-md"
                  : "bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
              } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <span className="flex items-center justify-center">
                {opt}
                {reveal && isCorrect && <span className="ml-2 text-green-600">✓</span>}
                {reveal && isWrongChoice && <span className="ml-2 text-red-600">✗</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


