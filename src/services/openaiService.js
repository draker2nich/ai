/**
 * Сервис для работы с Custom OpenAI-compatible API (aiguoguo199.com)
 * Генерация изображений с использованием DALL-E 3
 */
import config from '../config';
import {
  API_CONFIG,
  STYLE_MODIFIERS,
  PATTERN_TYPES,
  GENERATION_STAGES
} from '../constants';

const { PROXY_API_URL, OPENAI_BASE_URL } = config;
const { MAX_VARIANTS } = API_CONFIG;

/**
 * Генерация одного изображения через DALL-E 3
 */
async function generateSingleImage(prompt, settings = {}) {
  const apiKey = config.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API ключ не настроен');
  }

  const enhancedPrompt = enhancePrompt(prompt, settings);
  
  // DALL-E 3 поддерживает размеры: 1024x1024, 1024x1792, 1792x1024
  const size = '1024x1024';
  const quality = settings.detailLevel === 'high' ? 'hd' : 'standard';
  const style = settings.style === 'realistic' ? 'natural' : 'vivid';

  try {
    console.log('📤 Отправка запроса в Custom OpenAI API...');
    console.log(`   Base URL: ${OPENAI_BASE_URL}`);
    console.log(`   Промпт: ${enhancedPrompt.substring(0, 100)}...`);
    
    const response = await fetch(`${PROXY_API_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: apiKey,
        baseUrl: OPENAI_BASE_URL,
        prompt: enhancedPrompt,
        size: size,
        quality: quality,
        style: style
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Ошибка API:', error);
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Неверный ответ от API');
    }

    console.log('✅ Изображение успешно получено');
    return {
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt
    };
  } catch (error) {
    console.error('❌ Ошибка генерации:', error);
    throw new Error(`Не удалось сгенерировать изображение: ${error.message}`);
  }
}

/**
 * Генерация нескольких изображений последовательно
 * DALL-E 3 генерирует только по одному изображению за раз
 */
export async function generateDesigns(prompt, settings = {}, onProgressUpdate = null) {
  const numberOfVariants = Math.min(settings.numberOfVariants || 4, MAX_VARIANTS);
  console.log(`🎨 Запуск генерации ${numberOfVariants} вариантов...`);
  console.log(`🔗 Используется API: ${OPENAI_BASE_URL}`);
  
  const imageStatuses = Array.from({ length: numberOfVariants }, (_, i) => ({
    index: i,
    stage: GENERATION_STAGES.CREATING,
    progress: 0
  }));
  
  const updateProgress = () => {
    if (onProgressUpdate) onProgressUpdate([...imageStatuses]);
  };
  
  const results = [];
  
  try {
    updateProgress();
    
    // Генерируем изображения последовательно
    for (let i = 0; i < numberOfVariants; i++) {
      try {
        console.log(`\n🎨 Генерация варианта ${i + 1}/${numberOfVariants}...`);
        
        imageStatuses[i] = { 
          index: i, 
          stage: GENERATION_STAGES.GENERATING, 
          progress: 30 
        };
        updateProgress();
        
        // Добавляем вариацию в промпт для разнообразия
        const variantPrompt = addVariationToPrompt(prompt, i, numberOfVariants);
        const result = await generateSingleImage(variantPrompt, settings);
        
        imageStatuses[i] = { 
          index: i, 
          stage: GENERATION_STAGES.COMPLETED, 
          progress: 100 
        };
        updateProgress();
        
        results.push({
          id: `dalle_${Date.now()}_${i}`,
          url: result.url,
          prompt: prompt,
          revised_prompt: result.revised_prompt,
          index: i
        });
        
        console.log(`✅ Вариант ${i + 1}/${numberOfVariants} готов`);
        console.log(`   URL: ${result.url.substring(0, 60)}...`);
        
        // Небольшая задержка между запросами для стабильности
        if (i < numberOfVariants - 1) {
          console.log('⏳ Ожидание 2 секунды перед следующим запросом...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Ошибка генерации варианта ${i + 1}:`, error.message);
        imageStatuses[i] = { 
          index: i, 
          stage: GENERATION_STAGES.ERROR, 
          progress: 0,
          error: error.message
        };
        updateProgress();
        
        // Если первый вариант не удался - продолжаем пытаться
        // Если удалось сгенерировать хотя бы один - продолжаем с остальными
        if (results.length === 0 && i === numberOfVariants - 1) {
          throw error; // Если ни одного варианта не удалось сгенерировать
        }
        
        // Небольшая задержка перед следующей попыткой после ошибки
        if (i < numberOfVariants - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    if (results.length === 0) {
      throw new Error('Не удалось сгенерировать ни одного варианта. Проверьте API ключ и баланс.');
    }
    
    console.log(`\n✅ Генерация завершена: ${results.length}/${numberOfVariants} успешно`);
    return results;
    
  } catch (error) {
    console.error('❌ Критическая ошибка генерации:', error);
    throw new Error(`Не удалось сгенерировать дизайны: ${error.message}`);
  }
}

