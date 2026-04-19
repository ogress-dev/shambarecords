"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #4b5563',
  borderRadius: '4px',
  boxSizing: 'border-box' as const,
  backgroundColor: '#fff'
};

const buttonStyle = {
  padding: '10px 20px',
  background: '#dfeedd',
  border: '1px solid #bdd4bd',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }

      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } catch {
      setError('Unable to reach the login service');
    }
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
      <div
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >
        <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>Crop Field Monitoring</h1>
            <p style={{ margin: 0, color: '#4b5563' }}>
              Simple seasonal field tracking focused on meeting the assessment objectives clearly.
            </p>
          </div>

          <div
            style={{
              padding: '16px 18px',
              border: '1px solid #cfe0cf',
              borderRadius: '8px',
              background: '#e9f4e9',
              lineHeight: 1.6
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Project Note</p>
            <p style={{ margin: '10px 0 0 0' }}>
              This implementation was intentionally kept simple. The focus was placed on usable flows,
              working business logic, PostgreSQL as the relational database, and Next.js for the application structure.
            </p>
            <p style={{ margin: '10px 0 0 0' }}>
              Complex styling was not the priority for this submission.
            </p>
            <p style={{ margin: '10px 0 0 0' }}>
              Developed by <strong>Ogres Murathimi</strong> (<strong>Full Stack Developer</strong>).
            </p>
          </div>

          <div
            style={{
              padding: '16px 18px',
              border: '1px solid #cfe0cf',
              borderRadius: '8px',
              background: '#f5fbf5'
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Demo Users</p>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <p style={{ margin: 0 }}><strong>Admin:</strong> admin@example.com / admin123</p>
              <p style={{ margin: 0 }}><strong>Agent:</strong> agent@example.com / agent123</p>
              <p style={{ margin: 0 }}><strong>Agent 1:</strong> agent1@example.com / agent123</p>
              <p style={{ margin: 0 }}><strong>Agent 2:</strong> agent2@example.com / agent123</p>
              <p style={{ margin: 0 }}><strong>Agent 3:</strong> agent3@example.com / agent123</p>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <div
            style={{
              padding: '20px',
              border: '1px solid #cfe0cf',
              borderRadius: '8px',
              background: '#f7fcf7',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 6px 0' }}>Login</h2>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>
                Sign in as an admin or field agent to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button type="submit" style={buttonStyle}>Login</button>
            </form>

            {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
