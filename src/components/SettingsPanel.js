import React from 'react';
import { Settings } from './Icons';

export default function SettingsPanel({ settings, onSettingsChange, disabled }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Settings className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-purple-300">Настройки генерации</h3>
      </div>
      
      <div className="space-y-4">
        {/* Pattern Type */}
        <div>
          <label className="block text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
            Тип паттерна
          </label>
          <select 
            value={settings.patternType}
            onChange={(e) => onSettingsChange({ ...settings, patternType: e.target.value })}
            disabled={disabled}
            className="w-full px-4 py-2.5 text-sm bg-black/50 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <option value="seamless">Бесшовный повторяющийся</option>
            <option value="composition">Цельная композиция</option>
            <option value="geometric">Геометрический паттерн</option>
          </select>
        </div>

        {/* Style */}
        <div>
          <label className="block text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
            Художественный стиль
          </label>
          <select 
            value={settings.style}
            onChange={(e) => onSettingsChange({ ...settings, style: e.target.value })}
            disabled={disabled}
            className="w-full px-4 py-2.5 text-sm bg-black/50 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <option value="realistic">Фотореалистичный</option>
            <option value="abstract">Абстрактное искусство</option>
            <option value="minimalist">Минималистичный</option>
            <option value="vintage">Винтаж / Ретро</option>
            <option value="watercolor">Акварель</option>
            <option value="geometric">Геометрический</option>
            <option value="cyberpunk">Киберпанк</option>
          </select>
        </div>

        {/* Number of Variants */}
        <div>
          <label className="block text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
            Количество вариантов: <span className="text-pink-400">{settings.numberOfVariants}</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="2"
              max="6"
              value={settings.numberOfVariants}
              onChange={(e) => onSettingsChange({ ...settings, numberOfVariants: parseInt(e.target.value) })}
              disabled={disabled}
              className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer disabled:opacity-50 slider"
            />
            <div className="flex justify-between text-xs text-purple-500 mt-2 font-medium">
              <span>2</span>
              <span>4</span>
              <span>6</span>
            </div>
          </div>
        </div>

        {/* Detail Level */}
        <div>
          <label className="block text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
            Уровень детализации
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low', label: 'Быстро' },
              { value: 'medium', label: 'Баланс' },
              { value: 'high', label: 'Качество' }
            ].map((level) => (
              <button
                key={level.value}
                onClick={() => onSettingsChange({ ...settings, detailLevel: level.value })}
                disabled={disabled}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  settings.detailLevel === level.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                    : 'bg-black/30 text-purple-400 border-purple-500/30 hover:border-purple-400/50 hover:text-purple-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-5 px-4 py-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl">
        <p className="text-xs text-purple-300 leading-relaxed">
          <span className="font-bold text-purple-400">💡 Совет:</span> Используйте "Бесшовный повторяющийся" для лучших результатов на одежде. Высокая детализация даёт лучшее качество, но требует больше времени.
        </p>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.7);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
          transition: all 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  );
}
