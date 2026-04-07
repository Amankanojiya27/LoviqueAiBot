// File: server/src/app.ts
import cors, { CorsOptions } from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import authRoutes from './modules/auth/auth.routes';
import chatRoutes from './modules/chat/chat.routes';

const app = express();
const allowedOrigins = new Set(env.clientOrigins);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lovique API is running.',
    data: {
      version: 'v1',
    },
  });
});

const sendHealthResponse = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: 'Lovique API is awake and ready.',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
};

app.get('/api/health', sendHealthResponse);
app.get('/api/v1/health', sendHealthResponse);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
