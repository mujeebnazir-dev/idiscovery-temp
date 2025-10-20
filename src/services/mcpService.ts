import { MCPClientManager } from '@/lib/mcp/clientManager';
import { OpenAIConfig } from '@/services/openai';

/**
 * Singleton service for managing MCP client connections
 */
class MCPService {
  private static instance: MCPService | null = null;
  private clientManager: MCPClientManager | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Initialize the MCP client manager
   */
  async initialize(): Promise<MCPClientManager> {
    if (this.isInitialized && this.clientManager) {
      return this.clientManager;
    }

    try {
      const openaiConfig: OpenAIConfig = {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7")
      };

      if (!openaiConfig.apiKey) {
        console.warn('⚠️ OPENAI_API_KEY required');
      }

      this.clientManager = new MCPClientManager(openaiConfig);
      await this.clientManager.initialize();
      
      this.isInitialized = true;
      console.log('✅ MCP Service initialized successfully');
      
      return this.clientManager!;
    } catch (error) {
      console.error('❌ Failed to initialize MCP Service:', error);
      this.isInitialized = false;
      this.clientManager = null;
      throw error;
    }
  }

  /**
   * Get the client manager instance
   */
  getClientManager(): MCPClientManager {
    if (!this.isInitialized || !this.clientManager) {
      throw new Error('MCP Service not initialized. Call initialize() first.');
    }
    return this.clientManager;
  }

  /**
   * Check if the service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status and server info
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      serverInfo: this.clientManager?.getServerInfo() || [],
      connectedCount: this.clientManager?.getServerInfo().filter(s => s.connected).length || 0
    };
  }

  /**
   * Shutdown the service and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.clientManager) {
      await this.clientManager.shutdown();
      this.clientManager = null;
      this.isInitialized = false;
      console.log('✅ MCP Service shutdown complete');
    }
  }

  /**
   * Force re-initialization (useful for configuration changes)
   */
  async reinitialize(): Promise<MCPClientManager> {
    await this.shutdown();
    return await this.initialize();
  }
}

export const mcpService = MCPService.getInstance();
export { MCPService };