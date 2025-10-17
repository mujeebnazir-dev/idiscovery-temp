import { MCPClient } from './client';
import { ServerConfig, ConversationContext, WorkflowExecution } from './types';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OpenAIService, OpenAIConfig } from '../../services/openai';

export class MCPClientManager {
    private clients = new Map<string, MCPClient>();
    private servers: ServerConfig[] = [];
    private initialized = false;
    private openaiService?: OpenAIService;

    private conversationHistory: ConversationContext = {
        keyValuePairs: {},
        textTokens: [],
        recentQueries: [],
        sessionMetadata: {
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            queryCount: 0,
            totalTokens: 0
        }
    };

    constructor(openaiConfig?: OpenAIConfig) {
        if (openaiConfig && openaiConfig.apiKey) {
            this.openaiService = new OpenAIService(openaiConfig);
            console.log('MCPClientManager initialized with OpenAI service');
        } else {
            console.log('MCPClientManager initialized without OpenAI service');
        }
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            const response = await fetch('/servers.json');
            console.log('Fetching servers.json configuration');
            if (response.ok) {
                const configData = await response.json();
                this.servers = configData.servers || [];
                const enabledServers = this.servers.filter(s => s.enabled);

                for (const serverConfig of enabledServers) {
                    const client = new MCPClient(serverConfig);
                    await client.connect();
                    this.clients.set(serverConfig.name, client);
                }

                this.initialized = true;
                console.log('MCPClientManager initialized with servers:', this.servers.map(s => s.name));
            } else {
                throw new Error(`Failed to fetch servers.json: ${response.status}`);
            }
        } catch (error) {
            console.warn('Could not load servers config file', error);
            this.initialized = false;
        }
    }

    getConnectedClients(): MCPClient[] {
        const allClients = Array.from(this.clients.values());
        const connectedClients = allClients.filter(client => {
            const isConnected = client.isConnected;
            return isConnected;
        });

        return connectedClients;
    }

    getAllClients(): MCPClient[] {
        return Array.from(this.clients.values());
    }

    async getAvailableTools(): Promise<Record<string, any>> {
        const tools: Record<string, any> = {};

        for (const client of this.getConnectedClients()) {
            try {
                const clientTools = client.tools;
                if (clientTools && clientTools.length > 0) {
                    tools[client.name] = clientTools;
                }
            } catch (error) {
                console.error(`Failed to get tools from ${client.name}:`, error);
            }
        }

        console.log('Available tools from connected clients:', tools);
        return tools;
    }

    async getAvailableResources(): Promise<Record<string, any>> {
        const resources: Record<string, any> = {};

        for (const client of this.getConnectedClients()) {
            try {
                const clientResources = client.resources;
                if (clientResources && clientResources.length > 0) {
                    resources[client.name] = clientResources;
                }
            } catch (error) {
                console.error(`Failed to get resources from ${client.name}:`, error);
            }
        }

        return resources;
    }

    async callTool(serverName: string, toolName: string, args: any): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`No client found for server: ${serverName}`);
        }

        if (!client.isConnected) {
            throw new Error(`Client for ${serverName} is not connected`);
        }

        return await client.callTool(toolName, args);
    }

    async readResource(serverName: string, uri: string): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`No client found for server: ${serverName}`);
        }

        if (!client.isConnected) {
            throw new Error(`Client for ${serverName} is not connected`);
        }

        return await client.readResource(uri);
    }

    getClient(serverName: string): MCPClient | undefined {
        return this.clients.get(serverName);
    }

    hasAnyConnectedClients(): boolean {
        return this.getConnectedClients().length > 0;
    }

    getServerInfo(): Array<{ name: string, url: string, connected: boolean }> {
        return this.servers.map(server => {
            const client = this.clients.get(server.name);
            return {
                name: server.name,
                url: server.url,
                connected: client ? client.isConnected : false
            };
        });
    }

    async processQuery(
        query: string,
        onStepUpdate?: (update: {
            type: 'step_start' | 'step_update' | 'step_complete' | 'step_error' | 'estimation_update';
            stepNumber: number;
            data?: any;
            error?: string;
        }) => void,
        onInitialResponse?: (initialResponse: string) => void
    ): Promise<{
        workflow?: WorkflowExecution;
        response?: any;
        isWorkflow: boolean;
    }> {
        console.log('🔄 Processing query with workflow support:', query);

        const connectedClients = this.getConnectedClients();
        if (connectedClients.length === 0) {
            throw new Error('No connected MCP clients available');
        }

        if (!this.openaiService || !this.openaiService.isConfigured()) {
            return {
                isWorkflow: false,
                response: {
                    success: false,
                    content: [],
                    isError: true,
                    aiResponse: "OpenAI integration is required for intelligent request processing."
                }
            };
        }

        // Check if this is a conversational query vs analytical query
        const isConversationalQuery = this.isConversationalQuery(query);

        if (isConversationalQuery) {
            return {
                isWorkflow: false,
                response: {
                    success: true,
                    content: [],
                    aiResponse: this.getConversationalResponse(query),
                    isConversational: true
                }
            };
        }

        // Use recursive intelligent tool selection for analytical queries
        console.log('🚀 Starting recursive tool selection for analytical query');

        try {
            // Build available tools list for estimation
            const allTools: Tool[] = [];
            connectedClients.forEach(client => {
                client.tools.forEach(tool => {
                    allTools.push({
                        ...tool,
                        serverName: client.name
                    });
                });
            });
            // Generate initial step estimation and initial response
            console.log('📋 Generating initial step estimation...');
            const initialEstimation = await this.generateInitialStepEstimation(query, allTools);
            console.log("ALL TOOLS:", allTools.map(t => t.name));
            console.log('📋 Initial estimation:', initialEstimation);

            // Send initial response to UI
            if (onInitialResponse && initialEstimation.initialResponse) {
                onInitialResponse(initialEstimation.initialResponse);
            }

            const result = await this.executeRecursiveToolSelection(
                query,
                initialEstimation.steps, // Pass initial step estimation
                allTools, // Pass tools list
                connectedClients,
                [], // Start with no executed results
                1, // Start at step 1
                10, // Max 10 steps
                Date.now(), // Start time
                onStepUpdate, // Pass the callback
                undefined // No retry context for initial call
            );

            return {
                isWorkflow: true,
                response: {
                    success: !result.isError,
                    content: result?.content,
                    isError: result.isError,
                    aiResponse: result.aiResponse,
                    executionSummary: result.executionSummary,
                    totalSteps: result.totalSteps,
                    completionReason: result.completionReason,
                    visualizations: result.visualizations || [],
                    suggestions: result.suggestions || []
                }
            };
        } catch (error) {
            console.error('❌ Error in recursive tool selection:', error);
            return {
                isWorkflow: false,
                response: {
                    success: false,
                    isError: true,
                    aiResponse: `I encountered an error while processing your request: ${error}`
                }
            };
        }
    }

    /**
     * Check if a query is conversational and doesn't need tool usage
     */
    private isConversationalQuery(query: string): boolean {
        const conversationalPatterns = [
            // Greetings
            /^(hi|hello|hey|good morning|good afternoon|good evening)[\s\W]*$/i,
            // Help requests
            /^(help|what can you do|how do you work|what are you)[\s\W]*$/i,
            // General conversation
            /^(how are you|thanks|thank you|goodbye|bye|who are you)[\s\W]*$/i,
            // Simple questions about the assistant
            /^(what is this|what's this|tell me about yourself)[\s\W]*$/i,
            // Confirmation responses (but treat them specially)
            /^(yes|no|confirm|proceed|continue|go ahead|sample)[\s\W]*$/i,
            /^(limit|first|top)\s+\d+[\s\W]*$/i
        ];

        return conversationalPatterns.some(pattern => pattern.test(query.trim()));
    }

    /**
     * Generate appropriate conversational response
     */
    private getConversationalResponse(query: string): string {
        // Check if this is a confirmation response to a previous large data operation
        if (this.isConfirmationResponse(query)) {
            return "I understand you want to proceed with the operation. Please provide more context about what you'd like me to do.";
        }

        // Generate appropriate conversational responses
        if (query.match(/^(hi|hello|hey)/)) {
            return "Hello! I'm your intelligent data assistant. I can help you query databases, create visualizations like tables and charts, and analyze your data. What would you like to explore today?";
        } else if (query.match(/^(help|what can you do)/)) {
            return "I can help you with several things:\n\n• **Data Queries**: Ask me to show tables, fetch data, or run database queries\n• **Visualizations**: Create charts, graphs, and visual representations of your data\n• **Analysis**: Process and analyze information to give you insights\n\nJust ask me something like 'show me a table' or 'create a chart' and I'll get started!";
        } else if (query.match(/^(how are you|thanks|thank you)/)) {
            return query.includes('thank') ?
                "You're welcome! I'm here whenever you need help with data analysis or visualizations." :
                "I'm doing great and ready to help you with your data! What would you like to work on?";
        } else if (query.match(/^(who are you|what is this|tell me about)/)) {
            return "I'm an intelligent data assistant powered by AI. I can connect to various data sources, run queries, and create visualizations to help you understand your data better. I'm designed to make data analysis simple and interactive.";
        } else if (query.match(/^(goodbye|bye)/)) {
            return "Goodbye! Feel free to come back anytime you need help with data analysis or visualizations.";
        } else {
            // Fallback for other conversational queries
            return "I'm here to help you with data analysis and visualizations. You can ask me to show tables, create charts, or analyze your data. What would you like to do?";
        }
    }

    /**
     * Generate initial step estimation and initial response for the user's request
     */
    private async generateInitialStepEstimation(
        userPrompt: string,
        allTools: Tool[]
    ): Promise<{
        steps: any[];
        initialResponse: string;
    }> {
        const toolDescriptions = allTools.map(tool => {
            let description = `- ${tool.name}: ${tool.description || 'No description available'}`;

            if (tool.inputSchema && tool.inputSchema.properties) {
                const properties = Object.entries(tool.inputSchema.properties).map(([key, value]: [string, any]) => {
                    const required = tool.inputSchema.required?.includes(key) ? ' (required)' : '';
                    const type = value.type || 'unknown';
                    const desc = value.description ? ` - ${value.description}` : '';
                    return `    ${key}: ${type}${required}${desc}`;
                }).join('\n');

                description += `\n  Parameters:\n${properties}`;
            }

            return description;
        }).join('\n\n');

        const systemPrompt = `You are a strategic step planner. Create a rough estimation of steps needed to fulfill the user's request AND provide a friendly initial response.

USER REQUEST: ${userPrompt}

AVAILABLE TOOLS:
${toolDescriptions}

TASK: 
1. Create an estimated step-by-step plan to accomplish the user's request
2. Generate a friendly initial response acknowledging the request

STEP PLANNING PRINCIPLES:
1. Start with discovery if you need to understand available resources
2. Use appropriate tools only from available tools based on their descriptions and capabilities for discovery and data gathering
2. Move to focused data gathering based on discoveries
3. Process/analyze data if needed
4. Present final results

RESPONSE FORMAT:
Respond with a JSON object containing both the initial response and estimated steps:
{
  "initialResponse": "A friendly acknowledgment of the user's request, mentioning what you're about to do (e.g., 'I'll help you analyze the data by first exploring what's available...')",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title",
      "description": "What this step aims to accomplish",
      "estimatedTool": "tool_name",
      "arguments": { "param1": "value1", "param2": "value2" } || {},
      "reasoning": "Why this step is needed"
    }
  ]
}

GUIDELINES:
- Initial response should be warm, professional, and show understanding of the request
- Be realistic about step count (usually 1-6 steps)
- Each step should have a clear purpose 
- Steps should build logically upon each other
- Don't be too specific - this is an estimation that will be refined, only first step must be very accurate in terms of estimatedTool and arguments
- Consider what information you need to gather first vs. what you can do immediately
- Important: Estimated tool can only be from available tools
- If no appropriate tool available at any step and you have some data, plan to analyze/present based on that data
- If no tools are appropriate at all, plan a single step to inform the user you cannot fulfill the request
- Never assume any resources or data exist without first discovering them
- If the request is very simple, plan a single step using the most relevant tool
- First step (stepNumber=1) should be very accurate according to the estimated tool, as that will be executed directly and should not fail on tool call
- Next steps can be more flexible as they will be refined later
- The final response must be in line with the user's request

Examples:
- Simple query: 1-2 steps (direct tool usage)
- Discovery request: 2-3 steps (discover → describe → summarize)
- Complex analysis: 3-5 steps (discover → gather → analyze → present)
- Cross-system operation: 4-6 steps (identify sources → gather from each → combine → analyze);

CRITICAL RULES:
- Don't invent tool names or capabilities, just don't assume anything
- Use ONLY tools from the AVAILABLE TOOLS list
- Return ONLY valid JSON
- NO comments (// or /* */) anywhere in JSON
- NO trailing commas
- Use double quotes for all strings
- Arguments must be valid JSON object
- First step must be very accurate in terms of estimatedTool and arguments`;

        try {
            const response = await this.openaiService!.chatCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Create step estimation and initial response for: "${userPrompt}"` }
                ],
                maxTokens: 1200,
                temperature: 0.3
            });

            // Clean the response
            let cleanedResponse = response.message.trim();
            cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');

            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

            // const jsonMatch = response.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let jsonString = jsonMatch[0];

                // Clean JSON
                jsonString = jsonString
                    .replace(/\/\/.*$/gm, '')
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/,(\s*[}\]])/g, '$1');
                const parsed = JSON.parse(jsonString);
                return {
                    steps: parsed.steps || [],
                    initialResponse: parsed.initialResponse || "I'll help you with that request."
                };
            }

            throw new Error('Could not parse JSON from AI response');
        } catch (error) {
            console.error('Failed to generate initial step estimation:', error);
            return {
                steps: [],
                initialResponse: "I couldn't fully understand your request. Please provide more details."
            };
        }
    }

    /**
     * Recursive intelligent tool execution method with dynamic step estimation
     * Uses continuously refined step estimation to guide execution
     */
    private async executeRecursiveToolSelection(
        userPrompt: string,
        estimatedSteps: any[],
        allTools: Tool[],
        clients: MCPClient[],
        executedResults: any[] = [],
        currentStep: number = 1,
        maxSteps: number = 10,
        startTime: number = Date.now(),
        onStepUpdate?: (update: {
            type: 'step_start' | 'step_complete' | 'step_error' | 'estimation_update';
            stepNumber: number;
            stepData?: any;
            estimatedSteps?: any[];
            error?: string;
        }) => void,
        retryContext?: {
            isRetry: boolean;
            errorMessage: string;
            originalDecision: any;
            attemptNumber: number;
            lastSuccessfulResult?: any;
        }
    ): Promise<any> {
        const maxExecutionTime = 120000; // 2 minutes max
        const timeElapsed = Date.now() - startTime;

        // 1. Check for max steps
        if (currentStep > maxSteps) {
            console.log(`🔄 Stopping execution: Maximum steps (${maxSteps}) reached`);
            return this.formatFinalResponse(executedResults, 'max_steps_reached', estimatedSteps);
        }

        // 2. Check for max execution time
        if (timeElapsed > maxExecutionTime) {
            console.log(`⏰ Stopping execution: Maximum time (${maxExecutionTime}ms) reached`);
            return this.formatFinalResponse(executedResults, 'timeout', estimatedSteps);
        }

        // 3. Get current step estimation
        if (estimatedSteps.length === 0) {
            console.log('❌ No estimated steps available to guide execution');
            return this.formatFinalResponse(executedResults, 'no_estimation', estimatedSteps);
        }

        const toolToClientMap = new Map<string, MCPClient>();
        clients.forEach(client => {
            client.tools.forEach(tool => {
                toolToClientMap.set(tool.name, client);
            });
        });

        const currentStepEstimation = estimatedSteps.find(step => step.stepNumber === currentStep);
        if (!currentStepEstimation) {
            // No step estimation for this step, treat as done
            return this.formatFinalResponse(executedResults, 'no_estimation', estimatedSteps);
        }

        // handle failed retry context
        if (retryContext?.isRetry) {
            console.log(`🔄 Retrying step ${currentStep} due to error: ${retryContext.errorMessage}`);
            const maxRetries = 2;
            if (retryContext.attemptNumber > maxRetries) {
                console.log(`❌ Max retries reached for step ${currentStep}. Aborting.`);
                return this.formatFinalResponse(executedResults, 'max_retries', estimatedSteps);
            }

        }

        // 4. If retry, emit step_start with retry info
        onStepUpdate?.({
            type: 'step_start',
            stepNumber: currentStep,
            stepData: {
                title: currentStepEstimation?.title || `Step ${currentStep}`,
                description: retryContext ? `${currentStepEstimation?.description || 'Processing...'} (Retry attempt ${retryContext.attemptNumber})` : (currentStepEstimation?.description || 'Processing...'),
                estimatedTool: currentStepEstimation?.estimatedTool,
                tool: currentStepEstimation?.estimatedTool,
                arguments: currentStepEstimation?.arguments,
                status: 'running',
                isRetry: !!retryContext,
                retryAttempt: retryContext?.attemptNumber
            },
        });

        // 5. Execute the tool
        const selectedClient = toolToClientMap.get(currentStepEstimation.estimatedTool); // initial step estimation's reponsibility to make available estimatedTool for first step
        if (!selectedClient) {
            console.error(`❌ Tool ${currentStepEstimation.estimatedTool} not found in available clients`);
            onStepUpdate?.({
                type: 'step_error',
                stepNumber: currentStep,
                stepData: {
                    title: currentStepEstimation?.title || `Step ${currentStep}`,
                    description: currentStepEstimation?.description || 'Tool execution failed',
                    estimatedTool: currentStepEstimation?.estimatedTool,
                    tool: currentStepEstimation?.estimatedTool,
                    arguments: currentStepEstimation?.arguments,
                    status: 'error',
                    reasoning: currentStepEstimation?.reasoning || 'AI selected this tool but it was not found',
                    result: `Error: Tool ${currentStepEstimation?.estimatedTool} not found in available clients`
                },
                error: `Tool ${currentStepEstimation?.estimatedTool} not found`
            });
            return this.formatFinalResponse(executedResults, 'tool_not_found', estimatedSteps);
        }

        let toolResult;
        try {
            toolResult = await selectedClient.callTool(currentStepEstimation.estimatedTool, currentStepEstimation.arguments);
            console.log(`✅ Step ${currentStep} executed using tool ${currentStepEstimation.estimatedTool}`);
            console.log('Tool result:', toolResult);
        } catch (toolError) {
            // Emit error event with all context
            onStepUpdate?.({
                type: 'step_error',
                stepNumber: currentStep,
                stepData: {
                    title: currentStepEstimation?.title || `Step ${currentStep}`,
                    description: currentStepEstimation?.description || 'Tool execution failed',
                    estimatedTool: currentStepEstimation?.estimatedTool,
                    tool: currentStepEstimation?.estimatedTool,
                    arguments: currentStepEstimation?.arguments,
                    status: 'error',
                    reasoning: currentStepEstimation?.reasoning || 'Tool execution failed',
                    result: toolError instanceof Error ? toolError.message : String(toolError)
                },
                error: toolError instanceof Error ? toolError.message : String(toolError)
            });
            // Retry logic
            const maxRetries = 2;
            const currentAttempt = retryContext?.attemptNumber || 1;
            if (currentAttempt < maxRetries && this.shouldRetryStep(toolError)) {
                const newRetryContext = {
                    isRetry: true,
                    errorMessage: toolError instanceof Error ? toolError.message : String(toolError),
                    originalDecision: {
                        toolName: currentStepEstimation.estimatedTool,
                        arguments: currentStepEstimation.arguments,
                        reasoning: currentStepEstimation.reasoning
                    },
                    attemptNumber: currentAttempt + 1
                };
                return await this.executeRecursiveToolSelection(
                    userPrompt,
                    estimatedSteps,
                    allTools,
                    clients,
                    executedResults,
                    currentStep,
                    maxSteps,
                    startTime,
                    onStepUpdate,
                    newRetryContext
                );
            } else {
                return this.formatFinalResponse(executedResults, 'error', estimatedSteps, toolError);
            }
        }

        // 6. Add this step's result to executed results
        const stepResult = {
            step: currentStep,
            toolName: currentStepEstimation.estimatedTool,
            arguments: currentStepEstimation.arguments,
            result: toolResult,
            reasoning: currentStepEstimation.reasoning,
            timestamp: new Date().toISOString()
        };
        const updatedResults = [...executedResults, stepResult];

        // IMPORTANT: Update the completed step in estimatedSteps with the actual result
        const updatedEstimatedSteps = estimatedSteps.map(step => {
            if (step.stepNumber === currentStep) {
                return { ...step, result: toolResult, completed: true };
            }
            return step;
        });
        // 7. Emit step_complete with all relevant data
        const resultId = `result-${Date.now()}-${currentStep}`;
        onStepUpdate?.({
            type: 'step_complete',
            stepNumber: currentStep,
            stepData: {
                title: currentStepEstimation?.title || `Step ${currentStep}`,
                description: currentStepEstimation?.description || 'Processing completed',
                estimatedTool: currentStepEstimation?.estimatedTool,
                tool: currentStepEstimation?.estimatedTool,
                arguments: currentStepEstimation.arguments,
                status: 'completed',
                reasoning: currentStepEstimation.reasoning,
                result: this.summarizeToolResult(toolResult),
                fullResult: toolResult,
                resultId
            }
        });

        // 8. Check if this result satisfies the user's requirement
        const satisfactionCheck = await this.checkRequirementSatisfaction(userPrompt, updatedResults);
        if (satisfactionCheck.satisfied) {
            return this.formatFinalResponse(updatedResults, 'satisfied', estimatedSteps, satisfactionCheck.answer);
        }

        // 9. Refine step estimation
        let refinedEstimation = await this.refineStepEstimation(
            userPrompt,
            currentStep,
            toolResult,
            allTools,
            updatedEstimatedSteps
        );

        // ✅ Better approach:
        refinedEstimation = [...updatedEstimatedSteps.slice(0, currentStep), ...refinedEstimation];
        onStepUpdate?.({
            type: 'estimation_update',
            stepNumber: currentStep + 1,
            estimatedSteps: refinedEstimation
        });

        // 10. Recurse to next step
        return await this.executeRecursiveToolSelection(
            userPrompt,
            refinedEstimation,
            allTools,
            clients,
            updatedResults,
            currentStep + 1,
            maxSteps,
            startTime,
            onStepUpdate,
            undefined
        );
    }

    /**
     * Refine step estimation based on current progress and results
     */
    //     private async refineStepEstimation(
    //         userPrompt: string,
    //         currentStep: number,
    //         lastResult: any,
    //         allTools: Tool[],
    //         previousEstimation: any[]
    //     ): Promise<any[]> {
    //         const toolDescriptions = allTools.map(t => `${t.name} (${t.description})`).join(', ');

    //         const systemPrompt = `You are refining a step estimation based on current progress.

    // ORIGINAL USER REQUEST: ${userPrompt}

    // CURRENT STEP: ${currentStep}

    // PREVIOUS ESTIMATION:
    // ${previousEstimation.map(step => `Step ${step.stepNumber}: ${step.title} - ${step.description}`).join('\n')}

    // LAST STEP RESULT SUMMARY:
    // ${this.summarizeToolResult(lastResult)}

    // AVAILABLE TOOLS: ${toolDescriptions}

    // TASK: Based on the progress made, refine the remaining steps (from step ${currentStep + 1} onward).

    // CONSIDERATIONS:
    // - What has been accomplished so far?
    // - What information do we now have that we didn't have before?
    // - Do we need fewer or more steps than originally estimated?
    // - Should we change the approach based on what we learned?

    // RESPONSE FORMAT:
    // Respond with a JSON array of remaining steps:
    // [
    //   {
    //     "stepNumber": ${currentStep + 1},
    //     "title": "Next Step Title",
    //     "description": "What this step should accomplish",
    //     "estimatedTool": "tool_name",
    //     "arguments": { "param1": "value1", "param2": "value2" } || {},
    //     "reasoning": "Why this step is needed based on current progress"
    //   },
    //   ...
    // ]

    // GUIDELINES:
    // - Only include steps from ${currentStep + 1} onward
    // - Adjust based on what we've learned
    // - If user requirement might already be satisfied, estimate fewer/no remaining steps
    // - Be adaptive - use the new information to improve the plan;

    // CRITICAL RULES:
    // - Return ONLY valid JSON array
    // - NO comments (// or /* */) in JSON
    // - NO trailing commas
    // - Use double quotes for all strings
    // - If estimatedTool is empty, use empty string ""
    // - Arguments must be valid JSON object
    // - Only include steps from ${currentStep + 1} onward
    // - Adjust based on what we've learned
    // - If user requirement might already be satisfied, estimate fewer/no remaining steps`;

    //         try {
    //             console.log('🔄 Refining step estimation after step', currentStep);
    //             const response = await this.openaiService!.chatCompletion({
    //                 messages: [
    //                     { role: 'system', content: systemPrompt },
    //                     { role: 'user', content: `Refine estimation after step ${currentStep}` }
    //                 ],
    //                 maxTokens: 800,
    //                 temperature: 0.2
    //             });

    //             let cleanedResponse = response.message.trim();
    //             cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');

    //             console.log('🔄 Step estimation refinement response:', cleanedResponse);
    //             const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    //             console.log('🔄 Step estimation refinement JSON match:', jsonMatch);
    //             if (jsonMatch) {
    //                 let jsonString = jsonMatch[0];

    //                 // Clean JSON
    //                 jsonString = jsonString
    //                     // Remove comments (both // and /* */ style)
    //                     .replace(/\/\/.*$/gm, '')
    //                     .replace(/\/\*[\s\S]*?\*\//g, '')
    //                     // Remove trailing commas
    //                     .replace(/,(\s*[}\]])/g, '$1')
    //                     // Clean up extra whitespace
    //                     .replace(/\s+/g, ' ')
    //                     .trim();

    //                 const refinedSteps = JSON.parse(jsonString);

    //                 // const completedSteps = previousEstimation.slice(0, currentStep);
    //                 // return [...completedSteps, ...parsed];
    //                 // Validate structure
    //                 if (!Array.isArray(refinedSteps)) {
    //                     throw new Error('Response is not an array');
    //                 }

    //                 // Combine completed steps with refined remaining steps
    //                 const completedSteps = previousEstimation.slice(0, currentStep);
    //                 return [...completedSteps, ...refinedSteps];
    //             } else {
    //                 console.warn('Could not parse JSON array from refinement response');
    //                 throw new Error('Could not parse JSON from AI response');
    //             }
    //         } catch (error) {
    //             console.error('Failed to refine step estimation:', error);
    //             console.error('Falling back to previous estimation');

    //             return previousEstimation.slice(currentStep - 1);
    //         }
    //     }

    /**
     * Determine if a step should be retried based on the error type
     */
    private shouldRetryStep(error: any): boolean {
        if (!error) return false;

        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

        // Retryable errors
        const retryableErrors = [
            'timeout',
            'network',
            'connection',
            'temporary',
            'syntax error', // SQL syntax errors are often fixable
            'invalid query', // Query can be reformulated
            'parameter', // Parameter errors can be fixed
            'argument', // Argument errors can be fixed
            'table does not exist', // Can try different table names
            'column does not exist', // Can try different column names
            'permission denied', // Can try different approach
            'access denied' // Can try different approach
        ];

        // Non-retryable errors (permanent failures)
        const nonRetryableErrors = [
            'not found',
            'does not exist',
            'unauthorized',
            'forbidden',
            'invalid credentials',
            'authentication failed'
        ];

        // Check for non-retryable errors first
        if (nonRetryableErrors.some(pattern => errorMessage.toLowerCase().includes(pattern))) {
            return false;
        }

        // Check for retryable errors
        if (retryableErrors.some(pattern => errorMessage.toLowerCase().includes(pattern))) {
            return true;
        }

        // Default: retry for unknown errors (conservative approach)
        return true;
    }

    /**
     * Parse AI decision response
     */
    private parseAIDecision(aiMessage: string): any {
        try {
            const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Fallback parsing
            return {
                action: 'unclear',
                reasoning: 'Could not parse AI response',
                toolName: null,
                arguments: {}
            };
        } catch (error) {
            console.error('Failed to parse AI decision:', error);
            return {
                action: 'unclear',
                reasoning: 'JSON parsing failed',
                toolName: null,
                arguments: {}
            };
        }
    }

    /**
     * Check if user requirement is satisfied with current results
     */
    private async checkRequirementSatisfaction(
        userPrompt: string,
        results: any[]
    ): Promise<{ satisfied: boolean; answer?: string }> {
        if (results.length === 0) {
            return { satisfied: false };
        }

        const resultsContext = results.map(r =>
            `Step ${r.step}: ${r.toolName} → ${this.summarizeToolResult(r.result)}`
        ).join('\n');

        const systemPrompt = `You are evaluating whether enough information has been gathered to answer the user's question.

USER QUESTION: ${userPrompt}

GATHERED INFORMATION:
${resultsContext}

TASK: Determine if the gathered information is sufficient to provide a complete answer to the user's question.

RESPONSE FORMAT:
{
  "satisfied": true/false,
  "answer": "complete answer to user's question" (only if satisfied is true)
}

GUIDELINES:
- Only mark as satisfied if you can provide a complete, accurate answer
- If more information is needed, mark as not satisfied
- If data exists but needs processing/analysis, mark as not satisfied unless the analysis can be done from existing data`;

        try {
            const response = await this.openaiService!.chatCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Evaluate satisfaction' }
                ],
                maxTokens: 800,
                temperature: 0.1
            });

            const result = this.parseAIDecision(response.message);
            return {
                satisfied: result.satisfied || false,
                answer: result.answer
            };
        } catch (error) {
            console.error('Error checking requirement satisfaction:', error);
            return { satisfied: false };
        }
    }

    /**
     * Summarize tool result for context building
     */
    private summarizeToolResult(result: any): string {
        if (!result) return 'No result';

        if (typeof result === 'string') {
            return result.length > 200 ? result.substring(0, 200) + '...' : result;
        }

        if (result.error) {
            return `Error: ${result.error}`;
        }

        if (result.content && Array.isArray(result.content)) {
            const textContent = result.content
                .filter((item: any) => item.type === 'text')
                .map((item: any) => item.text)
                .join(' ');
            return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
        }

        return JSON.stringify(result).substring(0, 200) + '...';
    }

    /**
     * Format final response based on completion reason
     */
    private formatFinalResponse(
        results: any[],
        reason: string,
        estimatedSteps?: any[],
        finalAnswer?: any
    ): any {
        const executionSummary = results.map(r => ({
            step: r.step,
            tool: r.toolName,
            summary: this.summarizeToolResult(r.result)
        }));

        let aiResponse = '';
        let isError = false;

        switch (reason) {
            case 'completed':
            case 'satisfied':
                aiResponse = finalAnswer || 'Task completed successfully based on the executed steps.';
                break;
            case 'max_steps_reached':
                aiResponse = `I've executed ${results.length} steps but couldn't fully complete the request. Here's what I found: ${this.summarizeResults(results)}`;
                isError = true;
                break;
            case 'timeout':
                aiResponse = 'The request took too long to process. Here\'s what I managed to gather: ' + this.summarizeResults(results);
                isError = true;
                break;
            case 'unclear':
                aiResponse = 'I couldn\'t determine the next step to take. Here\'s what I found so far: ' + this.summarizeResults(results);
                isError = true;
                break;
            case 'tool_not_found':
                aiResponse = 'I couldn\'t find the required tool to continue processing.';
                isError = true;
                break;
            case 'error':
                aiResponse = `An error occurred during processing: ${finalAnswer}`;
                isError = true;
                break;
            case 'no_estimation':
                aiResponse = 'I couldn\'t proceed because there was no step estimation to guide the process.';
                isError = true;
                break;
            default:
                aiResponse = 'Processing completed with partial results.';
        }

        return {
            isError,
            aiResponse,
            executionSummary,
            totalSteps: results.length,
            completionReason: reason,
            estimatedSteps: estimatedSteps || [],
            actualSteps: results.length,
        };
    }

    /**
     * Summarize all results for user
     */
    private summarizeResults(results: any[]): string {
        if (results.length === 0) return 'No data was gathered.';

        return results.map((r, i) =>
            `Step ${i + 1}: Used ${r.toolName} and ${this.summarizeToolResult(r.result)}`
        ).join('; ');
    }


    /**
     * Check if a query is a confirmation response
     */
    private isConfirmationResponse(query: string): boolean {
        const confirmationPatterns = [
            /^(yes|confirm|proceed|continue|go ahead)[\s\W]*$/i,
            /^(no|cancel|stop|abort)[\s\W]*$/i,
            /^(limit|first|top)\s+\d+[\s\W]*$/i,
            /^(sample|summary)[\s\W]*$/i
        ];

        return confirmationPatterns.some(pattern => pattern.test(query.trim()));
    }

    /**
     * Clear conversation memory
     */
    clearConversationMemory(): void {
        console.log('🧠 Clearing conversation memory');
        this.conversationHistory = {
            keyValuePairs: {},
            textTokens: [],
            recentQueries: [],
            sessionMetadata: {
                startTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                queryCount: 0,
                totalTokens: 0
            }
        };
    }

    /**
     * Get conversation memory for debugging
     */
    getConversationMemory(): ConversationContext {
        return { ...this.conversationHistory };
    }

    async shutdown(): Promise<void> {
        console.log('🔄 Shutting down MCP Client Manager...');

        for (const [name, client] of this.clients) {
            try {
                await client.disconnect();
                console.log(`✅ Disconnected from ${name}`);
            } catch (error) {
                console.error(`❌ Failed to disconnect from ${name}:`, error);
            }
        }

        this.clients.clear();
        this.initialized = false;
        this.clearConversationMemory();
        console.log('✅ MCP Client Manager shutdown complete');
    }

    // ============================================
    /**
 * Refine step estimation based on current progress and results
 */
    private async refineStepEstimation(
        userPrompt: string,
        currentStep: number,
        lastResult: any,
        allTools: Tool[],
        previousEstimation: any[]
    ): Promise<any[]> {
        const toolDescriptions = allTools.map(t => `${t.name} (${t.description})`).join(', ');

        // Get all completed steps with their actual results
        const completedSteps = previousEstimation.slice(0, currentStep);
        const completedStepsWithResults = this.buildExecutionHistory(completedSteps, currentStep);

        // Extract concrete information from previous steps
        const discoveredInfo = this.extractDiscoveredInformation(completedStepsWithResults);

        const systemPrompt = `You are refining a step estimation based on current progress. You must use the ACTUAL DATA discovered in previous steps.

ORIGINAL USER REQUEST: ${userPrompt}

CURRENT STEP: ${currentStep}

EXECUTION HISTORY WITH ACTUAL RESULTS:
${completedStepsWithResults}

DISCOVERED INFORMATION FROM PREVIOUS STEPS:
${discoveredInfo}

AVAILABLE TOOLS: ${toolDescriptions}

REFINEMENT STRATEGY:
1. Use ACTUAL table names, column names, and data discovered in previous steps
2. Don't repeat failed approaches
3. Build upon successful discoveries
4. If you have enough data to answer the user's question, plan final compilation step

TASK: Generate remaining steps (from step ${currentStep + 1} onward) using CONCRETE information from previous steps.

RESPONSE FORMAT (JSON array):
[
  {
    "stepNumber": ${currentStep + 1},
    "title": "Next Step Title",
    "description": "What this step will accomplish using discovered data",
    "estimatedTool": "tool_name",
    "arguments": { "sql": "SELECT ... FROM actual_table_name ..." },
    "reasoning": "Why this step uses specific discovered data"
  },
  {
    "stepNumber": ${currentStep + 2},
    "title": "Next Step Title",
    "description": "What this step will accomplish using discovered data",
    "estimatedTool": "tool_name",
    "arguments": { "sql": "SELECT ... FROM actual_table_name ..." },
    "reasoning": "Why this step uses specific discovered data"
  }
]

CRITICAL RULES:
- Use ONLY actual table/column names discovered in previous steps
- If no tables were discovered, focus on discovery steps first
- If sufficient data exists, plan compilation/summary steps
- NO placeholder names like "identified_table" - use REAL names only
- If previous step found tables, use those exact table names in SQL
- NO comments in JSON`;

        try {
            console.log('🔄 Refining step estimation after step', currentStep);
            console.log('📊 Discovered info:', discoveredInfo);

            const response = await this.openaiService!.chatCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Based on the execution history, what are the next concrete steps using the discovered data?` }
                ],
                maxTokens: 800,
                temperature: 0.1
            });

            let cleanedResponse = response.message.trim();
            cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');

            console.log('🔄 Step estimation refinement response:', cleanedResponse);

            const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                let jsonString = jsonMatch[0];
                jsonString = this.cleanJsonString(jsonString);

                const refinedSteps = JSON.parse(jsonString);

                if (!Array.isArray(refinedSteps)) {
                    throw new Error('Response is not an array');
                }

                // Validate that steps use discovered data
                const validatedSteps = this.validateStepsUseDiscoveredData(refinedSteps, discoveredInfo);

                if (validatedSteps.length === 0) {
                    console.log('🎯 No valid additional steps needed, task should be complete');
                    return completedSteps;
                }

                console.log(`🔄 Generated ${validatedSteps.length} refined steps using discovered data`);
                // return [...completedSteps, ...validatedSteps];
                return validatedSteps.map((step, index) => ({
                    ...step,
                    stepNumber: currentStep + 1 + index
                }));
            } else {
                console.warn('Could not parse JSON array from refinement response');
                throw new Error('Could not parse JSON from AI response');
            }
        } catch (error) {
            console.error('Failed to refine step estimation:', error);
            return completedSteps;
        }
    }

    /**
  * Build detailed execution history with actual results
  * FIXED: Preserves full JSON structure, not just text summaries
  */
    private buildExecutionHistory(completedSteps: any[], currentStep: number): string {
        if (completedSteps.length === 0) return 'No steps completed yet.';

        let history = `EXECUTION HISTORY (${completedSteps.length} steps completed):\n\n`;

        completedSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            history += `STEP ${stepNumber}: ${step.title || `Step ${stepNumber}`}\n`;
            history += `Tool Used: ${step.estimatedTool || 'unknown'}\n`;
            history += `Arguments: ${JSON.stringify(step.arguments || {})}\n`;

            if (step.result) {
                // Store the actual full result structure, not truncated summary
                const detailedResult = this.extractDetailedResult(step.result);
                history += `RESULT: ${detailedResult}\n`;
                history += `STATUS: SUCCESS\n`;
            } else {
                history += `RESULT: null\n`;
                history += `STATUS: UNKNOWN\n`;
            }
            history += `\n`;
        });

        return history;
    }

    /**
     * Extract concrete information discovered from previous steps
     */
    /**
 * Extract concrete information discovered from previous steps
 * Handles JSON-formatted results and various SQL patterns
 */
    private extractDiscoveredInformation(executionHistory: string): string {
        const discoveries: string[] = [];

        // ============================================
        // 1. EXTRACT TABLE NAMES
        // ============================================
        const tablePatterns = [
            // SQL patterns
            /(?:^|\s)FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /(?:^|\s)JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /(?:^|\s)INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /(?:^|\s)UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /TABLE_NAME\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /table\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            // JSON/key-value patterns - matches: accession: 'value', table_name: 'value', etc.
            /\b(?:accession|table_name|tableName|table|name)\s*[:=]\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/gim,
            // Quoted table names
            /'([a-zA-Z_][a-zA-Z0-9_]*)'/g,
            /`([a-zA-Z_][a-zA-Z0-9_]*)`/g,
            // SHOW TABLES output format
            /^\s*\d+\.\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/gim,
            // Result labels
            /(?:available|discovered|existing|found)\s+(?:tables?|schemas?)\s*[:=]?\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)/gim
        ];

        const allTableNames = new Set<string>();
        const filterList = ['schema', 'result', 'status', 'true', 'false', 'data', 'rows', 'columns', 'error', 'metadata', 'content', 'title', 'type', 'unknown'];

        tablePatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1]) {
                        const values = match[1].split(',').map(v => v.trim());
                        values.forEach(val => {
                            if (val.length > 2 && !filterList.includes(val.toLowerCase())) {
                                allTableNames.add(val);
                            }
                        });
                    }
                });
            } catch (e) {
                console.warn('Regex pattern failed:', pattern, e);
            }
        });

        if (allTableNames.size > 0) {
            discoveries.push(`DISCOVERED TABLES: ${Array.from(allTableNames).join(', ')}`);
        }

        // ============================================
        // 2. EXTRACT COLUMN INFORMATION
        // ============================================
        const columnPatterns = [
            /(?:COLUMN|column)\s*[:\s=]+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)/gim,
            /columns?\s*[:=]\s*\[\s*'([^']+(?:'\s*,\s*'[^']+)*)'\s*\]/gim,
            /columns?\s*[:=]\s*"([^"]+(?:"\s*,\s*"[^"]+)*)"/gim,
            /(?:fields?|attributes?)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)/gim
        ];

        const allColumns = new Set<string>();

        columnPatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1]) {
                        const cols = match[1].split(/[',"\s]+/).filter(c => c && c.length > 1 && /^[a-zA-Z_]/.test(c));
                        cols.forEach(col => allColumns.add(col));
                    }
                });
            } catch (e) {
                console.warn('Column regex pattern failed:', pattern, e);
            }
        });

        if (allColumns.size > 0) {
            discoveries.push(`DISCOVERED COLUMNS: ${Array.from(allColumns).join(', ')}`);
        }

        // ============================================
        // 3. EXTRACT ROW COUNTS AND NUMERIC DATA
        // ============================================
        const countPatterns = [
            /(?:count|total|rows?|results?)\s*[:=]\s*(\d+)/gim,
            /total(?:Rows|Results)\s*[:=]\s*(\d+)/gim,
            /\b(\d+)\s+(?:rows?|records?|entries?)\b/gim
        ];

        const counts: string[] = [];

        countPatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1]) {
                        counts.push(match[1]);
                    }
                });
            } catch (e) {
                console.warn('Count regex pattern failed:', pattern, e);
            }
        });

        if (counts.length > 0) {
            const uniqueCounts = [...new Set(counts)];
            discoveries.push(`DISCOVERED COUNTS: ${uniqueCounts.join(', ')} rows/records`);
        }

        // ============================================
        // 4. EXTRACT DATABASE/SCHEMA INFORMATION
        // ============================================
        const schemaPatterns = [
            /(?:database|schema|catalog)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gim,
            /service\s*[:=]\s*['"`]?([a-zA-Z_][a-zA-Z0-9_]*)['"`]?/gim
        ];

        const allSchemas = new Set<string>();

        schemaPatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1] && match[1].length > 1 && !filterList.includes(match[1].toLowerCase())) {
                        allSchemas.add(match[1]);
                    }
                });
            } catch (e) {
                console.warn('Schema regex pattern failed:', pattern, e);
            }
        });

        if (allSchemas.size > 0) {
            discoveries.push(`DISCOVERED SCHEMAS: ${Array.from(allSchemas).join(', ')}`);
        }

        // ============================================
        // 5. EXTRACT DATA TYPES (for columns)
        // ============================================
        const typePatterns = [
            /(?:type|datatype)\s*[:=]\s*['"`]?(\w+)['"`]?/gim,
            /:\s*(string|int|integer|varchar|text|boolean|date|timestamp|float|double|decimal|bigint)\b/gim
        ];

        const dataTypes = new Set<string>();

        typePatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1] && match[1].length > 1) {
                        dataTypes.add(match[1]);
                    }
                });
            } catch (e) {
                console.warn('Type regex pattern failed:', pattern, e);
            }
        });

        if (dataTypes.size > 0) {
            discoveries.push(`DISCOVERED DATA TYPES: ${Array.from(dataTypes).join(', ')}`);
        }

        // ============================================
        // 6. EXTRACT ERROR INFORMATION (to avoid repeating)
        // ============================================
        const errorPatterns = [
            /(?:error|failed|not found|does not exist)[:\s]*([^\n]+)/gim
        ];

        const errors: string[] = [];

        errorPatterns.forEach(pattern => {
            try {
                const matches = [...executionHistory.matchAll(pattern)];
                matches.forEach(match => {
                    if (match[1] && match[1].length > 5) {
                        errors.push(match[1].substring(0, 100));
                    }
                });
            } catch (e) {
                console.warn('Error regex pattern failed:', pattern, e);
            }
        });

        if (errors.length > 0) {
            const uniqueErrors = [...new Set(errors)];
            discoveries.push(`KNOWN ERRORS TO AVOID: ${uniqueErrors.slice(0, 2).join('; ')}`);
        }

        // ============================================
        // 7. RETURN CONSOLIDATED DISCOVERIES
        // ============================================
        if (discoveries.length === 0) {
            return 'No concrete data discovered yet - focus on discovery steps first.';
        }

        console.log('📊 Extracted discoveries:', discoveries);
        return discoveries.join('\n');
    }

    /**
     * Validate that steps use discovered data rather than placeholder names
     */
    private validateStepsUseDiscoveredData(steps: any[], discoveredInfo: string): any[] {
        if (!Array.isArray(steps)) return [];

        return steps.filter(step => {
            // Basic validation
            if (!step.stepNumber || !step.title || !step.estimatedTool) {
                console.warn('Filtering out invalid step:', step);
                return false;
            }

            // If step has SQL, validate it uses discovered data
            if (step.arguments?.sql) {
                const sql = step.arguments.sql.toLowerCase();

                // Check for placeholder names that indicate the step isn't using discovered data
                const hasPlaceholders = [
                    'identified_',
                    'discovered_',
                    'patients_table',
                    'samples_table',
                    'variants_table',
                    'example_',
                    'placeholder'
                ].some(placeholder => sql.includes(placeholder));

                if (hasPlaceholders) {
                    console.warn('Filtering out step with placeholder names:', step);
                    return false;
                }

                // If we have discovered tables, ensure the step uses them
                const tableMatch = discoveredInfo.match(/DISCOVERED TABLES: ([^\n]+)/);
                if (tableMatch) {
                    const discoveredTables = tableMatch[1].split(', ').map(t => t.trim().toLowerCase());
                    const sqlUsesTables = discoveredTables.some(table => sql.includes(table));

                    if (sql.includes('from ') && !sqlUsesTables) {
                        console.warn('Filtering out step that doesnt use discovered tables:', step);
                        return false;
                    }
                }
            }

            return true;
        }).slice(0, 3);
    }

    /**
     * Extract detailed result information
     */
    /**
     * Extract detailed result information
     * FIXED: Properly handles your result structure
     */
    private extractDetailedResult(result: any): string {
        if (!result) return 'No result';

        // Handle error case
        if (result.error || result.isError) {
            return `ERROR: ${result.error || 'Query execution failed'}`;
        }

        let extracted = '';

        // Extract from data.rows (your actual table structure)
        if (result.data && result.data.rows && Array.isArray(result.data.rows)) {
            const rowsJson = JSON.stringify(result.data.rows);
            extracted += `ROWS: ${rowsJson}\n`;
        }

        // Extract from data.columns (column names)
        if (result.data && result.data.columns && Array.isArray(result.data.columns)) {
            extracted += `COLUMNS: ${JSON.stringify(result.data.columns)}\n`;
        }

        // Extract from content array (text results)
        if (result.content && Array.isArray(result.content)) {
            const textContent = result.content
                .filter((item: any) => item.type === 'text')
                .map((item: any) => item.text)
                .join('\n');
            if (textContent) extracted += `CONTENT: ${textContent}\n`;
        }

        // Extract metadata
        if (result.metadata) {
            extracted += `METADATA: ${JSON.stringify(result.metadata)}\n`;
        }

        if (result.totalRows) {
            extracted += `TOTAL_ROWS: ${result.totalRows}\n`;
        }

        // Fallback
        if (!extracted) {
            extracted = JSON.stringify(result, null, 2);
        }

        return extracted;
    }

    /**
     * Clean JSON string more thoroughly
     */
    private cleanJsonString(jsonString: string): string {
        return jsonString
            // Remove comments (both // and /* */ style)
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
}