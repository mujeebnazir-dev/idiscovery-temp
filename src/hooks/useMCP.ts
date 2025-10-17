import { useState, useEffect, useRef } from 'react';
import { MCPClientManager } from '@/lib/mcp/clientManager';

export const useMCP = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSteps, setCurrentSteps] = useState<any[]>([]);
    const mcpManagerRef = useRef<MCPClientManager | null>(null);

    useEffect(() => {
        const initializeMCP = async () => {
            try {
                const openaiConfig = {
                    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
                    model: 'gpt-4o-mini',
                    maxTokens: 2000,
                    temperature: 0.7
                };

                mcpManagerRef.current = new MCPClientManager(openaiConfig);
                await mcpManagerRef.current.initialize();
                setIsInitialized(true);
                setError(null);
            } catch (err) {
                console.error('MCP initialization failed:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize MCP');
                setIsInitialized(false);
            }
        };

        initializeMCP();

        return () => {
            if (mcpManagerRef.current) {
                mcpManagerRef.current.shutdown();
            }
        };
    }, []);

    const processQuery = async (
        query: string,
        onInitialResponse?: (response: string) => void,
        onStepUpdate?: (step: any) => void
    ) => {
        if (!mcpManagerRef.current || !isInitialized) {
            throw new Error('MCP not initialized');
        }

        setIsProcessing(true);
        setCurrentSteps([]);
        setError(null);

        try {
            const result = await mcpManagerRef.current.processQuery(
                query,
                (stepUpdate) => {
                    setCurrentSteps(prev => {
                        const newSteps = [...prev];
                        const existingIndex = newSteps.findIndex(s => s.stepNumber === stepUpdate.stepNumber);

                        if (existingIndex >= 0) {
                            newSteps[existingIndex] = { ...newSteps[existingIndex], ...stepUpdate };
                        } else {
                            newSteps.push(stepUpdate);
                        }

                        return newSteps;
                    });

                    if (onStepUpdate) {
                        onStepUpdate(stepUpdate);
                    }
                },
                onInitialResponse
            );

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Query processing failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const getServerInfo = () => {
        return mcpManagerRef.current?.getServerInfo() || [];
    };

    const getAvailableTools = async () => {
        if (!mcpManagerRef.current) return {};
        return await mcpManagerRef.current.getAvailableTools();
    };

    return {
        isInitialized,
        isProcessing,
        error,
        currentSteps,
        processQuery,
        getServerInfo,
        getAvailableTools
    };
};