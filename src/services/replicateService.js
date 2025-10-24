/**
 * Сервис для работы с Replicate API
 * Оптимизированная версия с использованием констант
 */
import config from '../config';
import {
  API_CONFIG,
  INFERENCE_STEPS,
  GUIDANCE_SCALE,
  STYLE_MODIFIERS,
  PATTERN_TYPES,
  GENERATION_STAGES
} from '../constants';

const { PROXY_API_URL } = config;
const { SDXL_MODEL_VERSION, MAX_VARIANTS } = API_CONFIG;

/**
 * Retry fetch с экспоненциальной задержкой
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Rate limited, ожидание ${waitTime}ms перед повтором ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Ошибка сети, повтор через ${waitTime}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Превышено максимальное количество попыток');
}

/**
 * Создание prediction
 */
export async function createPrediction(prompt, settings = {}, seed = null) {
  const apiKey = config.REPLICATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('API ключ не настроен');
  }

  const enhancedPrompt = enhancePrompt(prompt, settings);
  const negativePrompt = buildNegativePrompt(settings);
  const inferenceSteps = INFERENCE_STEPS[settings.detailLevel] || INFERENCE_STEPS.medium;
  const guidanceScale = GUIDANCE_SCALE[settings.detailLevel] || GUIDANCE_SCALE.medium;
  
  try {
    const response = await fetchWithRetry(`${PROXY_API_URL}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: apiKey,
        version: SDXL_MODEL_VERSION,
        input: {
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          width: API_CONFIG.DEFAULT_IMAGE_SIZE,
          height: API_CONFIG.DEFAULT_IMAGE_SIZE,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: inferenceSteps,
          guidance_scale: guidanceScale,
          seed: seed || Math.floor(Math.random() * 1000000),
          prompt_strength: 0.8,
          refine: settings.detailLevel === 'high' ? 'expert_ensemble_refiner' : 'no_refiner'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Не удалось создать prediction: ${error.message}`);
  }
}

/**
 * Получение статуса prediction
 */
export async function getPrediction(predictionId) {
  const apiKey = config.REPLICATE_API_KEY;
  
  try {
    const response = await fetchWithRetry(`${PROXY_API_URL}/predictions/${predictionId}`, {
      headers: { 'X-API-Key': apiKey }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Не удалось получить статус: ${error.message}`);
  }
}

/**
 * Ожидание завершения prediction
 */
export async function waitForPrediction(predictionId, onProgress = null) {
  const maxAttempts = 120;
  const startTime = Date.now();
  
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    try {
      const prediction = await getPrediction(predictionId);
      const currentAttempts = attempts; // Копия для использования в замыкании
      
      let detailedStatus = {
        status: prediction.status,
        stage: GENERATION_STAGES.WAITING,
        message: '',
        progress: 0
      };

      if (prediction.status === 'starting') {
        detailedStatus.stage = GENERATION_STAGES.STARTING;
        detailedStatus.progress = 10;
      } else if (prediction.status === 'processing') {
        detailedStatus.stage = GENERATION_STAGES.GENERATING;
        detailedStatus.progress = Math.min(50 + (currentAttempts * 2), 90);
      } else if (prediction.status === 'succeeded') {
        detailedStatus.stage = GENERATION_STAGES.COMPLETED;
        detailedStatus.progress = 100;
        
        if (prediction.output && prediction.output[0]) {
          await preloadImage(prediction.output[0]);
        }
      }
      
      if (onProgress) onProgress(detailedStatus);
      
      if (prediction.status === 'succeeded') {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Prediction ${predictionId} завершён за ${duration}s`);
        return prediction;
      }
      
      if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Генерация не удалась');
      }
      
      if (prediction.status === 'canceled') {
        throw new Error('Генерация отменена');
      }
    } catch (error) {
      if (attempts > 10) throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, attempts < 10 ? 1000 : 2000));
  }
  
  throw new Error('Превышено время ожидания (2 минуты)');
}

/**
 * Генерация нескольких дизайнов параллельно
 */
