import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '../../../db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = request.headers.get('x-role');
  const userId = request.headers.get('x-user-id');
  const { id } = await params;
  const field = await queryOne<{ assigned_agent_id: number | null }>(
    'SELECT assigned_agent_id FROM fields WHERE id = $1',
    [id]
  );

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  const isAdmin = userRole === 'admin';
  const isAssignedAgent = userRole === 'agent' && String(field.assigned_agent_id) === userId;

  if (!isAdmin && !isAssignedAgent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const updates = await query(`
    SELECT fu.*, u.name as agent_name 
    FROM field_updates fu 
    LEFT JOIN users u ON fu.agent_id = u.id
    WHERE fu.field_id = $1
    ORDER BY fu.created_at DESC
  `, [id]);

  return NextResponse.json(updates.rows);
}
