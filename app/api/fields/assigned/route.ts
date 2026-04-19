import { NextRequest, NextResponse } from 'next/server';
import { getFieldStatus, query } from '../../db';

type AssignedFieldRow = {
  id: number;
  name: string;
  crop_type: string | null;
  planting_date: string | Date | null;
  current_stage: string | null;
  assigned_agent_id: number | null;
  created_by: number | null;
};

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-role');
  const userId = request.headers.get('x-user-id');
  
  if (userRole !== 'agent') {
    return NextResponse.json({ error: 'Agent only' }, { status: 403 });
  }

  const fields = await query<AssignedFieldRow>(
    `SELECT * FROM fields WHERE assigned_agent_id = $1 ORDER BY id DESC`,
    [userId]
  );
  const fieldsWithStatus = fields.rows.map((field) => ({ ...field, status: getFieldStatus(field) }));
  return NextResponse.json(fieldsWithStatus);
}
