import React, { useState, useEffect, Suspense, lazy } from 'react';

/**
 * УМНАЯ ОБЁРТКА ДЛЯ 3D ВИЗУАЛИЗАЦИИ
 * 
 * Стратегия (как делают опытные программисты):
 * 1. Попытка загрузить реальную модель (если есть)
 * 2. Fallback на процедурную генерацию (всегда работает)
 * 3. Graceful degradation - пользователь всегда видит результат
 */

// Lazy load компонентов для оптимизации
const ImprovedSweatshirt3D = lazy(() => import('./ImprovedSweatshirt3D'));
const Sweatshirt3DLoader = lazy(() => import('./Sweatshirt3DLoader'));

/**
 * Конфигурация путей к моделям
 * Измените здесь, если добавите свои файлы
 */
const MODEL_PATHS = {
  obj: '/models/sweatshirt.obj',
  gltf: '/models/sweatshirt.gltf',
  glb: '/models/sweatshirt.glb',
  fbx: '/models/sweatshirt.fbx'
};

/**
 * Проверка существования файла модели
 */
async function checkModelExists(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Определение доступного формата модели
 */
async function detectAvailableModel() {
  // Проверяем форматы в порядке приоритета
  const priorities = ['glb', 'gltf', 'obj', 'fbx'];
  
  for (const format of priorities) {
    const path = MODEL_PATHS[format];
    const exists = await checkModelExists(path);
    if (exists) {
      console.log(`✅ Найдена модель: ${path}`);
      return { format, path };
    }
  }
  
  console.log('ℹ️ Внешние модели не найдены, используем процедурную генерацию');
  return null;
}

/**
 * Режимы отображения
 */
const DISPLAY_MODES = {
  AUTO_DETECT: 'auto',      // Автоопределение (рекомендуется)
  PROCEDURAL: 'procedural', // Процедурная генерация (всегда работает)
  MODEL_FILE: 'file'        // Загрузка из файла (требует файлы)
};

export default function Smart3DViewer({ 
  designUrl, 
  viewMode, 
  settings = {},
  forcedMode = DISPLAY_MODES.AUTO_DETECT // Можно переключить принудительно
}) {
  const [displayMode, setDisplayMode] = useState('loading');
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeViewer();
  }, [forcedMode]);

  const initializeViewer = async () => {
    setDisplayMode('loading');
    setError(null);

    try {
      if (forcedMode === DISPLAY_MODES.PROCEDURAL) {
        // Принудительно использовать процедурную генерацию
        console.log('🎨 Режим: Процедурная генерация (принудительный)');
        setDisplayMode('procedural');
        return;
      }

      if (forcedMode === DISPLAY_MODES.MODEL_FILE) {
        // Принудительно попытаться загрузить файл
        console.log('📁 Режим: Загрузка файла (принудительный)');
        const model = await detectAvailableModel();
        if (model) {
          setModelInfo(model);
          setDisplayMode('file');
        } else {
          throw new Error('Файлы моделей не найдены');
        }
        return;
      }

      // AUTO_DETECT - умное определение
      console.log('🔍 Режим: Автоопределение...');
      const model = await detectAvailableModel();
      
      if (model) {
        setModelInfo(model);
        setDisplayMode('file');
      } else {
        console.log('✨ Переключение на процедурную генерацию');
        setDisplayMode('procedural');
      }
    } catch (err) {
      console.error('❌ Ошибка инициализации:', err);
      setError(err.message);
      // Fallback на процедурную генерацию при любой ошибке
      setDisplayMode('procedural');
    }
  };

  // Loading state
  if (displayMode === 'loading') {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
              </div>
            </div>
          </div>
          <p className="text-purple-300 text-base font-semibold mb-2">
            Инициализация 3D визуализации...
          </p>
          <p className="text-purple-400 text-sm">
            Проверяем доступные модели
          </p>
        </div>
      </div>
    );
  }

  // Error fallback
  if (error && displayMode !== 'procedural') {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-300 font-bold mb-2">Ошибка загрузки 3D</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setDisplayMode('procedural');
              setError(null);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            Использовать процедурную генерацию
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate viewer
  return (
    <div className="w-full h-full min-h-[500px] relative">
      <Suspense fallback={
        <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-black/50 to-pink-900/30 rounded-2xl">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300">Загружаем 3D компонент...</p>
          </div>
        </div>
      }>
        {displayMode === 'file' && modelInfo ? (
          <>
            <Sweatshirt3DLoader
              designUrl={designUrl}
              viewMode={viewMode}
              settings={settings}
            />
            {/* Badge для файловой модели */}
            <div className="absolute top-4 left-4 bg-green-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-green-500/40 shadow-lg">
              <div className="flex items-center gap-2 text-green-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold uppercase">
                  Загружена {modelInfo.format.toUpperCase()} модель
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <ImprovedSweatshirt3D
              designUrl={designUrl}
              viewMode={viewMode}
              settings={settings}
            />
            {/* Badge для процедурной генерации */}
            <div className="absolute top-4 left-4 bg-purple-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-500/40 shadow-lg">
              <div className="flex items-center gap-2 text-purple-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
                <span className="text-xs font-bold uppercase">
                  Процедурная генерация
                </span>
              </div>
            </div>
          </>
        )}
      </Suspense>

      {/* Информационное сообщение при процедурной генерации */}
      {displayMode === 'procedural' && (
        <div className="absolute bottom-4 left-4 right-4 bg-blue-900/80 backdrop-blur-md px-4 py-3 rounded-xl border border-blue-500/40 shadow-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-blue-200 text-sm font-semibold mb-1">
                💡 Используется процедурная 3D модель
              </p>
              <p className="text-blue-300 text-xs">
                Хотите использовать свою модель? Поместите файл в{' '}
                <code className="px-1 py-0.5 bg-blue-950/50 rounded">public/models/sweatshirt.{'{glb|obj|gltf}'}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export режимов для использования в других компонентах
export { DISPLAY_MODES };