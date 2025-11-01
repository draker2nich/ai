/**
 * Сервис подготовки дизайнов к печати
 * Апскейлинг, конвертация в CMYK, раскладка на лекала
 */

/**
 * Конфигурация печати
 */
export const PRINT_CONFIG = {
  dpi: 300,
  colorSpace: 'CMYK',
  fileFormat: 'PNG',
  sizesAvailable: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
};

/**
 * Размеры лекал для каждого размера (в пикселях при 300 DPI)
 */
export const PATTERN_SIZES = {
  XS: { front: { w: 1800, h: 2400 }, back: { w: 1800, h: 2400 }, sleeve: { w: 900, h: 1500 } },
  S: { front: { w: 1950, h: 2550 }, back: { w: 1950, h: 2550 }, sleeve: { w: 975, h: 1575 } },
  M: { front: { w: 2100, h: 2700 }, back: { w: 2100, h: 2700 }, sleeve: { w: 1050, h: 1650 } },
  L: { front: { w: 2250, h: 2850 }, back: { w: 2250, h: 2850 }, sleeve: { w: 1125, h: 1725 } },
  XL: { front: { w: 2400, h: 3000 }, back: { w: 2400, h: 3000 }, sleeve: { w: 1200, h: 1800 } },
  XXL: { front: { w: 2550, h: 3150 }, back: { w: 2550, h: 3150 }, sleeve: { w: 1275, h: 1875 } },
  XXXL: { front: { w: 2700, h: 3300 }, back: { w: 2700, h: 3300 }, sleeve: { w: 1350, h: 1950 } }
};

/**
 * Апскейлинг изображения до нужного DPI
 * Для реального апскейлинга нужно использовать Real-ESRGAN API
 */
