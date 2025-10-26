/**
 * Компонент 3D фона с моделью одежды
 * Отображает интерактивную 3D сцену с возможностью вращения камеры
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadTShirtModel } from '../utils/modelLoader';
import { useLanguage } from '../locales/LanguageContext';

export default function BackgroundCanvas({ design, isVisible }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const tshirtRef = useRef(null);
  const currentTextureRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Инициализация фонового 3D canvas');

    // Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    sceneRef.current = scene;

    // Камера - улучшенное позиционирование для лучшего обзора модели
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Камера расположена выше и ближе для лучшего обзора
    camera.position.set(53, 0, 78);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение - кинематографичное с мягкими тенями
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x9333ea, 0.6);
    fillLight.position.set(-50, 30, -30);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xec4899, 0.8);
    rimLight.position.set(0, 50, -100);
    scene.add(rimLight);

    // Подсветка снизу для атмосферы
    const bottomLight = new THREE.PointLight(0x6366f1, 0.5);
    bottomLight.position.set(0, -20, 0);
    scene.add(bottomLight);

    // Частицы в фоне для глубины
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 200;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x9333ea,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Контролы камеры - оптимизированы для удобного просмотра
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    // Центр вращения находится в центре, модель будет опущена ниже
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Платформа под моделью - опущена ниже для правильной композиции
    const platformGeometry = new THREE.CylinderGeometry(25, 25, 1, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0x9333ea,
      emissiveIntensity: 0.1
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -30; // Опущена ниже для лучшей композиции
    platform.receiveShadow = true;
    scene.add(platform);

    // Световое кольцо вокруг платформы
    const ringGeometry = new THREE.TorusGeometry(26, 0.2, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -29.5;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Загрузка дефолтной текстуры
    const textureLoader = new THREE.TextureLoader();
    const defaultTexture = textureLoader.load(
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MzMzZWE7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlYzQ4OTk7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NmYxO3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+',
      () => {
        loadTShirtModel(
          defaultTexture,
          (progress) => console.log(`Загрузка модели: ${progress}%`),
          (model) => {
            // Модель позиционируется ниже для лучшего обзора
            model.position.y = -75; // Опущена ниже от центра
            scene.add(model);
            tshirtRef.current = model;
            setIsLoading(false);
            console.log('Модель футболки загружена успешно');
          },
          (error) => {
            console.error('Ошибка загрузки модели:', error);
            setIsLoading(false);
          }
        );
      }
    );

    // Цикл анимации
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Анимация частиц
      particles.rotation.y += 0.0005;
      
      // Пульсация кольца
      ring.material.opacity = 0.6 + Math.sin(time * 2) * 0.2;
      
      // Плавное покачивание модели
      if (tshirtRef.current) {
        tshirtRef.current.position.y = -75 + Math.sin(time) * 1;
        tshirtRef.current.rotation.y += 0.002;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Обработка изменения размера окна
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // Обновление текстуры при смене дизайна
  useEffect(() => {
    if (!design || !tshirtRef.current) return;

    console.log('Обновление текстуры дизайна');
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      design.url,
      (texture) => {
        // Очистка старой текстуры
        if (currentTextureRef.current) {
          currentTextureRef.current.dispose();
        }

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        tshirtRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        });

        currentTextureRef.current = texture;
        console.log('Текстура обновлена успешно');
      },
      undefined,
      (error) => {
        console.error('Ошибка загрузки текстуры:', error);
      }
    );
  }, [design]);

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: 0 }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold text-lg">{t.viewer.loading}</p>
            <p className="text-purple-400 text-sm mt-2">{t.viewer.preparing}</p>
          </div>
        </div>
      )}
    </div>
  );
}