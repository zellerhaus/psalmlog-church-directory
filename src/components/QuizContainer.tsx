'use client';

import { useState } from 'react';
import Quiz from './Quiz';
import QuizResults from './QuizResults';
import { type QuizResult } from '@/lib/quiz';

type QuizState = 'intro' | 'questions' | 'results';

interface QuizContainerProps {
  showIntro?: boolean;
}

export default function QuizContainer({ showIntro = true }: QuizContainerProps) {
  const [state, setState] = useState<QuizState>(showIntro ? 'intro' : 'questions');
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleStart = () => {
    setState('questions');
  };

  const handleComplete = (quizResult: QuizResult) => {
    setResult(quizResult);
    setState('results');
    // Scroll to top when showing results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setResult(null);
    setState('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (state === 'results' && result) {
    return (
      <div>
        <QuizResults result={result} />
        <div className="text-center mt-8">
          <button
            onClick={handleRetake}
            className="text-[var(--muted)] hover:text-[var(--foreground)] underline"
          >
            Retake the quiz
          </button>
        </div>
      </div>
    );
  }

  if (state === 'questions') {
    return <Quiz onComplete={handleComplete} />;
  }

  // Intro state
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <span className="inline-block px-4 py-2 bg-[var(--secondary)] text-[var(--primary)] text-sm font-medium rounded-full mb-4">
          2-3 minute quiz
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
          Ready to find your church home?
        </h2>
        <p className="text-lg text-[var(--muted)]">
          Answer a few questions about your worship preferences, community needs,
          and spiritual priorities. We&apos;ll match you with church types where you&apos;re
          likely to thrive.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center mb-2">
            <span className="text-[var(--primary)] font-bold">1</span>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-1">
            Answer 8 questions
          </h3>
          <p className="text-sm text-[var(--muted)]">
            About worship style, community, and what matters to you
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center mb-2">
            <span className="text-[var(--primary)] font-bold">2</span>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-1">
            Get matched
          </h3>
          <p className="text-sm text-[var(--muted)]">
            We&apos;ll show you church types that fit your preferences
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center mb-2">
            <span className="text-[var(--primary)] font-bold">3</span>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-1">
            Find churches
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Search for matching churches in your area
          </p>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="btn-primary text-lg px-8 py-3"
      >
        Start the Quiz
      </button>

      <p className="mt-4 text-sm text-[var(--muted)]">
        No account needed. Your answers are not stored.
      </p>
    </div>
  );
}
