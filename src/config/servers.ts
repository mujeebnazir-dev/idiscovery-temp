import * as fs from 'fs';
import * as path from 'path';
import { ServerConfig } from '../lib/mcp/types';

export interface ServersConfiguration {
    servers: ServerConfig[];
}

/**
 * Load servers configuration from JSON file
 */
export function loadServersConfig(): ServersConfiguration {
    try {
        const configPath = path.join(process.cwd(), 'src', 'config', 'servers.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        return config;
    } catch (error) {
        console.error('❌ Failed to load servers config:', error);
        return { servers: [] };
    }
}

/**
 * Get list of enabled servers
 */
export function getEnabledServers(): ServerConfig[] {
    const config = loadServersConfig();
    return config.servers.filter(server => server.enabled !== false);
}

/**
 * Get a specific server configuration by name
 */
export function getServerConfig(name: string): ServerConfig | undefined {
    const servers = getEnabledServers();
    return servers.find(server => server.name === name);
}

/**
 * Check if a server is configured and enabled
 */
export function isServerEnabled(name: string): boolean {
    const server = getServerConfig(name);
    return server !== undefined && server.enabled !== false;
}