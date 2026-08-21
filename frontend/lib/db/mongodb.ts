import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongo = globalThis as typeof globalThis & { _mongoose?: Cache };

const cached: Cache = globalForMongo._mongoose ?? { conn: null, promise: null };
globalForMongo._mongoose = cached;

export async function connectMongo() {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Demo uses in-memory mock services instead.");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export function isMongoConfigured() {
  return Boolean(uri);
}
