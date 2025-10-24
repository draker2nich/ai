/**
 * Утилиты для загрузки 3D-моделей - PRODUCTION VERSION
 * Минимальные логи, максимальная производительность
 */
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Конфигурация загрузки моделей
 */
export const MODEL_CONFIG = {
  format: 'glb', // 'obj', 'glb', 'gltf', 'procedural'
  modelPath: '/models/tshirt.glb',
  texturePath: null,
  mtlPath: null,
  autoScale: true,
  targetSize: 50,
  flipTextureY: false,
  centerModel: true,
  debug: false // Отключаем детальные логи для production
};

/**
 * Загрузка OBJ модели
 */
export function loadOBJModel(modelPath, mtlPath, texture, onProgress, onComplete, onError) {
  const loadOBJFile = (materials = null) => {
    const objLoader = new OBJLoader();
    
    if (materials) {
      objLoader.setMaterials(materials);
    }
    
    objLoader.load(
      modelPath,
      (object) => {
        applyTextureToModel(object, texture, MODEL_CONFIG.flipTextureY);
        const processedModel = processModelAdvanced(object, MODEL_CONFIG);
        onComplete(processedModel);
      },
      onProgress,
      onError
    );
  };

  if (mtlPath) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload();
        loadOBJFile(materials);
      },
      undefined,
      () => loadOBJFile()
    );
  } else {
    loadOBJFile();
  }
}

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
function processModelAdvanced(model, config) {
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
      const processedModel = processModelAdvanced(model, MODEL_CONFIG);
      onComplete(processedModel);
    },
    onProgress,
    onError
  );
}

/**
 * Создание процедурной геометрии футболки
 */
export function createProceduralTShirt(texture) {
  const shape = new THREE.Shape();
  
  shape.moveTo(-1, -1.5);
  shape.lineTo(-1, 0.5);
  shape.lineTo(-1.3, 0.8);
  shape.lineTo(-1.3, 1);
  shape.lineTo(-0.3, 1.3);
  shape.lineTo(-0.3, 1.5);
  shape.lineTo(0.3, 1.5);
  shape.lineTo(0.3, 1.3);
  shape.lineTo(1.3, 1);
  shape.lineTo(1.3, 0.8);
  shape.lineTo(1, 0.5);
  shape.lineTo(1, -1.5);
  shape.lineTo(-1, -1.5);

  const extrudeSettings = {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rotation.y = Math.PI / 6;

  return mesh;
}

/**
 * Главная функция загрузки модели
 */
export function loadTShirtModel(texture, onProgress, onComplete, onError) {
  const config = MODEL_CONFIG;
  
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
  
  switch (config.format) {
    case 'obj':
      loadOBJModel(
        config.modelPath,
        config.mtlPath,
        texture,
        progressHandler,
        onComplete,
        errorHandler
      );
      break;
      
    case 'gltf':
    case 'glb':
      loadGLTFModel(
        config.modelPath,
        texture,
        progressHandler,
        onComplete,
        errorHandler
      );
      break;
      
    case 'procedural':
    default:
      try {
        const model = createProceduralTShirt(texture);
        setTimeout(() => onComplete(model), 100);
      } catch (error) {
        errorHandler(error);
      }
      break;
  }
}

export function isSupportedFormat(format) {
  const supported = ['obj', 'gltf', 'glb', 'procedural'];
  return supported.includes(format.toLowerCase());
}

export function getModelInfo() {
  return {
    format: MODEL_CONFIG.format,
    path: MODEL_CONFIG.modelPath,
    isExternal: MODEL_CONFIG.format !== 'procedural',
    hasAutoScale: MODEL_CONFIG.autoScale,
    targetSize: MODEL_CONFIG.targetSize,
    debug: MODEL_CONFIG.debug
  };
}
