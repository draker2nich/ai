/**
 * Утилиты для обработки текстур
 * Оптимизированная версия с основными функциями
 */

/**
 * Создание бесшовного паттерна (offset-and-blend метод)
 * Более качественный результат чем простое смешивание краёв
 */
export async function makeSeamless(imageUrl, blendRadius = 64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const width = img.width;
      const height = img.height;
      
      canvas.width = width;
      canvas.height = height;
      
      // Шаг 1: Создаём смещённую версию (50% offset)
      const offsetCanvas = document.createElement('canvas');
      const offsetCtx = offsetCanvas.getContext('2d');
      offsetCanvas.width = width;
      offsetCanvas.height = height;
      
      const halfWidth = Math.floor(width / 2);
      const halfHeight = Math.floor(height / 2);
      
      // Рисуем 4 квадранта со смещением
      offsetCtx.drawImage(img, 
        halfWidth, halfHeight, halfWidth, halfHeight,
        0, 0, halfWidth, halfHeight
      );
      offsetCtx.drawImage(img,
        0, halfHeight, halfWidth, halfHeight,
        halfWidth, 0, halfWidth, halfHeight
      );
      offsetCtx.drawImage(img,
        halfWidth, 0, halfWidth, halfHeight,
        0, halfHeight, halfWidth, halfHeight
      );
      offsetCtx.drawImage(img,
        0, 0, halfWidth, halfHeight,
        halfWidth, halfHeight, halfWidth, halfHeight
      );
      
      // Шаг 2: Применяем Gaussian blend в центре
      const offsetImageData = offsetCtx.getImageData(0, 0, width, height);
      const data = offsetImageData.data;
      
      // Вертикальная линия (центр по X)
      for (let y = 0; y < height; y++) {
        for (let dx = -blendRadius; dx <= blendRadius; dx++) {
          const x = halfWidth + dx;
          if (x < 0 || x >= width) continue;
          
          const weight = Math.exp(-(dx * dx) / (2 * (blendRadius / 3) * (blendRadius / 3)));
          const idx = (y * width + x) * 4;
          const leftIdx = (y * width + Math.max(0, x - 1)) * 4;
          const rightIdx = (y * width + Math.min(width - 1, x + 1)) * 4;
          
          for (let c = 0; c < 3; c++) {
            const blended = data[idx + c] * weight + 
                          (data[leftIdx + c] + data[rightIdx + c]) * (1 - weight) / 2;
            data[idx + c] = Math.max(0, Math.min(255, blended));
          }
        }
      }
      
      // Горизонтальная линия (центр по Y)
      for (let x = 0; x < width; x++) {
        for (let dy = -blendRadius; dy <= blendRadius; dy++) {
          const y = halfHeight + dy;
          if (y < 0 || y >= height) continue;
          
          const weight = Math.exp(-(dy * dy) / (2 * (blendRadius / 3) * (blendRadius / 3)));
          const idx = (y * width + x) * 4;
          const topIdx = (Math.max(0, y - 1) * width + x) * 4;
          const bottomIdx = (Math.min(height - 1, y + 1) * width + x) * 4;
          
          for (let c = 0; c < 3; c++) {
            const blended = data[idx + c] * weight + 
                          (data[topIdx + c] + data[bottomIdx + c]) * (1 - weight) / 2;
            data[idx + c] = Math.max(0, Math.min(255, blended));
          }
        }
      }
      
      offsetCtx.putImageData(offsetImageData, 0, 0);
      
      // Шаг 3: Смещаем обратно
      ctx.drawImage(offsetCanvas,
        halfWidth, halfHeight, halfWidth, halfHeight,
        0, 0, halfWidth, halfHeight
      );
      ctx.drawImage(offsetCanvas,
        0, halfHeight, halfWidth, halfHeight,
        halfWidth, 0, halfWidth, halfHeight
      );
      ctx.drawImage(offsetCanvas,
        halfWidth, 0, halfWidth, halfHeight,
        0, halfHeight, halfWidth, halfHeight
      );
      ctx.drawImage(offsetCanvas,
        0, 0, halfWidth, halfHeight,
        halfWidth, halfHeight, halfWidth, halfHeight
      );
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Улучшение качества текстуры
 */
export async function enhanceTexture(imageUrl, options = {}) {
  const {
    brightness = 1.0,
    contrast = 1.0,
    saturation = 1.0
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Brightness
        data[i] *= brightness;
        data[i + 1] *= brightness;
        data[i + 2] *= brightness;
        
        // Contrast
        data[i] = ((data[i] - 128) * contrast) + 128;
        data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
        data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
        
        // Saturation
        if (saturation !== 1.0) {
          const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
          data[i] = gray + (data[i] - gray) * saturation;
          data[i + 1] = gray + (data[i + 1] - gray) * saturation;
          data[i + 2] = gray + (data[i + 2] - gray) * saturation;
        }
        
        // Clamp values
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Применение текстуры ткани
 */
export async function applyFabricTexture(imageUrl, fabricUrl = null, opacity = 0.15) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Применяем лёгкий шум для имитации текстуры ткани
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 10 * opacity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Предзагрузка изображения
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
