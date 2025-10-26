/**
 * Русская локализация
 */
export default {
  // Заголовок и основное
  appTitle: 'AI Fashion Studio',
  
  // Навигация
  nav: {
    saved: 'Сохранённые',
    hideUI: 'Скрыть интерфейс',
    showUI: 'Показать интерфейс'
  },
  
  // Создание дизайна
  create: {
    title: 'Создать дизайн',
    placeholder: 'Опишите ваш дизайн...',
    generate: 'Создать дизайны',
    generating: 'Генерация...',
    quickIdeas: 'Быстрые идеи'
  },
  
  // Настройки
  settings: {
    title: 'Настройки',
    style: 'Стиль',
    variants: 'Варианты',
    styles: {
      realistic: 'Реалистичный',
      abstract: 'Абстрактный',
      minimalist: 'Минималистичный',
      vintage: 'Винтажный',
      cyberpunk: 'Киберпанк'
    }
  },
  
  // Галерея
  gallery: {
    title: 'Сгенерированные дизайны',
    save: 'Сохранить',
    download: 'Скачать'
  },
  
  // Процесс генерации
  generation: {
    creating: 'Создание ваших дизайнов...',
    timeEstimate: 'Обычно занимает 20-40 секунд',
    stage: {
      creating: 'Отправка...',
      starting: 'Инициализация...',
      waiting: 'Обработка...',
      generating: 'Генерация...',
      completed: 'Готово!',
      error: 'Ошибка'
    }
  },
  
  // Сохранённые дизайны
  savedDesigns: {
    title: 'Сохранённые дизайны',
    total: 'Всего',
    empty: 'Пока нет сохранённых дизайнов',
    emptyHint: 'Создайте дизайн и нажмите кнопку "Сохранить", чтобы он появился здесь',
    load: 'Загрузить',
    delete: 'Удалить',
    noDescription: 'Без описания',
    timeAgo: {
      minutes: 'мин. назад',
      hours: 'ч. назад',
      days: 'д. назад'
    }
  },
  
  // Уведомления
  notifications: {
    saved: 'Дизайн сохранён!',
    deleted: 'Дизайн удалён',
    downloaded: 'Дизайн скачан!'
  },
  
  // Ошибки
  errors: {
    noApiKey: 'Пожалуйста, настройте API ключ в файле .env',
    emptyPrompt: 'Пожалуйста, введите описание дизайна',
    generationFailed: 'Не удалось сгенерировать дизайны. Попробуйте ещё раз.',
    saveFailed: 'Не удалось сохранить дизайн',
    downloadFailed: 'Не удалось скачать изображение'
  },
  
  // 3D просмотр
  viewer: {
    loading: 'Загрузка 3D сцены...',
    preparing: 'Подготовка виртуальной студии'
  }
};
