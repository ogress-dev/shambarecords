import { NextRequest, NextResponse } from 'next/server';
import { query } from '../db';

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-role');

  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const updates = await query(`
    SELECT
      fu.id,
      fu.field_id,
      fu.new_stage,
      fu.notes,
      fu.created_at,
      f.name as field_name,
      u.name as agent_name
    FROM field_updates fu
    LEFT JOIN fields f ON fu.field_id = f.id
    LEFT JOIN users u ON fu.agent_id = u.id
    ORDER BY fu.created_at DESC
    LIMIT 12
  `);

  return NextResponse.json(updates.rows);
}