/**
 * Добавление вариации в промпт для разнообразия
 */
function addVariationToPrompt(prompt, index, total) {
  const variations = [
    '',
    ', with alternative color palette',
    ', different artistic composition',
    ', unique perspective and layout',
    ', creative interpretation with variation',
    ', artistic variation with different style emphasis'
  ];
  
  if (index === 0) {
    return prompt; // Первый вариант без изменений
  }
  
  const variation = variations[index % variations.length];
  return prompt + variation;
}

/**
 * Улучшение промпта с настройками
 */
function enhancePrompt(prompt, settings = {}) {
  let enhanced = prompt;
  
  // Добавляем инструкции для паттерна
  if (settings.patternType === PATTERN_TYPES.SEAMLESS) {
    enhanced += ', SEAMLESS REPEATING PATTERN, tileable texture, infinite pattern, edges match perfectly, wrap-around design, textile design for clothing';
  } else if (settings.patternType === PATTERN_TYPES.GEOMETRIC) {
    enhanced += ', SEAMLESS GEOMETRIC PATTERN, tileable shapes, perfect symmetry, repeating angular design, geometric tessellation for apparel';
  } else if (settings.patternType === PATTERN_TYPES.COMPOSITION) {
    enhanced += ', artistic composition for t-shirt print, centered design, full print artwork, complete illustration';
  }
  
  // Добавляем модификатор стиля
  if (settings.style && STYLE_MODIFIERS[settings.style]) {
    enhanced += STYLE_MODIFIERS[settings.style];
  }
  
  // Качество по уровню детализации
  if (settings.detailLevel === 'high') {
    enhanced += ', ultra detailed, masterpiece quality, professional artwork, intricate details, 4K quality';
  } else if (settings.detailLevel === 'medium') {
    enhanced += ', detailed artwork, high quality design, professional finish';
  } else {
    enhanced += ', clean design, good quality';
  }
  
  // Текстильные инструкции
  enhanced += ', optimized for textile printing, fashion design, apparel artwork, print-ready, vibrant colors';
  
  // DALL-E 3 лучше работает с более естественными промптами
  enhanced = enhanced.replace(/,\s+/g, ', ').trim();
  
  return enhanced;
}

/**
 * Проверка настройки API ключа
 */
export function isApiKeyConfigured() {
  const apiKey = config.OPENAI_API_KEY;
  return apiKey && apiKey.length > 0 && apiKey.startsWith('sk-');
}

/**
 * Получение информации о лимитах API
 */
export function getApiInfo() {
  return {
    provider: 'Custom OpenAI (aiguoguo199.com)',
    model: 'DALL-E 3',
    baseUrl: OPENAI_BASE_URL,
    maxSize: '1024x1024',
    supportedSizes: ['1024x1024', '1024x1792', '1792x1024'],
    imagesPerRequest: 1,
    note: 'DALL-E 3 генерирует по одному изображению за раз',
    balanceCheck: 'https://usage.aiguoguo199.com/',
    testChat: 'https://chat.aiguoguo199.com/'
  };
}

/**
 * Проверка баланса (функция для будущего использования)
 */
export async function checkBalance() {
  // Эта функция может быть реализована в будущем
  // для проверки баланса через API
  console.log('💰 Проверить баланс можно на: https://usage.aiguoguo199.com/');
  return {
    message: 'Проверьте баланс на https://usage.aiguoguo199.com/'
  };
}