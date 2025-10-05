import React, { useState, Suspense, lazy, useEffect } from 'react';
import { RefreshCw, Download } from './Icons';
import View3DSettings from './View3DSettings';
import { makeSeamless, enhanceTexture, applyFabricTexture } from '../utils/textureUtils';

// Lazy load 3D component - SWEATSHIRT instead of T-shirt
const Sweatshirt3DViewer = lazy(() => import('./Sweatshirt3DViewer'));

export default function TShirtPreview({ 
  design, 
  viewMode, 
  onViewModeChange,
  onRegenerate,
  onDownload,
  isRegenerating 
}) {
  const [visualizationMode, setVisualizationMode] = useState('3d'); // '2d' or '3d'
  const [processedDesign, setProcessedDesign] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textureSettings, setTextureSettings] = useState({
    seamless: false,
    fabricOverlay: false,
    enhanced: false
  });
  
  const [view3DSettings, setView3DSettings] = useState({
    antialiasing: true,
    shadows: true,
    pixelRatio: 1.5,
    ambientLight: 0.5,
    directionalLight: 1.0,
    toneMappingExposure: 1.2,
    roughness: 0.75,
    metalness: 0.05,
    autoRotate: false,
    floatAnimation: true
  });

  // Process texture when design or settings change
  useEffect(() => {
    if (!design) {
      setProcessedDesign(null);
      return;
    }

    const processTexture = async () => {
      setIsProcessing(true);
      try {
        let processedUrl = design.url;

        if (textureSettings.seamless) {
          processedUrl = await makeSeamless(processedUrl, 32);
        }

        if (textureSettings.enhanced) {
          processedUrl = await enhanceTexture(processedUrl, {
            brightness: 1.05,
            contrast: 1.1,
            saturation: 1.05,
            sharpen: true
          });
        }

        if (textureSettings.fabricOverlay) {
          processedUrl = await applyFabricTexture(processedUrl, null, 0.15);
        }

        setProcessedDesign({
          ...design,
          url: processedUrl,
          originalUrl: design.url
        });
      } catch (error) {
        console.error('Error processing texture:', error);
        setProcessedDesign(design);
      } finally {
        setIsProcessing(false);
      }
    };

    processTexture();
  }, [design, textureSettings]);

  const handleTextureToggle = (setting) => {
    setTextureSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

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

  const displayDesign = processedDesign || design;

  return (
    <div>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Предпросмотр на кофте
        </h3>
        
        <div className="flex gap-2 flex-wrap">
          {/* 2D/3D Toggle */}
          <div className="flex gap-1 bg-black/50 p-1 rounded-xl">
            <button
              onClick={() => setVisualizationMode('2d')}
              className={`px-3 py-2 text-xs rounded-lg font-bold transition-all ${
                visualizationMode === '2d'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setVisualizationMode('3d')}
              className={`px-3 py-2 text-xs rounded-lg font-bold transition-all relative ${
                visualizationMode === '3d'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-purple-400 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              3D
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </button>
          </div>

          {/* Front/Back Toggle */}
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

          {/* 3D Settings (only show in 3D mode) */}
          {visualizationMode === '3d' && (
            <View3DSettings 
              settings={view3DSettings}
              onSettingsChange={setView3DSettings}
            />
          )}
        </div>
      </div>

      {/* Texture Enhancement Controls */}
      <div className="mb-4 p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            Обработка текстуры
          </h4>
          {isProcessing && (
            <div className="flex items-center gap-2 text-purple-400 text-xs">
              <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Обработка...</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleTextureToggle('seamless')}
            disabled={isProcessing}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              textureSettings.seamless
                ? 'bg-purple-600 text-white'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {textureSettings.seamless ? '✓' : '○'} Бесшовная
          </button>
          
          <button
            onClick={() => handleTextureToggle('enhanced')}
            disabled={isProcessing}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              textureSettings.enhanced
                ? 'bg-purple-600 text-white'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {textureSettings.enhanced ? '✓' : '○'} Улучшенная
          </button>
          
          <button
            onClick={() => handleTextureToggle('fabricOverlay')}
            disabled={isProcessing}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              textureSettings.fabricOverlay
                ? 'bg-purple-600 text-white'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {textureSettings.fabricOverlay ? '✓' : '○'} Текстура ткани
          </button>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="relative bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl p-8 flex items-center justify-center min-h-[500px] mb-5 border border-purple-500/20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Mode Badge */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-500/30">
          <p className="text-xs text-purple-300 font-bold">
            {visualizationMode === '3d' ? '✨ 3D Интерактивная модель' : '🖼️ 2D Предпросмотр'}
          </p>
        </div>

        {/* Render 2D or 3D view */}
        {visualizationMode === '2d' ? (
          // 2D Preview - SWEATSHIRT with LONG SLEEVES
          <div className="relative w-80 h-96 z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Sweatshirt SVG with LONG SLEEVES */}
                <svg viewBox="0 0 300 340" className="w-full h-full filter drop-shadow-2xl">
                  <defs>
                    <linearGradient id="sweatshirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#fafafa', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: '#e5e5e5', stopOpacity: 1}} />
                    </linearGradient>
                    <filter id="fabricTexture">
                      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" result="turbulence" seed="1" />
                      <feColorMatrix in="turbulence" type="saturate" values="0" />
                      <feComponentTransfer>
                        <feFuncA type="discrete" tableValues="0 .02 .02 .02 .02"/>
                      </feComponentTransfer>
                      <feComposite in2="SourceGraphic" operator="over" />
                    </filter>
                    <clipPath id="sweatshirtClip">
                      <path d="M 95 60 
                               L 95 85
                               L 75 300
                               L 225 300
                               L 205 85
                               L 205 60
                               L 180 65
                               Q 150 75 150 75
                               Q 150 75 120 65
                               Z" />
                    </clipPath>
                  </defs>
                  
                  <g filter="url(#fabricTexture)">
                    {/* Long LEFT Sleeve */}
                    <path
                      d="M 95 60 L 75 75 L 20 95 L 10 195 L 15 200 L 30 150 L 95 85 Z"
                      fill="url(#sweatshirtGradient)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                    
                    {/* Long RIGHT Sleeve */}
                    <path
                      d="M 205 60 L 225 75 L 280 95 L 290 195 L 285 200 L 270 150 L 205 85 Z"
                      fill="url(#sweatshirtGradient)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                    
                    {/* Left Cuff (манжета) */}
                    <ellipse cx="16" cy="195" rx="6" ry="10" 
                      fill="#e8e8e8" 
                      stroke="#94a3b8" 
                      strokeWidth="1.2"
                    />
                    
                    {/* Right Cuff */}
                    <ellipse cx="284" cy="195" rx="6" ry="10" 
                      fill="#e8e8e8" 
                      stroke="#94a3b8" 
                      strokeWidth="1.2"
                    />
                    
                    {/* Main Body */}
                    <path
                      d="M 95 60 
                         L 95 85
                         L 75 300
                         L 225 300
                         L 205 85
                         L 205 60
                         L 180 65
                         Q 150 75 150 75
                         Q 150 75 120 65
                         Z"
                      fill="url(#sweatshirtGradient)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    
                    {/* Round Collar */}
                    <ellipse cx="150" cy="65" rx="45" ry="12" 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="2"
                    />
                    
                    {/* Bottom Hem (нижняя резинка) */}
                    <rect x="75" y="297" width="150" height="8" rx="4"
                      fill="#e8e8e8"
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                  </g>
                  
                  {/* Design Overlay with Clipping */}
                  <g clipPath="url(#sweatshirtClip)">
                    <foreignObject x="75" y="95" width="150" height="190">
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={displayDesign.url}
                          alt="Дизайн на кофте"
                          className="w-full h-full object-cover"
                          style={{
                            opacity: 0.92,
                            mixBlendMode: 'multiply',
                            transform: viewMode === 'back' ? 'scaleX(-1)' : 'none'
                          }}
                        />
                      </div>
                    </foreignObject>
                  </g>
                  
                  {/* Shadow */}
                  <ellipse cx="150" cy="310" rx="75" ry="10" fill="black" opacity="0.1" />
                </svg>
                
                <div className="absolute top-4 left-4 px-3 py-1 bg-purple-600/30 backdrop-blur-sm rounded-full border border-purple-500/50">
                  <span className="text-xs font-bold text-purple-300 uppercase">
                    Вид {viewMode === 'front' ? 'спереди' : 'сзади'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 3D Preview - SWEATSHIRT
          <div className="w-full h-full min-h-[500px]">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-purple-300">Загружаем 3D модель кофты...</p>
                </div>
              </div>
            }>
              <Sweatshirt3DViewer 
                designUrl={displayDesign.url} 
                viewMode={viewMode}
                settings={view3DSettings}
              />
            </Suspense>
          </div>
        )}
        
        {/* Quality Badge */}
        <div className="absolute bottom-4 right-4 text-xs text-purple-400 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-500/30 font-medium">
          {visualizationMode === '2d' ? '✨ Высокое качество предпросмотра' : '🎮 Интерактивный просмотр'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30 hover:border-purple-400/50"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Генерация...' : 'Пересоздать'}
        </button>
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Download className="w-4 h-4" />
          Скачать дизайн
        </button>
      </div>
    </div>
  );
}
