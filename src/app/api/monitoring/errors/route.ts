import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { env, clientEnv } from '@/lib/env';

// CORS configuration
const ALLOWED_ORIGINS = [
  clientEnv.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(env.NODE_ENV === 'development' ? ['http://localhost:3001', 'http://127.0.0.1:3001'] : []),
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

function setCorsHeaders(response: NextResponse, origin?: string) {
  // Set origin if it's in allowed list
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // Set other CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    if (key !== 'Access-Control-Allow-Origin') {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  const response = new NextResponse(null, { status: 200 });
  
  return setCorsHeaders(response, origin);
}

// Error reporting endpoint
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  
  try {
    // Validate request
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const response = NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
      return setCorsHeaders(response, origin);
    }

    // Parse request body
    const body = await request.json();
    const { errors, error, errorInfo, errorId, timestamp, manual } = body;

    // Validate required fields
    if (!errors && !error) {
      const response = NextResponse.json(
        { error: 'Missing error data' },
        { status: 400 }
      );
      return setCorsHeaders(response, origin);
    }

    // Get request metadata
    const headersList = headers();
    const userAgent = headersList.get('user-agent') ?? 'unknown';
    const requestId = headersList.get('x-request-id') ?? `req_${Date.now()}`;
    
    // Process errors
    const errorList = errors ?? [{ error, errorInfo, errorId, timestamp, manual }];
    
    for (const errorData of errorList) {
      // Log error (in production, send to monitoring service)
      const logEntry = {
        timestamp: errorData.timestamp ?? new Date().toISOString(),
        errorId: errorData.errorId ?? `error_${Date.now()}`,
        error: {
          message: errorData.error?.message ?? errorData.message,
          stack: errorData.error?.stack ?? errorData.stack,
          name: errorData.error?.name ?? errorData.name ?? 'Error',
        },
        context: {
          ...errorData.context,
          ...errorData.errorInfo,
          userAgent,
          origin,
          requestId,
          manual: errorData.manual ?? false,
        },
      };

      // In development, log to console
      if (env.NODE_ENV === 'development') {
        console.error('🚨 Error Report:', logEntry);
      }

      // In production, send to monitoring service
      if (env.NODE_ENV === 'production') {
        // Example: Send to Sentry, DataDog, etc.
        // await sendToMonitoringService(logEntry);
        
        // For now, just log to console
        console.error('Error Report:', JSON.stringify(logEntry, null, 2));
      }
    }

    const response = NextResponse.json(
      { 
        success: true, 
        processed: errorList.length,
        requestId 
      },
      { status: 200 }
    );
    
    return setCorsHeaders(response, origin);

  } catch (error) {
    console.error('Error processing error report:', error);
    
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    
    return setCorsHeaders(response, origin);
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  
  const response = NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'error-monitoring'
    },
    { status: 200 }
  );
  
  return setCorsHeaders(response, origin);
}
