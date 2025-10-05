import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ImprovedSweatshirt3D({ designUrl, viewMode, settings = {} }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const sweatshirtRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    targetRotation: { x: 0, y: 0 },
    zoom: 5
  });
  const [loading, setLoading] = useState(true);
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

    // Создание реалистичной кофты с естественными складками
    const createRealisticSweatshirt = () => {
      const group = new THREE.Group();

      // Основное тело - используем PlaneGeometry с subdivision для складок
      const bodyGeo = new THREE.PlaneGeometry(2.4, 3.2, 60, 80);
      
      const positionAttribute = bodyGeo.attributes.position;
      
      // Создаём естественную форму тела с изгибами и складками
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        let z = 0;
        
        // Основная выпуклость тела
        const distFromCenter = Math.sqrt(x * x + y * y);
        const bodyRoundness = Math.max(0, 1 - distFromCenter / 2) * 0.35;
        z += bodyRoundness;
        
        // Естественное сужение в талии
        const waistCurve = Math.exp(-Math.pow((y + 0.2) / 0.8, 2)) * 0.15;
        z -= waistCurve * (1 - Math.abs(x) / 1.2);
        
        // ВЕРТИКАЛЬНЫЕ СКЛАДКИ - как на реальной одежде
        const verticalFolds = Math.sin(x * 12) * 0.025 * Math.exp(-Math.abs(y) / 1.5);
        z += verticalFolds;
        
        // ГОРИЗОНТАЛЬНЫЕ СКЛАДКИ в области живота/талии
        if (y > -1.2 && y < 0.3) {
          const horizontalFolds = Math.sin(y * 15 + x * 3) * 0.02 * (1 - Math.abs(x) / 1.2);
          z += horizontalFolds;
        }
        
        // Дополнительные мелкие складки для реализма
        const microFolds = (Math.sin(x * 25 + y * 20) + Math.sin(x * 18 - y * 15)) * 0.008;
        z += microFolds;
        
        // Складки у рукавов
        if (Math.abs(x) > 0.9 && y > 0.5) {
          const sleeveFolds = Math.sin(y * 10) * 0.03 * (Math.abs(x) - 0.9) * 3;
          z += sleeveFolds;
        }
        
        // Форма плеч
        if (y > 1.0) {
          const shoulderCurve = Math.pow((y - 1.0) / 0.6, 2) * 0.2 * (1 - Math.abs(x) / 1.2);
          z += shoulderCurve;
        }
        
        positionAttribute.setZ(i, z);
      }
      
      bodyGeo.computeVertexNormals();

      let bodyMaterial;
      if (designUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        
        textureLoader.load(
          designUrl,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.colorSpace = THREE.SRGBColorSpace;
            
            bodyMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: settings.roughness || 0.85,
              metalness: settings.metalness || 0.02,
              side: THREE.DoubleSide,
              envMapIntensity: 0.3
            });
            
            if (body.material) {
              body.material.dispose();
            }
            body.material = bodyMaterial;
            setTextureLoaded(true);
            setLoading(false);
          },
          undefined,
          (err) => {
            console.error('Error loading texture:', err);
            setError('Не удалось загрузить текстуру');
            setLoading(false);
          }
        );
      } else {
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0xf8f8f8,
          roughness: 0.85,
          metalness: 0.02,
          side: THREE.DoubleSide
        });
        setLoading(false);
      }

      const body = new THREE.Mesh(bodyGeo, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Материал для рукавов
      const sleeveMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.88,
        metalness: 0.02
      });

      // ЛЕВЫЙ РУКАВ - с естественными изгибами
      const createRealisticSleeve = (isLeft) => {
        const sleeveGroup = new THREE.Group();
        
        // Верхняя часть рукава (плечо) - широкая
        const upperSleeveGeo = new THREE.CylinderGeometry(0.32, 0.28, 1.5, 16, 8);
        
        // Добавляем складки на рукаве
        const upperPos = upperSleeveGeo.attributes.position;
        for (let i = 0; i < upperPos.count; i++) {
          const x = upperPos.getX(i);
          const y = upperPos.getY(i);
          const z = upperPos.getZ(i);
          
          // Вертикальные складки на рукаве
          const angle = Math.atan2(z, x);
          const folds = Math.sin(angle * 8 + y * 5) * 0.015;
          const radius = Math.sqrt(x * x + z * z) + folds;
          
          upperPos.setX(i, Math.cos(angle) * radius);
          upperPos.setZ(i, Math.sin(angle) * radius);
        }
        upperSleeveGeo.computeVertexNormals();
        
        const upperSleeve = new THREE.Mesh(upperSleeveGeo, sleeveMaterial);
        upperSleeve.rotation.z = Math.PI / 2;
        upperSleeve.rotation.x = isLeft ? -Math.PI / 12 : Math.PI / 12;
        upperSleeve.position.set(isLeft ? -1.5 : 1.5, 0.9, 0);
        upperSleeve.castShadow = true;
        sleeveGroup.add(upperSleeve);

        // Нижняя часть рукава (предплечье) - более узкая
        const lowerSleeveGeo = new THREE.CylinderGeometry(0.24, 0.21, 1.3, 16, 8);
        
        const lowerPos = lowerSleeveGeo.attributes.position;
        for (let i = 0; i < lowerPos.count; i++) {
          const x = lowerPos.getX(i);
          const y = lowerPos.getY(i);
          const z = lowerPos.getZ(i);
          
          const angle = Math.atan2(z, x);
          const folds = Math.sin(angle * 6 + y * 6) * 0.012;
          const radius = Math.sqrt(x * x + z * z) + folds;
          
          lowerPos.setX(i, Math.cos(angle) * radius);
          lowerPos.setZ(i, Math.sin(angle) * radius);
        }
        lowerSleeveGeo.computeVertexNormals();
        
        const lowerSleeve = new THREE.Mesh(lowerSleeveGeo, sleeveMaterial);
        lowerSleeve.rotation.z = Math.PI / 2;
        lowerSleeve.rotation.x = isLeft ? -Math.PI / 8 : Math.PI / 8;
        lowerSleeve.position.set(isLeft ? -2.5 : 2.5, 0.1, 0.1);
        lowerSleeve.castShadow = true;
        sleeveGroup.add(lowerSleeve);

        // Манжета
        const cuffGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16);
        const cuffMaterial = new THREE.MeshStandardMaterial({
          color: 0xe8e8e8,
          roughness: 0.92,
          metalness: 0
        });
        const cuff = new THREE.Mesh(cuffGeo, cuffMaterial);
        cuff.rotation.z = Math.PI / 2;
        cuff.rotation.x = isLeft ? -Math.PI / 8 : Math.PI / 8;
        cuff.position.set(isLeft ? -3.15 : 3.15, -0.45, 0.15);
        cuff.castShadow = true;
        sleeveGroup.add(cuff);

        return sleeveGroup;
      };

      const leftSleeve = createRealisticSleeve(true);
      group.add(leftSleeve);

      const rightSleeve = createRealisticSleeve(false);
      group.add(rightSleeve);

      // Круглый вырез горловины с толщиной
      const collarGeo = new THREE.TorusGeometry(0.48, 0.09, 12, 24, Math.PI * 1.8);
      const collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.9,
        metalness: 0
      });
      const collar = new THREE.Mesh(collarGeo, collarMaterial);
      collar.rotation.x = Math.PI / 2;
      collar.rotation.z = Math.PI / 2;
      collar.position.set(0, 1.55, 0.18);
      collar.castShadow = true;
      group.add(collar);

      // Нижняя резинка (манжета)
      const hemGeo = new THREE.TorusGeometry(1.15, 0.1, 12, 32);
      const hemMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.95,
        metalness: 0
      });
      const hem = new THREE.Mesh(hemGeo, hemMaterial);
      hem.rotation.x = Math.PI / 2;
      hem.position.set(0, -1.6, 0);
      hem.castShadow = true;
      group.add(hem);

      // Боковые швы - реалистичные
      const seamMaterial = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        roughness: 0.95,
        metalness: 0
      });

      const createSeam = (xPos) => {
        const seamPath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xPos, 1.2, 0.25),
          new THREE.Vector3(xPos * 1.05, 0.5, 0.25),
          new THREE.Vector3(xPos, -0.3, 0.25),
          new THREE.Vector3(xPos * 0.95, -1.0, 0.25),
          new THREE.Vector3(xPos * 0.85, -1.5, 0.25)
        ]);

        const seamGeo = new THREE.TubeGeometry(seamPath, 20, 0.02, 8, false);
        const seam = new THREE.Mesh(seamGeo, seamMaterial);
        seam.castShadow = true;
        return seam;
      };

      const leftSeam = createSeam(-1.18);
      group.add(leftSeam);

      const rightSeam = createSeam(1.18);
      group.add(rightSeam);

      return group;
    };

    const sweatshirt = createRealisticSweatshirt();
    scene.add(sweatshirt);
    sweatshirtRef.current = sweatshirt;

    if (viewMode === 'back') {
      controlsRef.current.rotation.y = Math.PI;
      controlsRef.current.targetRotation.y = Math.PI;
    }

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

      if (sweatshirtRef.current) {
        const lerpFactor = 0.1;
        controlsRef.current.rotation.x += 
          (controlsRef.current.targetRotation.x - controlsRef.current.rotation.x) * lerpFactor;
        controlsRef.current.rotation.y += 
          (controlsRef.current.targetRotation.y - controlsRef.current.rotation.y) * lerpFactor;
        
        sweatshirtRef.current.rotation.x = controlsRef.current.rotation.x;
        sweatshirtRef.current.rotation.y = controlsRef.current.rotation.y;
        
        if (settings.floatAnimation !== false) {
          sweatshirtRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.08;
        }

        if (settings.autoRotate) {
          sweatshirtRef.current.rotation.y += 0.003;
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
                <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
            <p className="text-purple-300 text-base font-semibold mb-2">Создаём реалистичную 3D модель...</p>
            <p className="text-purple-400 text-sm">Генерируем складки и детали</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/80 border border-red-500/60 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm text-sm shadow-2xl">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && (
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-3 rounded-xl border border-purple-500/30 shadow-2xl">
          <div className="space-y-1.5">
            <p className="text-xs text-purple-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="font-semibold">Управление:</span>
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
            <span className="font-semibold">Дизайн применён!</span>
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
