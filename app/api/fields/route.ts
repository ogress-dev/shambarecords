import { NextRequest, NextResponse } from 'next/server';
import { getFieldStatus, query } from '../db';

type FieldRow = {
  id: number;
  name: string;
  crop_type: string | null;
  planting_date: string | Date | null;
  current_stage: string | null;
  assigned_agent_id: number | null;
  created_by: number | null;
  agent_name?: string | null;
};

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-role');
  
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const fields = await query<FieldRow>(`
    SELECT f.*, u.name as agent_name 
    FROM fields f 
    LEFT JOIN users u ON f.assigned_agent_id = u.id
    ORDER BY f.id DESC
  `);

  const fieldsWithStatus = fields.rows.map((field) => ({ ...field, status: getFieldStatus(field) }));
  return NextResponse.json(fieldsWithStatus);
}

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-role');
  const userId = request.headers.get('x-user-id');
  
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { name, crop_type, planting_date, current_stage } = await request.json();
  
  const result = await query<{ id: number }>(
    `
      INSERT INTO fields (name, crop_type, planting_date, current_stage, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [name, crop_type, planting_date, current_stage, userId]
  );
  
  return NextResponse.json({ id: result.rows[0].id });
}
