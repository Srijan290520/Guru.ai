import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface TopicInputProps {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onGenerate(topic.trim());
      setTopic(''); // Clear input after submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., 'The Roman Empire' or 'Quantum Computing'"
        className="flex-grow w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
        disabled={isLoading}
        aria-label="Topic to learn"
      />
      <button
        type="submit"
        disabled={isLoading || !topic.trim()}
        className="flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-indigo-900/50"
      >
        <SparklesIcon />
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
    </form>
  );
};

export default TopicInput;
