import React, { useState } from 'react';
import { RefreshCw, Download } from './Icons';
import TShirt3DViewer from './TShirt3DViewer';

export default function TShirtPreview({ 
  design, 
  onRegenerate,
  onDownload,
  onSave,
  isRegenerating 
}) {
  const [viewMode, setViewMode] = useState('front');
  const [show3D, setShow3D] = useState(false);

  if (!design) {
    return (
      <div className="bg-purple-900/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-purple-500/30 p-16 text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <svg 
            className="relative w-20 h-20 text-purple-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7l3-3 3 3m0 0l3 3m-3-3v12" />
          </svg>
        </div>
        <p className="text-xl font-bold text-white mb-2">
          Дизайн не выбран
        </p>
        <p className="text-sm text-purple-300">
          Сначала сгенерируйте дизайны, чтобы увидеть превью
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Предпросмотр дизайна
          </h3>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-black/50 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('front')}
                className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                  viewMode === 'front'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
                }`}
              >
                Полный размер
              </button>
              <button
                onClick={() => setViewMode('tiled')}
                className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                  viewMode === 'tiled'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
                }`}
              >
                Паттерн
              </button>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl p-8 flex items-center justify-center min-h-[500px] mb-5 border border-purple-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl"></div>
          </div>

          <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-500/30">
            <p className="text-xs text-purple-300 font-bold">
              ✨ AI Дизайн
            </p>
          </div>

          <div className="relative w-full max-w-3xl">
            {viewMode === 'front' ? (
              <div className="aspect-square bg-black/40 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl">
                <img
                  src={design.url}
                  alt="AI Design"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div 
                className="aspect-square bg-black/40 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl"
                style={{
                  backgroundImage: `url(${design.url})`,
                  backgroundSize: '200px 200px',
                  backgroundRepeat: 'repeat',
                  backgroundPosition: 'center'
                }}
              >
                <div className="w-full h-full backdrop-blur-[0.5px]"></div>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-purple-500/40 shadow-2xl">
            <div className="space-y-1">
              <p className="text-xs text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-semibold">Дизайн загружен</span>
              </p>
              <p className="text-xs text-purple-400">🎨 Режим: {viewMode === 'front' ? 'Полный размер' : 'Паттерн'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30 hover:border-purple-400/50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">{isRegenerating ? 'Генерация...' : 'Пересоздать'}</span>
          </button>
          
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="hidden lg:inline">Сохранить</span>
          </button>
          
          <button
            onClick={onDownload}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Скачать</span>
          </button>

          {/* Кнопка 3D просмотра */}
          <button
            onClick={() => setShow3D(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
            <span className="hidden lg:inline">3D</span>
          </button>
        </div>

        <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-blue-300 leading-relaxed">
              <p className="font-bold mb-1">💡 Совет:</p>
              <p>Нажмите <strong className="text-cyan-300">3D</strong> чтобы увидеть дизайн на объёмной футболке. Используйте режим "Паттерн" чтобы увидеть повторение на ткани. Скачайте изображение для дальнейшей обработки.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3D-просмотрщик */}
      {show3D && (
        <TShirt3DViewer 
          design={design} 
          onClose={() => setShow3D(false)} 
        />
      )}
    </>
  );
}
