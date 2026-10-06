import React, { useState } from 'react';
import { QuizPackage, QuizResultData } from '../types';
import { AIQuestionGeneratorPage } from './AIQuestionGeneratorPage';
import { QuizInterface } from './QuizInterface';
import { QuizResults } from './QuizResults';

interface AIQuestionGeneratorFlowProps {
  onBackToHome: () => void;
  onRecordQuestionsSolved?: (count: number, subject?: string) => void;
}

export const AIQuestionGeneratorFlow: React.FC<AIQuestionGeneratorFlowProps> = ({
  onBackToHome,
  onRecordQuestionsSolved,
}) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'quiz' | 'results'>('form');
  const [activeQuizPackage, setActiveQuizPackage] = useState<QuizPackage | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResultData | null>(null);

  const handleQuestionsGenerated = (pkg: QuizPackage) => {
    setActiveQuizPackage(pkg);
    setCurrentStep('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitQuiz = () => {
    setCurrentStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitQuiz = (results: QuizResultData) => {
    setQuizResults(results);
    setCurrentStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onRecordQuestionsSolved) {
      onRecordQuestionsSolved(results.total, results.topic);
    }
  };

  const handleTryAgain = () => {
    // Retake the same quiz questions with fresh answers
    setCurrentStep('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewQuiz = () => {
    setActiveQuizPackage(null);
    setQuizResults(null);
    setCurrentStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentStep === 'quiz' && activeQuizPackage) {
    return (
      <QuizInterface
        quizPackage={activeQuizPackage}
        onExitQuiz={handleExitQuiz}
        onSubmitQuiz={handleSubmitQuiz}
      />
    );
  }

  if (currentStep === 'results' && quizResults) {
    return (
      <QuizResults
        results={quizResults}
        onTryAgain={handleTryAgain}
        onBackToHome={onBackToHome}
        onNewQuiz={handleNewQuiz}
      />
    );
  }

  return (
    <AIQuestionGeneratorPage
      onBackToHome={onBackToHome}
      onQuestionsGenerated={handleQuestionsGenerated}
    />
  );
};
