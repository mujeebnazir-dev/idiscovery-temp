// Application-specific types for MCP data processing
export interface ProcessingStep {
  stepNumber?: number; // Made optional to match usage in ExecutionSteps
  title: string;
  description: string;
  tool?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  reasoning?: string;
  resultId?: string; // Reference to stored result
}

// New workflow-related types
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'sequential' | 'parallel';
  toolCall?: {
    toolName: string;
    serverName: string;
    arguments: any;
    result?: any;
    error?: string;
  };
  subSteps?: WorkflowStep[];
  startTime?: Date;
  endTime?: Date;
  isClickable?: boolean;
  isExpanded?: boolean;
  dependsOn?: string[];
}

export interface WorkflowExecution {
  id: string;
  query: string;
  steps: WorkflowStep[];
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  finalResult?: {
    content: string;
    visualizations?: VisualizationContent[];
  };
}

export interface ServerConfig {
  name: string;
  url: string;
  enabled: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  initialResponse?: string; // Optional initial acknowledgment like "I'm processing your request"
  resultId?: string; // Reference to final result in the common result store
  metadata?: {
    steps?: ProcessingStep[]; // Array of processing steps for complex queries
    suggestions?: string[]; // Follow-up suggestions
    error?: boolean; // Error flag for system messages
  };
}

// New result storage interface
export interface StoredResult {
  id: string;
  stepNumber: number;
  executionId: string;
  tool: string;
  timestamp: Date;
  summary: string;
  fullResult: any;
  arguments?: any;
  visualizationContent?: VisualizationContent;
}

// Standardized visualization content types
export interface BaseVisualizationContent {
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
  stepInfo?: {
    stepTitle: string;
    tool: string;
    reasoning?: string;
    arguments?: any;
  };
}

export interface TextContent extends BaseVisualizationContent {
  type: 'text';
  content: string;
}

export interface TableContent extends BaseVisualizationContent {
  type: 'table';
  data: Record<string, any>[];
  totalRows?: number;
  currentPage?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  originalQuery?: string;
}

export interface BarChartContent {
  type: 'bar';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export interface LineChartContent {
  type: 'line';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export interface PieChartContent {
  type: 'pie';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export interface NumberContent {
  type: 'number';
  value: number | string;
  label?: string;
  format?: string;
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export interface CodeContent {
  type: 'code';
  content: string;
  language?: string;
  title?: string;
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
}

// Skeleton content for loading states
export interface SkeletonContent {
  type: 'skeleton';
  skeletonType: 'table' | 'bar' | 'line' | 'pie' | 'text';
  tableInfo?: {
    row: number;
    column: number;
    header?: boolean;
  };
  barInfo?: {
    bars: number;
  };
  lineInfo?: {
    lines: number;
  };
  pieInfo?: {
    pies: number;
  };
  title?: string;
  id?: string;
  isLoading: true;
}

export type VisualizationContent = TextContent | TableContent | BarChartContent | LineChartContent | PieChartContent | NumberContent | CodeContent | SkeletonContent;

export interface ConversationContext {
  // Key-value pairs extracted from responses (structured data)
  keyValuePairs: Record<string, any>;
  // Compact text tokens for LLM understanding
  textTokens: string[];
  // Recent requests for context
  recentQueries: string[];
  // Session metadata
  sessionMetadata: {
    startTime: string;
    lastActivity: string;
    queryCount: number;
    totalTokens: number;
  };
}

export interface ContextExtractionResult {
  keyValuePairs: Record<string, any>;
  textTokens: string[];
  summary: string;
}

// Enhanced expectation-driven types for MCP request processing

export interface ExpectedResponse {
  id: string;
  type: 'text' | 'table' | 'chart' | 'number' | 'code';
  title: string;
  description?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
  format?: 'integer' | 'decimal' | 'percentage' | 'currency';
  language?: 'sql' | 'json' | 'javascript' | 'python' | 'text' | 'yaml' | 'xml' | 'markdown';
  required: boolean;
  fallbackContent?: string;
}

export interface ResponseExpectation {
  conversationSummary: {
    enabled: boolean;
    expectedContent: string;
  };
  visualizations: ExpectedResponse[];
  totalExpected: number;
  timeout?: number;
  retryCount?: number;
}

export interface MCPDataRequest {
  query: string;
  expectations: ResponseExpectation;
  context?: {
    userId?: string;
    sessionId?: string;
    previousRequests?: string[];
    preferences?: any;
    conversation?: ConversationContext;
    currentExpectations?: ResponseExpectation;
    serverContext?: Record<string, any>;
  };
  options?: {
    maxRows?: number;
    timeout?: number;
    useCache?: boolean;
    explain?: boolean;
  };
}

export interface ResponseStatus {
  id: string;
  status: 'pending' | 'loading' | 'success' | 'error' | 'timeout';
  data?: any;
  error?: string;
  timestamp: string;
  retryCount?: number;
}

export interface MCPDataResponse {
  success: boolean;
  conversationResponse?: {
    content: string;
    status: 'success' | 'error';
    error?: string;
  };
  visualizationResponses: {
    [responseId: string]: ResponseStatus;
  };
  isError?: boolean;
  globalError?: string;
  suggestions?: string[];
  processingSteps?: ProcessingStep[];
  metadata?: {
    totalExpected: number;
    totalReceived: number;
    totalErrors: number;
    executionTime: number;
    requestId: string;
  };
}

// Visualization prediction types for AI-powered visualization guessing
export interface VisualizationPrediction {
  needsVisualization: boolean;
  predictions: {
    type: 'table' | 'bar' | 'line' | 'pie';
    confidence: number;
    tableInfo?: {
      estimatedRows: number;
      estimatedColumns: number;
      hasHeader: boolean;
    };
    barInfo?: {
      estimatedBars: number;
    };
    lineInfo?: {
      estimatedLines: number;
    };
    pieInfo?: {
      estimatedPies: number;
    };
    title?: string;
  }[];
}