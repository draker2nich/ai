import React, { useState, useEffect } from 'react';
import { Shirt, Sparkles } from './components/Icons';
import PromptInput from './components/PromptInput';
import SettingsPanel from './components/SettingsPanel';
import DesignGallery from './components/DesignGallery';
import TShirtPreview from './components/TShirtPreview';
import SavedDesigns from './components/SavedDesigns';
import { generateDesigns, isApiKeyConfigured } from './services/replicateService';
import { saveDesign, getSavedDesigns, deleteDesign } from './utils/storageService';

function App() {
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState({
    patternType: 'seamless',
    style: 'realistic',
    numberOfVariants: 4,
    detailLevel: 'medium'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [error, setError] = useState('');
  const [imageStatuses, setImageStatuses] = useState([]);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const configured = isApiKeyConfigured();
    setApiConfigured(configured);
    if (!configured) {
      setError('Пожалуйста, настройте API ключ в файле .env. См. .env.example для инструкций.');
    }
    loadSavedDesigns();
  }, []);

  const loadSavedDesigns = () => {
    const designs = getSavedDesigns();
    setSavedDesigns(designs);
  };

  const handleGenerate = async () => {
    if (!apiConfigured) {
      setError('API ключ не настроен. Пожалуйста, добавьте REACT_APP_REPLICATE_API_KEY в файл .env');
      return;
    }

    if (!prompt.trim()) {
      setError('Пожалуйста, введите описание дизайна');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedDesigns([]);
    setSelectedDesign(null);
    setImageStatuses([]);

    try {
      const designs = await generateDesigns(
        prompt, 
        settings,
        (statuses) => {
          setImageStatuses(statuses);
        }
      );
      
      if (designs.length === 0) {
        throw new Error('Не удалось сгенерировать дизайны');
      }

      setGeneratedDesigns(designs);
      setSelectedDesign(designs[0]);
      setImageStatuses([]);
    } catch (err) {
      console.error('Ошибка генерации:', err);
      setError(err.message || 'Не удалось сгенерировать дизайны. Попробуйте ещё раз.');
      setImageStatuses([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDesign = () => {
    if (!selectedDesign) return;
    
    try {
      saveDesign({
        ...selectedDesign,
        prompt,
        settings
      });
      
      loadSavedDesigns();
      showNotification('Дизайн сохранён!', 'success');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить дизайн');
    }
  };

  const handleLoadDesign = (design) => {
    setPrompt(design.prompt || '');
    setSettings(design.settings || settings);
    setGeneratedDesigns([design]);
    setSelectedDesign(design);
    setShowSaved(false);
  };

  const handleDeleteDesign = (designId) => {
    deleteDesign(designId);
    loadSavedDesigns();
    showNotification('Дизайн удалён', 'info');
  };

  const handleDownload = async () => {
    if (!selectedDesign) return;

    try {
      const response = await fetch(selectedDesign.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-design-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Дизайн скачан!', 'success');
    } catch (err) {
      console.error('Ошибка скачивания:', err);
      setError('Не удалось скачать изображение');
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : 
                     type === 'error' ? 'bg-red-600' : 
                     'bg-blue-600';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-slideInRight`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-semibold">${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <header className="bg-black/30 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur-lg opacity-60 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-2xl">
                  <Shirt className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                  AI Студия Дизайна
                </h1>
                <p className="text-xs text-purple-300/80">Создавайте уникальные паттерны для одежды с помощью AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {savedDesigns.length > 0 && (
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  <span className="text-sm font-semibold">Сохранённые ({savedDesigns.length})</span>
                </button>
              )}
              
              {!apiConfigured && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium animate-pulse">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Требуется API ключ
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {showSaved && (
          <SavedDesigns
            designs={savedDesigns}
            onLoad={handleLoadDesign}
            onDelete={handleDeleteDesign}
            onClose={() => setShowSaved(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
              <PromptInput
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={!apiConfigured}
              />
            </div>

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
              <SettingsPanel
                settings={settings}
                onSettingsChange={setSettings}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-xl flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">{error}</p>
                  {!apiConfigured && (
                    <p className="text-sm mt-1">
                      1. Создайте файл .env в корневой директории<br/>
                      2. Добавьте: REACT_APP_REPLICATE_API_KEY=ваш_ключ<br/>
                      3. Получите ключ на <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">replicate.com</a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl animate-pulse">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-xl font-bold text-white mb-2">Создаём ваши дизайны...</p>
                  <p className="text-sm text-purple-300">Обычно занимает 20-40 секунд</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {imageStatuses.map((status, index) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30 backdrop-blur"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">
                          Дизайн {index + 1}
                        </span>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          status.stage === 'completed' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                          status.stage === 'generating' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' :
                          status.stage === 'creating' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' :
                          status.stage === 'error' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                          'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                        }`}>
                          {status.stage === 'completed' ? 'Готово!' :
                           status.stage === 'generating' ? 'Генерация...' :
                           status.stage === 'creating' ? 'Отправка...' :
                           status.stage === 'starting' ? 'Инициализация...' :
                           status.stage === 'waiting' ? 'Обработка...' :
                           status.stage === 'error' ? 'Ошибка' :
                           status.message}
                        </span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 transition-all duration-500 ${
                            status.stage === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            status.stage === 'generating' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                            status.stage === 'creating' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            status.stage === 'error' ? 'bg-red-500' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          } ${status.stage === 'generating' || status.stage === 'creating' ? 'animate-pulse' : ''}`}
                          style={{ width: `${status.progress || 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isGenerating && generatedDesigns.length > 0 && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
                <DesignGallery
                  designs={generatedDesigns}
                  selectedDesign={selectedDesign}
                  onSelectDesign={setSelectedDesign}
                />
              </div>
            )}

            {!isGenerating && selectedDesign && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
                <TShirtPreview
                  design={selectedDesign}
                  onRegenerate={handleGenerate}
                  onDownload={handleDownload}
                  onSave={handleSaveDesign}
                  isRegenerating={isGenerating}
                />
              </div>
            )}

            {!isGenerating && generatedDesigns.length === 0 && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-dashed border-purple-500/30 p-16 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <Sparkles className="relative w-20 h-20 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-3">Готовы создать?</p>
                <p className="text-purple-300 max-w-md mx-auto">
                  Введите описание дизайна выше и нажмите "Создать дизайны", чтобы сгенерировать уникальные паттерны для вашей одежды
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;