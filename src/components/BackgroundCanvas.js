/**
 * Компонент 3D фона с моделью одежды
 * Отображает интерактивную 3D сцену с возможностью вращения камеры
 * ИСПРАВЛЕНО: Правильное применение текстуры на модель
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadTShirtModel } from '../utils/modelLoader';
import { useLanguage } from '../locales/LanguageContext';

export default function BackgroundCanvas({ design, isVisible, autoRotate, onAutoRotateChange }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const tshirtRef = useRef(null);
  const currentTextureRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const userInteractedRef = useRef(false);

  // Логирование пропсов при монтировании
  useEffect(() => {
    console.log('🎬 BackgroundCanvas получил пропсы:', { 
      autoRotate, 
      hasOnAutoRotateChange: !!onAutoRotateChange,
      hasDesign: !!design
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Инициализация фонового 3D canvas');

    // Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    sceneRef.current = scene;

    // Камера - оптимизированное позиционирование
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Рендерер с улучшенными настройками
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
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение - профессиональная студийная настройка
    // Основной верхний свет
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(30, 50, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 200;
    keyLight.shadow.camera.left = -50;
    keyLight.shadow.camera.right = 50;
    keyLight.shadow.camera.top = 50;
    keyLight.shadow.camera.bottom = -50;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Заполняющий свет слева
    const fillLight = new THREE.DirectionalLight(0xb8a5ff, 0.5);
    fillLight.position.set(-40, 20, 20);
    scene.add(fillLight);

    // Контровой свет справа
    const rimLight = new THREE.DirectionalLight(0xffa5d8, 0.6);
    rimLight.position.set(40, 20, -20);
    scene.add(rimLight);

    // Мягкий окружающий свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Нижняя подсветка для объема
    const bottomLight = new THREE.PointLight(0x8b7fff, 0.4, 100);
    bottomLight.position.set(0, -30, 0);
    scene.add(bottomLight);

    // Акцентная подсветка сзади
    const backLight = new THREE.PointLight(0xff8bd8, 0.3, 80);
    backLight.position.set(0, 10, -50);
    scene.add(backLight);

    // Платформа с улучшенным материалом
    const platformGeometry = new THREE.CylinderGeometry(30, 30, 2, 64);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0x9333ea,
      emissiveIntensity: 0.15
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -30;
    platform.receiveShadow = true;
    platform.castShadow = false;
    scene.add(platform);

    // Световое кольцо с градиентом
    const ringGeometry = new THREE.TorusGeometry(32, 0.3, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x9333ea,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8,
      roughness: 0.3,
      metalness: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -29;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Частицы для атмосферы
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // Случайный цвет между фиолетовым и розовым
      const mixValue = Math.random();
      colors[i * 3] = 0.58 + mixValue * 0.35; // R
      colors[i * 3 + 1] = 0.20 + mixValue * 0.40; // G
      colors[i * 3 + 2] = 0.92 - mixValue * 0.25; // B
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Контролы камеры
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 40;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.enablePan = false;
    controls.autoRotate = true; // Включаем по умолчанию
    controls.autoRotateSpeed = 1.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Обработчик начала взаимодействия пользователя
    const handleInteractionStart = () => {
      if (controls.autoRotate) {
        console.log('👆 Пользователь начал взаимодействие - выключаем автовращение');
        userInteractedRef.current = true;
        controls.autoRotate = false;
        if (onAutoRotateChange) {
          onAutoRotateChange(false);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', handleInteractionStart);
    renderer.domElement.addEventListener('touchstart', handleInteractionStart);

    // Загрузка модели БЕЗ дефолтной текстуры
    loadTShirtModel(
      null, // Передаём null вместо текстуры
      (progress) => console.log(`Загрузка модели: ${progress.toFixed(0)}%`),
      (model) => {
        model.position.y = -80;
        model.castShadow = true;
        model.receiveShadow = true;
        
        // ВАЖНО: Создаём базовый материал для модели
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Создаём белый базовый материал, на который будем накладывать текстуры
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff, // Белый цвет - база для текстур
              roughness: 0.85,
              metalness: 0.02,
              side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        tshirtRef.current = model;
        setIsLoading(false);
        console.log('✅ Модель футболки загружена успешно');
      },
      (error) => {
        console.error('❌ Ошибка загрузки модели:', error);
        setIsLoading(false);
      }
    );

    // Цикл анимации
    let time = 0;
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Медленное вращение частиц
      particles.rotation.y += 0.0003;
      particles.rotation.x = Math.sin(time * 0.1) * 0.05;
      
      // Пульсация кольца
      ring.material.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.3;
      
      // Плавное покачивание модели - ВСЕГДА включено, независимо от автовращения
      if (tshirtRef.current) {
        tshirtRef.current.position.y = -80 + Math.sin(time * 0.5) * 0.5;
      }

      if (controlsRef.current) {
        controls.update();
      }
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
      renderer.domElement.removeEventListener('mousedown', handleInteractionStart);
      renderer.domElement.removeEventListener('touchstart', handleInteractionStart);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
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

  // Обновление автовращения
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      console.log('🔄 Автовращение:', autoRotate ? 'включено' : 'выключено');
    }
  }, [autoRotate]);

  // Сброс флага взаимодействия при изменении autoRotate на true
  useEffect(() => {
    if (autoRotate && controlsRef.current) {
      userInteractedRef.current = false;
      controlsRef.current.autoRotate = true;
      console.log('✅ Автовращение принудительно включено');
    }
  }, [autoRotate]);

  // ИСПРАВЛЕНО: Обновление текстуры при смене дизайна
  useEffect(() => {
    if (!design || !tshirtRef.current) {
      console.log('⏭️ Пропуск обновления текстуры:', { hasDesign: !!design, hasModel: !!tshirtRef.current });
      return;
    }

    console.log('🎨 Начинаем обновление текстуры дизайна');
    console.log('   URL дизайна:', design.url);
    
    const textureLoader = new THREE.TextureLoader();
    
    // Включаем CORS для загрузки изображений
    textureLoader.crossOrigin = 'anonymous';
    
    textureLoader.load(
      design.url,
      (texture) => {
        console.log('✅ Текстура загружена успешно');
        
        // Очистка старой текстуры
        if (currentTextureRef.current) {
          currentTextureRef.current.dispose();
          console.log('🗑️ Старая текстура удалена');
        }

        // Настройка текстуры для повторения (бесшовный паттерн)
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() || 16;
        
        console.log('⚙️ Применяем текстуру к модели...');
        
        // Применяем текстуру ко всем mesh объектам модели
        let meshCount = 0;
        tshirtRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // ВАЖНО: Создаём НОВЫЙ материал с текстурой
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.85,
              metalness: 0.02,
              side: THREE.DoubleSide
            });
            child.material.needsUpdate = true;
            meshCount++;
          }
        });

        currentTextureRef.current = texture;
        console.log(`✅ Текстура применена к ${meshCount} mesh объектам`);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`📥 Загрузка текстуры: ${percent.toFixed(0)}%`);
        }
      },
      (error) => {
        console.error('❌ Ошибка загрузки текстуры:', error);
        console.error('   URL:', design.url);
        console.error('   Возможные причины: CORS, неверный URL, недоступен сервер');
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