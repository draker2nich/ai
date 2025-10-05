import React from 'react';
import { Sparkles } from './Icons';

// Примеры на английском для лучшей работы AI
const EXAMPLE_PROMPTS = [
  "vibrant sunset over ocean with dolphins jumping, pink and purple gradient sky, seamless pattern",
  "abstract geometric Memphis style shapes, bright neon colors, repeating pattern, 80s aesthetic",
  "tropical paradise with palm leaves and hibiscus flowers, watercolor painting style, seamless design",
  "deep space nebula with stars and galaxies, dark blue and purple cosmos, tileable pattern",
  "Japanese great wave in traditional ukiyo-e style, turquoise and white colors, seamless pattern",
  "cyberpunk neon circuit board elements, black background with glowing lines, geometric pattern",
  "vintage floral bouquet in 70s retro style, pastel earth tones, bohemian pattern",
  "colorful mandala with intricate details, psychedelic art style, symmetrical design",
  "minimal line art faces and abstract shapes, modern artistic pattern, black and white",
  "holographic iridescent gradient, liquid metal effect, futuristic seamless texture"
];

export default function PromptInput({ 
  prompt, 
  onPromptChange, 
  onGenerate, 
  isGenerating,
  disabled 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Описание дизайна
          <span className="text-xs font-normal text-purple-400">(пишите на английском для лучших результатов)</span>
        </label>
        
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Опишите ваш дизайн на английском языке..."
          rows="4"
          disabled={disabled}
          className="w-full px-4 py-3 text-sm bg-black/50 border-2 border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        
        <button
          onClick={onGenerate}
          disabled={isGenerating || disabled || !prompt.trim()}
          className="w-full mt-3 bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 text-white py-3.5 px-6 rounded-xl font-bold hover:from-purple-700 hover:via-pink-700 hover:to-violet-700 disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Создаём дизайны...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Создать дизайны
            </>
          )}
        </button>
      </div>

      {/* Example Prompts */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
          Нажмите для вдохновения
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {EXAMPLE_PROMPTS.map((example, idx) => (
            <button
              key={idx}
              onClick={() => onPromptChange(example)}
              disabled={disabled}
              className="w-full text-left px-4 py-3 text-xs bg-gradient-to-r from-purple-900/30 to-pink-900/30 hover:from-purple-800/40 hover:to-pink-800/40 rounded-lg transition-all text-purple-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/20 hover:border-purple-400/40 group"
            >
              <div className="flex items-start gap-3">
                <span className="text-purple-500 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-0.5">
                  →
                </span>
                <span className="flex-1 leading-relaxed">{example}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  );
}
