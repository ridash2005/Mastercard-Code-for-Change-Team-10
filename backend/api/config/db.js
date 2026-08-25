const mongoose = require('mongoose');
const config = require('./index');

// Serverless (Vercel) invocations are short-lived and concurrent - a
// fire-and-forget connectDB() call at module load never gets awaited by
// anything, so a request can be served (and check isConnected/readyState)
// before the connection attempt has actually succeeded or failed. Cache the
// in-flight connection promise so every caller (the request middleware
// below, or a direct `await connectDB()`) observes the same attempt and
// waits for it to settle instead of racing it.
let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(config.mongoUri, {
      // Generous for a serverless cold start reaching a (possibly
      // cross-region) Atlas cluster - the previous 5s was tight enough to
      // fail spuriously on Vercel even with a correctly configured cluster.
      serverSelectionTimeoutMS: 15000,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        connectionPromise = null;
      });

      return conn;
    })
    .catch((error) => {
      console.error(`⚠️  MongoDB Connection Failed: ${error.message}`);
      if (error.reason) {
        console.error(
          '⚠️  MongoDB Connection Failed (reason detail):',
          require('util').inspect(error.reason, { depth: 6 })
        );
      }
      console.info(
        'ℹ️  Server is continuing in offline DB mode. Please set MONGO_URI in .env or start MongoDB locally.'
      );
      // Let the next request try again instead of being stuck offline for
      // this instance's whole lifetime.
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = { connectDB, getDBStatus };
