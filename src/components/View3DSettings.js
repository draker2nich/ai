import React, { useState } from 'react';
import { Settings, X } from './Icons';

export default function View3DSettings({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md text-purple-300 rounded-xl border border-purple-500/30 hover:bg-purple-900/30 hover:border-purple-400/50 transition-all shadow-lg"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-semibold">Настройки 3D</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-purple-500/30 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Настройки 3D</h3>
                  <p className="text-xs text-purple-400">Настройте визуализацию</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-400 hover:bg-purple-900/30 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Качество визуализации
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-purple-200">Сглаживание (AA)</label>
                    <button
                      onClick={() => handleChange('antialiasing', !settings.antialiasing)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.antialiasing 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                          : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.antialiasing ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-purple-200">Тени</label>
                    <button
                      onClick={() => handleChange('shadows', !settings.shadows)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.shadows 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                          : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.shadows ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-purple-200">Разрешение</label>
                      <span className="text-xs text-purple-400 font-semibold">{settings.pixelRatio}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.5"
                      value={settings.pixelRatio}
                      onChange={(e) => handleChange('pixelRatio', parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  Освещение
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-purple-200">Общее освещение</label>
                      <span className="text-xs text-purple-400 font-semibold">
                        {Math.round(settings.ambientLight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.ambientLight}
                      onChange={(e) => handleChange('ambientLight', parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-purple-200">Направленный свет</label>
                      <span className="text-xs text-purple-400 font-semibold">
                        {Math.round(settings.directionalLight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.directionalLight}
                      onChange={(e) => handleChange('directionalLight', parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  Материал
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-purple-200">Шероховатость</label>
                      <span className="text-xs text-purple-400 font-semibold">
                        {Math.round(settings.roughness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.roughness}
                      onChange={(e) => handleChange('roughness', parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/30">
                <button
                  onClick={() => {
                    onSettingsChange({
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
                  }}
                  className="w-full py-3 px-4 bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all font-semibold text-sm"
                >
                  Сбросить настройки
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-black/50 backdrop-blur-xl border-t border-purple-500/30 p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Применить настройки
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
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
      `}</style>
    </>
  );
}
