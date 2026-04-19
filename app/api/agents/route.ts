import { NextRequest, NextResponse } from 'next/server';
import { query } from '../db';

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-role');
  
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const agents = await query<{ id: number; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY name ASC`
  );
  return NextResponse.json(agents.rows);
}
