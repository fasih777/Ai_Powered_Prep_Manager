import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL || process.env.PYTHON_API_URL || 'http://localhost:8000';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('Authorization', authorization);
  const backendResponse = await fetch(
    `${backendUrl}/v1/prep-review/evaluate-sync`,
    {
      method: 'POST',
      headers,
      body: await request.text(),
      cache: 'no-store',
    },
  );

  return new NextResponse(await backendResponse.text(), {
    status: backendResponse.status,
    headers: {
      'Content-Type':
        backendResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}
