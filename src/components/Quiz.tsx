'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import {
  QUIZ_QUESTIONS,
  calculateQuizResults,
  type QuizAnswers,
  type QuizQuestion,
  type QuizResult,
} from '@/lib/quiz';

interface QuizProps {
  onComplete: (result: QuizResult) => void;
}

export default function Quiz({ onComplete }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;

  const handleSelect = (optionId: string) => {
    if (currentQuestion.multiSelect) {
      // Multi-select: toggle the option
      const current = (answers[currentQuestion.id] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setAnswers({ ...answers, [currentQuestion.id]: updated });
    } else {
      // Single select: set the answer and auto-advance
      setAnswers({ ...answers, [currentQuestion.id]: optionId });

      // Auto-advance after a brief delay for visual feedback
      setTimeout(() => {
        if (currentStep < totalQuestions - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz complete - calculate results
      const result = calculateQuizResults(answers);
      onComplete(result);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered = (question: QuizQuestion): boolean => {
    const answer = answers[question.id];
    if (question.multiSelect) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  };

  const isSelected = (optionId: string): boolean => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.multiSelect) {
      return Array.isArray(answer) && answer.includes(optionId);
    }
    return answer === optionId;
  };

  const canProceed = isAnswered(currentQuestion);
  const isLastQuestion = currentStep === totalQuestions - 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
          <span>Question {currentStep + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
          {currentQuestion.question}
        </h2>
        {currentQuestion.description && (
          <p className="text-[var(--muted)]">{currentQuestion.description}</p>
        )}
        {currentQuestion.multiSelect && (
          <p className="text-sm text-[var(--primary)] mt-2">
            Select all that apply
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option) => {
          const selected = isSelected(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selected
                  ? 'border-[var(--primary)] bg-[var(--secondary)]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    selected
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-gray-300'
                  }`}
                >
                  {selected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      selected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {(currentQuestion.multiSelect || isLastQuestion) && (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-1 px-6 py-2 rounded-lg font-medium transition-all ${
              canProceed
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLastQuestion ? 'See My Results' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
