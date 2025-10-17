import OpenAI from 'openai';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface OpenAIConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

export interface ToolCallResult {
    toolCallId: string;
    result: any;
}

export interface ChatCompletionRequest {
    messages: ChatMessage[];
    tools?: Tool[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface ChatCompletionResponse {
    message: string;
    toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Generic OpenAI service for chat completions
 * Provides minimal, reusable API wrapper without app-specific logic
 */
export class OpenAIService {
    private openai: OpenAI;
    private config: OpenAIConfig;

    constructor(config: OpenAIConfig) {
        this.config = config;
        this.openai = new OpenAI({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true // Required for browser usage
        });
    }

    /**
     * Primary method: Create chat completion with optional tool usage
     * This is the main method for all OpenAI interactions
     */
    async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        try {
            const messages = this.buildMessages(request);
            const tools = this.convertMCPToolsToOpenAI(request.tools || []);

            console.log('Creating OpenAI chat completion:', {
                messageCount: messages.length,
                toolCount: tools.length,
                model: this.config.model
            });

            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: messages,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: tools.length > 0 ? 'auto' : undefined,
                max_tokens: request.maxTokens || this.config.maxTokens,
                temperature: request.temperature || this.config.temperature
            });

            const choice = completion.choices[0];
            if (!choice) {
                throw new Error('No response from OpenAI');
            }

            return {
                message: choice.message.content || '',
                toolCalls: choice.message.tool_calls,
                finishReason: choice.finish_reason as any,
                usage: completion.usage ? {
                    promptTokens: completion.usage.prompt_tokens,
                    completionTokens: completion.usage.completion_tokens,
                    totalTokens: completion.usage.total_tokens
                } : undefined
            };
        } catch (error) {
            console.error('OpenAI chat completion failed:', error);
            throw error;
        }
    }

    /**
     * Build messages array with system prompt if provided
     */
    private buildMessages(request: ChatCompletionRequest): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

        // Add system message if provided
        if (request.systemPrompt) {
            messages.push({
                role: 'system',
                content: request.systemPrompt
            });
        }

        // Convert and add other messages
        for (const msg of request.messages) {
            if (msg.role === 'tool') {
                messages.push({
                    role: 'tool',
                    content: msg.content,
                    tool_call_id: msg.tool_call_id!
                });
            } else if (msg.role === 'assistant' && msg.tool_calls) {
                messages.push({
                    role: 'assistant',
                    content: msg.content || null,
                    tool_calls: msg.tool_calls
                });
            } else {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }

        return messages;
    }

    /**
     * Convert MCP tools to OpenAI tool format
     */
    private convertMCPToolsToOpenAI(mcpTools: Tool[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
        return mcpTools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description || '',
                parameters: tool.inputSchema || {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        }));
    }

    /**
     * Check if OpenAI service is configured and available
     */
    isConfigured(): boolean {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }

    /**
     * Get current configuration (without exposing API key)
     */
    getConfig(): Omit<OpenAIConfig, 'apiKey'> {
        return {
            model: this.config.model,
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature
        };
    }
}