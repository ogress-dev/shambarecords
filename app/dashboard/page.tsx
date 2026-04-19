"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [updateField, setUpdateField] = useState<any>(null);
  const [newStage, setNewStage] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(stored);
    setUser(userData);

    if (userData.role === 'admin') {
      fetch('/api/fields', {
        headers: { 'x-role': userData.role, 'x-user-id': userData.id }
      }).then(r => r.json()).then(d => setFields(d));

      fetch('/api/agents', {
        headers: { 'x-role': userData.role, 'x-user-id': userData.id }
      }).then(r => r.json()).then(d => setAgents(d));

      fetch('/api/updates', {
        headers: { 'x-role': userData.role, 'x-user-id': userData.id }
      }).then(r => r.json()).then(d => setRecentUpdates(d));
    } else {
      fetch('/api/fields/assigned', {
        headers: { 'x-role': userData.role, 'x-user-id': userData.id }
      }).then(r => r.json()).then(d => setFields(d));
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('user');
    router.push('/');
  }

  function assignAgent(fieldId: number, agentId: number) {
    fetch(`/api/fields/${fieldId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-role': user.role,
        'x-user-id': user.id
      },
      body: JSON.stringify({ agentId })
    }).then(() => window.location.reload());
  }

  function openUpdateModal(field: any) {
    setUpdateField(field);
    setNewStage(field.current_stage);
    setNotes('');
  }

  function submitUpdate() {
    fetch(`/api/fields/${updateField.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': user.role,
        'x-user-id': user.id
      },
      body: JSON.stringify({ new_stage: newStage, notes })
    }).then(() => {
      setUpdateField(null);
      window.location.reload();
    });
  }

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  const total = fields.length;
  const active = fields.filter(f => f.status === 'Active').length;
  const atRisk = fields.filter(f => f.status === 'At Risk').length;
  const completed = fields.filter(f => f.status === 'Completed').length;
  const title = user.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard';

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            paddingBottom: 16,
            borderBottom: '1px solid #ccc'
          }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: '#111' }}>Dashboard</Link>
            {user.role === 'admin' && (
              <Link
                href="/fields/new"
                style={{
                  textDecoration: 'none',
                  color: '#111',
                  background: '#dfeedd',
                  border: '1px solid #bdd4bd',
                  borderRadius: 4,
                  padding: '8px 12px'
                }}
              >
                Add New Field
              </Link>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.name && (
              <span style={{ fontWeight: 500, color: '#333' }}>{user.name}</span>
            )}
            <button
              onClick={logout}
              style={{ padding: '8px 16px', cursor: 'pointer', background: '#edf6ed', border: '1px solid #c8dac8', borderRadius: 4 }}
            >
              Logout
            </button>
          </div>
        </nav>

        <h1 style={{ marginTop: 24, marginBottom: 16 }}>{title}</h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: '1 1 150px', padding: 16, border: '1px solid #cfe0cf', borderRadius: 6, background: '#edf7ed' }}>
            <div>Total Fields</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{total}</div>
          </div>
          <div style={{ flex: '1 1 150px', padding: 16, border: '1px solid #cfe0cf', borderRadius: 6, background: '#e6f4e6' }}>
            <div>Active</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{active}</div>
          </div>
          <div style={{ flex: '1 1 150px', padding: 16, border: '1px solid #cfe0cf', borderRadius: 6, background: '#eef6ea' }}>
            <div>At Risk</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{atRisk}</div>
          </div>
          <div style={{ flex: '1 1 150px', padding: 16, border: '1px solid #cfe0cf', borderRadius: 6, background: '#edf6ed' }}>
            <div>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{completed}</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 12 }}>{user.role === 'admin' ? 'All Fields' : 'My Assigned Fields'}</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #cfe0cf', borderRadius: 6, background: '#f7fcf7' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: user.role === 'admin' ? 760 : 620 }}>
            <thead>
              <tr style={{ background: '#e5f1e5' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Field Name</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Crop</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Stage</th>
                {user.role === 'admin' && <th style={{ padding: 12, textAlign: 'left' }}>Assigned Agent</th>}
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12 }}>
                    <strong>{f.name}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>ID: {f.id}</span>
                  </td>
                  <td style={{ padding: 12 }}>{f.crop_type}</td>
                  <td style={{ padding: 12 }}>
                    <strong>{f.current_stage}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {f.planting_date ? `Planted: ${new Date(f.planting_date).toLocaleDateString()}` : 'Not set'}
                    </span>
                  </td>
                  {user.role === 'admin' && (
                    <td style={{ padding: 12 }}>
                      {f.agent_name || 'Unassigned'}
                      <br />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{f.assigned_agent_id ? `ID: ${f.assigned_agent_id}` : 'Pending'}</span>
                    </td>
                  )}
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        backgroundColor: f.status === 'Active' ? '#d1fae5' : f.status === 'At Risk' ? '#fee2e2' : '#e5e7eb',
                        color: f.status === 'Active' ? '#065f46' : f.status === 'At Risk' ? '#991b1b' : '#374151'
                      }}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    {user.role === 'admin' ? (
                      <select onChange={e => assignAgent(f.id, Number(e.target.value))} style={{ padding: 8, width: '100%' }}>
                        <option value="">Assign...</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    ) : (
                      <button onClick={() => openUpdateModal(f)} style={{ padding: '8px 16px', cursor: 'pointer', background: '#edf6ed', border: '1px solid #c8dac8', borderRadius: 4 }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user.role === 'admin' && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ marginBottom: 12 }}>Recent Agent Updates</h2>
            <div style={{ border: '1px solid #cfe0cf', borderRadius: 6, background: '#f7fcf7' }}>
              {recentUpdates.length === 0 ? (
                <div style={{ padding: 16 }}>No field updates have been submitted yet.</div>
              ) : (
                recentUpdates.map(update => (
                  <div key={update.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Field</span>
                        <div><strong>{update.field_name}</strong></div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Updated</span>
                        <div>{new Date(update.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Agent</span>
                        <div>{update.agent_name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Stage</span>
                        <div><strong>{update.new_stage}</strong></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Notes</span>
                      <div style={{ background: '#e8f4e8', padding: 8, borderRadius: 4, marginTop: 4, border: '1px solid #d2e2d2' }}>
                        {update.notes || 'No notes'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {updateField && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 1000
            }}
          >
            <div style={{ background: '#f7fcf7', padding: 24, borderRadius: 8, width: 'min(100%, 420px)', border: '1px solid #cfe0cf', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Update Field Stage</h3>
              
              <div style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{updateField.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{updateField.crop_type}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Planted: {updateField.planting_date ? new Date(updateField.planting_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: '#e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 }}>Current</div>
                  <div style={{ fontWeight: 600, color: '#374151' }}>{updateField.current_stage || 'Not set'}</div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: 20 }}>→</div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: '#dfeedd', textAlign: 'center', border: '2px solid #22c55e' }}>
                  <div style={{ fontSize: 10, color: '#15803d', textTransform: 'uppercase', marginBottom: 2 }}>New</div>
                  <select 
                    value={newStage} 
                    onChange={e => setNewStage(e.target.value)} 
                    style={{ fontWeight: 600, color: '#15803d', background: 'transparent', border: 'none', textAlign: 'center', width: '100%', cursor: 'pointer' }}
                  >
                    <option value="Planted">Planted</option>
                    <option value="Growing">Growing</option>
                    <option value="Ready">Ready</option>
                    <option value="Harvested">Harvested</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Notes (optional)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Add notes about this update..."
                  style={{ width: '100%', padding: 10, minHeight: 80, borderRadius: 6, border: '1px solid #d1d5db' }} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setUpdateField(null); setNotes(''); }} 
                  style={{ padding: '10px 18px', cursor: 'pointer', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitUpdate} 
                  style={{ padding: '10px 18px', cursor: 'pointer', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500 }}
                >
                  Save Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
