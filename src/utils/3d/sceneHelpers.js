/**
 * Вспомогательные функции для работы с 3D сценой
 */
import * as THREE from 'three';
import { LIGHTING_CONFIG } from '../../config/3dConfig';

/**
 * Создаёт и настраивает освещение для сцены
 * @param {THREE.Scene} scene - Three.js сцена
 * @param {Object} customConfig - Пользовательские настройки освещения
 */
export function setupLighting(scene, customConfig = {}) {
  const config = { ...LIGHTING_CONFIG, ...customConfig };

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(
    config.ambient.color,
    config.ambient.intensity
  );
  scene.add(ambientLight);

  // Main Directional Light
  const mainLight = new THREE.DirectionalLight(
    config.main.color,
    config.main.intensity
  );
  mainLight.position.set(...config.main.position);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  // Fill Light 1
  const fillLight1 = new THREE.DirectionalLight(
    config.fill1.color,
    config.fill1.intensity
  );
  fillLight1.position.set(...config.fill1.position);
  scene.add(fillLight1);

  // Fill Light 2
  const fillLight2 = new THREE.DirectionalLight(
    config.fill2.color,
    config.fill2.intensity
  );
  fillLight2.position.set(...config.fill2.position);
  scene.add(fillLight2);

  // Hemisphere Light
  const hemisphereLight = new THREE.HemisphereLight(
    config.hemisphere.skyColor,
    config.hemisphere.groundColor,
    config.hemisphere.intensity
  );
  scene.add(hemisphereLight);

  return { ambientLight, mainLight, fillLight1, fillLight2, hemisphereLight };
}

/**
 * Загружает текстуру с заданными настройками
 * @param {string} url - URL текстуры
 * @param {THREE.WebGLRenderer} renderer - WebGL рендерер
 * @returns {Promise<THREE.Texture|null>}
 */
export async function loadTexture(url, renderer) {
  if (!url) return null;

  return new Promise((resolve) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        console.log('✅ Текстура загружена');
        resolve(texture);
      },
      undefined,
      (error) => {
        console.warn('⚠️ Ошибка загрузки текстуры:', error);
        resolve(null);
      }
    );
  });
}

/**
 * Центрирует и масштабирует модель
 * @param {THREE.Object3D} model - 3D модель
 * @param {number} targetSize - Целевой размер
 * @returns {Object} Информация о масштабировании
 */
export function centerAndScaleModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Центрируем
  model.position.set(-center.x, -center.y, -center.z);

  // Масштабируем
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  model.scale.setScalar(scale);

  return {
    scale,
    size: { x: size.x, y: size.y, z: size.z },
    center: { x: center.x, y: center.y, z: center.z },
  };
}

/**
 * Очищает ресурсы Three.js объекта
 * @param {THREE.Object3D} object - Объект для очистки
 */
export function disposeObject(object) {
  if (!object) return;

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          disposeMaterial(material);
        });
      } else {
        disposeMaterial(child.material);
      }
    }
  });
}

/**
 * Очищает материал
 * @param {THREE.Material} material - Материал для очистки
 */
function disposeMaterial(material) {
  if (material.map) material.map.dispose();
  if (material.lightMap) material.lightMap.dispose();
  if (material.bumpMap) material.bumpMap.dispose();
  if (material.normalMap) material.normalMap.dispose();
  if (material.specularMap) material.specularMap.dispose();
  if (material.envMap) material.envMap.dispose();
  material.dispose();
}

/**
 * Применяет материал ко всем мешам в модели
 * @param {THREE.Object3D} model - 3D модель
 * @param {THREE.Material} material - Материал для применения
 * @returns {number} Количество обработанных мешей
 */
export function applyMaterialToModel(model, material) {
  let meshCount = 0;

  model.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
      meshCount++;
    }
  });

  return meshCount;
}
