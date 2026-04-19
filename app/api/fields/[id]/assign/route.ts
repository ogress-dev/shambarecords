import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = request.headers.get('x-role');
  
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { agentId } = await request.json();
  const { id } = await params;
  
  await query(`UPDATE fields SET assigned_agent_id = $1 WHERE id = $2`, [agentId, id]);
  return NextResponse.json({ success: true });
}
