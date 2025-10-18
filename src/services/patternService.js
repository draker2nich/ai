/**
 * Сервис для работы с лекалами одежды
 * UV-маппинг и подготовка к печати
 */

import { API_CONFIG } from '../constants';

/**
 * Структура лекал кофты
 */
const PATTERN_STRUCTURE = {
  // Передняя часть
  front: {
    name: 'Перёд',
    uvBounds: { x: 0, y: 0, width: 0.25, height: 0.5 }
  },
  // Задняя часть
  back: {
    name: 'Спина',
    uvBounds: { x: 0.25, y: 0, width: 0.25, height: 0.5 }
  },
  // Левый рукав
  sleeveLeft: {
    name: 'Левый рукав',
    uvBounds: { x: 0, y: 0.5, width: 0.5, height: 0.5 }
  },
  // Правый рукав
  sleeveRight: {
    name: 'Правый рукав',
    uvBounds: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
  }
};

/**
 * Размеры одежды (в см)
 */
export const SIZES = {
  XS: { chest: 84, length: 62, sleeve: 58 },
  S: { chest: 88, length: 64, sleeve: 60 },
  M: { chest: 92, length: 66, sleeve: 62 },
  L: { chest: 96, length: 68, sleeve: 64 },
  XL: { chest: 100, length: 70, sleeve: 66 },
  XXL: { chest: 104, length: 72, sleeve: 68 },
  XXXL: { chest: 108, length: 74, sleeve: 70 }
};

/**
 * DPI для печати
 */
const PRINT_DPI = {
  draft: 150,      // Черновик
  standard: 300,   // Стандарт
  high: 600        // Высокое качество
};

/**
 * Применение дизайна на все лекала
 */
export async function applyDesignToPatterns(designUrl, size = 'M', options = {}) {
  const {
    seamless = true,
    quality = 'standard'
  } = options;

  try {
    console.log('🎨 Применение дизайна на лекала...');
    
    // Загружаем дизайн
    const designImage = await loadImage(designUrl);
    
    // Создаём паттерн для каждой детали
    const patterns = {};
    
    for (const [key, pattern] of Object.entries(PATTERN_STRUCTURE)) {
      console.log(`📐 Обработка: ${pattern.name}`);
      
      const patternCanvas = await createPatternPiece(
        designImage,
        pattern,
        SIZES[size],
        { seamless, quality }
      );
      
      patterns[key] = {
        name: pattern.name,
        canvas: patternCanvas,
        dataUrl: patternCanvas.toDataURL('image/png', 1.0)
      };
    }
    
    console.log('✅ Все лекала готовы!');
    return patterns;
    
  } catch (error) {
    console.error('❌ Ошибка применения дизайна:', error);
    throw error;
  }
}

/**
 * Создание одной детали лекала
 */
async function createPatternPiece(designImage, pattern, sizeData, options) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Вычисляем размер в пикселях
  const dpi = PRINT_DPI[options.quality] || PRINT_DPI.standard;
  const cmToPx = dpi / 2.54; // 1см = dpi/2.54 пикселей
  
  // Размер детали в пикселях
  const width = Math.round(sizeData.chest * cmToPx);
  const height = Math.round(sizeData.length * cmToPx);
  
  canvas.width = width;
  canvas.height = height;
  
  // Если seamless - создаём повторяющийся паттерн
  if (options.seamless) {
    const pattern = ctx.createPattern(designImage, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Масштабируем дизайн на всю деталь
    ctx.drawImage(designImage, 0, 0, width, height);
  }
  
  return canvas;
}

/**
 * Экспорт всех лекал для печати
 */
export async function exportForPrinting(patterns, size, options = {}) {
  const {
    format = 'separate', // 'separate' или 'combined'
    includeMarkers = true,
    quality = 'standard'
  } = options;
  
  if (format === 'separate') {
    // Отдельные файлы для каждой детали
    return exportSeparatePatterns(patterns, size, { includeMarkers, quality });
  } else {
    // Все детали на одном листе
    return exportCombinedPattern(patterns, size, { includeMarkers, quality });
  }
}

/**
 * Экспорт отдельных файлов
 */
