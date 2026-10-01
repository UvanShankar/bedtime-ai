import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 8082;

const server = app.listen(PORT, () => {
  console.log(`[Generic AI Service] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

process.on('SIGTERM', () => {
  console.log('[Generic AI Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Generic AI Service] HTTP server closed');
  });
});
