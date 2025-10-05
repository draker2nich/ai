import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from './Icons';

export default function ApiKeyInput({ apiKey, onApiKeyChange, error }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 p-6 shadow-sm">
      <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></span>
        API Ключ Replicate
      </label>

      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="r8_..."
          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!error && apiKey && (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">API ключ подтвержден</span>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-bold">💡 Где получить:</span> Зарегистрируйтесь на{' '}
          <a 
            href="https://replicate.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold underline hover:text-blue-600"
          >
            replicate.com
          </a>
          {' '}и создайте API ключ в настройках аккаунта
        </p>
      </div>
    </div>
  );
}
