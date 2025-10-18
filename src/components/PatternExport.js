import React, { useState } from 'react';
import { Download } from './Icons';
import { SIZES, applyDesignToPatterns, exportForPrinting, downloadPatterns } from '../services/patternService';

export default function PatternExport({ design, onClose }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [exportFormat, setExportFormat] = useState('separate');
  const [quality, setQuality] = useState('standard');
  const [includeMarkers, setIncludeMarkers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (!design) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Шаг 1: Применяем дизайн на все лекала
      setProgress(20);
      const patterns = await applyDesignToPatterns(design.url, selectedSize, {
        seamless: true,
        quality
      });

      // Шаг 2: Подготавливаем файлы для экспорта
      setProgress(60);
      const files = await exportForPrinting(patterns, selectedSize, {
        format: exportFormat,
        includeMarkers,
        quality
      });

      // Шаг 3: Скачиваем файлы
      setProgress(90);
      await downloadPatterns(files);

      setProgress(100);
      
      // Показываем успех
      setTimeout(() => {
        alert(`✅ Экспортировано ${files.length} файл(ов) для размера ${selectedSize}`);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('❌ Не удалось экспортировать лекала');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-xl border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Экспорт лекал для печати</h3>
              <p className="text-xs text-purple-400">Подготовка файлов для производства</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-400 hover:bg-purple-900/30 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="aspect-video bg-black/40 rounded-xl overflow-hidden border border-purple-500/20">
            <img
              src={design?.url}
              alt="Дизайн"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-bold text-purple-300 mb-3">
              Выберите размер
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(SIZES).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 px-4 text-sm font-bold rounded-xl border transition-all ${
                    selectedSize === size
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                      : 'bg-black/30 text-purple-400 border-purple-500/30 hover:border-purple-400/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Size info */}
            <div className="mt-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
              <p className="text-xs text-purple-300">
                <span className="font-bold">Размер {selectedSize}:</span>{' '}
                Обхват груди: {SIZES[selectedSize].chest}см, 
                Длина: {SIZES[selectedSize].length}см, 
                Рукав: {SIZES[selectedSize].sleeve}см
              </p>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-bold text-purple-300 mb-3">
              Формат экспорта
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('separate')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  exportFormat === 'separate'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-black/30 border-purple-500/20 text-purple-300 hover:border-purple-400/50'
                }`}
              >
                <div className="font-bold mb-1">Отдельные файлы</div>
                <div className="text-xs opacity-80">
                  Каждая деталь в своём файле (4 файла)
                </div>
              </button>
              <button
                onClick={() => setExportFormat('combined')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  exportFormat === 'combined'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-black/30 border-purple-500/20 text-purple-300 hover:border-purple-400/50'
                }`}
              >
                <div className="font-bold mb-1">Один файл</div>
                <div className="text-xs opacity-80">
                  Все детали на одном листе
                </div>
              </button>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-bold text-purple-300 mb-3">
              Качество печати
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'draft', label: 'Черновик', dpi: '150 DPI' },
                { value: 'standard', label: 'Стандарт', dpi: '300 DPI' },
                { value: 'high', label: 'Высокое', dpi: '600 DPI' }
              ].map((q) => (
                <button
                  key={q.value}
                  onClick={() => setQuality(q.value)}
                  className={`py-3 px-3 text-sm font-bold rounded-xl border transition-all ${
                    quality === q.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                      : 'bg-black/30 text-purple-400 border-purple-500/30 hover:border-purple-400/50'
                  }`}
                >
                  <div>{q.label}</div>
                  <div className="text-xs opacity-70">{q.dpi}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center gap-3 p-4 bg-black/30 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={includeMarkers}
                onChange={(e) => setIncludeMarkers(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-purple-500 bg-black/50 checked:bg-purple-600 focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Метки для печати</div>
                <div className="text-xs text-purple-400">
                  Добавить разметку, линейку и метки выравнивания
                </div>
              </div>
            </label>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Обработка...</span>
                <span className="text-sm font-bold text-purple-400">{progress}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-blue-300 leading-relaxed">
                <p className="font-bold mb-1">💡 Рекомендации для печати:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Используйте плотерную печать для точности</li>
                  <li>Проверьте масштаб по линейке перед раскроем</li>
                  <li>Сохраняйте припуски на швы (1-1.5см)</li>
                  <li>Для сублимации используйте качество "Высокое"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/50 backdrop-blur-xl border-t border-purple-500/30 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Экспорт...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Экспортировать лекала
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
