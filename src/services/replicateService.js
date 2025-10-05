/**
 * Service for working with Replicate API through backend proxy
 */
import config from '../config';

const PROXY_API_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api';
const SDXL_MODEL_VERSION = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Get API key from config
const API_KEY = config.REPLICATE_API_KEY;

/**
 * Create a prediction (start image generation) with settings support
 */
export async function createPrediction(prompt, settings = {}, seed = null) {
  // Apply settings to prompt
  const enhancedPrompt = enhancePromptWithSettings(prompt, settings);
  
  // Adjust technical parameters based on detail level
  const inferenceSteps = settings.detailLevel === 'high' ? 40 : 
                         settings.detailLevel === 'medium' ? 25 : 15;
  
  const response = await fetch(`${PROXY_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: API_KEY,
      version: SDXL_MODEL_VERSION,
      input: {
        prompt: enhancedPrompt,
        negative_prompt: "blurry, low quality, distorted, ugly, watermark, text, signature, logo, letters, words, bad anatomy, deformed, artifacts",
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: inferenceSteps,
        guidance_scale: settings.detailLevel === 'high' ? 8.5 : 7.5,
        seed: seed || Math.floor(Math.random() * 1000000),
        prompt_strength: 0.8,
        refine: settings.detailLevel === 'high' ? 'expert_ensemble_refiner' : 'no_refiner'
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || 'Failed to create request');
  }

  return await response.json();
}

/**
 * Get prediction status
 */
export async function getPrediction(predictionId) {
  const response = await fetch(`${PROXY_API_URL}/predictions/${predictionId}`, {
    headers: {
      'X-API-Key': API_KEY,
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get status');
  }

  return await response.json();
}

/**
 * Wait for prediction completion with progress tracking
 */
export async function waitForPrediction(predictionId, onProgress = null) {
  let attempts = 0;
  const maxAttempts = 120; // Increase timeout for better reliability
  
  while (attempts < maxAttempts) {
    try {
      const prediction = await getPrediction(predictionId);
      
      // Determine detailed status
      let detailedStatus = {
        status: prediction.status,
        stage: 'unknown',
        message: '',
        progress: 0
      };

      if (prediction.status === 'starting') {
        detailedStatus.stage = 'starting';
        detailedStatus.message = 'Initializing AI...';
        detailedStatus.progress = 10;
      } else if (prediction.status === 'processing') {
        // Estimate progress based on time
        const progressEstimate = Math.min(50 + (attempts * 2), 90);
        detailedStatus.stage = 'generating';
        detailedStatus.message = 'Creating design...';
        detailedStatus.progress = progressEstimate;
      } else if (prediction.status === 'succeeded') {
        detailedStatus.stage = 'completed';
        detailedStatus.message = 'Design ready!';
        detailedStatus.progress = 100;
        
        // Ensure image is fully loaded
        if (prediction.output && prediction.output[0]) {
          await preloadImage(prediction.output[0]);
        }
      }
      
      if (onProgress) {
        onProgress(detailedStatus);
      }
      
      if (prediction.status === 'succeeded') {
        return prediction;
      }
      
      if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Generation failed');
      }
      
      if (prediction.status === 'canceled') {
        throw new Error('Generation canceled');
      }
    } catch (error) {
      console.error('Error checking prediction status:', error);
      // Continue polling even if there's a temporary error
      if (attempts > 10) {
        throw error; // Fail after multiple attempts
      }
    }
    
    // Wait before next check (increase interval for long-running tasks)
    const waitTime = attempts < 10 ? 1000 : 2000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    attempts++;
  }
  
  throw new Error('Generation timeout exceeded');
}

/**
 * Preload image to ensure it's fully loaded
 */
async function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generate multiple design variants with settings support
 */
export async function generateDesigns(prompt, settings = {}, onProgressUpdate = null) {
  const numberOfVariants = settings.numberOfVariants || 4;
  console.log(`Starting parallel generation of ${numberOfVariants} variants...`);
  
  // Initialize status array for each image
  const imageStatuses = Array.from({ length: numberOfVariants }, (_, i) => ({
    index: i,
    stage: 'creating',
    message: 'Preparing...',
    status: 'starting',
    progress: 0
  }));
  
  const updateProgress = () => {
    if (onProgressUpdate) {
      onProgressUpdate([...imageStatuses]);
    }
  };
  
  try {
    // Create ALL predictions in parallel with different seeds
    updateProgress();
    
    const predictionPromises = Array.from({ length: numberOfVariants }, async (_, i) => {
      console.log(`Sending request ${i + 1}/${numberOfVariants}`);
      imageStatuses[i] = {
        index: i,
        stage: 'creating',
        message: 'Sending to AI...',
        status: 'starting',
        progress: 5
      };
      updateProgress();
      
      try {
        // Use different seed for each variant for diversity
        const seed = Math.floor(Math.random() * 1000000) + i * 1000;
        const prediction = await createPrediction(prompt, settings, seed);
        imageStatuses[i] = {
          index: i,
          stage: 'waiting',
          message: 'Processing...',
          status: 'processing',
          predictionId: prediction.id,
          progress: 20
        };
        updateProgress();
        return prediction;
      } catch (error) {
        imageStatuses[i] = {
          index: i,
          stage: 'error',
          message: `Error: ${error.message}`,
          status: 'failed',
          progress: 0
        };
        updateProgress();
        throw error;
      }
    });
    
    // Wait for ALL predictions to be created
    const predictions = await Promise.all(predictionPromises);
    console.log(`All ${numberOfVariants} requests created, waiting for generation...`);
    
    // Wait for ALL generations to complete in parallel
    const results = await Promise.all(
      predictions.map((pred, index) => {
        console.log(`Waiting for result ${index + 1}/${numberOfVariants} (ID: ${pred.id})`);
        
        return waitForPrediction(pred.id, (detailedStatus) => {
          imageStatuses[index] = {
            index: index,
            stage: detailedStatus.stage,
            message: detailedStatus.message,
            status: detailedStatus.status,
            predictionId: pred.id,
            progress: detailedStatus.progress || 50
          };
          updateProgress();
          console.log(`Image ${index + 1}: ${detailedStatus.message}`);
        });
      })
    );
    
    console.log(`All ${numberOfVariants} images ready!`);
    
    // Update statuses to "completed"
    imageStatuses.forEach((status, i) => {
      imageStatuses[i] = {
        ...status,
        stage: 'completed',
        message: 'Ready!',
        status: 'succeeded',
        progress: 100
      };
    });
    updateProgress();
    
    // Extract image URLs
    return results
      .filter(result => result.output && result.output[0])
      .map((result, index) => ({
        id: result.id,
        url: result.output[0],
        prompt: prompt,
        seed: result.input?.seed,
        index: index
      }));
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
}

/**
 * Enhance prompt with settings for better results
 */
function enhancePromptWithSettings(prompt, settings = {}) {
  let enhancedPrompt = prompt;
  
  // Ensure prompt is in English for best results
  // Common translations if user inputs in Russian
  const translations = {
    'закат': 'sunset',
    'океан': 'ocean',
    'дельфин': 'dolphin',
    'розовый': 'pink',
    'фиолетовый': 'purple violet',
    'синий': 'blue',
    'красный': 'red',
    'зеленый': 'green',
    'желтый': 'yellow',
    'черный': 'black',
    'белый': 'white',
    'цветы': 'flowers',
    'листья': 'leaves',
    'геометрический': 'geometric',
    'абстрактный': 'abstract',
    'узор': 'pattern',
    'паттерн': 'pattern',
    'звезды': 'stars',
    'космос': 'space cosmos',
    'туманность': 'nebula',
    'галактика': 'galaxy'
  };
  
  // Translate Russian words
  Object.keys(translations).forEach(russian => {
    const regex = new RegExp(russian, 'gi');
    enhancedPrompt = enhancedPrompt.replace(regex, translations[russian]);
  });
  
  // Add pattern type instructions
  if (settings.patternType === 'seamless') {
    enhancedPrompt += ', seamless pattern, tileable texture, repeating design, perfect for textile printing';
  } else if (settings.patternType === 'geometric') {
    enhancedPrompt += ', geometric pattern, mathematical shapes, symmetrical design, modern abstract geometry';
  } else if (settings.patternType === 'composition') {
    enhancedPrompt += ', artistic composition, centered design, full print artwork, complete illustration';
  }
  
  // Add style modifiers
  if (settings.style === 'realistic') {
    enhancedPrompt += ', photorealistic style, highly detailed, 8k quality, professional photography';
  } else if (settings.style === 'abstract') {
    enhancedPrompt += ', abstract art style, modern design, artistic interpretation, contemporary art';
  } else if (settings.style === 'minimalist') {
    enhancedPrompt += ', minimalist style, simple clean lines, negative space, elegant simplicity';
  } else if (settings.style === 'vintage') {
    enhancedPrompt += ', vintage retro style, nostalgic aesthetic, classic design, old-school vibes';
  } else if (settings.style === 'watercolor') {
    enhancedPrompt += ', watercolor painting style, soft blended colors, artistic brushstrokes, painted texture';
  } else if (settings.style === 'geometric') {
    enhancedPrompt += ', geometric art style, angular shapes, modern patterns, mathematical precision';
  } else if (settings.style === 'cyberpunk') {
    enhancedPrompt += ', cyberpunk style, neon colors, futuristic tech aesthetic, digital art, glowing elements';
  }
  
  // Add quality modifiers based on detail level
  if (settings.detailLevel === 'high') {
    enhancedPrompt += ', ultra detailed, masterpiece quality, professional artwork, intricate details, sharp focus';
  } else if (settings.detailLevel === 'medium') {
    enhancedPrompt += ', detailed artwork, high quality design, professional finish';
  } else {
    enhancedPrompt += ', clean design, good quality';
  }
  
  // Always add textile-specific instructions
  enhancedPrompt += ', suitable for textile printing, fashion design, apparel artwork, t-shirt design';
  
  return enhancedPrompt;
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured() {
  return API_KEY && API_KEY !== 'r8_YOUR_ACTUAL_API_KEY_HERE' && API_KEY.startsWith('r8_');
}
