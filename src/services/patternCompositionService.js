/**
 * Сервис композиции паттернов (Метод А)
 * Генерация чистого паттерна + наложение на UV-развёртку
 */

/**
 * Генерация чистого бесшовного паттерна через DALL-E
 */
export async function generateSeamlessPattern(basePrompt, style = 'vivid') {
  // Усиленный промпт для создания идеального бесшовного паттерна
  const seamlessPrompt = `${basePrompt}, SEAMLESS TILEABLE PATTERN, perfect edges that connect seamlessly, repeating textile design, infinite wrap-around pattern, edges match exactly on all sides, professional fabric print design, high quality seamless texture`;
  
  return {
    prompt: seamlessPrompt,
    style: style,
    size: '1024x1024'
  };
}

/**
 * Создание цветовой маски из UV-развёртки
 * Берём UV-карту и создаём маску для композиции
 */
export async function createUVMask(uvMapPath) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Рисуем UV-карту
      ctx.drawImage(img, 0, 0);
      
      // Получаем данные изображения
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Создаём маску: делаем непрозрачные области красными, остальное чёрным
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        
        if (alpha > 128) {
          // Область детали - делаем красной
          data[i] = 255;     // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
          data[i + 3] = 255; // A
        } else {
          // Пустая область - делаем чёрной
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Возвращаем маску как data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = reject;
    img.src = uvMapPath;
  });
}

/**
 * Наложение паттерна на маску
 * Композиция: паттерн обрезается по форме маски
 */
export async function applyPatternToMask(patternUrl, maskDataUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const patternImg = new Image();
    const maskImg = new Image();
    
    let loadedCount = 0;
    
    const checkBothLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        compose();
      }
    };
    
    const compose = () => {
      // Размер канваса = размер маски
      canvas.width = maskImg.width;
      canvas.height = maskImg.height;
      
      // Рисуем паттерн, повторяя его для заполнения
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = canvas.width;
      patternCanvas.height = canvas.height;
      const patternCtx = patternCanvas.getContext('2d');
      
      // Создаём повторяющийся паттерн
      const pattern = patternCtx.createPattern(patternImg, 'repeat');
      patternCtx.fillStyle = pattern;
      patternCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем паттерн на основном канвасе
      ctx.drawImage(patternCanvas, 0, 0);
      
      // Применяем маску: используем маску как альфа-канал
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskImg, 0, 0);
      
      // Добавляем дополнительные элементы если есть (логотипы, полосы)
      if (options.overlays) {
        ctx.globalCompositeOperation = 'source-over';
        options.overlays.forEach(overlay => {
          const overlayImg = new Image();
          overlayImg.src = overlay.url;
          overlayImg.onload = () => {
            ctx.drawImage(overlayImg, overlay.x, overlay.y, overlay.width, overlay.height);
          };
        });
      }
      
      // Возвращаем финальное изображение
      setTimeout(() => {
        resolve(canvas.toDataURL('image/png'));
      }, 100);
    };
    
    patternImg.crossOrigin = 'anonymous';
    maskImg.crossOrigin = 'anonymous';
    
    patternImg.onload = checkBothLoaded;
    maskImg.onload = checkBothLoaded;
    
    patternImg.onerror = reject;
    maskImg.onerror = reject;
    
    patternImg.src = patternUrl;
    maskImg.src = maskDataUrl;
  });
}

/**
 * Добавление обязательных элементов (логотипы, полосы, номера)
 */
export function addMandatoryElements(baseImageUrl, elements) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const baseImg = new Image();
    
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      
      // Рисуем базовое изображение
      ctx.drawImage(baseImg, 0, 0);
      
      // Добавляем элементы
      let loadedElements = 0;
      const totalElements = elements.length;
      
      if (totalElements === 0) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }
      
      elements.forEach(element => {
        if (element.type === 'text') {
          // Текстовый элемент
          ctx.font = element.font || '48px Arial';
          ctx.fillStyle = element.color || '#FFFFFF';
          ctx.textAlign = element.align || 'center';
          ctx.fillText(element.text, element.x, element.y);
          
          loadedElements++;
          if (loadedElements === totalElements) {
            resolve(canvas.toDataURL('image/png'));
          }
        } else if (element.type === 'image') {
          // Изображение (логотип и т.д.)
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.drawImage(img, element.x, element.y, element.width, element.height);
            loadedElements++;
            if (loadedElements === totalElements) {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          img.onerror = () => {
            loadedElements++;
            if (loadedElements === totalElements) {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          img.src = element.url;
        }
      });
    };
    
    baseImg.onerror = reject;
    baseImg.src = baseImageUrl;
  });
}

