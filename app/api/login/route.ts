import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '../db';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const user = await queryOne<{ id: number; email: string; role: string; name: string }>(
    'SELECT id, email, role, name FROM users WHERE email = $1 AND password = $2',
    [email, password]
  );
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  return NextResponse.json({ id: user.id, email: user.email, role: user.role, name: user.name });
}
