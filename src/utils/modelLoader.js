/**
 * Утилиты для загрузки 3D-моделей - GLTF/GLBonly
 * Минимальные логи, максимальная производительность
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Конфигурация загрузки моделей
 */
export const MODEL_CONFIG = {
  modelPath: '/models/tshirt.glb',
  autoScale: true,
  targetSize: 50,
  flipTextureY: false,
  centerModel: true,
  debug: false
};

/**
 * Анализ модели (только если debug включен)
 */
function analyzeModel(model) {
  if (!MODEL_CONFIG.debug) return;
  
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  let totalVertices = 0;
  let totalFaces = 0;
  let meshCount = 0;
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      meshCount++;
      if (child.geometry.attributes.position) {
        totalVertices += child.geometry.attributes.position.count;
      }
      if (child.geometry.index) {
        totalFaces += child.geometry.index.count / 3;
      }
    }
  });
  
  console.log('📊 МОДЕЛЬ:', {
    размер: size,
    центр: center,
    полигоны: totalFaces.toLocaleString(),
    вершины: totalVertices.toLocaleString(),
    объекты: meshCount
  });
  
  if (totalFaces > 50000) {
    console.warn('⚠️ Модель тяжёлая (>50k полигонов). Рекомендуется оптимизация.');
  }
}

/**
 * Применение текстуры к модели
 */
function applyTextureToModel(model, texture, flipY = false) {
  if (flipY) {
    texture.flipY = false;
  }
  
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

/**
 * Обработка модели: центрирование и масштабирование
 */
function processModel(model, config) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  if (config.centerModel) {
    model.position.sub(center);
  }
  
  if (config.autoScale) {
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = config.targetSize / maxDim;
    model.scale.setScalar(scale);
  }
  
  return model;
}

/**
 * Загрузка GLTF/GLB модели
 */
export function loadGLTFModel(modelPath, texture, onProgress, onComplete, onError) {
  const loader = new GLTFLoader();
  
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      analyzeModel(model);
      applyTextureToModel(model, texture, MODEL_CONFIG.flipTextureY);
      const processedModel = processModel(model, MODEL_CONFIG);
      onComplete(processedModel);
    },
    onProgress,
    onError
  );
}

/**
 * Главная функция загрузки модели
 */
export function loadTShirtModel(texture, onProgress, onComplete, onError) {
  const progressHandler = (xhr) => {
    if (xhr.lengthComputable && onProgress) {
      const percent = (xhr.loaded / xhr.total) * 100;
      onProgress(percent);
    }
  };
  
  const errorHandler = (error) => {
    console.error('❌ Ошибка загрузки модели:', error);
    if (onError) onError(error);
  };
  
  loadGLTFModel(
    MODEL_CONFIG.modelPath,
    texture,
    progressHandler,
    onComplete,
    errorHandler
  );
}

/**
 * Информация о конфигурации
 */
export function getModelInfo() {
  return {
    format: 'gltf/glb',
    path: MODEL_CONFIG.modelPath,
    hasAutoScale: MODEL_CONFIG.autoScale,
    targetSize: MODEL_CONFIG.targetSize,
    debug: MODEL_CONFIG.debug
  };
}