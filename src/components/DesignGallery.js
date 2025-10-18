import React from 'react';

export default function DesignGallery({ 
  designs, 
  selectedDesign, 
  onSelectDesign 
}) {
  if (designs.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Созданные дизайны
        </h3>
        <span className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 rounded-full border border-purple-500/30">
          {designs.length} {designs.length === 1 ? 'дизайн' : designs.length < 5 ? 'дизайна' : 'дизайнов'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {designs.map((design) => (
          <button
            key={design.id}
            onClick={() => onSelectDesign(design)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
              selectedDesign?.id === design.id
                ? 'border-purple-500 ring-4 ring-purple-500/30 shadow-2xl scale-105'
                : 'border-purple-500/20 hover:border-purple-400/50 hover:shadow-xl hover:scale-102'
            }`}
          >
            <div className="aspect-square relative bg-black">
              <img
                src={design.url}
                alt={`Дизайн ${design.index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 animate-pulse -z-10" />
            </div>
            
            {selectedDesign?.id === design.id && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
              <p className="text-white text-sm font-bold flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-600/50 backdrop-blur rounded-full flex items-center justify-center text-xs">
                  {design.index + 1}
                </span>
                Вариант {design.index + 1}
              </p>
            </div>

            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-2 py-1 bg-purple-600/80 backdrop-blur text-white text-xs font-bold rounded-lg">
                Нажмите для выбора
              </span>
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
