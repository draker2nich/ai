import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// Пути к вашим файлам
const FBX_MODEL_PATH = '/models/sweatshirt.fbx';
const BASE_TEXTURE_PATH = '/textures/sweatshirt_base.png';

export default function RealSweatshirt3D({ designUrl, viewMode, settings = {} }) {
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
    zoom: 5
  });
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [textureLoaded, setTextureLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

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

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientLight || 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, settings.directionalLight || 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x9966ff, 0.5);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, -5, -5);
    scene.add(rimLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    scene.add(hemisphereLight);

    // Загрузка FBX модели
    const loadModel = async () => {
      try {
        const fbxLoader = new FBXLoader();
        const textureLoader = new THREE.TextureLoader();

        // Загружаем базовую текстуру кофты
        let baseTexture = null;
        try {
          baseTexture = await new Promise((resolve, reject) => {
            textureLoader.load(
              BASE_TEXTURE_PATH,
              resolve,
              (progress) => {
                const percent = (progress.loaded / progress.total) * 50; // 50% за текстуру
                setLoadingProgress(percent);
              },
              reject
            );
          });
          
          baseTexture.colorSpace = THREE.SRGBColorSpace;
          baseTexture.flipY = false; // FBX обычно требует flipY = false
          console.log('✅ Базовая текстура загружена');
        } catch (err) {
          console.warn('⚠️ Базовая текстура не найдена, используем белый цвет');
        }

        // Загружаем дизайн от AI (если есть)
        let designTexture = null;
        if (designUrl) {
          try {
            designTexture = await new Promise((resolve, reject) => {
              textureLoader.load(
                designUrl,
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.flipY = false;
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  texture.minFilter = THREE.LinearMipmapLinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  resolve(texture);
                },
                undefined,
                reject
              );
            });
            console.log('✅ AI дизайн загружен');
            setTextureLoaded(true);
          } catch (err) {
            console.error('❌ Ошибка загрузки AI дизайна:', err);
          }
        }

        // Загружаем FBX модель
        const model = await new Promise((resolve, reject) => {
          fbxLoader.load(
            FBX_MODEL_PATH,
            resolve,
            (progress) => {
              const percent = 50 + (progress.loaded / progress.total) * 50; // 50% за модель
              setLoadingProgress(percent);
            },
            reject
          );
        });

        console.log('✅ FBX модель загружена');

        // Применяем текстуры к модели
        model.traverse((child) => {
          if (child.isMesh) {
            // Создаём материал с текстурами
            const material = new THREE.MeshStandardMaterial({
              map: designTexture || baseTexture,
              roughness: settings.roughness || 0.85,
              metalness: settings.metalness || 0.02,
              side: THREE.DoubleSide,
              envMapIntensity: 0.3
            });

            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;

            console.log('✅ Материал применён к:', child.name);
          }
        });

        // Центрируем и масштабируем модель
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Смещаем в центр
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Масштабируем до подходящего размера (примерно 3 единицы в высоту)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);

        scene.add(model);
        modelRef.current = model;

        if (viewMode === 'back') {
          controlsRef.current.rotation.y = Math.PI;
          controlsRef.current.targetRotation.y = Math.PI;
        }

        setLoading(false);
        console.log('✅ Модель готова к отображению');

      } catch (err) {
        console.error('❌ Ошибка загрузки модели:', err);
        setError(`Не удалось загрузить модель: ${err.message}`);
        setLoading(false);
      }
    };

    loadModel();

    // Mouse/Touch controls
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
      controlsRef.current.zoom = Math.max(2.5, Math.min(10, controlsRef.current.zoom));
    };

    mountRef.current.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop
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
          modelRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.08;
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

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
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
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [designUrl, settings]);

  useEffect(() => {
    if (viewMode === 'back') {
      controlsRef.current.targetRotation.y = Math.PI;
    } else {
      controlsRef.current.targetRotation.y = 0;
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
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-purple-300 text-sm font-bold">{Math.round(loadingProgress)}%</span>
              </div>
            </div>
            <p className="text-purple-300 text-base font-semibold mb-2">
              Загружаем вашу 3D модель кофты...
            </p>
            <p className="text-purple-400 text-sm">
              {loadingProgress < 50 ? 'Загрузка текстуры...' : 'Загрузка FBX модели...'}
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/80 border border-red-500/60 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm text-sm shadow-2xl">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold mb-1">Ошибка загрузки модели</p>
              <p className="text-xs">{error}</p>
              <p className="text-xs mt-2">
                Убедитесь, что файлы находятся в правильных папках:
                <br/>• <code>public/models/sweatshirt.fbx</code>
                <br/>• <code>public/textures/sweatshirt_base.png</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-3 rounded-xl border border-purple-500/30 shadow-2xl">
          <div className="space-y-1.5">
            <p className="text-xs text-purple-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="font-semibold">Реальная FBX модель</span>
            </p>
            <p className="text-xs text-purple-400">Тяните для вращения</p>
            <p className="text-xs text-purple-400">Скролл для зума</p>
          </div>
        </div>
      )}

      {textureLoaded && (
        <div className="absolute top-4 right-4 bg-green-900/80 border border-green-500/60 px-4 py-2 rounded-xl backdrop-blur-sm animate-fade-out">
          <div className="flex items-center gap-2 text-green-200 text-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">AI дизайн применён!</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .animate-fade-out {
          animation: fade-out 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
