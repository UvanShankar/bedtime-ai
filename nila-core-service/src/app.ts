import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { authRoutes } from './routes/AuthRoutes';
import { parentRoutes } from './routes/ParentRoutes';
import { childRoutes } from './routes/ChildRoutes';
import { memoryRoutes } from './routes/MemoryRoutes';
import { voiceRoutes } from './routes/VoiceRoutes';
import { storyRoutes } from './routes/StoryRoutes';
import { errorHandler } from './exceptions';

const app = express();

// Global Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));
app.use(cookieParser());

// Health Check
app.get('/healthy', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'nila-core-service', timestamp: new Date().toISOString() });
});

// Application Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parent', parentRoutes);
app.use('/api/v1/children', childRoutes);
app.use('/api/v1/memories', memoryRoutes);
app.use('/api/v1/voices', voiceRoutes);
app.use('/api/v1/stories', storyRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
