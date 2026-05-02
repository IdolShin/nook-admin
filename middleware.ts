// Deprecated in Next.js 16 — logic moved to proxy.ts
// This file must export a middleware function to satisfy the build,
// but the matcher is empty so it never runs.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [], // empty — proxy.ts handles all routing
};
