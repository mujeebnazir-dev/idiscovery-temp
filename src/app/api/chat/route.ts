import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/services/mcpService';

interface ChatRequest {
  message: string;
  chatId: string;
}

interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    workflow?: any;
    isWorkflow?: boolean;
    isProcessing?: boolean;
  };
  error?: {
    message: string;
    code: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  
  try {
    const body: ChatRequest = await request.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Message is required and must be a string',
          code: 'INVALID_REQUEST'
        }
      } as ChatResponse, { status: 400 });
    }

    let manager;
    try {
      manager = await mcpService.initialize();
    } catch (initError) {
      console.error('❌ MCP service initialization failed:', initError);
      return NextResponse.json({
        success: false,
        error: {
          message: `MCP service initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`,
          code: 'MCP_INIT_ERROR'
        }
      } as ChatResponse, { status: 503 });
    }

    let result;
    try {
      result = await manager.processQuery(
        body.message,
        (stepUpdate: any) => {
          console.log('📊 Step update:', stepUpdate?.type || 'unknown');
        }
      );
    } catch (queryError) {
      console.error('❌ Query processing failed:', queryError);
      return NextResponse.json({
        success: false,
        error: {
          message: `Query processing failed: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
          code: 'QUERY_ERROR'
        }
      } as ChatResponse, { status: 500 });
    }

    const response = {
      success: true,
      data: {
        response: result.response?.aiResponse || 'Processing completed',
        workflow: result.workflow,
        isWorkflow: result.isWorkflow,
        isProcessing: false
      }
    } as ChatResponse;

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected error in chat API:', error);
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      }
    } as ChatResponse;

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET endpoint to check if MCP is initialized
export async function GET(request: NextRequest): Promise<NextResponse> {
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        try {
          await mcpService.initialize();
          const status = mcpService.getStatus();
          
          return NextResponse.json({
            success: true,
            data: status
          });
        } catch (statusError) {
          console.error('❌ Status check failed:', statusError);
          return NextResponse.json({
            success: false,
            error: {
              message: `Status check failed: ${statusError instanceof Error ? statusError.message : String(statusError)}`,
              code: 'STATUS_ERROR'
            }
          }, { status: 500 });
        }

      case 'tools':
        try {
          const manager = await mcpService.initialize();
          const tools = await manager.getAvailableTools();
          
          return NextResponse.json({
            success: true,
            data: { tools }
          });
        } catch (toolsError) {
          console.error('❌ Tools retrieval failed:', toolsError);
          return NextResponse.json({
            success: false,
            error: {
              message: `Tools retrieval failed: ${toolsError instanceof Error ? toolsError.message : String(toolsError)}`,
              code: 'TOOLS_ERROR'
            }
          }, { status: 500 });
        }

      case 'health':
        // Simple health check
        return NextResponse.json({
          success: true,
          data: {
            message: 'API is healthy',
            timestamp: new Date().toISOString()
          }
        });

      default:
        console.log('❌ Invalid action requested');
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid action. Supported actions: status, tools, health',
            code: 'INVALID_ACTION'
          }
        }, { status: 400 });
    }
  } catch (error) {
    console.error('💥 Unexpected error in GET request:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      }
    }, { status: 500 });
  }
}