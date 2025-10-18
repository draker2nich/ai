import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { printConfigurationStatus } from './config';

// Проверяем конфигурацию при запуске
console.log('🔍 Проверка конфигурации...');
printConfigurationStatus();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
