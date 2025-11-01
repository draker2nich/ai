/**
 * Модальное окно подготовки дизайна к печати
 * Выбор размера, просмотр раскладки, скачивание файлов
 */
import React, { useState } from 'react';
import { X, Download } from '../components/Icons';
import { useLanguage } from '../locales/LanguageContext';
import { prepareToPrint, downloadPrintPackage, createPrintPackage, PATTERN_SIZES } from '../services/printPreparationService';

export default function PrintPreparationModal({ design, onClose }) {
  const { t, language } = useLanguage();
  const [selectedSize, setSelectedSize] = useState('M');
  const [isPreparing, setIsPreparing] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [convertToCMYK, setConvertToCMYK] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const sizes = Object.keys(PATTERN_SIZES);
  
  const steps = [
    { name: language === 'ru' ? 'Выбор размера' : 'Size Selection', icon: '📏' },
    { name: language === 'ru' ? 'Раскладка' : 'Layout', icon: '✂️' },
    { name: language === 'ru' ? 'Апскейлинг' : 'Upscaling', icon: '📐' },
    { name: language === 'ru' ? 'CMYK' : 'CMYK', icon: '🎨' },
    { name: language === 'ru' ? 'Готово' : 'Ready', icon: '✅' }
  ];

  const handlePrepare = async () => {
    if (!design?.url) {
      setError(language === 'ru' ? 'Нет дизайна для подготовки' : 'No design to prepare');
      return;
    }

    setIsPreparing(true);
    setError('');
    setCurrentStep(0);

    try {
      // Имитируем прогресс через шаги
      for (let i = 0; i <= 4; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const prepared = await prepareToPrint(design.url, selectedSize, {
        convertToCMYK: convertToCMYK
      });

      setPrintData(prepared);
      setCurrentStep(4);
      
    } catch (err) {
      console.error('Ошибка подготовки:', err);
      setError(err.message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDownload = async () => {
    if (!printData) return;

    try {
      const printPackage = await createPrintPackage(printData);
      downloadPrintPackage(printPackage);
      
      // Уведомление
      const notification = language === 'ru' 
        ? `Скачивание ${printPackage.files.length} файлов...` 
        : `Downloading ${printPackage.files.length} files...`;
      
      alert(notification);
      
    } catch (err) {
      console.error('Ошибка скачивания:', err);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Заголовок */}
        <div className="bg-black/50 backdrop-blur-xl border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {language === 'ru' ? '🖨️ Подготовка к печати' : '🖨️ Print Preparation'}
              </h3>
              <p className="text-sm text-purple-400">
                {language === 'ru' ? 'Готовим файлы для производства' : 'Preparing files for production'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-purple-400 hover:bg-purple-900/30 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Индикатор прогресса */}
          {isPreparing && (
            <div className="mb-6 bg-black/40 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                      index <= currentStep 
                        ? 'bg-purple-600 scale-110' 
                        : 'bg-gray-700'
                    }`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs mt-2 ${
                      index <= currentStep ? 'text-white font-semibold' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`absolute h-1 w-full top-6 left-1/2 -z-10 transition-all ${
                        index < currentStep ? 'bg-purple-600' : 'bg-gray-700'
                      }`} style={{ marginLeft: '24px', width: 'calc(100% - 48px)' }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="mb-6 bg-red-900/40 border border-red-500/50 rounded-xl p-4 text-red-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Левая панель - настройки */}
            <div className="space-y-6">
              
              {/* Превью дизайна */}
              <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-sm font-semibold text-purple-300 mb-3">
                  {language === 'ru' ? 'Дизайн' : 'Design'}
                </h4>
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <img 
                    src={design?.url} 
                    alt="Design" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Выбор размера */}
              <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-sm font-semibold text-purple-300 mb-3">
                  📏 {language === 'ru' ? 'Размер изделия' : 'Garment Size'}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={isPreparing}
                      className={`py-3 px-4 rounded-lg font-bold transition-all ${
                        selectedSize === size
                          ? 'bg-purple-600 text-white scale-105'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                
                {/* Размеры лекал */}
                {selectedSize && PATTERN_SIZES[selectedSize] && (
                  <div className="mt-4 text-xs text-purple-300 space-y-1">
                    <p className="font-semibold">{language === 'ru' ? 'Размеры деталей:' : 'Part dimensions:'}</p>
                    <p>• {language === 'ru' ? 'Перед' : 'Front'}: {PATTERN_SIZES[selectedSize].front.w} × {PATTERN_SIZES[selectedSize].front.h} px</p>
                    <p>• {language === 'ru' ? 'Спинка' : 'Back'}: {PATTERN_SIZES[selectedSize].back.w} × {PATTERN_SIZES[selectedSize].back.h} px</p>
                    <p>• {language === 'ru' ? 'Рукав' : 'Sleeve'}: {PATTERN_SIZES[selectedSize].sleeve.w} × {PATTERN_SIZES[selectedSize].sleeve.h} px</p>
                  </div>
                )}
              </div>

              {/* Настройки конвертации */}
              <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-sm font-semibold text-purple-300 mb-3">
                  🎨 {language === 'ru' ? 'Цветовое пространство' : 'Color Space'}
                </h4>
                
                <button
                  onClick={() => setConvertToCMYK(!convertToCMYK)}
                  disabled={isPreparing}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      convertToCMYK ? 'bg-purple-600 border-purple-600' : 'border-gray-600'
                    }`}>
                      {convertToCMYK && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">
                        {language === 'ru' ? 'Конвертация в CMYK' : 'Convert to CMYK'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {language === 'ru' ? 'Для офсетной печати' : 'For offset printing'}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="mt-3 text-xs text-purple-300 bg-purple-900/20 rounded-lg p-3">
                  <p className="font-semibold mb-1">ℹ️ {language === 'ru' ? 'Важно:' : 'Important:'}</p>
                  <p>{language === 'ru' 
                    ? 'Яркие цвета могут измениться при конвертации в CMYK - это нормально для печати.' 
                    : 'Bright colors may change when converting to CMYK - this is normal for printing.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Правая панель - результат */}
            <div className="space-y-6">
              
              {printData ? (
                <>
                  {/* Превью деталей */}
                  <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3">
                      ✂️ {language === 'ru' ? 'Детали кроя' : 'Pattern Parts'}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(printData.parts).map(([part, url]) => (
                        <div key={part} className="bg-gray-900 rounded-lg overflow-hidden border border-purple-500/20">
                          <img src={url} alt={part} className="w-full aspect-[3/4] object-cover" />
                          <div className="p-2 bg-black/50">
                            <p className="text-xs text-white font-semibold capitalize">{part}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Информация о файлах */}
                  <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3">
                      📋 {language === 'ru' ? 'Информация' : 'Information'}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>{language === 'ru' ? 'Размер:' : 'Size:'}</span>
                        <span className="font-semibold text-white">{printData.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DPI:</span>
                        <span className="font-semibold text-white">{printData.dpi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ru' ? 'Цвет:' : 'Color:'}</span>
                        <span className="font-semibold text-white">{printData.colorSpace}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ru' ? 'Файлов:' : 'Files:'}</span>
                        <span className="font-semibold text-white">{Object.keys(printData.parts).length + 1}</span>
                      </div>
                    </div>

                    {printData.note && (
                      <div className="mt-4 text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-3">
                        💡 {printData.note}
                      </div>
                    )}
                  </div>

                  {/* Кнопка скачивания */}
                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    {language === 'ru' ? 'Скачать все файлы' : 'Download All Files'}
                  </button>
                </>
              ) : (
                <div className="bg-black/40 rounded-xl p-8 border border-purple-500/20 text-center">
                  <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold mb-2">
                    {language === 'ru' ? 'Готово к подготовке' : 'Ready to Prepare'}
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    {language === 'ru' 
                      ? 'Нажмите кнопку ниже, чтобы подготовить файлы для печати'
                      : 'Click the button below to prepare files for printing'}
                  </p>
                  
                  <button
                    onClick={handlePrepare}
                    disabled={isPreparing}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-8 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  >
                    {isPreparing ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        {language === 'ru' ? 'Подготовка...' : 'Preparing...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {language === 'ru' ? 'Подготовить к печати' : 'Prepare for Print'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}