/**
 * Полный процесс Method A
 */
export async function processMethodA(prompt, settings, uvMapPath, overlayElements = []) {
  try {
    console.log('🎨 Метод А: Начало процесса композиции');
    
    // Шаг 1: Генерация чистого паттерна
    console.log('📝 Шаг 1: Подготовка промпта для паттерна...');
    const patternConfig = await generateSeamlessPattern(prompt, settings.style);
    
    // Здесь должен быть вызов DALL-E для генерации паттерна
    // Возвращаем конфиг для внешнего вызова
    return {
      patternConfig,
      uvMapPath,
      overlayElements,
      processSteps: {
        step1: 'Generate seamless pattern with DALL-E',
        step2: 'Create UV mask from mapping',
        step3: 'Apply pattern to mask',
        step4: 'Add overlays (logos, stripes, etc.)'
      }
    };
    
  } catch (error) {
    console.error('❌ Ошибка в Методе А:', error);
    throw error;
  }
}

/**
 * Применение финальной композиции к 3D модели
 */
export async function applyCompositionToModel(patternUrl, uvMapPath, overlayElements = []) {
  try {
    console.log('🎭 Применение композиции к модели...');
    
    // Шаг 1: Создаём маску из UV-карты
    console.log('   Создание маски...');
    const mask = await createUVMask(uvMapPath);
    
    // Шаг 2: Накладываем паттерн на маску
    console.log('   Наложение паттерна...');
    const composed = await applyPatternToMask(patternUrl, mask);
    
    // Шаг 3: Добавляем дополнительные элементы
    if (overlayElements.length > 0) {
      console.log('   Добавление элементов...');
      const final = await addMandatoryElements(composed, overlayElements);
      return final;
    }
    
    return composed;
    
  } catch (error) {
    console.error('❌ Ошибка применения композиции:', error);
    throw error;
  }
}

/**
 * Проверка бесшовности паттерна
 */
export function validateSeamlessPattern(imageUrl) {
  return new Promise((resolve) => {
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
      
      // Проверяем совпадение краёв
      const edgeThreshold = 30; // Допустимое отклонение цвета
      let edgeMatches = 0;
      let edgeChecks = 0;
      
      // Проверка верхнего и нижнего края
      for (let x = 0; x < canvas.width; x++) {
        const topIdx = (0 * canvas.width + x) * 4;
        const bottomIdx = ((canvas.height - 1) * canvas.width + x) * 4;
        
        const rDiff = Math.abs(data[topIdx] - data[bottomIdx]);
        const gDiff = Math.abs(data[topIdx + 1] - data[bottomIdx + 1]);
        const bDiff = Math.abs(data[topIdx + 2] - data[bottomIdx + 2]);
        
        if (rDiff < edgeThreshold && gDiff < edgeThreshold && bDiff < edgeThreshold) {
          edgeMatches++;
        }
        edgeChecks++;
      }
      
      // Проверка левого и правого края
      for (let y = 0; y < canvas.height; y++) {
        const leftIdx = (y * canvas.width + 0) * 4;
        const rightIdx = (y * canvas.width + (canvas.width - 1)) * 4;
        
        const rDiff = Math.abs(data[leftIdx] - data[rightIdx]);
        const gDiff = Math.abs(data[leftIdx + 1] - data[rightIdx + 1]);
        const bDiff = Math.abs(data[leftIdx + 2] - data[rightIdx + 2]);
        
        if (rDiff < edgeThreshold && gDiff < edgeThreshold && bDiff < edgeThreshold) {
          edgeMatches++;
        }
        edgeChecks++;
      }
      
      const seamlessScore = (edgeMatches / edgeChecks) * 100;
      
      resolve({
        isSeamless: seamlessScore > 70,
        score: seamlessScore.toFixed(1),
        recommendation: seamlessScore > 70 
          ? 'Паттерн хорошо бесшовный' 
          : 'Паттерн может иметь видимые швы, рекомендуется регенерация'
      });
    };
    
    img.onerror = () => resolve({ isSeamless: false, score: 0, recommendation: 'Ошибка загрузки' });
    img.src = imageUrl;
  });
}