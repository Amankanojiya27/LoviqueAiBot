// File: server/src/config/database.ts
import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  const connection = await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};
