/**
 * Backend proxy server for Replicate API
 * Handles CORS and provides a secure layer between frontend and Replicate
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Fashion Studio API Proxy',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createPrediction: 'POST /api/predictions',
      getPrediction: 'GET /api/predictions/:id',
      cancelPrediction: 'POST /api/cancel/:id'
    }
  });
});

/**
 * POST /api/predictions
 * Create a new prediction (generate image)
 */
app.post('/api/predictions', async (req, res) => {
  try {
    const { apiKey, ...body } = req.body;

    // Validate API key
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        message: 'Please provide your Replicate API key'
      });
    }

    if (!apiKey.startsWith('r8_')) {
      return res.status(400).json({ 
        error: 'Invalid API key format',
        message: 'API key should start with r8_'
      });
    }

    // Validate request body
    if (!body.version) {
      return res.status(400).json({ 
        error: 'Model version is required',
        message: 'Please specify the model version'
      });
    }

    console.log('📤 Creating prediction...');
    const startTime = Date.now();

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Fashion-Studio/1.0'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ Failed to create prediction (${duration}ms):`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Prediction created: ${data.id} (${duration}ms)`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error creating prediction:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/predictions/:id
 * Get prediction status
 */
app.get('/api/predictions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        message: 'Please provide API key in x-api-key header' 
      });
    }

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'User-Agent': 'AI-Fashion-Studio/1.0'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Failed to get prediction ${id}:`, data);
      return res.status(response.status).json(data);
    }

    // Log status updates for completed predictions
    if (data.status === 'succeeded') {
      console.log(`✅ Prediction ${id} completed`);
    } else if (data.status === 'failed') {
      console.error(`❌ Prediction ${id} failed:`, data.error);
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Error getting prediction:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

/**
 * POST /api/cancel/:id
 * Cancel a prediction
 */
app.post('/api/cancel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        message: 'Please provide API key in x-api-key header' 
      });
    }

    console.log(`🛑 Canceling prediction ${id}...`);

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'User-Agent': 'AI-Fashion-Studio/1.0'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Failed to cancel prediction ${id}:`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Prediction ${id} canceled`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error canceling prediction:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      health: 'GET /health',
      api: 'GET /api',
      predictions: {
        create: 'POST /api/predictions',
        get: 'GET /api/predictions/:id',
        cancel: 'POST /api/cancel/:id'
      }
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 AI Fashion Studio - Backend Proxy Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API info: http://localhost:${PORT}/api`);
  console.log(`✅ CORS enabled for all origins`);
  console.log(`🔒 API keys handled securely`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
