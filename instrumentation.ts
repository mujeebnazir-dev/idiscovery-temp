export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server starting - initializing services...');
    
    try {
      // Dynamic import to avoid loading client-side code on server
      const { initializeServer } = await import('@/lib/server/init');
      await initializeServer();
      
      console.log('✅ Server services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize server services:', error);
      // Don't throw here as it would prevent the server from starting
      // The services will be initialized lazily when needed
    }
  }
}