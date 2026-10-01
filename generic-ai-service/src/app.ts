import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { textRoutes } from './routes/TextRoutes';
import { speechRoutes } from './routes/SpeechRoutes';
import { voiceRoutes } from './routes/VoiceRoutes';
import { jobRoutes } from './routes/JobRoutes';
import { errorHandler } from './exceptions';

const app = express();

// Global Middlewares
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: '*' }));

// Health Check
app.get('/healthy', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'generic-ai-service', timestamp: new Date().toISOString() });
});

// Secure API Routes with API Key authentication
app.use(apiKeyAuth);

app.use('/api/v1/ai/text', textRoutes);
app.use('/api/v1/ai/speech', speechRoutes);
app.use('/api/v1/ai/voice', voiceRoutes);
app.use('/api/v1/ai/jobs', jobRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
