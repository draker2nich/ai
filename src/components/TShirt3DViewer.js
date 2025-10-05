import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function TShirt3DViewer({ designUrl, viewMode }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const tshirtRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x9966ff, 0.3);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    // Create T-shirt geometry
    const createTShirt = () => {
      const group = new THREE.Group();

      // Main body
      const bodyGeometry = new THREE.BoxGeometry(2.2, 2.8, 0.4);
      bodyGeometry.translate(0, -0.2, 0);
      
      // Create material with texture if design is provided
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
            
            bodyMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.8,
              metalness: 0.1,
              side: THREE.DoubleSide
            });
            
            if (body.material) {
              body.material.dispose();
            }
            body.material = bodyMaterial;
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
          roughness: 0.8,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        setLoading(false);
      }

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Left sleeve
      const leftSleeveGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.35);
      leftSleeveGeometry.rotateZ(-Math.PI / 6);
      leftSleeveGeometry.translate(-1.3, 0.8, 0);
      const leftSleeveMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
      });
      const leftSleeve = new THREE.Mesh(leftSleeveGeometry, leftSleeveMaterial);
      leftSleeve.castShadow = true;
      group.add(leftSleeve);

      // Right sleeve
      const rightSleeveGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.35);
      rightSleeveGeometry.rotateZ(Math.PI / 6);
      rightSleeveGeometry.translate(1.3, 0.8, 0);
      const rightSleeveMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
      });
      const rightSleeve = new THREE.Mesh(rightSleeveGeometry, rightSleeveMaterial);
      rightSleeve.castShadow = true;
      group.add(rightSleeve);

      // Collar
      const collarGeometry = new THREE.TorusGeometry(0.6, 0.1, 8, 16, Math.PI * 2);
      collarGeometry.rotateX(Math.PI / 2);
      collarGeometry.translate(0, 1.3, 0);
      const collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.9,
        metalness: 0
      });
      const collar = new THREE.Mesh(collarGeometry, collarMaterial);
      collar.castShadow = true;
      group.add(collar);

      return group;
    };

    const tshirt = createTShirt();
    scene.add(tshirt);
    tshirtRef.current = tshirt;

    // Set initial rotation based on viewMode
    if (viewMode === 'back') {
      tshirt.rotation.y = Math.PI;
    }

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = mountRef.current.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      targetRotationY = mouseX * Math.PI * 0.5;
      targetRotationX = mouseY * Math.PI * 0.2;
    };

    // Scroll zoom
    const handleWheel = (event) => {
      event.preventDefault();
      const zoomSpeed = 0.001;
      camera.position.z += event.deltaY * zoomSpeed;
      camera.position.z = Math.max(2, Math.min(10, camera.position.z));
    };

    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Smooth rotation
      if (tshirtRef.current) {
        tshirtRef.current.rotation.x += (targetRotationX - tshirtRef.current.rotation.x) * 0.05;
        tshirtRef.current.rotation.y += (targetRotationY - tshirtRef.current.rotation.y) * 0.05;
        
        // Add subtle floating animation
        tshirtRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('wheel', handleWheel);
        if (rendererRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      
      window.removeEventListener('resize', handleResize);

      // Dispose of Three.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
          if (object.material && object.material.map) {
            object.material.map.dispose();
          }
        });
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [designUrl, viewMode]);

  // Update rotation when viewMode changes
  useEffect(() => {
    if (tshirtRef.current) {
      if (viewMode === 'back') {
        tshirtRef.current.rotation.y = Math.PI;
      } else {
        tshirtRef.current.rotation.y = 0;
      }
    }
  }, [viewMode]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-move"
        style={{ minHeight: '500px' }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300 text-sm">Загружаем 3D модель...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
        <p className="text-xs text-purple-300">
          🖱️ Двигайте мышь для вращения | Скролл для зума
        </p>
      </div>
    </div>
  );
}
