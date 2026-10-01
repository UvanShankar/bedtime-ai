import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`[Nila Core Service] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

process.on('SIGTERM', () => {
  console.log('[Nila Core Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Nila Core Service] HTTP server closed');
  });
});
