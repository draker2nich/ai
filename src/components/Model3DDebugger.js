import React, { useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * Диагностический компонент для проверки 3D-модели
 * Используйте для отладки моделей перед использованием в основном приложении
 */
export default function Model3DDebugger() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testModel = async (format, path) => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      let model;
      let loader;

      switch (format) {
        case 'gltf':
        case 'glb':
          loader = new GLTFLoader();
          const gltf = await new Promise((resolve, reject) => {
            loader.load(path, resolve, undefined, reject);
          });
          model = gltf.scene;
          break;

        case 'obj':
          loader = new OBJLoader();
          model = await new Promise((resolve, reject) => {
            loader.load(path, resolve, undefined, reject);
          });
          break;

        case 'fbx':
          loader = new FBXLoader();
          model = await new Promise((resolve, reject) => {
            loader.load(path, resolve, undefined, reject);
          });
          break;

        default:
          throw new Error('Неподдерживаемый формат');
      }

      // Анализируем модель
      const modelInfo = analyzeModel(model);
      setInfo(modelInfo);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeModel = (model) => {
    const info = {
      meshCount: 0,
      vertexCount: 0,
      faceCount: 0,
      hasUV: false,
      materials: [],
      boundingBox: null,
      size: null,
      center: null
    };

    // Подсчёт мешей и вершин
    model.traverse((child) => {
      if (child.isMesh) {
        info.meshCount++;
        
        if (child.geometry) {
          const positions = child.geometry.attributes.position;
          const uvs = child.geometry.attributes.uv;
          
          if (positions) {
            info.vertexCount += positions.count;
            info.faceCount += positions.count / 3;
          }
          
          if (uvs) {
            info.hasUV = true;
          }
        }

        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            if (!info.materials.find(m => m.name === mat.name)) {
              info.materials.push({
                name: mat.name || 'Unnamed',
                type: mat.type,
                hasMap: !!mat.map,
                color: mat.color ? `#${mat.color.getHexString()}` : null
              });
            }
          });
        }
      }
    });

    // Вычисляем размеры
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    info.boundingBox = {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z }
    };
    info.size = { x: size.x, y: size.y, z: size.z };
    info.center = { x: center.x, y: center.y, z: center.z };

    return info;
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 3D Model Debugger</h1>
        
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тестирование модели</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Формат:</label>
              <select 
                id="format"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                defaultValue="obj"
              >
                <option value="obj">OBJ</option>
                <option value="glb">GLB</option>
                <option value="gltf">GLTF</option>
                <option value="fbx">FBX</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Путь к файлу:</label>
              <input
                id="path"
                type="text"
                placeholder="/models/sweatshirt.obj"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                defaultValue="/models/sweatshirt.obj"
              />
            </div>

            <button
              onClick={() => {
                const format = document.getElementById('format').value;
                const path = document.getElementById('path').value;
                testModel(format, path);
              }}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Тестировать модель'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">❌ Ошибка</h3>
            <p className="text-red-200">{error}</p>
            <div className="mt-4 text-sm">
              <p className="font-semibold mb-2">Проверьте:</p>
              <ul className="list-disc list-inside space-y-1 text-red-300">
                <li>Файл находится в папке public/</li>
                <li>Путь указан правильно</li>
                <li>Формат соответствует расширению файла</li>
              </ul>
            </div>
          </div>
        )}

        {info && (
          <div className="space-y-6">
            <div className="bg-green-900/50 border border-green-500 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-2">✅ Модель загружена успешно!</h3>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-xl mb-4">📊 Статистика модели</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Мешей</p>
                  <p className="text-2xl font-bold">{info.meshCount}</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Вершин</p>
                  <p className="text-2xl font-bold">{info.vertexCount.toLocaleString()}</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Граней</p>
                  <p className="text-2xl font-bold">{Math.round(info.faceCount).toLocaleString()}</p>
                </div>
                
                <div className={`rounded-lg p-4 ${info.hasUV ? 'bg-green-700' : 'bg-red-700'}`}>
                  <p className="text-gray-200 text-sm">UV-координаты</p>
                  <p className="text-2xl font-bold">{info.hasUV ? '✅ Есть' : '❌ Нет'}</p>
                </div>
              </div>

              {!info.hasUV && (
                <div className="mt-4 bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <p className="font-bold">⚠️ UV-координаты отсутствуют!</p>
                  <p className="text-sm text-red-200 mt-2">
                    Без UV-координат текстура не будет корректно наложена. 
                    Необходимо создать UV-развёртку в Blender.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-xl mb-4">📐 Размеры модели</h3>
              
              <div className="space-y-2 font-mono text-sm">
                <p><span className="text-gray-400">Ширина (X):</span> {info.size.x.toFixed(3)}</p>
                <p><span className="text-gray-400">Высота (Y):</span> {info.size.y.toFixed(3)}</p>
                <p><span className="text-gray-400">Глубина (Z):</span> {info.size.z.toFixed(3)}</p>
              </div>

              <div className="mt-4 bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                <p className="font-semibold mb-2">💡 Рекомендуемый targetSize:</p>
                <p className="font-mono text-lg">
                  {(3.5 / Math.max(info.size.x, info.size.y, info.size.z)).toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Или оставьте autoScale: true для автоматической подгонки
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-xl mb-4">🎨 Материалы ({info.materials.length})</h3>
              
              {info.materials.length === 0 ? (
                <p className="text-gray-400">Материалы не найдены</p>
              ) : (
                <div className="space-y-3">
                  {info.materials.map((mat, idx) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-4">
                      <p className="font-semibold">{mat.name}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-400">Тип: {mat.type}</span>
                        {mat.color && (
                          <span className="flex items-center gap-2">
                            Цвет: 
                            <span 
                              className="w-4 h-4 rounded border border-gray-500"
                              style={{ backgroundColor: mat.color }}
                            />
                            {mat.color}
                          </span>
                        )}
                        <span className={mat.hasMap ? 'text-green-400' : 'text-gray-500'}>
                          {mat.hasMap ? '✅ С текстурой' : 'Без текстуры'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-xl mb-4">📝 Рекомендации</h3>
              
              <div className="space-y-2 text-sm">
                {info.vertexCount > 100000 && (
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
                    ⚠️ Много вершин ({info.vertexCount.toLocaleString()}). 
                    Рекомендуется упростить модель для веба (до 50k вершин).
                  </div>
                )}
                
                {info.hasUV ? (
                  <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
                    ✅ UV-координаты присутствуют - текстура будет применена корректно!
                  </div>
                ) : (
                  <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
                    ❌ Отсутствуют UV-координаты - создайте UV-развёртку в Blender!
                  </div>
                )}
                
                {info.meshCount === 1 ? (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3">
                    ℹ️ Один меш - идеально для производительности
                  </div>
                ) : (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3">
                    ℹ️ {info.meshCount} мешей - рассмотрите объединение для лучшей производительности
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
