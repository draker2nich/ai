/**
 * УЛУЧШЕННАЯ ВЕРСИЯ: Создание бесшовных паттернов
 * 
 * Философия: AI должен сразу создавать правильные паттерны.
 * Постобработка - только для edge cases.
 */

/**
 * Метод 1 (РЕКОМЕНДУЕТСЯ): Offset-and-blend техника
 * Более качественный результат, чем простое смешивание краев
 * 
 * Принцип:
 * 1. Смещаем изображение на 50% по X и Y (швы теперь в центре)
 * 2. Применяем умное смешивание только в центральной области
 * 3. Смещаем обратно
 */
export async function makeSeamlessOffset(imageUrl, blendRadius = 64) {
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
      
      // Шаг 1: Создаем смещенную версию (50% offset)
      const offsetCanvas = document.createElement('canvas');
      const offsetCtx = offsetCanvas.getContext('2d');
      offsetCanvas.width = width;
      offsetCanvas.height = height;
      
      const halfWidth = Math.floor(width / 2);
      const halfHeight = Math.floor(height / 2);
      
      // Рисуем 4 квадранта со смещением
      offsetCtx.drawImage(img, 
        halfWidth, halfHeight, halfWidth, halfHeight,  // source: правый нижний
        0, 0, halfWidth, halfHeight                     // dest: левый верхний
      );
      offsetCtx.drawImage(img,
        0, halfHeight, halfWidth, halfHeight,           // source: левый нижний  
        halfWidth, 0, halfWidth, halfHeight             // dest: правый верхний
      );
      offsetCtx.drawImage(img,
        halfWidth, 0, halfWidth, halfHeight,            // source: правый верхний
        0, halfHeight, halfWidth, halfHeight            // dest: левый нижний
      );
      offsetCtx.drawImage(img,
        0, 0, halfWidth, halfHeight,                    // source: левый верхний
        halfWidth, halfHeight, halfWidth, halfHeight    // dest: правый нижний
      );
      
      // Шаг 2: Применяем Gaussian blend в центральной крестообразной области
      const offsetImageData = offsetCtx.getImageData(0, 0, width, height);
      const data = offsetImageData.data;
      
      // Вертикальная линия (центр по X)
      for (let y = 0; y < height; y++) {
        for (let dx = -blendRadius; dx <= blendRadius; dx++) {
          const x = halfWidth + dx;
          if (x < 0 || x >= width) continue;
          
          // Gaussian weight
          const weight = Math.exp(-(dx * dx) / (2 * (blendRadius / 3) * (blendRadius / 3)));
          const idx = (y * width + x) * 4;
          
          // Blend с соседними пикселями
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
      
      // Шаг 3: Смещаем обратно (reverse offset)
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
 * Метод 2: Создание превью тайлинга для визуальной проверки
 * Позволяет пользователю увидеть, как паттерн повторяется
 */
export async function createTilingPreview(imageUrl, cols = 2, rows = 2, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Вычисляем размер каждой плитки
      const tileWidth = Math.floor(maxSize / cols);
      const tileHeight = Math.floor(maxSize / rows);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = tileWidth * cols;
      canvas.height = tileHeight * rows;
      
      // Рисуем паттерн в виде сетки
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.drawImage(
            img,
            col * tileWidth,
            row * tileHeight,
            tileWidth,
            tileHeight
          );
        }
      }
      
      // Добавляем тонкие линии для визуализации швов
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      
      // Вертикальные линии
      for (let col = 1; col < cols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * tileWidth, 0);
        ctx.lineTo(col * tileWidth, canvas.height);
        ctx.stroke();
      }
      
      // Горизонтальные линии
      for (let row = 1; row < rows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * tileHeight);
        ctx.lineTo(canvas.width, row * tileHeight);
        ctx.stroke();
      }
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Метод 3: Анализ качества швов
 * Определяет, насколько хорошо паттерн состыковывается
 */
export async function analyzeSeamQuality(imageUrl) {
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
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Анализируем различия на краях
      let horizontalDiff = 0;
      let verticalDiff = 0;
      let samplesH = 0;
      let samplesV = 0;
      
      // Горизонтальные края (левый vs правый)
      for (let y = 0; y < height; y += 4) { // семплируем каждый 4-й пиксель
        const leftIdx = (y * width) * 4;
        const rightIdx = (y * width + (width - 1)) * 4;
        
        for (let c = 0; c < 3; c++) {
          horizontalDiff += Math.abs(data[leftIdx + c] - data[rightIdx + c]);
        }
        samplesH++;
      }
      
      // Вертикальные края (верхний vs нижний)
      for (let x = 0; x < width; x += 4) {
        const topIdx = x * 4;
        const bottomIdx = ((height - 1) * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          verticalDiff += Math.abs(data[topIdx + c] - data[bottomIdx + c]);
        }
        samplesV++;
      }
      
      // Нормализуем (0-100, где 0 = идеально, 100 = ужасно)
      const hScore = Math.min(100, (horizontalDiff / samplesH / 3) / 2.55);
      const vScore = Math.min(100, (verticalDiff / samplesV / 3) / 2.55);
      const avgScore = (hScore + vScore) / 2;
      
      resolve({
        horizontalSeamQuality: 100 - hScore,
        verticalSeamQuality: 100 - vScore,
        overallQuality: 100 - avgScore,
        isSeamless: avgScore < 10, // хорошо, если средняя разница < 10
        needsProcessing: avgScore > 20
      });
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * УСТАРЕВШИЙ МЕТОД (оставлен для совместимости)
 * Используйте makeSeamlessOffset() вместо этого
 */
export async function makeSeamless(imageUrl, blendWidth = 32) {
  console.warn('makeSeamless() устарел. Используйте makeSeamlessOffset()');
  return makeSeamlessOffset(imageUrl, blendWidth);
}

/**
 * Enhance texture quality
 */
export async function enhanceTexture(imageUrl, options = {}) {
  const {
    brightness = 1.0,
    contrast = 1.0,
    saturation = 1.0,
    sharpen = false
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
 * Apply fabric texture overlay
 */
export async function applyFabricTexture(imageUrl, fabricUrl = null, opacity = 0.15) {
  return new Promise(async (resolve, reject) => {
    try {
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
        
        // Apply subtle noise for fabric texture
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
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Preload image
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