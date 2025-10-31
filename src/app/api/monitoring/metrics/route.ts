import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { env, clientEnv } from '@/lib/env';

// CORS configuration (shared with errors route)
const ALLOWED_ORIGINS = [
  clientEnv.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(env.NODE_ENV === 'development' ? ['http://localhost:3001', 'http://127.0.0.1:3001'] : []),
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

function setCorsHeaders(response: NextResponse, origin?: string) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    if (key !== 'Access-Control-Allow-Origin') {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const response = NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
      return setCorsHeaders(response, origin);
    }

    const body = (await request.json()) as { metrics?: unknown };
    if (!Array.isArray(body.metrics)) {
      const response = NextResponse.json(
        { error: 'Missing or invalid metrics data' },
        { status: 400 }
      );
      return setCorsHeaders(response, origin);
    }

    const headersList = headers();
    const userAgent = headersList.get('user-agent') ?? 'unknown';
    const requestId = headersList.get('x-request-id') ?? `req_${Date.now()}`;

    type MetricPayload = {
      timestamp?: number;
      [key: string]: unknown;
    };

    const normalizedMetrics: MetricPayload[] = body.metrics.filter(
      (entry): entry is MetricPayload => entry !== null && typeof entry === 'object'
    );

    // Process metrics
    const processedMetrics = normalizedMetrics.map((metric) => {
      const timestamp =
        typeof metric.timestamp === 'number' && Number.isFinite(metric.timestamp)
          ? metric.timestamp
          : Date.now();
      return {
        ...metric,
        timestamp,
        userAgent,
        origin,
        requestId,
      };
    });

    // In development, log metrics
    if (env.NODE_ENV === 'development') {
      console.warn('[metrics] Performance metrics captured', processedMetrics);
    }

    // In production, send to monitoring service
    if (env.NODE_ENV === 'production') {
      // Example: Send to DataDog, New Relic, etc.
      // await sendMetricsToService(processedMetrics);
      
      // For now, just log
      console.warn('[metrics] Payload:', JSON.stringify(processedMetrics, null, 2));
    }

    const response = NextResponse.json(
      { 
        success: true, 
        processed: processedMetrics.length,
        requestId 
      },
      { status: 200 }
    );
    
    return setCorsHeaders(response, origin);

  } catch (error) {
    console.error('Error processing metrics:', error);
    
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

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const response = NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'metrics-monitoring'
    },
    { status: 200 }
  );
  
  return setCorsHeaders(response, origin);
}
