/**
 * Конфигурация для 3D визуализации
 */

// Настройки модели
export const MODEL_CONFIG = {
  format: 'glb',
  modelPath: '/models/sweatshirt.glb',
  targetSize: 3.5,
};

// Настройки камеры
export const CAMERA_CONFIG = {
  fov: 45,
  near: 0.1,
  far: 1000,
  initialPosition: { x: 0, y: 0, z: 10 },
};

// Настройки OrbitControls
export const CONTROLS_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 4,
  maxDistance: 20,
  enablePan: false,
  rotateSpeed: 0.7,
  zoomSpeed: 1.2,
};

// Настройки освещения
export const LIGHTING_CONFIG = {
  ambient: { color: 0xffffff, intensity: 0.7 },
  main: { color: 0xffffff, intensity: 1.3, position: [5, 10, 7] },
  fill1: { color: 0x9966ff, intensity: 0.4, position: [-5, 3, -5] },
  fill2: { color: 0xffffff, intensity: 0.3, position: [0, -5, -5] },
  hemisphere: { skyColor: 0xffffff, groundColor: 0x444444, intensity: 0.5 },
};

// Настройки рендерера
export const RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  maxPixelRatio: 2,
  toneMappingExposure: 1.2,
};

// Настройки материала
export const MATERIAL_CONFIG = {
  color: 0xffffff,
  roughness: 0.85,
  metalness: 0.02,
};

// Настройки сцены
export const SCENE_CONFIG = {
  backgroundColor: 0x0a0a0a,
};
