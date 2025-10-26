/**
 * Компонент модального окна с сохранёнными дизайнами
 * Отображает галерею всех сохранённых пользователем дизайнов
 */
import React from 'react';
import { X } from './Icons';
import { useLanguage } from '../locales/LanguageContext';

export default function SavedDesigns({ designs, onLoad, onDelete, onClose }) {
  const { t } = useLanguage();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Менее часа назад
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${t.savedDesigns.timeAgo.minutes}`;
    }
    
    // Менее суток назад
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${t.savedDesigns.timeAgo.hours}`;
    }
    
    // Менее недели назад
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} ${t.savedDesigns.timeAgo.days}`;
    }
    
    // Иначе показываем дату
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const truncatePrompt = (text, maxLength = 60) => {
    if (!text) return t.savedDesigns.noDescription;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="bg-black/50 backdrop-blur-xl border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 4v14l-5-2.5L5 18V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.savedDesigns.title}</h3>
              <p className="text-xs text-purple-400">{t.savedDesigns.total}: {designs.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-400 hover:bg-purple-900/30 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          {designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white mb-2">{t.savedDesigns.empty}</p>
              <p className="text-sm text-purple-300">
                {t.savedDesigns.emptyHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="group relative bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 hover:border-purple-400/50 overflow-hidden transition-all hover:shadow-xl hover:shadow-purple-500/20"
                >
                  {/* Изображение */}
                  <div className="aspect-square relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                    <img
                      src={design.url}
                      alt={design.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Оверлей при наведении */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onLoad(design)}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {t.savedDesigns.load}
                        </button>
                        <button
                          onClick={() => onDelete(design.id)}
                          className="py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-all"
                          title={t.savedDesigns.delete}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-3">
                    <p className="text-sm text-white font-medium mb-1 line-clamp-2">
                      {truncatePrompt(design.prompt)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-purple-400">
                      <span>{formatDate(design.createdAt)}</span>
                      {design.settings?.style && (
                        <span className="px-2 py-0.5 bg-purple-900/30 rounded-full">
                          {design.settings.style}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
