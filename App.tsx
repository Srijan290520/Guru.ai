import React, { useState, useCallback } from 'react';
import TopicInput from './components/TopicInput';
import NotesDisplay from './components/NotesDisplay';
import LoadingState from './components/LoadingState';
import QuizDisplay from './components/QuizDisplay';
import { generateNotes, generateImage, generateQuiz } from './services/geminiService';
import type { LearningNotes, Quiz } from './types';

type QuizState = 'idle' | 'generating' | 'active';

function App(): React.ReactNode {
  const [notes, setNotes] = useState<LearningNotes | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState<string>('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [quizError, setQuizError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (inputTopic: string) => {
    setIsLoading(true);
    setError(null);
    setNotes(null);
    setTopic(inputTopic);
    setQuiz(null);
    setQuizState('idle');
    setQuizError(null);

    try {
      setLoadingMessage('Crafting your learning materials...');
      const structuredNotes = await generateNotes(inputTopic);

      if (structuredNotes.length === 0) {
        throw new Error("Could not generate notes for this topic. Please try a different one.");
      }
      
      setLoadingMessage(`Generating ${structuredNotes.length} images to illustrate your notes...`);

      const notesWithImages = await Promise.all(
        structuredNotes.map(async (note, index) => {
          // Add a small delay for batching image generation if needed
          await new Promise(res => setTimeout(res, index * 100));
          const imageUrl = await generateImage(note.imagePrompt);
          return { ...note, imageUrl };
        })
      );
      
      setNotes(notesWithImages);

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleStartQuiz = useCallback(async () => {
    if (!notes) return;
    setQuizState('generating');
    setQuizError(null);
    try {
      const quizData = await generateQuiz(topic, notes);
      setQuiz(quizData);
      setQuizState('active');
    } catch (e: any) {
      setQuizError(e.message || 'Could not generate the quiz.');
      setQuizState('idle');
    }
  }, [notes, topic]);
  
  const handleReset = () => {
    setNotes(null);
    setQuiz(null);
    setQuizState('idle');
    setError(null);
    setQuizError(null);
    setTopic('');
  };

  const handleBackToNotes = () => {
    setQuiz(null);
    setQuizState('idle');
    setQuizError(null);
  }

  const renderContent = () => {
    if (quizState === 'active' && quiz) {
      return <QuizDisplay quiz={quiz} topic={topic} onBackToNotes={handleBackToNotes} />;
    }
    if (notes && !isLoading) {
      return <NotesDisplay notes={notes} onStartQuiz={handleStartQuiz} isQuizGenerating={quizState === 'generating'} />;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Gemini Learning Studio
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Your personal AI tutor. Enter any topic to generate detailed, illustrated, and narrated notes in seconds.
          </p>
        </header>
        
        {!notes && !isLoading && (
          <div className="max-w-3xl mx-auto">
            <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {notes && !isLoading && (
            <div className="text-center mb-8">
                <button
                    onClick={handleReset}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors text-lg"
                >
                    &larr; Start a new topic
                </button>
            </div>
        )}
        

        <div className="mt-12">
          {(isLoading || quizState === 'generating') && <LoadingState message={isLoading ? loadingMessage : 'Building your quiz...'} />}
          
          {error && (
            <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-bold">Oops! Something went wrong generating notes.</p>
              <p>{error}</p>
            </div>
          )}
          {quizError && (
            <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-bold">Oops! Couldn't build the quiz.</p>
              <p>{quizError}</p>
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
