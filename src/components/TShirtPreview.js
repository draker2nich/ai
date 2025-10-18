import React, { useState, Suspense, lazy } from 'react';
import { RefreshCw, Download } from './Icons';
import View3DSettings from './View3DSettings';

const Sweatshirt3DLoader = lazy(() => import('./Sweatshirt3DLoader'));

export default function TShirtPreview({ 
  design, 
  viewMode, 
  onViewModeChange,
  onRegenerate,
  onDownload,
  onSave,
  isRegenerating 
}) {
  const [view3DSettings, setView3DSettings] = useState({
    antialiasing: true,
    shadows: true,
    pixelRatio: 1.5,
    ambientLight: 0.7,
    directionalLight: 1.3,
    toneMappingExposure: 1.2,
    roughness: 0.85,
    metalness: 0.02,
    autoRotate: false,
    floatAnimation: true
  });

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
          Сначала сгенерируйте дизайны, чтобы увидеть превью на кофте
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          3D Предпросмотр на кофте
        </h3>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-black/50 p-1 rounded-xl">
            <button
              onClick={() => onViewModeChange('front')}
              className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                viewMode === 'front'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              Спереди
            </button>
            <button
              onClick={() => onViewModeChange('back')}
              className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                viewMode === 'back'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              Сзади
            </button>
          </div>

          <View3DSettings 
            settings={view3DSettings}
            onSettingsChange={setView3DSettings}
          />
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl p-8 flex items-center justify-center min-h-[600px] mb-5 border border-purple-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-500/30">
          <p className="text-xs text-purple-300 font-bold">
            ✨ Интерактивная 3D модель
          </p>
        </div>

        <div className="w-full h-full min-h-[600px]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-purple-300 text-lg font-semibold">Загрузка 3D модели...</p>
                <p className="text-purple-400 text-sm mt-2">Пожалуйста, подождите</p>
              </div>
            </div>
          }>
            <Sweatshirt3DLoader 
              designUrl={design.url} 
              viewMode={viewMode}
              settings={view3DSettings}
            />
          </Suspense>
        </div>
        
        <div className="absolute bottom-4 right-4 text-xs text-purple-400 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-500/30 font-medium">
          🎮 Интерактивная 3D модель
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30 hover:border-purple-400/50"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRegenerating ? 'Генерация...' : 'Пересоздать'}</span>
        </button>
        
        <button
          onClick={onSave}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <span className="hidden sm:inline">Сохранить</span>
        </button>
        
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Скачать</span>
        </button>
      </div>
    </div>
  );
}
