import React, { useState, useMemo } from 'react';
import type { Quiz } from '../types';
import { CheckIcon, XIcon, RestartIcon, BackIcon } from './icons';

interface QuizDisplayProps {
  quiz: Quiz;
  topic: string;
  onBackToNotes: () => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, topic, onBackToNotes }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz[currentQuestionIndex];
  const totalQuestions = quiz.length;

  const handleAnswerSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    window.scrollTo(0, 0);
  };
  
  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  }

  const score = useMemo(() => {
    return quiz.reduce((total, question, index) => {
      return answers[index] === question.correctAnswer ? total + 1 : total;
    }, 0);
  }, [quiz, answers]);

  if (showResults) {
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    let feedback = { message: "Great effort!", color: "text-yellow-400" };
    if (scorePercentage > 80) {
        feedback = { message: "Excellent work!", color: "text-green-400" };
    } else if (scorePercentage > 50) {
        feedback = { message: "Good job!", color: "text-blue-400" };
    }


    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Quiz Results: <span className="text-indigo-400">{topic}</span></h2>
        <div className="bg-gray-800/50 p-8 rounded-xl text-center mb-8 border border-gray-700">
            <p className="text-2xl font-bold mb-2">You Scored</p>
            <p className={`text-6xl font-extrabold ${feedback.color}`}>{score} / {totalQuestions}</p>
            <p className={`text-2xl mt-4 font-semibold ${feedback.color}`}>{feedback.message}</p>
        </div>
        
        <h3 className="text-2xl font-bold mb-6 text-center">Review Your Answers</h3>
        <div className="space-y-4">
          {quiz.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            return (
              <div key={index} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                <p className="font-semibold text-lg mb-2">{index + 1}. {question.question}</p>
                <p>Your answer: <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{userAnswer || "Not answered"}</span></p>
                {!isCorrect && <p>Correct answer: <span className="font-bold text-green-400">{question.correctAnswer}</span></p>}
                <p className="text-gray-400 mt-2 text-sm"><em>Explanation: {question.explanation}</em></p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-8">
            <button onClick={handleRetake} className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                <RestartIcon/> Try Again
            </button>
            <button onClick={onBackToNotes} className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors">
                <BackIcon/> Back to Notes
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-indigo-400 mb-2">Quiz: {topic}</h2>
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
          <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}></div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestionIndex] === option;
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 text-lg ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 ring-2 ring-indigo-300'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 font-semibold bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 transition-colors"
        >
          Previous
        </button>
        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== totalQuestions}
            className="px-8 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-900/50"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="px-6 py-2 font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-gray-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizDisplay;
