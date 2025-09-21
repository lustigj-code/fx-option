import { NextResponse } from 'next/server';

import { fetchAuditEvents } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') ?? '100', 10);
  const events = await fetchAuditEvents(Number.isFinite(limit) ? limit : 100);
  return NextResponse.json(events);
}
