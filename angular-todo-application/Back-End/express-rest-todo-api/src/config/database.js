const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database configuration options
 */
const dbConfig = {
  // MongoDB connection URI
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp',
  
  // Mongoose connection options
  options: {
    // Use new URL parser
    useNewUrlParser: true,
    
    // Use new Server Discovery and Monitoring engine
    useUnifiedTopology: true,
    
    // Buffer commands when disconnected
    bufferCommands: true,
    
    // Buffer max entries
    bufferMaxEntries: 0,
    
    // Connection timeout
    connectTimeoutMS: 30000,
    
    // Socket timeout
    socketTimeoutMS: 45000,
    
    // Server selection timeout
    serverSelectionTimeoutMS: 5000,
    
    // Heartbeat frequency
    heartbeatFrequencyMS: 10000,
    
    // Max pool size
    maxPoolSize: 10,
    
    // Min pool size
    minPoolSize: 5,
    
    // Max idle time
    maxIdleTimeMS: 30000,
    
    // Retry writes
    retryWrites: true,
    
    // Write concern
    w: 'majority',
    
    // Journal
    journal: true,
    
    // Read preference
    readPreference: 'primaryPreferred',
    
    // Auto index
    autoIndex: process.env.NODE_ENV !== 'production'
  },
  
  // Database name
  dbName: process.env.DB_NAME || 'todoapp',
  
  // Environment specific settings
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp_dev',
    debug: true,
    autoIndex: true
  },
  
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/todoapp_test',
    debug: false,
    autoIndex: true
  },
  
  production: {
    uri: process.env.MONGODB_URI,
    debug: false,
    autoIndex: false,
    options: {
      maxPoolSize: 20,
      minPoolSize: 10,
      maxIdleTimeMS: 60000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000
    }
  }
};

/**
 * Get environment-specific database configuration
 * @returns {Object} Database configuration for current environment
 */
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = dbConfig[env] || {};
  
  return {
    uri: envConfig.uri || dbConfig.uri,
    options: {
      ...dbConfig.options,
      ...(envConfig.options || {})
    },
    debug: envConfig.debug !== undefined ? envConfig.debug : false,
    autoIndex: envConfig.autoIndex !== undefined ? envConfig.autoIndex : true
  };
};

/**
 * Connect to MongoDB database
 * @returns {Promise} Promise that resolves when connected
 */
const connectDatabase = async () => {
  try {
    const config = getDbConfig();
    
    // Enable debug mode if specified
    if (config.debug) {
      mongoose.set('debug', true);
    }
    
    // Set auto index
    mongoose.set('autoIndex', config.autoIndex);
    
    logger.info('🔌 Connecting to MongoDB...');
    logger.info(`📍 Database URI: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Connect to MongoDB
    await mongoose.connect(config.uri, config.options);
    
    logger.info('✅ MongoDB connected successfully');
    logger.info(`📊 Database: ${mongoose.connection.name}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    return mongoose.connection;
    
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    
    // Exit process on connection failure
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise} Promise that resolves when disconnected
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('❌ MongoDB disconnection error:', error.message);
    throw error;
  }
};

/**
 * Setup database event listeners
 */
const setupDatabaseEvents = () => {
  const db = mongoose.connection;
  
  // Connection events
  db.on('connected', () => {
    logger.info('🔗 Mongoose connected to MongoDB');
  });
  
  db.on('error', (error) => {
    logger.error('❌ Mongoose connection error:', error);
  });
  
  db.on('disconnected', () => {
    logger.warn('⚠️  Mongoose disconnected from MongoDB');
  });
  
  db.on('reconnected', () => {
    logger.info('🔄 Mongoose reconnected to MongoDB');
  });
  
  db.on('close', () => {
    logger.info('🔒 Mongoose connection closed');
  });
  
  // Application termination events
  process.on('SIGINT', async () => {
    await db.close();
    logger.info('👋 Mongoose connection closed through app termination');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await db.close();
    logger.info('👋 Mongoose connection closed through app termination');
    process.exit(0);
  });
};

/**
 * Get database connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections)
  };
};

/**
 * Initialize database connection and setup
 * @returns {Promise} Promise that resolves when database is ready
 */
const initializeDatabase = async () => {
  try {
    // Setup event listeners
    setupDatabaseEvents();
    
    // Connect to database
    await connectDatabase();
    
    // Log connection status
    const status = getConnectionStatus();
    logger.info('📈 Database Status:', status);
    
    return mongoose.connection;
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

/**
 * Create database indexes
 * @returns {Promise} Promise that resolves when indexes are created
 */
const createIndexes = async () => {
  try {
    logger.info('🔍 Creating database indexes...');
    
    // Get all models
    const models = mongoose.modelNames();
    
    // Create indexes for each model
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      await model.createIndexes();
      logger.info(`✅ Indexes created for ${modelName}`);
    }
    
    logger.info('🔍 All database indexes created successfully');
    
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error.message);
    throw error;
  }
};

/**
 * Drop database (use with caution!)
 * @returns {Promise} Promise that resolves when database is dropped
 */
const dropDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }
    
    logger.warn('⚠️  Dropping database...');
    await mongoose.connection.dropDatabase();
    logger.info('✅ Database dropped successfully');
    
  } catch (error) {
    logger.error('❌ Error dropping database:', error.message);
    throw error;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      database: stats.db,
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    };
  } catch (error) {
    logger.error('❌ Error getting database statistics:', error.message);
    throw error;
  }
};

module.exports = {
  dbConfig,
  getDbConfig,
  connectDatabase,
  disconnectDatabase,
  initializeDatabase,
  setupDatabaseEvents,
  getConnectionStatus,
  createIndexes,
  dropDatabase,
  getDatabaseStats
};