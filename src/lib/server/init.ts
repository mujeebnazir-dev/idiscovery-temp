import { mcpService } from '@/services/mcpService';

/**
 * Initialize server-side services
 * This should be called once when the server starts
 */
export async function initializeServer(): Promise<void> {
  try {
    console.log('🚀 Starting server initialization...');
    
    // Initialize MCP service
    await mcpService.initialize();
    
    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    throw error;
  }
}

/**
 * Graceful shutdown of server services
 */
export async function shutdownServer(): Promise<void> {
  try {
    console.log('🔄 Starting graceful shutdown...');
    
    // Shutdown MCP service
    await mcpService.shutdown();
    
    console.log('✅ Graceful shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// Handle process termination signals
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('📡 Received SIGTERM signal');
    await shutdownServer();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('📡 Received SIGINT signal');
    await shutdownServer();
    process.exit(0);
  });

  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught exception:', error);
    await shutdownServer();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    await shutdownServer();
    process.exit(1);
  });
}