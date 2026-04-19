"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const fieldInputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #4b5563',
  borderRadius: '4px',
  boxSizing: 'border-box' as const,
  backgroundColor: '#fff'
};

const actionButtonStyle = {
  padding: '10px 20px',
  background: '#dfeedd',
  border: '1px solid #bdd4bd',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default function NewField() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [currentStage, setCurrentStage] = useState('Planted');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(stored);
    setUser(userData);

    if (userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch('/api/fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': user.role,
        'x-user-id': user.id
      },
      body: JSON.stringify({
        name,
        crop_type: cropType,
        planting_date: plantingDate,
        current_stage: currentStage
      })
    });

    if (res.ok) {
      router.push('/dashboard');
    }
  }

  function logout() {
    localStorage.removeItem('user');
    router.push('/');
  }

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingBottom: '12px',
            borderBottom: '1px solid #ccc'
          }}
        >
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#111' }}>Dashboard</Link>
          <button onClick={logout} style={{ ...actionButtonStyle, background: '#edf6ed', border: '1px solid #c8dac8' }}>Logout</button>
        </nav>

        <div style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>Add New Field</h1>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Fill in the field details below to register a new crop field for monitoring.
          </p>
        </div>

        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            border: '1px solid #cfe0cf',
            borderRadius: '8px',
            background: '#f7fcf7',
            padding: 'clamp(16px, 4vw, 22px)'
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Field Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={fieldInputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Crop Type</label>
              <input type="text" value={cropType} onChange={e => setCropType(e.target.value)} required style={fieldInputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Planting Date</label>
              <input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} required style={fieldInputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Current Stage</label>
              <select value={currentStage} onChange={e => setCurrentStage(e.target.value)} style={fieldInputStyle}>
                <option value="Planted">Planted</option>
                <option value="Growing">Growing</option>
                <option value="Ready">Ready</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>
            <button type="submit" style={actionButtonStyle}>Create Field</button>
          </form>
        </div>
      </div>
    </div>
  );
}
