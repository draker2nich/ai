import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// НАСТРОЙКИ МОДЕЛИ - ИЗМЕНИТЕ ПОД ВАШИ ФАЙЛЫ
const MODEL_CONFIG = {
  // Выберите формат вашей модели: 'gltf', 'obj', или 'fbx'
  format: 'obj', // РЕКОМЕНДУЕТСЯ: 'obj' или 'gltf'
  
  // Пути к файлам (положите их в public/)
  modelPath: '/models/sweatshirt.obj',  // или .glb, .gltf, .fbx
  texturePath: '/textures/sweatshirt_base.png', // базовая текстура
  
  // Дополнительные файлы для OBJ (если есть)
  mtlPath: null, // '/models/sweatshirt.mtl' - если есть материалы
  
  // Настройки масштаба (подстройте под вашу модель)
  autoScale: true, // автоматически подогнать размер
  targetSize: 3.5, // целевой размер модели
  
  // UV и текстуры
  flipTextureY: false, // для OBJ обычно false, для FBX может быть true
};

export default function Sweatshirt3DLoader({ designUrl, viewMode, settings = {} }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const modelRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    targetRotation: { x: 0, y: 0 },
    zoom: 6
  });
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Инициализация...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, controlsRef.current.zoom);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: settings.antialiasing !== false,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio || 2));
    renderer.shadowMap.enabled = settings.shadows !== false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = settings.toneMappingExposure || 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение - профессиональная настройка
    const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientLight || 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, settings.directionalLight || 1.3);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight1 = new THREE.DirectionalLight(0x9966ff, 0.4);
    fillLight1.position.set(-5, 3, -5);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight2.position.set(0, -5, -5);
    scene.add(fillLight2);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);

    // Загрузка модели
    const loadModel = async () => {
      try {
        setLoadingStage('Загрузка текстуры...');
        const textureLoader = new THREE.TextureLoader();

        // Загружаем AI дизайн или базовую текстуру
        let texture = null;
        const textureUrl = designUrl || MODEL_CONFIG.texturePath;
        
        if (textureUrl) {
          texture = await new Promise((resolve, reject) => {
            textureLoader.load(
              textureUrl,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.flipY = MODEL_CONFIG.flipTextureY;
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                setLoadingProgress(30);
                resolve(tex);
              },
              (progress) => {
                const percent = (progress.loaded / progress.total) * 30;
                setLoadingProgress(percent);
              },
              (err) => {
                console.warn('Текстура не загружена:', err);
                resolve(null);
              }
            );
          });
          console.log('✅ Текстура загружена');
        }

        setLoadingStage(`Загрузка ${MODEL_CONFIG.format.toUpperCase()} модели...`);
        
        let model;
        
        // Загружаем модель в зависимости от формата
        if (MODEL_CONFIG.format === 'gltf' || MODEL_CONFIG.format === 'glb') {
          const loader = new GLTFLoader();
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              MODEL_CONFIG.modelPath,
              resolve,
              (progress) => {
                const percent = 30 + (progress.loaded / progress.total) * 60;
                setLoadingProgress(percent);
              },
              reject
            );
          });
          model = gltf.scene;
          
        } else if (MODEL_CONFIG.format === 'obj') {
          const loader = new OBJLoader();
          model = await new Promise((resolve, reject) => {
            loader.load(
              MODEL_CONFIG.modelPath,
              resolve,
              (progress) => {
                const percent = 30 + (progress.loaded / progress.total) * 60;
                setLoadingProgress(percent);
              },
              reject
            );
          });
          
        } else if (MODEL_CONFIG.format === 'fbx') {
          const loader = new FBXLoader();
          model = await new Promise((resolve, reject) => {
            loader.load(
              MODEL_CONFIG.modelPath,
              resolve,
              (progress) => {
                const percent = 30 + (progress.loaded / progress.total) * 60;
                setLoadingProgress(percent);
              },
              reject
            );
          });
        }

        console.log('✅ Модель загружена');
        setLoadingStage('Применение материалов...');
        setLoadingProgress(90);

        // Создаём материал для кофты
        const sweatshirtMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          color: texture ? 0xffffff : 0xf5f5f5,
          roughness: settings.roughness || 0.85,
          metalness: settings.metalness || 0.02,
          side: THREE.DoubleSide,
          envMapIntensity: 0.3
        });

        // Применяем материал ко всем мешам
        let meshCount = 0;
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = sweatshirtMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
            meshCount++;
          }
        });

        console.log(`✅ Материал применён к ${meshCount} мешам`);

        // Центрирование и масштабирование модели
        if (MODEL_CONFIG.autoScale) {
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Центрируем
          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;

          // Масштабируем
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = MODEL_CONFIG.targetSize / maxDim;
          model.scale.setScalar(scale);
          
          console.log(`✅ Модель масштабирована: ${scale.toFixed(3)}x`);
        }

        scene.add(model);
        modelRef.current = model;

        // Начальная ротация для вида сзади
        if (viewMode === 'back') {
          controlsRef.current.rotation.y = Math.PI;
          controlsRef.current.targetRotation.y = Math.PI;
        }

        setLoadingProgress(100);
        setLoadingStage('Готово!');
        setTimeout(() => setLoading(false), 300);
        
        console.log('✅ Модель готова к отображению');

      } catch (err) {
        console.error('❌ Ошибка загрузки:', err);
        setError(`Не удалось загрузить модель: ${err.message}`);
        setLoading(false);
      }
    };

    loadModel();

    // Управление мышью/тачем
    const handleMouseDown = (event) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event) => {
      if (!controlsRef.current.isDragging) return;

      const deltaMove = {
        x: event.clientX - controlsRef.current.previousMousePosition.x,
        y: event.clientY - controlsRef.current.previousMousePosition.y
      };

      const rotationSpeed = 0.005;
      controlsRef.current.targetRotation.y += deltaMove.x * rotationSpeed;
      controlsRef.current.targetRotation.x += deltaMove.y * rotationSpeed;

      controlsRef.current.targetRotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, controlsRef.current.targetRotation.x)
      );

      controlsRef.current.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const zoomSpeed = 0.002;
      controlsRef.current.zoom += event.deltaY * zoomSpeed;
      controlsRef.current.zoom = Math.max(3, Math.min(15, controlsRef.current.zoom));
    };

    mountRef.current.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('wheel', handleWheel, { passive: false });

    // Анимация
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (modelRef.current) {
        const lerpFactor = 0.1;
        controlsRef.current.rotation.x += 
          (controlsRef.current.targetRotation.x - controlsRef.current.rotation.x) * lerpFactor;
        controlsRef.current.rotation.y += 
          (controlsRef.current.targetRotation.y - controlsRef.current.rotation.y) * lerpFactor;
        
        modelRef.current.rotation.x = controlsRef.current.rotation.x;
        modelRef.current.rotation.y = controlsRef.current.rotation.y;
        
        if (settings.floatAnimation !== false) {
          modelRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.001;
        }

        if (settings.autoRotate) {
          modelRef.current.rotation.y += 0.003;
        }
      }

      const currentZ = camera.position.z;
      camera.position.z += (controlsRef.current.zoom - currentZ) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousedown', handleMouseDown);
        mountRef.current.removeEventListener('wheel', handleWheel);
        if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
              });
            } else {
              if (object.material.map) object.material.map.dispose();
              object.material.dispose();
            }
          }
        });
      }
      
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [designUrl, settings, viewMode]);

  useEffect(() => {
    if (modelRef.current) {
      if (viewMode === 'back') {
        controlsRef.current.targetRotation.y = Math.PI;
      } else {
        controlsRef.current.targetRotation.y = 0;
      }
    }
  }, [viewMode]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: '500px', touchAction: 'none' }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/70 via-purple-900/50 to-pink-900/50 backdrop-blur-sm">
          <div className="text-center max-w-sm">
            <div className="relative mb-6">
              <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#4c1d95"
                  strokeWidth="8"
                  fill="none"
                  opacity="0.3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${loadingProgress * 2.827} 282.7`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-300">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            </div>
            <p className="text-purple-300 text-lg font-semibold mb-2">
              {loadingStage}
            </p>
            <p className="text-purple-400 text-sm">
              Формат: {MODEL_CONFIG.format.toUpperCase()}
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="bg-red-900/90 border-2 border-red-500/60 text-red-100 px-6 py-4 rounded-2xl backdrop-blur-sm shadow-2xl max-w-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-bold mb-2 text-lg">Ошибка загрузки модели</p>
                <p className="text-sm mb-3">{error}</p>
                <div className="bg-red-950/50 p-3 rounded-lg text-xs font-mono">
                  <p className="font-bold mb-1">Проверьте:</p>
                  <p>• Путь: <span className="text-red-300">{MODEL_CONFIG.modelPath}</span></p>
                  <p>• Формат: <span className="text-red-300">{MODEL_CONFIG.format}</span></p>
                  <p>• Файл существует в папке public/</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-purple-500/40 shadow-2xl">
            <div className="space-y-1.5">
              <p className="text-xs text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-semibold">{MODEL_CONFIG.format.toUpperCase()} модель</span>
              </p>
              <p className="text-xs text-purple-400">🖱️ Тяните для вращения</p>
              <p className="text-xs text-purple-400">🔍 Скролл для зума</p>
            </div>
          </div>

          {designUrl && (
            <div className="absolute top-4 right-4 bg-green-900/90 border border-green-500/60 px-4 py-2 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
