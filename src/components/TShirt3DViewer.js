import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadTShirtModel } from '../utils/modelLoader';

export default function TShirt3DViewer({ design, onClose }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const tshirtRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !design) return;

    console.log('🎬 Инициализация 3D-сцены...');

    // Инициализация сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Отладочные элементы отключены (сетка и оси)

    // Камера
    const camera = new THREE.PerspectiveCamera(
      50, // Увеличил FOV для лучшего обзора
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000 // Увеличил far plane
    );
    camera.position.set(0, 50, 100); // Отодвинул камеру дальше
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    console.log('📷 Камера:', camera.position);

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    console.log('✅ Рендерер создан');

    // Освещение (усиленное)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-50, 0, -50);
    scene.add(fillLight);

    const topLight = new THREE.PointLight(0xffffff, 0.6);
    topLight.position.set(0, 100, 0);
    scene.add(topLight);

    console.log('✅ Освещение настроено');

    // Контролы
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI;
    controls.enablePan = true; // Включаем панорамирование для отладки
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    console.log('✅ Контролы настроены');

    // Загрузка текстуры дизайна
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      design.url,
      (texture) => {
        console.log('✅ Текстура дизайна загружена');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        setLoadingProgress(50);
        
        // Загрузка 3D-модели футболки через универсальный загрузчик
        loadTShirtModel(
          texture,
          (progress) => {
            const percent = 50 + (progress / 100) * 50;
            setLoadingProgress(percent);
          },
          (model) => {
            console.log('✅ Модель получена из загрузчика');
            
            // ВАЖНО: Добавляем модель в сцену
            scene.add(model);
            tshirtRef.current = model;
            
            // Анализируем bounding box модели
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            console.log('📦 ФИНАЛЬНАЯ ПОЗИЦИЯ МОДЕЛИ В СЦЕНЕ:');
            console.log('  Центр:', center);
            console.log('  Размер:', size);
            console.log('  Позиция модели:', model.position);
            console.log('  Масштаб модели:', model.scale);
            
            // Автоматическая фокусировка камеры на модель
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraDistance *= 2.5; // Множитель для комфортного расстояния
            
            console.log('📷 Автофокус камеры:');
            console.log('  Расстояние до модели:', cameraDistance);
            
            // Позиционируем камеру
            camera.position.set(
              center.x + cameraDistance * 0.5,
              center.y + cameraDistance * 0.5,
              center.z + cameraDistance
            );
            
            // Направляем камеру на центр модели
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();
            
            console.log('  Новая позиция камеры:', camera.position);
            console.log('  Камера смотрит на:', controls.target);
            
            setLoadingProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              console.log('✅ 3D-сцена полностью готова!');
              console.log('🎮 Попробуйте покрутить сцену мышкой');
            }, 300);
          },
          (error) => {
            console.error('❌ Ошибка загрузки модели:', error);
            setError('Не удалось загрузить 3D-модель');
            setIsLoading(false);
          }
        );
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 50;
          setLoadingProgress(percent);
        }
      },
      (error) => {
        console.error('❌ Ошибка загрузки текстуры:', error);
        setError('Не удалось загрузить дизайн');
        setIsLoading(false);
      }
    );

    // Анимация
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (autoRotate && tshirtRef.current) {
        tshirtRef.current.rotation.y += 0.005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Обработка изменения размера окна
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Очистка
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      controls.dispose();
      
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [design, autoRotate]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current && tshirtRef.current) {
      const box = new THREE.Box3().setFromObject(tshirtRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.5;
      
      cameraRef.current.position.set(
        center.x + cameraDistance * 0.5,
        center.y + cameraDistance * 0.5,
        center.z + cameraDistance
      );
      
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current || !tshirtRef.current) return;
    
    const box = new THREE.Box3().setFromObject(tshirtRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    
    const positions = {
      front: [center.x, center.y, center.z + distance],
      back: [center.x, center.y, center.z - distance],
      left: [center.x - distance, center.y, center.z],
      right: [center.x + distance, center.y, center.z],
      top: [center.x, center.y + distance, center.z]
    };

    const [x, y, z] = positions[view] || positions.front;
    
    const startPos = cameraRef.current.position.clone();
    const endPos = new THREE.Vector3(x, y, z);
    const duration = 500;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      cameraRef.current.position.lerpVectors(startPos, endPos, eased);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Заголовок */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">3D Просмотр</h3>
              <p className="text-xs text-purple-300">Вращайте модель мышкой или пальцем</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Загрузка */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold text-xl mb-2">Загрузка 3D-модели...</p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-purple-300 text-sm mt-2">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 max-w-md mx-4">
            <p className="text-red-300 font-bold mb-2">Ошибка загрузки</p>
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Панель управления */}
      {!isLoading && !error && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 px-4 w-full max-w-4xl">
          <div className="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setCameraView('front')}
                  className="px-3 sm:px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-purple-500/30"
                >
                  Перед
                </button>
                <button
                  onClick={() => setCameraView('back')}
                  className="px-3 sm:px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-purple-500/30"
                >
                  Зад
                </button>
                <button
                  onClick={() => setCameraView('left')}
                  className="px-3 sm:px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-purple-500/30"
                >
                  Слева
                </button>
                <button
                  onClick={() => setCameraView('right')}
                  className="px-3 sm:px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-purple-500/30"
                >
                  Справа
                </button>
              </div>

              <div className="hidden sm:block w-px h-8 bg-purple-500/30"></div>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  autoRotate
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border-purple-500/30'
                }`}
              >
                <svg className={`w-5 h-5 inline ${autoRotate ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={resetCamera}
                className="px-3 sm:px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-purple-500/30"
              >
                <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подсказки */}
      {!isLoading && !error && (
        <div className="absolute top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-xs z-10">
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-3">
            <p className="text-blue-200 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>На телефоне:</strong> Вращайте одним пальцем<br/>
                <strong>На ПК:</strong> Вращайте мышкой<br/>
                <strong>Отладка:</strong> Смотрите консоль (F12)
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