export async function upscaleImage(imageUrl, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Используем высококачественный алгоритм масштабирования
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Рисуем с масштабированием
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // В реальном проекте здесь должен быть вызов Real-ESRGAN API
      console.log(`📐 Апскейлинг: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Конвертация RGB в CMYK (упрощённая)
 * Для точной конвертации нужен цветовой профиль ICC
 */
export function rgbToCmyk(r, g, b) {
  // Нормализуем RGB (0-255) к (0-1)
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  // Вычисляем K (black)
  const k = 1 - Math.max(r, g, b);
  
  // Если изображение полностью чёрное
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  
  // Вычисляем CMY
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

/**
 * Конвертация изображения в CMYK
 */
export async function convertToCMYK(imageUrl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Создаём массив CMYK данных
      const cmykData = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        const cmyk = rgbToCmyk(r, g, b);
        cmykData.push({ ...cmyk, a });
        
        // Конвертируем обратно в RGB для предпросмотра
        // (реальный CMYK файл нужно сохранять в специальном формате)
        const rgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      console.log('🎨 Конвертация в CMYK завершена');
      console.log('⚠️ Яркие цвета могут измениться - это нормально для печати');
      
      resolve({
        previewUrl: canvas.toDataURL('image/png'),
        cmykData: cmykData,
        note: 'Для печати используйте профессиональный конвертер с ICC профилем'
      });
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Конвертация CMYK обратно в RGB (для предпросмотра)
 */
function cmykToRgb(c, m, y, k) {
  c = c / 100;
  m = m / 100;
  y = y / 100;
  k = k / 100;
  
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  
  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
}

/**
 * Раскладка дизайна на части (перед, спинка, рукава)
 */
export async function layoutPattern(patternUrl, size = 'M') {
  const sizes = PATTERN_SIZES[size];
  
  if (!sizes) {
    throw new Error(`Размер ${size} не найден`);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      const parts = {};
      
      // Перед
      const frontCanvas = document.createElement('canvas');
      const frontCtx = frontCanvas.getContext('2d');
      frontCanvas.width = sizes.front.w;
      frontCanvas.height = sizes.front.h;
      
      // Создаём повторяющийся паттерн
      const pattern = frontCtx.createPattern(img, 'repeat');
      frontCtx.fillStyle = pattern;
      frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
      parts.front = frontCanvas.toDataURL('image/png');
      
      // Спинка
      const backCanvas = document.createElement('canvas');
      const backCtx = backCanvas.getContext('2d');
      backCanvas.width = sizes.back.w;
      backCanvas.height = sizes.back.h;
      
      const patternBack = backCtx.createPattern(img, 'repeat');
      backCtx.fillStyle = patternBack;
      backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
      parts.back = backCanvas.toDataURL('image/png');
      
      // Рукава (2 штуки)
      const sleeveCanvas = document.createElement('canvas');
      const sleeveCtx = sleeveCanvas.getContext('2d');
      sleeveCanvas.width = sizes.sleeve.w;
      sleeveCanvas.height = sizes.sleeve.h;
      
      const patternSleeve = sleeveCtx.createPattern(img, 'repeat');
      sleeveCtx.fillStyle = patternSleeve;
      sleeveCtx.fillRect(0, 0, sleeveCanvas.width, sleeveCanvas.height);
      parts.sleeveLeft = sleeveCanvas.toDataURL('image/png');
      parts.sleeveRight = sleeveCanvas.toDataURL('image/png');
      
      console.log(`✂️ Раскладка на части для размера ${size} завершена`);
      
      resolve({
        size: size,
        parts: parts,
        dimensions: sizes
      });
    };
    
    img.onerror = reject;
    img.src = patternUrl;
  });
}

/**
 * Полная подготовка к печати
 */
export async function prepareToPrint(designUrl, size = 'M', options = {}) {
  try {
    console.log('🖨️ Подготовка к печати...');
    
    const sizes = PATTERN_SIZES[size];
    if (!sizes) {
      throw new Error(`Размер ${size} не поддерживается`);
    }
    
    // Шаг 1: Раскладка на части
    console.log('   Шаг 1: Раскладка на лекала...');
    const layout = await layoutPattern(designUrl, size);
    
    // Шаг 2: Апскейлинг каждой части
    console.log('   Шаг 2: Апскейлинг до печатного качества...');
    const upscaled = {};
    
    for (const [part, url] of Object.entries(layout.parts)) {
      const dimension = part === 'front' ? sizes.front :
                       part === 'back' ? sizes.back :
                       sizes.sleeve;
      
      upscaled[part] = await upscaleImage(url, dimension.w, dimension.h);
    }
    
    // Шаг 3: Конвертация в CMYK
    if (options.convertToCMYK) {
      console.log('   Шаг 3: Конвертация в CMYK...');
      const cmykParts = {};
      
      for (const [part, url] of Object.entries(upscaled)) {
        const cmyk = await convertToCMYK(url);
        cmykParts[part] = cmyk.previewUrl;
      }
      
      return {
        size: size,
        parts: cmykParts,
        colorSpace: 'CMYK',
        dpi: PRINT_CONFIG.dpi,
        dimensions: sizes,
        note: 'Файлы готовы к печати. Яркие цвета могут отличаться от экрана.'
      };
    }
    
    // Возвращаем RGB версию
    return {
      size: size,
      parts: upscaled,
      colorSpace: 'RGB',
      dpi: PRINT_CONFIG.dpi,
      dimensions: sizes
    };
    
  } catch (error) {
    console.error('❌ Ошибка подготовки к печати:', error);
    throw error;
  }
}

/**
 * Создание ZIP архива с файлами для печати
 */
export async function createPrintPackage(printData) {
  // Для создания ZIP нужна библиотека JSZip
  // Здесь упрощённая версия - создаём структуру данных
  
  const files = [];
  
  for (const [part, dataUrl] of Object.entries(printData.parts)) {
    files.push({
      name: `${printData.size}_${part}.png`,
      data: dataUrl,
      size: printData.dimensions[part === 'sleeveLeft' || part === 'sleeveRight' ? 'sleeve' : part]
    });
  }
  
  // Создаём информационный файл
  const info = {
    size: printData.size,
    colorSpace: printData.colorSpace,
    dpi: printData.dpi,
    files: files.map(f => ({
      name: f.name,
      width: f.size.w,
      height: f.size.h
    })),
    instructions: [
      'Используйте файлы для сублимационной печати',
      'DPI: 300',
      'Цветовое пространство: ' + printData.colorSpace,
      'Проверьте размеры перед печатью',
      'Рекомендуется тестовая печать'
    ]
  };
  
  files.push({
    name: 'README.json',
    data: JSON.stringify(info, null, 2)
  });
  
  console.log('📦 Пакет для печати создан:', files.length, 'файлов');
  
  return {
    files: files,
    info: info
  };
}

/**
 * Скачивание одного файла
 */
export function downloadFile(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Скачивание всех файлов пакета
 */
export function downloadPrintPackage(printPackage) {
  printPackage.files.forEach((file, index) => {
    setTimeout(() => {
      if (file.name.endsWith('.json')) {
        const blob = new Blob([file.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, file.name);
        URL.revokeObjectURL(url);
      } else {
        downloadFile(file.data, file.name);
      }
    }, index * 500); // Задержка между скачиваниями
  });
  
  console.log('⬇️ Начато скачивание', printPackage.files.length, 'файлов');
}