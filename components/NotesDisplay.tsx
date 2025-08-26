import React, { useState, useEffect, useRef } from 'react';
import type { LearningNotes } from '../types';
import { PlayIcon, PauseIcon, StopIcon, BrainIcon } from './icons';

interface NotesDisplayProps {
  notes: LearningNotes;
  onStartQuiz: () => void;
  isQuizGenerating: boolean;
}

type PlaybackState = 'stopped' | 'playing' | 'paused';

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes, onStartQuiz, isQuizGenerating }) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [speakingSectionIndex, setSpeakingSectionIndex] = useState<number | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const handleBeforeUnload = () => {
      speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const loadAndSetVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return; // Wait for voices to load

      const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
      let bestVoice: SpeechSynthesisVoice | null = null;
      
      // Prioritize known high-quality voices often found on modern OSes
      const preferredVoiceNames = [
        'Google US English',
        'Microsoft David - English (United States)',
        'Microsoft Zira - English (United States)',
        'Samantha', // Common on Apple devices
        'Alex', // Common on Apple devices
        'Google UK English Female',
        'Google UK English Male',
      ];

      bestVoice = englishVoices.find(v => preferredVoiceNames.includes(v.name)) || null;

      if (!bestVoice) {
        // Fallback to a non-local (often higher quality cloud-based) voice
        bestVoice = englishVoices.find(v => !v.localService) || null;
      }
      
      if (!bestVoice) {
        // Finally, fallback to the default voice or the first available one
        bestVoice = englishVoices.find(v => v.default) || englishVoices[0] || null;
      }
      
      setSelectedVoice(bestVoice);
      speechSynthesis.onvoiceschanged = null; // We've got a voice, no need to listen anymore
    };

    // Voices are loaded asynchronously, so we need to listen for the 'voiceschanged' event.
    loadAndSetVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadAndSetVoice;
    }

    // Cleanup on component unmount
    return () => {
      speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // When notes or the selected voice changes, stop any current speech and recreate the utterances.
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    setPlaybackState('stopped');
    setSpeakingSectionIndex(null);
    utterancesRef.current = [];

    if (notes && window.speechSynthesis) {
        utterancesRef.current = notes.map((section, index) => {
            const utterance = new SpeechSynthesisUtterance(`${section.heading}. ${section.content}`);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            // Explicitly set rate and pitch for a more consistent, natural delivery.
            utterance.pitch = 1.0;
            utterance.rate = 1.0;

            utterance.onstart = () => setSpeakingSectionIndex(index);
            utterance.onend = () => {
                if (index === utterancesRef.current.length - 1) {
                    setPlaybackState('stopped');
                    setSpeakingSectionIndex(null);
                }
            };
            utterance.onerror = (e) => {
                console.error("Speech synthesis error:", e);
                setPlaybackState('stopped');
                setSpeakingSectionIndex(null);
            };
            return utterance;
        });
    }

  }, [notes, selectedVoice]);

  const handlePlay = () => {
    if (!utterancesRef.current.length) return;
    if (playbackState === 'paused') {
      speechSynthesis.resume();
      setPlaybackState('playing');
    } else if (playbackState === 'stopped') {
       // Clear queue and speak
      speechSynthesis.cancel();
      utterancesRef.current.forEach(utterance => speechSynthesis.speak(utterance));
      setPlaybackState('playing');
    }
  };

  const handlePause = () => {
    if (playbackState === 'playing') {
      speechSynthesis.pause();
      setPlaybackState('paused');
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setPlaybackState('stopped');
    setSpeakingSectionIndex(null);
  };

  return (
    <div className="space-y-12">
      {notes.length > 0 && 'speechSynthesis' in window && (
        <div className="sticky top-4 z-10 flex justify-center p-2 bg-gray-800/80 backdrop-blur-sm rounded-full max-w-xs mx-auto shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
                <button
                    onClick={handlePlay}
                    disabled={playbackState === 'playing'}
                    className="p-3 rounded-full bg-gray-700 hover:bg-indigo-600 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                    aria-label="Play Narration"
                >
                    <PlayIcon />
                </button>
                <button
                    onClick={handlePause}
                    disabled={playbackState !== 'playing'}
                    className="p-3 rounded-full bg-gray-700 hover:bg-indigo-600 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                    aria-label="Pause Narration"
                >
                    <PauseIcon />
                </button>
                 <button
                    onClick={handleStop}
                    disabled={playbackState === 'stopped'}
                    className="p-3 rounded-full bg-gray-700 hover:bg-red-600 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                    aria-label="Stop Narration"
                >
                    <StopIcon />
                </button>
            </div>
        </div>
      )}
      {notes.map((section, index) => (
        <article
          key={index}
          className={`p-6 md:p-8 rounded-xl border border-gray-700/50 transition-all duration-500 ease-in-out ${speakingSectionIndex === index ? 'bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-800/50'}`}
          aria-live="polite"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400 mb-4">
            {section.heading}
          </h2>
          {section.imageUrl && (
            <img
              src={section.imageUrl}
              alt={section.imagePrompt}
              className="rounded-lg w-full h-auto object-cover mb-6 aspect-video border-2 border-gray-700"
            />
          )}
          <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed text-lg">
            {section.content.split('\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
            ))}
          </div>
        </article>
      ))}
      <div className="mt-16 text-center">
        <button
          onClick={onStartQuiz}
          disabled={isQuizGenerating}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-green-900/50 transform hover:scale-105"
        >
          <BrainIcon />
          {isQuizGenerating ? 'Building Quiz...' : 'Ready? Take the Quiz!'}
        </button>
      </div>
    </div>
  );
};

export default NotesDisplay;