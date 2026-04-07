// File: server/src/server.ts
import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import dns from 'node:dns/promises';

const startServer = async () => {

  if (process.env.NODE_ENV === "development") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Server is running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
