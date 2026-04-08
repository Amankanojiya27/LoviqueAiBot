// File: frontend/app/api/proxy/[...path]/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const getApiTargetBase = (): string => {
  const candidate =
    process.env.API_PROXY_TARGET_URL?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!candidate) {
    throw new Error('API proxy target is not configured.');
  }

  return candidate.replace(/\/$/, '');
};

const buildTargetUrl = (path: string[]): string => {
  return `${getApiTargetBase()}/${path.join('/')}`;
};

const buildForwardHeaders = (request: NextRequest, contentType?: string | null): Headers => {
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (cookie) {
    headers.set('Cookie', cookie);
  }

  if (origin) {
    headers.set('Origin', origin);
  }

  if (userAgent) {
    headers.set('User-Agent', userAgent);
  }

  if (forwardedFor) {
    headers.set('X-Forwarded-For', forwardedFor);
  }

  return headers;
};

const forwardRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> => {
  const { path } = await context.params;
  const method = request.method;
  const contentType = request.headers.get('content-type');
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.text();

  const backendResponse = await fetch(buildTargetUrl(path), {
    method,
    headers: buildForwardHeaders(request, contentType),
    body,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const responseContentType = backendResponse.headers.get('content-type');
  const setCookie = backendResponse.headers.get('set-cookie');

  if (responseContentType) {
    responseHeaders.set('Content-Type', responseContentType);
  }

  if (setCookie) {
    responseHeaders.set('Set-Cookie', setCookie);
  }

  return new Response(await backendResponse.text(), {
    status: backendResponse.status,
    headers: responseHeaders,
  });
};

export function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}
