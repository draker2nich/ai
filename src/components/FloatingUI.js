/**
 * Плавающий интерфейс пользователя
 * Включает панели управления и галерею сгенерированных дизайнов
 */
import React from 'react';
import { Sparkles, Download, X } from './Icons';
import { EXAMPLE_PROMPTS } from '../constants';
import SavedDesigns from './SavedDesigns';
import { useLanguage } from '../locales/LanguageContext';

export default function FloatingUI({
  prompt,
  onPromptChange,
  settings,
  onSettingsChange,
  isGenerating,
  onGenerate,
  generatedDesigns,
  selectedDesign,
  onSelectDesign,
  onSave,
  onDownload,
  onPreparePrint, // НОВЫЙ ПРОП
  savedDesigns,
  showSaved,
  onShowSavedToggle,
  onLoadDesign,
  onDeleteDesign,
  error,
  onClearError,
  imageStatuses,
  apiConfigured,
  uiVisible,
  onToggleUI,
  autoRotate,
  onAutoRotateChange
}) {
  const { t, language, changeLanguage } = useLanguage();

  return (
    <>
      {/* Шапка сайта */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur opacity-60 animate-pulse"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Переключатель языка */}
            <div className="flex items-center gap-1 bg-purple-600/30 rounded-lg border border-purple-500/30 p-1">
              <button
                onClick={() => changeLanguage('ru')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  language === 'ru' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  language === 'en' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {savedDesigns.length > 0 && (
              <button
                onClick={onShowSavedToggle}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg border border-purple-500/30 transition-all text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <span className="hidden sm:inline">{t.nav.saved} ({savedDesigns.length})</span>
              </button>
            )}

            <button
              onClick={onToggleUI}
              className="w-10 h-10 flex items-center justify-center bg-purple-600/30 hover:bg-purple-600/50 rounded-lg border border-purple-500/30 transition-all"
              title={uiVisible ? t.nav.hideUI : t.nav.showUI}
            >
              {uiVisible ? (
                <svg className="w-5 h-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Основные панели интерфейса */}
      <div className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full flex items-stretch p-4 pt-20 pb-4 gap-4">
          {/* Левая панель - управление генерацией */}
          <div className="w-96 flex flex-col gap-4 pointer-events-auto">
            {/* Карточка ввода промпта */}
            <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-purple-300">{t.create.title}</h2>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={t.create.placeholder}
                rows="4"
                disabled={!apiConfigured}
                className="w-full px-4 py-3 text-sm bg-black/50 border-2 border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-3"
              />

              <button
                onClick={onGenerate}
                disabled={isGenerating || !apiConfigured || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-700 hover:via-pink-700 hover:to-violet-700 disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    {t.create.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t.create.generate}
                  </>
                )}
              </button>

              {/* Быстрые промпты */}
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                  {t.create.quickIdeas}
                </p>
                {EXAMPLE_PROMPTS.slice(0, 5).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => onPromptChange(example)}
                    disabled={!apiConfigured}
                    className="w-full text-left px-3 py-2 text-xs bg-gradient-to-r from-purple-900/30 to-pink-900/30 hover:from-purple-800/40 hover:to-pink-800/40 rounded-lg transition-all text-purple-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/20"
                  >
                    <span className="line-clamp-2">{example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Карточка настроек */}
            <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-purple-300 mb-4">{t.settings.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-purple-400 mb-2">
                    {t.settings.style}
                  </label>
                  <select 
                    value={settings.style}
                    onChange={(e) => onSettingsChange({ ...settings, style: e.target.value })}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 text-sm bg-black/50 border-2 border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="realistic">{t.settings.styles.realistic}</option>
                    <option value="abstract">{t.settings.styles.abstract}</option>
                    <option value="minimalist">{t.settings.styles.minimalist}</option>
                    <option value="vintage">{t.settings.styles.vintage}</option>
                    <option value="cyberpunk">{t.settings.styles.cyberpunk}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-400 mb-2">
                    {t.settings.variants}: {settings.numberOfVariants}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={settings.numberOfVariants}
                    onChange={(e) => onSettingsChange({ ...settings, numberOfVariants: parseInt(e.target.value) })}
                    disabled={isGenerating}
                    className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Кнопка автовращения */}
                <div className="pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      console.log('🖱️ Клик по кнопке автовращения, текущее:', autoRotate);
                      onAutoRotateChange(!autoRotate);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all border-2 ${
                      autoRotate 
                        ? 'bg-purple-600/30 border-purple-500/50 text-purple-200' 
                        : 'bg-black/30 border-purple-500/20 text-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg 
                        className={`w-5 h-5 transition-transform ${autoRotate ? 'animate-spin-slow' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div className="text-left">
                        <p className="text-sm font-semibold">
                          {language === 'ru' ? 'Автовращение' : 'Auto-rotate'}
                        </p>
                        <p className="text-xs opacity-70">
                          {autoRotate 
                            ? (language === 'ru' ? 'Включено' : 'Enabled')
                            : (language === 'ru' ? 'Выключено' : 'Disabled')
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all ${
                      autoRotate ? 'bg-purple-600' : 'bg-gray-600'
                    }`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        autoRotate ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Правая панель - галерея дизайнов */}
          {generatedDesigns.length > 0 && (
            <div className="w-[420px] ml-auto flex flex-col pointer-events-auto">
              {/* Карточка галереи */}
              <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-120px)]">
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-purple-300">{t.gallery.title}</h3>
                    <span className="text-xs font-semibold px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full">
                      {generatedDesigns.length}
                    </span>
                  </div>
                </div>
                
                {/* Сетка дизайнов с прокруткой */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    {generatedDesigns.map((design) => (
                      <button
                        key={design.id}
                        onClick={() => onSelectDesign(design)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
                          selectedDesign?.id === design.id
                            ? 'border-purple-500 ring-4 ring-purple-500/30 scale-105'
                            : 'border-purple-500/20 hover:border-purple-400/50 hover:scale-102'
                        }`}
                      >
                        <div className="aspect-square bg-black">
                          <img
                            src={design.url}
                            alt={`Design ${design.index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        
                        {selectedDesign?.id === design.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                          #{design.index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Кнопки действий */}
                {selectedDesign && (
                  <div className="p-6 border-t border-purple-500/20 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={onSave}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600/80 hover:bg-green-600 text-white rounded-lg font-semibold transition-all text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        {t.gallery.save}
                      </button>
                      
                      <button
                        onClick={onDownload}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all text-sm"
                      >
                        <Download className="w-4 h-4" />
                        {t.gallery.download}
                      </button>
                    </div>

                    {/* НОВАЯ КНОПКА: Подготовить к печати */}
                    <button
                      onClick={onPreparePrint}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-bold transition-all text-sm shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      {language === 'ru' ? '🖨️ Подготовить к печати' : '🖨️ Prepare for Print'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Уведомление об ошибке */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 pointer-events-auto">
          <div className="bg-red-900/90 backdrop-blur-xl border border-red-500/50 text-red-100 px-4 py-3 rounded-xl flex items-start gap-3 shadow-2xl">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
            <button onClick={onClearError} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Индикатор процесса генерации */}
      {isGenerating && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
          <div className="bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-white font-bold">{t.generation.creating}</p>
                <p className="text-purple-300 text-sm">{t.generation.timeEstimate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imageStatuses.map((status, index) => (
                <div 
                  key={index} 
                  className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">
                      #{index + 1}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      status.stage === 'completed' ? 'bg-green-500/30 text-green-300' :
                      status.stage === 'generating' ? 'bg-blue-500/30 text-blue-300' :
                      'bg-purple-500/30 text-purple-300'
                    }`}>
                      {status.stage === 'completed' ? '✓' :
                       status.stage === 'generating' ? '...' :
                       '○'}
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${status.progress || 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно сохранённых дизайнов */}
      {showSaved && (
        <SavedDesigns
          designs={savedDesigns}
          onLoad={onLoadDesign}
          onDelete={onDeleteDesign}
          onClose={onShowSavedToggle}
        />
      )}

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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scale-102 {
          transform: scale(1.02);
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}