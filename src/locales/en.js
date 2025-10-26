/**
 * English localization
 */
export default {
  // Header and main
  appTitle: 'AI Fashion Studio',
  
  // Navigation
  nav: {
    saved: 'Saved',
    hideUI: 'Hide UI',
    showUI: 'Show UI'
  },
  
  // Create design
  create: {
    title: 'Create Design',
    placeholder: 'Describe your design...',
    generate: 'Generate Designs',
    generating: 'Generating...',
    quickIdeas: 'Quick Ideas'
  },
  
  // Settings
  settings: {
    title: 'Settings',
    style: 'Style',
    variants: 'Variants',
    styles: {
      realistic: 'Realistic',
      abstract: 'Abstract',
      minimalist: 'Minimalist',
      vintage: 'Vintage',
      cyberpunk: 'Cyberpunk'
    }
  },
  
  // Gallery
  gallery: {
    title: 'Generated Designs',
    save: 'Save',
    download: 'Download'
  },
  
  // Generation process
  generation: {
    creating: 'Creating your designs...',
    timeEstimate: 'Usually takes 20-40 seconds',
    stage: {
      creating: 'Sending...',
      starting: 'Starting...',
      waiting: 'Processing...',
      generating: 'Generating...',
      completed: 'Done!',
      error: 'Error'
    }
  },
  
  // Saved designs
  savedDesigns: {
    title: 'Saved Designs',
    total: 'Total',
    empty: 'No saved designs yet',
    emptyHint: 'Create a design and click "Save" to add it here',
    load: 'Load',
    delete: 'Delete',
    noDescription: 'No description',
    timeAgo: {
      minutes: 'min. ago',
      hours: 'h. ago',
      days: 'd. ago'
    }
  },
  
  // Notifications
  notifications: {
    saved: 'Design saved!',
    deleted: 'Design deleted',
    downloaded: 'Design downloaded!'
  },
  
  // Errors
  errors: {
    noApiKey: 'Please configure API key in .env file',
    emptyPrompt: 'Please enter design description',
    generationFailed: 'Failed to generate designs. Please try again.',
    saveFailed: 'Failed to save design',
    downloadFailed: 'Failed to download image'
  },
  
  // 3D viewer
  viewer: {
    loading: 'Loading 3D scene...',
    preparing: 'Preparing virtual studio'
  }
};
