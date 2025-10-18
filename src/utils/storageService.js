/**
 * Сервис для работы с localStorage
 * Сохранение и загрузка дизайнов пользователя
 */

const STORAGE_KEY = 'ai_fashion_designs';
const MAX_DESIGNS = 50; // Максимальное количество сохраненных дизайнов

/**
 * Получить все сохраненные дизайны
 */
export function getSavedDesigns() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const designs = JSON.parse(data);
    return Array.isArray(designs) ? designs : [];
  } catch (error) {
    console.error('Ошибка загрузки дизайнов:', error);
    return [];
  }
}

/**
 * Сохранить новый дизайн
 */
export function saveDesign(design) {
  try {
    const designs = getSavedDesigns();
    
    const newDesign = {
      id: design.id || generateId(),
      url: design.url,
      prompt: design.prompt || '',
      settings: design.settings || {},
      seed: design.seed,
      createdAt: Date.now(),
      thumbnail: design.url // Можно добавить генерацию thumbnail
    };
    
    // Добавляем в начало массива
    designs.unshift(newDesign);
    
    // Ограничиваем количество сохраненных дизайнов
    if (designs.length > MAX_DESIGNS) {
      designs.splice(MAX_DESIGNS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return newDesign;
  } catch (error) {
    console.error('Ошибка сохранения дизайна:', error);
    throw new Error('Не удалось сохранить дизайн');
  }
}

/**
 * Удалить дизайн по ID
 */
export function deleteDesign(designId) {
  try {
    const designs = getSavedDesigns();
    const filtered = designs.filter(d => d.id !== designId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Ошибка удаления дизайна:', error);
    return false;
  }
}

/**
 * Очистить все сохраненные дизайны
 */
export function clearAllDesigns() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Ошибка очистки дизайнов:', error);
    return false;
  }
}

/**
 * Получить статистику хранилища
 */
export function getStorageStats() {
  const designs = getSavedDesigns();
  return {
    total: designs.length,
    maxCapacity: MAX_DESIGNS,
    remaining: MAX_DESIGNS - designs.length,
    oldestDate: designs.length > 0 ? designs[designs.length - 1].createdAt : null,
    newestDate: designs.length > 0 ? designs[0].createdAt : null
  };
}

/**
 * Генерация уникального ID
 */
function generateId() {
  return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Экспорт дизайнов в JSON
 */
export function exportDesigns() {
  const designs = getSavedDesigns();
  const dataStr = JSON.stringify(designs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-fashion-designs-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Импорт дизайнов из JSON
 */
export function importDesigns(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (!Array.isArray(imported)) {
          throw new Error('Неверный формат файла');
        }
        
        const current = getSavedDesigns();
        const merged = [...imported, ...current];
        
        // Удаляем дубликаты по URL
        const unique = merged.filter((design, index, self) => 
          index === self.findIndex(d => d.url === design.url)
        );
        
        // Ограничиваем количество
        const limited = unique.slice(0, MAX_DESIGNS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        resolve(limited.length);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}
