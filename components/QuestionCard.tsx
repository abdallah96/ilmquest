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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-rose-100 transform transition-all duration-500 hover:shadow-xl">
      <div className="mb-6">
        <p className="text-lg font-semibold text-rose-800 leading-relaxed animate-fade-in">{question.prompt}</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
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
              className={`relative h-14 rounded-xl border-2 font-medium text-sm transition-all duration-500 transform hover:scale-[1.03] active:scale-[0.97] disabled:hover:scale-100 shadow-sm hover:shadow-md ${
                reveal
                  ? isCorrect
                    ? "bg-gradient-to-r from-green-50 to-green-100 border-green-400 text-green-800 shadow-lg animate-pulse-success"
                    : isWrongChoice
                    ? "bg-gradient-to-r from-red-50 to-red-100 border-red-400 text-red-800 shadow-lg animate-shake"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-600"
                  : isMyAnswer
                  ? "bg-gradient-to-r from-rose-100 to-rose-200 border-rose-400 text-rose-800 shadow-lg animate-pulse-selected"
                  : "bg-gradient-to-r from-rose-50 to-white border-rose-200 text-rose-900 hover:from-rose-100 hover:to-rose-50 hover:border-rose-300 hover:shadow-lg"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5"}`}
              style={{
                animationDelay: `${idx * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <span className="flex items-center justify-center px-4 py-2">
                <span className="flex-1 text-center">{opt}</span>
                {reveal && isCorrect && (
                  <span className="ml-3 text-green-600 text-lg animate-bounce-in">✓</span>
                )}
                {reveal && isWrongChoice && (
                  <span className="ml-3 text-red-600 text-lg animate-bounce-in">✗</span>
                )}
              </span>
              {isMyAnswer && !reveal && (
                <div className="absolute inset-0 rounded-xl bg-rose-400/20 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