export async function generateDesigns(prompt, settings = {}, onProgressUpdate = null) {
  const numberOfVariants = Math.min(settings.numberOfVariants || 4, MAX_VARIANTS);
  console.log(`🎨 Запуск генерации ${numberOfVariants} вариантов...`);
  
  const imageStatuses = Array.from({ length: numberOfVariants }, (_, i) => ({
    index: i,
    stage: GENERATION_STAGES.CREATING,
    progress: 0
  }));
  
  const updateProgress = () => {
    if (onProgressUpdate) onProgressUpdate([...imageStatuses]);
  };
  
  try {
    updateProgress();
    
    // Создаём все predictions параллельно
    const predictionPromises = Array.from({ length: numberOfVariants }, async (_, i) => {
      imageStatuses[i] = { index: i, stage: GENERATION_STAGES.CREATING, progress: 5 };
      updateProgress();
      
      try {
        const seed = Math.floor(Math.random() * 1000000) + i * 1000;
        const prediction = await createPrediction(prompt, settings, seed);
        imageStatuses[i] = { index: i, stage: GENERATION_STAGES.WAITING, progress: 20, predictionId: prediction.id };
        updateProgress();
        return prediction;
      } catch (error) {
        imageStatuses[i] = { index: i, stage: GENERATION_STAGES.ERROR, progress: 0 };
        updateProgress();
        throw error;
      }
    });
    
    const predictions = await Promise.all(predictionPromises);
    
    // Ждём завершения
    const results = await Promise.all(
      predictions.map((pred, index) => 
        waitForPrediction(pred.id, (status) => {
          imageStatuses[index] = { ...status, index };
          updateProgress();
        })
      )
    );
    
    // Отмечаем все как завершённые
    imageStatuses.forEach((_, i) => {
      imageStatuses[i] = { index: i, stage: GENERATION_STAGES.COMPLETED, progress: 100 };
    });
    updateProgress();
    
    // Форматируем результаты
    return results
      .filter(result => result.output && result.output[0])
      .map((result, index) => ({
        id: result.id,
        url: result.output[0],
        prompt: prompt,
        seed: result.input?.seed,
        index: index
      }));
  } catch (error) {
    console.error('❌ Ошибка генерации:', error);
    throw new Error(`Не удалось сгенерировать дизайны: ${error.message}`);
  }
}

/**
 * Построение negative prompt
 */
function buildNegativePrompt(settings = {}) {
  let negativePrompt = 'blurry, low quality, distorted, ugly, watermark, text, signature, logo, letters, words, bad anatomy, deformed, artifacts';
  
  if (settings.patternType === PATTERN_TYPES.SEAMLESS) {
    negativePrompt += ', visible seams, edge discontinuity, border artifacts, non-repeating pattern, mismatched borders';
  }
  
  if (settings.patternType === PATTERN_TYPES.GEOMETRIC || settings.style === 'geometric') {
    negativePrompt += ', asymmetric shapes, irregular patterns, uneven spacing';
  }
  
  return negativePrompt;
}

/**
 * Улучшение промпта с настройками
 */
function enhancePrompt(prompt, settings = {}) {
  let enhanced = prompt;
  
  // Добавляем инструкции для паттерна
  if (settings.patternType === PATTERN_TYPES.SEAMLESS) {
    enhanced += ', SEAMLESS REPEATING PATTERN, tileable texture, infinite pattern, edges match perfectly, wrap-around design, textile design';
  } else if (settings.patternType === PATTERN_TYPES.GEOMETRIC) {
    enhanced += ', SEAMLESS GEOMETRIC PATTERN, tileable shapes, perfect symmetry, repeating angular design, geometric tessellation';
  } else if (settings.patternType === PATTERN_TYPES.COMPOSITION) {
    enhanced += ', artistic composition, centered design, full print artwork, complete illustration';
  }
  
  // Добавляем модификатор стиля
  if (settings.style && STYLE_MODIFIERS[settings.style]) {
    enhanced += STYLE_MODIFIERS[settings.style];
  }
  
  // Качество по уровню детализации
  if (settings.detailLevel === 'high') {
    enhanced += ', ultra detailed, masterpiece quality, professional artwork, intricate details';
  } else if (settings.detailLevel === 'medium') {
    enhanced += ', detailed artwork, high quality design, professional finish';
  } else {
    enhanced += ', clean design, good quality';
  }
  
  // Текстильные инструкции
  enhanced += ', optimized for textile printing, fashion design, apparel artwork, print-ready';
  
  return enhanced;
}

/**
 * Предзагрузка изображения
 */
async function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    img.src = url;
  });
}

/**
 * Проверка настройки API ключа
 */
export function isApiKeyConfigured() {
  const apiKey = config.REPLICATE_API_KEY;
  return apiKey && apiKey.length > 0 && apiKey.startsWith('r8_');
}
