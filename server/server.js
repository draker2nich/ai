/**
 * Backend proxy server for Custom OpenAI-compatible API
 * Handles CORS and provides a secure layer between frontend and API
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Default API base URL (can be overridden by client)
const DEFAULT_BASE_URL = 'https://api.aiguoguo199.com/v1';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
    message: 'Custom OpenAI proxy server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiBaseUrl: DEFAULT_BASE_URL
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Fashion Studio API Proxy (Custom OpenAI)',
    version: '2.0.0',
    apiProvider: 'aiguoguo199.com',
    endpoints: {
      health: '/health',
      generateImage: 'POST /api/generate',
      chat: 'POST /api/chat'
    }
  });
});

/**
 * POST /api/generate
 * Generate image using DALL-E via custom API
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      apiKey, 
      prompt, 
      size = '1024x1024', 
      quality = 'standard', 
      style = 'vivid',
      baseUrl = DEFAULT_BASE_URL 
    } = req.body;

    // Validate API key
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        message: 'Please provide your API key'
      });
    }

    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'Invalid API key format',
        message: 'API key should start with sk-'
      });
    }

    // Validate prompt
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Please specify the image prompt'
      });
    }

    console.log('📤 Generating image with DALL-E...');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Size: ${size}, Quality: ${quality}, Style: ${style}`);
    const startTime = Date.now();

    const apiUrl = `${baseUrl}/images/generations`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Fashion-Studio/2.0'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: style
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ Failed to generate image (${duration}ms):`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Image generated successfully (${duration}ms)`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error generating image:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/chat
 * Chat completion endpoint (for future use)
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      apiKey, 
      messages, 
      model = 'gpt-4o',
      baseUrl = DEFAULT_BASE_URL 
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        message: 'Please provide your API key'
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Messages array is required',
        message: 'Please provide a valid messages array'
      });
    }

    console.log('💬 Processing chat completion...');
    const startTime = Date.now();

    const apiUrl = `${baseUrl}/chat/completions`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Fashion-Studio/2.0'
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ Failed to complete chat (${duration}ms):`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Chat completed successfully (${duration}ms)`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error processing chat:', error);
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
      generate: 'POST /api/generate',
      chat: 'POST /api/chat'
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
  console.log('\n' + '='.repeat(70));
  console.log('🚀 AI Fashion Studio - Custom OpenAI Backend Proxy Server');
  console.log('='.repeat(70));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API info: http://localhost:${PORT}/api`);
  console.log(`🔗 API Base URL: ${DEFAULT_BASE_URL}`);
  console.log(`✅ CORS enabled for all origins`);
  console.log(`🔒 API keys handled securely`);
  console.log('='.repeat(70) + '\n');
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