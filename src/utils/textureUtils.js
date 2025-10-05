/**
 * Utilities for texture processing and enhancement
 */

/**
 * Create a seamless texture by blending edges
 */
export async function makeSeamless(imageUrl, blendWidth = 32) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Blend horizontal edges
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < blendWidth; x++) {
          const leftIdx = (y * canvas.width + x) * 4;
          const rightIdx = (y * canvas.width + (canvas.width - blendWidth + x)) * 4;
          
          const blend = x / blendWidth;
          
          for (let c = 0; c < 4; c++) {
            const leftColor = data[leftIdx + c];
            const rightColor = data[rightIdx + c];
            const blendedColor = leftColor * (1 - blend) + rightColor * blend;
            
            data[leftIdx + c] = blendedColor;
            data[rightIdx + c] = blendedColor;
          }
        }
      }
      
      // Blend vertical edges
      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < blendWidth; y++) {
          const topIdx = (y * canvas.width + x) * 4;
          const bottomIdx = ((canvas.height - blendWidth + y) * canvas.width + x) * 4;
          
          const blend = y / blendWidth;
          
          for (let c = 0; c < 4; c++) {
            const topColor = data[topIdx + c];
            const bottomColor = data[bottomIdx + c];
            const blendedColor = topColor * (1 - blend) + bottomColor * blend;
            
            data[topIdx + c] = blendedColor;
            data[bottomIdx + c] = blendedColor;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Enhance texture quality
 */
export async function enhanceTexture(imageUrl, options = {}) {
  const {
    brightness = 1.0,
    contrast = 1.0,
    saturation = 1.0,
    sharpen = false
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] *= brightness;
        data[i + 1] *= brightness;
        data[i + 2] *= brightness;
        
        data[i] = ((data[i] - 128) * contrast) + 128;
        data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
        data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
        
        if (saturation !== 1.0) {
          const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
          data[i] = gray + (data[i] - gray) * saturation;
          data[i + 1] = gray + (data[i + 1] - gray) * saturation;
          data[i + 2] = gray + (data[i + 2] - gray) * saturation;
        }
        
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Apply fabric texture overlay
 */
export async function applyFabricTexture(imageUrl, fabricUrl = null, opacity = 0.15) {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 10 * opacity;
          data[i] += noise;
          data[i + 1] += noise;
          data[i + 2] += noise;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    } catch (error) {
      reject(error);
    }
  });
}

export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
