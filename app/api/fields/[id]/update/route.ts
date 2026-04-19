import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '../../../db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = request.headers.get('x-role');
  const userId = request.headers.get('x-user-id');
  
  if (userRole !== 'agent') {
    return NextResponse.json({ error: 'Agent only' }, { status: 403 });
  }

  const { new_stage, notes } = await request.json();
  const { id } = await params;
  const field = await queryOne<{ assigned_agent_id: number | null }>(
    'SELECT assigned_agent_id FROM fields WHERE id = $1',
    [id]
  );

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  if (String(field.assigned_agent_id) !== userId) {
    return NextResponse.json({ error: 'Field not assigned to this agent' }, { status: 403 });
  }
  
  await query(
    `INSERT INTO field_updates (field_id, agent_id, new_stage, notes) VALUES ($1, $2, $3, $4)`,
    [id, userId, new_stage, notes]
  );

  await query(`UPDATE fields SET current_stage = $1 WHERE id = $2`, [new_stage, id]);
  return NextResponse.json({ success: true });
}
