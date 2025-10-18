import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  MODEL_CONFIG,
  CAMERA_CONFIG,
  CONTROLS_CONFIG,
  RENDERER_CONFIG,
  MATERIAL_CONFIG,
  SCENE_CONFIG,
} from '../config/3dConfig';
import {
  setupLighting,
  loadTexture,
  centerAndScaleModel,
  disposeObject,
  applyMaterialToModel,
} from '../utils/3d/sceneHelpers';

/**
 * Компонент для 3D визуализации модели кофты с AI-дизайном
 * @param {Object} props
 * @param {string} props.designUrl - URL изображения дизайна
 * @param {string} props.viewMode - Режим просмотра ('front' или 'back')
 * @param {Object} props.settings - Дополнительные настройки
 */
export default function Sweatshirt3DLoader({ designUrl, viewMode, settings = {} }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let scene, camera, renderer, controls, model;
    let animationId;
    let mounted = true;

    /**
     * Инициализация 3D сцены
     */
    const initScene = async () => {
      try {
        console.log('🎬 Инициализация 3D сцены...');

        // Создание сцены
        scene = new THREE.Scene();
        scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);

        // Создание камеры
        const { fov, near, far, initialPosition } = CAMERA_CONFIG;
        camera = new THREE.PerspectiveCamera(
          fov,
          mountRef.current.clientWidth / mountRef.current.clientHeight,
          near,
          far
        );
        camera.position.set(
          initialPosition.x,
          initialPosition.y,
          initialPosition.z
        );
        camera.lookAt(0, 0, 0);

        // Создание рендерера
        renderer = new THREE.WebGLRenderer({
          antialias: RENDERER_CONFIG.antialias,
          alpha: RENDERER_CONFIG.alpha,
          powerPreference: RENDERER_CONFIG.powerPreference,
        });
        renderer.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight
        );
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, RENDERER_CONFIG.maxPixelRatio)
        );
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = RENDERER_CONFIG.toneMappingExposure;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement);
        }

        // Создание OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        Object.assign(controls, CONTROLS_CONFIG);

        // Настройка освещения
        setupLighting(scene, settings);

        // Загрузка текстуры
        const texture = await loadTexture(designUrl, renderer);

        if (!mounted) return;

        // Загрузка модели
        console.log('📦 Загрузка модели...');
        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
          loader.load(MODEL_CONFIG.modelPath, resolve, undefined, reject);
        });

        if (!mounted) return;

        model = gltf.scene;
        console.log('✅ Модель загружена');

        // Создание и применение материала
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          color: MATERIAL_CONFIG.color,
          roughness: settings.roughness || MATERIAL_CONFIG.roughness,
          metalness: settings.metalness || MATERIAL_CONFIG.metalness,
          side: THREE.DoubleSide,
        });

        const meshCount = applyMaterialToModel(model, material);
        console.log(`✅ Материал применён к ${meshCount} мешам`);

        // Центрирование и масштабирование
        const scaleInfo = centerAndScaleModel(model, MODEL_CONFIG.targetSize);
        console.log(`✅ Модель масштабирована: ${scaleInfo.scale.toFixed(3)}x`);
        console.log(
          `📐 Размеры: ${scaleInfo.size.x.toFixed(2)} x ${scaleInfo.size.y.toFixed(2)} x ${scaleInfo.size.z.toFixed(2)}`
        );

        // Начальная ротация для вида сзади
        if (viewMode === 'back') {
          model.rotation.y = Math.PI;
        }

        scene.add(model);

        if (mounted) {
          setLoading(false);
          console.log('✅ Модель готова к отображению');
        }

        // Анимационный цикл
        const animate = () => {
          if (!mounted) return;
          animationId = requestAnimationFrame(animate);

          if (controls) controls.update();
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        };
        animate();

        // Обработчик изменения размера окна
        const handleResize = () => {
          if (!mountRef.current || !camera || !renderer) return;

          camera.aspect =
            mountRef.current.clientWidth / mountRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
          );
        };
        window.addEventListener('resize', handleResize);

        // Cleanup функция
        return () => {
          mounted = false;
          window.removeEventListener('resize', handleResize);

          if (animationId) {
            cancelAnimationFrame(animationId);
          }

          if (controls) {
            controls.dispose();
          }

          if (scene) {
            disposeObject(scene);
          }

          if (renderer) {
            renderer.dispose();
            if (
              mountRef.current &&
              mountRef.current.contains(renderer.domElement)
            ) {
              mountRef.current.removeChild(renderer.domElement);
            }
          }

          console.log('🧹 Cleanup выполнен');
        };
      } catch (err) {
        console.error('❌ Ошибка инициализации:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    const cleanup = initScene();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then((fn) => fn && fn());
      }
    };
  }, [designUrl, viewMode, settings]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: '600px', touchAction: 'none' }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/70 via-purple-900/50 to-pink-900/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300 text-lg font-semibold">
              Загрузка 3D модели...
            </p>
            <p className="text-purple-400 text-sm mt-2">GLB формат</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-red-900/90 border-2 border-red-500/60 text-red-100 px-6 py-4 rounded-2xl max-w-md">
            <p className="font-bold text-lg mb-2">❌ Ошибка загрузки</p>
            <p className="text-sm">{error}</p>
            <div className="mt-3 text-xs bg-red-950/50 p-2 rounded">
              <p>Путь: {MODEL_CONFIG.modelPath}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-purple-500/40 shadow-2xl">
            <div className="space-y-1">
              <p className="text-xs text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-semibold">GLB модель загружена</span>
              </p>
              <p className="text-xs text-purple-400">🖱️ ЛКМ - вращение</p>
              <p className="text-xs text-purple-400">🔍 Колесо - зум</p>
              <p className="text-xs text-purple-400">📱 Тач - жесты</p>
            </div>
          </div>

          {designUrl && (
            <div className="absolute top-4 right-4 bg-green-900/90 border border-green-500/60 px-4 py-2 rounded-xl backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">AI дизайн применён!</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
