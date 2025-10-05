import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Sweatshirt3DViewer({ designUrl, viewMode, settings = {} }) {
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientLight || 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, settings.directionalLight || 1.0);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x9966ff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -5, -5);
    scene.add(rimLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    scene.add(hemisphereLight);

    // Create Sweatshirt with long sleeves
    const createSweatshirt = () => {
      const group = new THREE.Group();

      // Main body - slightly longer than t-shirt
      const bodyGeometry = new THREE.BoxGeometry(2.4, 3.2, 0.5);
      
      const bodyPositions = bodyGeometry.attributes.position;
      for (let i = 0; i < bodyPositions.count; i++) {
        const x = bodyPositions.getX(i);
        const y = bodyPositions.getY(i);
        const z = bodyPositions.getZ(i);
        
        if (Math.abs(z) > 0.2) {
          const curve = (1 - Math.abs(y) / 1.6) * 0.15;
          bodyPositions.setZ(i, z + (z > 0 ? curve : -curve));
        }
        
        if (y < -0.8) {
          const taper = (y + 1.6) * 0.03;
          bodyPositions.setX(i, x * (1 + taper));
        }
      }
      
      bodyGeometry.computeVertexNormals();
      bodyGeometry.translate(0, -0.1, 0);

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
              roughness: settings.roughness || 0.75,
              metalness: settings.metalness || 0.05,
              side: THREE.DoubleSide,
              envMapIntensity: 0.5
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
          color: 0xffffff,
          roughness: settings.roughness || 0.75,
          metalness: settings.metalness || 0.05,
          side: THREE.DoubleSide
        });
        setLoading(false);
      }

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // LONG LEFT SLEEVE - multiple segments for realistic bend
      const sleeveMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        metalness: 0.05
      });

      // Upper left sleeve (shoulder to elbow)
      const upperLeftSleeveGeo = new THREE.CylinderGeometry(0.25, 0.28, 1.4, 12);
      upperLeftSleeveGeo.rotateZ(Math.PI / 2);
      upperLeftSleeveGeo.rotateX(-Math.PI / 12);
      upperLeftSleeveGeo.translate(-1.5, 0.9, 0);
      const upperLeftSleeve = new THREE.Mesh(upperLeftSleeveGeo, sleeveMaterial);
      upperLeftSleeve.castShadow = true;
      group.add(upperLeftSleeve);

      // Lower left sleeve (elbow to wrist)
      const lowerLeftSleeveGeo = new THREE.CylinderGeometry(0.22, 0.20, 1.2, 12);
      lowerLeftSleeveGeo.rotateZ(Math.PI / 2);
      lowerLeftSleeveGeo.rotateX(-Math.PI / 8);
      lowerLeftSleeveGeo.translate(-2.4, 0.1, 0.1);
      const lowerLeftSleeve = new THREE.Mesh(lowerLeftSleeveGeo, sleeveMaterial);
      lowerLeftSleeve.castShadow = true;
      group.add(lowerLeftSleeve);

      // Left cuff (манжета)
      const leftCuffGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.15, 12);
      leftCuffGeo.rotateZ(Math.PI / 2);
      leftCuffGeo.rotateX(-Math.PI / 8);
      leftCuffGeo.translate(-3.0, -0.4, 0.15);
      const leftCuffMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.9,
        metalness: 0
      });
      const leftCuff = new THREE.Mesh(leftCuffGeo, leftCuffMaterial);
      leftCuff.castShadow = true;
      group.add(leftCuff);

      // LONG RIGHT SLEEVE
      const upperRightSleeveGeo = new THREE.CylinderGeometry(0.25, 0.28, 1.4, 12);
      upperRightSleeveGeo.rotateZ(Math.PI / 2);
      upperRightSleeveGeo.rotateX(Math.PI / 12);
      upperRightSleeveGeo.translate(1.5, 0.9, 0);
      const upperRightSleeve = new THREE.Mesh(upperRightSleeveGeo, sleeveMaterial);
      upperRightSleeve.castShadow = true;
      group.add(upperRightSleeve);

      const lowerRightSleeveGeo = new THREE.CylinderGeometry(0.22, 0.20, 1.2, 12);
      lowerRightSleeveGeo.rotateZ(Math.PI / 2);
      lowerRightSleeveGeo.rotateX(Math.PI / 8);
      lowerRightSleeveGeo.translate(2.4, 0.1, 0.1);
      const lowerRightSleeve = new THREE.Mesh(lowerRightSleeveGeo, sleeveMaterial);
      lowerRightSleeve.castShadow = true;
      group.add(lowerRightSleeve);

      // Right cuff
      const rightCuffGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.15, 12);
      rightCuffGeo.rotateZ(Math.PI / 2);
      rightCuffGeo.rotateX(Math.PI / 8);
      rightCuffGeo.translate(3.0, -0.4, 0.15);
      const rightCuff = new THREE.Mesh(rightCuffGeo, leftCuffMaterial);
      rightCuff.castShadow = true;
      group.add(rightCuff);

      // Round neckline (круглый вырез)
      const collarGeometry = new THREE.TorusGeometry(0.45, 0.08, 10, 20, Math.PI * 1.6);
      collarGeometry.rotateX(Math.PI / 2);
      collarGeometry.translate(0, 1.5, 0.05);
      
      const collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.85,
        metalness: 0
      });
      const collar = new THREE.Mesh(collarGeometry, collarMaterial);
      collar.castShadow = true;
      group.add(collar);

      // Bottom hem (нижняя манжета/резинка)
      const hemGeo = new THREE.CylinderGeometry(1.22, 1.20, 0.12, 24);
      hemGeo.translate(0, -1.54, 0);
      const hemMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.9,
        metalness: 0
      });
      const hem = new THREE.Mesh(hemGeo, hemMaterial);
      hem.castShadow = true;
      group.add(hem);

      // Side seams
      const seamMaterial = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        roughness: 0.9,
        metalness: 0
      });

      const seamGeometry = new THREE.CylinderGeometry(0.015, 0.015, 3.0, 8);
      const leftSeam = new THREE.Mesh(seamGeometry, seamMaterial);
      leftSeam.position.set(-1.2, -0.1, 0.25);
      leftSeam.castShadow = true;
      group.add(leftSeam);

      const rightSeam = new THREE.Mesh(seamGeometry.clone(), seamMaterial);
      rightSeam.position.set(1.2, -0.1, 0.25);
      rightSeam.castShadow = true;
      group.add(rightSeam);

      return group;
    };

    const sweatshirt = createSweatshirt();
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

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        controlsRef.current.isDragging = true;
        controlsRef.current.previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      }
    };

    const handleTouchMove = (event) => {
      if (!controlsRef.current.isDragging || event.touches.length !== 1) return;

      const deltaMove = {
        x: event.touches[0].clientX - controlsRef.current.previousMousePosition.x,
        y: event.touches[0].clientY - controlsRef.current.previousMousePosition.y
      };

      const rotationSpeed = 0.005;
      controlsRef.current.targetRotation.y += deltaMove.x * rotationSpeed;
      controlsRef.current.targetRotation.x += deltaMove.y * rotationSpeed;

      controlsRef.current.targetRotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, controlsRef.current.targetRotation.x)
      );

      controlsRef.current.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    };

    const handleTouchEnd = () => {
      controlsRef.current.isDragging = false;
    };

    mountRef.current.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('wheel', handleWheel, { passive: false });
    mountRef.current.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

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
        mountRef.current.removeEventListener('touchstart', handleTouchStart);
        if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
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
            <p className="text-purple-300 text-base font-semibold mb-2">Загружаем 3D модель кофты...</p>
            <p className="text-purple-400 text-sm">Готовим интерактивный просмотр</p>
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
            <p className="text-xs text-purple-400">Свайп на тачскрине</p>
          </div>
        </div>
      )}

      {textureLoaded && (
        <div className="absolute top-4 right-4 bg-green-900/80 border border-green-500/60 px-4 py-2 rounded-xl backdrop-blur-sm animate-fade-out">
          <div className="flex items-center gap-2 text-green-200 text-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Текстура загружена!</span>
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