async function exportSeparatePatterns(patterns, size, options) {
  const files = [];
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const canvas = pattern.canvas;
    
    // Добавляем маркеры если нужно
    if (options.includeMarkers) {
      addPrintMarkers(canvas, pattern.name, size);
    }
    
    // Конвертируем в blob
    const blob = await canvasToBlob(canvas);
    
    files.push({
      name: `${pattern.name}_${size}.png`,
      blob: blob,
      url: URL.createObjectURL(blob)
    });
  }
  
  return files;
}

/**
 * Экспорт объединённого макета
 */
async function exportCombinedPattern(patterns, size, options) {
  // Создаём большой canvas для всех деталей
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Вычисляем общий размер
  const margin = 50; // отступ между деталями
  let totalWidth = margin;
  let totalHeight = margin;
  let maxRowHeight = 0;
  let currentX = margin;
  let currentY = margin;
  
  // Раскладываем детали
  const layout = [];
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const patternCanvas = pattern.canvas;
    
    // Если не влезает по ширине - переносим на новую строку
    if (currentX + patternCanvas.width > 5000) { // макс ширина
      currentX = margin;
      currentY += maxRowHeight + margin;
      maxRowHeight = 0;
    }
    
    layout.push({
      canvas: patternCanvas,
      x: currentX,
      y: currentY,
      name: pattern.name
    });
    
    currentX += patternCanvas.width + margin;
    maxRowHeight = Math.max(maxRowHeight, patternCanvas.height);
    totalWidth = Math.max(totalWidth, currentX);
    totalHeight = Math.max(totalHeight, currentY + patternCanvas.height + margin);
  }
  
  // Устанавливаем размер
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  
  // Белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем все детали
  for (const item of layout) {
    ctx.drawImage(item.canvas, item.x, item.y);
    
    // Добавляем метки
    if (options.includeMarkers) {
      ctx.font = '24px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(
        `${item.name} (${size})`,
        item.x,
        item.y - 10
      );
      
      // Рамка вокруг детали
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x, item.y, item.canvas.width, item.canvas.height);
    }
  }
  
  // Конвертируем в blob
  const blob = await canvasToBlob(canvas);
  
  return [{
    name: `Все_детали_${size}.png`,
    blob: blob,
    url: URL.createObjectURL(blob)
  }];
}

/**
 * Добавление меток для печати
 */
function addPrintMarkers(canvas, patternName, size) {
  const ctx = canvas.getContext('2d');
  
  // Метки по углам (для выравнивания при печати)
  const markerSize = 20;
  ctx.fillStyle = '#000000';
  
  // Верхний левый
  ctx.fillRect(0, 0, markerSize, 2);
  ctx.fillRect(0, 0, 2, markerSize);
  
  // Верхний правый
  ctx.fillRect(canvas.width - markerSize, 0, markerSize, 2);
  ctx.fillRect(canvas.width - 2, 0, 2, markerSize);
  
  // Нижний левый
  ctx.fillRect(0, canvas.height - 2, markerSize, 2);
  ctx.fillRect(0, canvas.height - markerSize, 2, markerSize);
  
  // Нижний правый
  ctx.fillRect(canvas.width - markerSize, canvas.height - 2, markerSize, 2);
  ctx.fillRect(canvas.width - 2, canvas.height - markerSize, 2, markerSize);
  
  // Текстовая метка
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    `${patternName} | Размер: ${size}`,
    10,
    canvas.height - 10
  );
  
  // Линейка (каждые 10см)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  const dpi = PRINT_DPI.standard;
  const cmToPx = dpi / 2.54;
  
  for (let cm = 10; cm * cmToPx < canvas.width; cm += 10) {
    const x = cm * cmToPx;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 30);
    ctx.lineTo(x, canvas.height - 20);
    ctx.stroke();
    ctx.fillText(`${cm}см`, x - 15, canvas.height - 35);
  }
}

/**
 * Загрузка изображения
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Конвертация canvas в blob
 */
function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
}

/**
 * Скачивание файлов
 */
export async function downloadPatterns(files) {
  for (const file of files) {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Небольшая задержка между скачиваниями
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Создание архива со всеми файлами (требует JSZip)
 */
export async function createPrintPackage(patterns, size, designUrl) {
  // TODO: Реализовать создание ZIP архива
  // Потребуется библиотека jszip
  console.log('📦 Создание пакета для печати...');
  
  return {
    patterns,
    size,
    designUrl,
    timestamp: Date.now()
  };
}
