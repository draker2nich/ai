/**
 * Глобальные константы приложения
 */

// API настройки
export const API_CONFIG = {
  MAX_VARIANTS: 4,
  DEFAULT_IMAGE_SIZE: 1024,
  GENERATION_TIMEOUT: 120000, // 2 минуты
  SDXL_MODEL_VERSION: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
};

// Хранилище
export const STORAGE_CONFIG = {
  DESIGNS_KEY: 'ai_fashion_designs',
  MAX_SAVED_DESIGNS: 50
};

// 3D модель - настройки по умолчанию
export const MODEL_3D_CONFIG = {
  format: 'obj',
  modelPath: '/models/sweatshirt.obj',
  texturePath: '/textures/sweatshirt_base.png',
  mtlPath: null,
  autoScale: true,
  targetSize: 3.5,
  flipTextureY: false
};

// Настройки 3D визуализации по умолчанию
export const DEFAULT_3D_SETTINGS = {
  antialiasing: true,
  shadows: true,
  pixelRatio: 1.5,
  ambientLight: 0.7,
  directionalLight: 1.3,
  toneMappingExposure: 1.2,
  roughness: 0.85,
  metalness: 0.02,
  autoRotate: false,
  floatAnimation: true
};

// Настройки генерации по умолчанию
export const DEFAULT_GENERATION_SETTINGS = {
  patternType: 'seamless',
  style: 'realistic',
  numberOfVariants: 4,
  detailLevel: 'medium'
};

// Примеры промптов
export const EXAMPLE_PROMPTS = [
  "vibrant sunset over ocean with dolphins jumping, pink and purple gradient sky, seamless pattern",
  "abstract geometric Memphis style shapes, bright neon colors, repeating pattern, 80s aesthetic",
  "tropical paradise with palm leaves and hibiscus flowers, watercolor painting style, seamless design",
  "deep space nebula with stars and galaxies, dark blue and purple cosmos, tileable pattern",
  "Japanese great wave in traditional ukiyo-e style, turquoise and white colors, seamless pattern",
  "cyberpunk neon circuit board elements, black background with glowing lines, geometric pattern",
  "vintage floral bouquet in 70s retro style, pastel earth tones, bohemian pattern",
  "colorful mandala with intricate details, psychedelic art style, symmetrical design",
  "minimal line art faces and abstract shapes, modern artistic pattern, black and white",
  "holographic iridescent gradient, liquid metal effect, futuristic seamless texture"
];

// Типы паттернов
export const PATTERN_TYPES = {
  SEAMLESS: 'seamless',
  COMPOSITION: 'composition',
  GEOMETRIC: 'geometric'
};

// Стили
export const STYLES = {
  REALISTIC: 'realistic',
  ABSTRACT: 'abstract',
  MINIMALIST: 'minimalist',
  VINTAGE: 'vintage',
  WATERCOLOR: 'watercolor',
  GEOMETRIC: 'geometric',
  CYBERPUNK: 'cyberpunk'
};

// Уровни детализации
export const DETAIL_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Модификаторы стилей для промптов
export const STYLE_MODIFIERS = {
  [STYLES.REALISTIC]: ', photorealistic style, highly detailed, 8k quality, professional photography, crisp details',
  [STYLES.ABSTRACT]: ', abstract art style, modern design, artistic interpretation, contemporary art, flowing shapes',
  [STYLES.MINIMALIST]: ', minimalist style, simple clean lines, negative space, elegant simplicity, refined design',
  [STYLES.VINTAGE]: ', vintage retro style, nostalgic aesthetic, classic design, old-school vibes, vintage print',
  [STYLES.WATERCOLOR]: ', watercolor painting style, soft blended colors, artistic brushstrokes, painted texture, fluid art',
  [STYLES.GEOMETRIC]: ', geometric art style, angular shapes, modern patterns, mathematical precision, clean lines',
  [STYLES.CYBERPUNK]: ', cyberpunk style, neon colors, futuristic tech aesthetic, digital art, glowing elements, sci-fi design'
};

// Настройки инференса для разных уровней детализации
export const INFERENCE_STEPS = {
  [DETAIL_LEVELS.LOW]: 15,
  [DETAIL_LEVELS.MEDIUM]: 25,
  [DETAIL_LEVELS.HIGH]: 40
};

// Guidance scale для разных уровней
export const GUIDANCE_SCALE = {
  [DETAIL_LEVELS.LOW]: 7.5,
  [DETAIL_LEVELS.MEDIUM]: 7.5,
  [DETAIL_LEVELS.HIGH]: 8.5
};

// Статусы генерации
export const GENERATION_STAGES = {
  CREATING: 'creating',
  STARTING: 'starting',
  WAITING: 'waiting',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Сообщения для статусов
export const STAGE_MESSAGES = {
  [GENERATION_STAGES.CREATING]: 'Отправка...',
  [GENERATION_STAGES.STARTING]: 'Инициализация...',
  [GENERATION_STAGES.WAITING]: 'Обработка...',
  [GENERATION_STAGES.GENERATING]: 'Генерация...',
  [GENERATION_STAGES.COMPLETED]: 'Готово!',
  [GENERATION_STAGES.ERROR]: 'Ошибка'
};
