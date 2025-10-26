import React, { useState, useEffect } from 'react';
import { Shirt, Sparkles } from './components/Icons';
import BackgroundCanvas from './components/BackgroundCanvas';
import FloatingUI from './components/FloatingUI';
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
  const [uiVisible, setUiVisible] = useState(true);

  useEffect(() => {
    const configured = isApiKeyConfigured();
    setApiConfigured(configured);
    if (!configured) {
      setError('Пожалуйста, настройте API ключ в файле .env');
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
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Canvas Background */}
      <BackgroundCanvas 
        design={selectedDesign}
        isVisible={!showSaved}
      />

      {/* Floating UI */}
      <FloatingUI
        prompt={prompt}
        onPromptChange={setPrompt}
        settings={settings}
        onSettingsChange={setSettings}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        generatedDesigns={generatedDesigns}
        selectedDesign={selectedDesign}
        onSelectDesign={setSelectedDesign}
        onSave={handleSaveDesign}
        onDownload={handleDownload}
        savedDesigns={savedDesigns}
        showSaved={showSaved}
        onShowSavedToggle={() => setShowSaved(!showSaved)}
        onLoadDesign={handleLoadDesign}
        onDeleteDesign={handleDeleteDesign}
        error={error}
        onClearError={() => setError('')}
        imageStatuses={imageStatuses}
        apiConfigured={apiConfigured}
        uiVisible={uiVisible}
        onToggleUI={() => setUiVisible(!uiVisible)}
      />

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
