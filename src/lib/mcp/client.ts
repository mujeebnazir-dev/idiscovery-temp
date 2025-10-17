import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ServerConfig } from './types';

export class MCPClient {
    private client: Client;
    private transport: StreamableHTTPClientTransport;
    private serverConfig: ServerConfig;
    connected = false;
    connecting = false;
    tools: Tool[] = [];
    resources: Resource[] = [];
    prompts: Prompt[] = [];

    constructor(config: ServerConfig) {
        this.serverConfig = config;

        this.client = new Client(
            { name: 'iDiscovery-mcp-client', version: '1.0.0' },
            { capabilities: {} }
        );

        this.transport = new StreamableHTTPClientTransport(new URL(this.serverConfig.url));
    }

    async connect(): Promise<void> {
        if (this.connected || this.connecting) return;

        this.connecting = true;
        try {
            // Add transport event handlers for debugging
            this.transport.onerror = (error: Error) => {
                console.error(`Transport error for ${this.serverConfig.name}:`, error);
            };

            this.transport.onclose = () => {
                console.log(`Transport closed for ${this.serverConfig.name}`);
                this.connected = false;
            };

            await this.client.connect(this.transport);

            this.connected = true;
            this.connecting = false;

            this.tools = await this.client.listTools().then(res => res.tools || []);
            this.resources = await this.client.listResources().then(res => res.resources || []);
            this.prompts = await this.client.listPrompts().then(res => res.prompts || []);

        } catch (error) {
            this.connected = false;
            this.connecting = false;

            try {
                await this.transport.close();
            } catch (cleanupError) {
                console.warn('Failed to cleanup transport after connection failure:', cleanupError);
            }

            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected && !this.connecting) return;

        try {
            await this.transport.close();
            console.log("Disconnected from", this.serverConfig.name);
        } catch (error) {
            console.error("Error disconnecting from", this.serverConfig.name, ":", error);
        } finally {
            this.connected = false;
            this.connecting = false;
        }
    }

    async callTool(name: string, args: any = {}): Promise<any> {
        if (!this.connected) {
            throw new Error("Not connected to " + this.serverConfig.name);
        }

        try {
            const result = await this.client.callTool({
                name,
                arguments: args
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    async readResource(uri: string): Promise<any> {
        if (!this.connected) {
            throw new Error("Not connected to " + this.serverConfig.name);
        }

        try {
            const result = await this.client.readResource({ uri });
            return result;
        } catch (error) {
            console.error("Failed to read resource", uri, "on", this.serverConfig.name, ":", error);
            throw error;
        }
    }

    get name(): string {
        return this.serverConfig.name;
    }

    get isConnected(): boolean {
        return this.connected;
    }

    getConnectionStatus(): { connected: boolean; connecting: boolean; url: string; name: string } {
        return {
            connected: this.connected,
            connecting: this.connecting,
            url: this.serverConfig.url,
            name: this.serverConfig.name,
        };
    }

    get serverCapabilities() {
        return this.client.getServerCapabilities();
    }

    get serverVersion() {
        return this.client.getServerVersion();
    }
}