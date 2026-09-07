'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="shell" style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>RIVALRY</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Turn your workouts into a season. Track monthly points with your friends.
      </p>

      {session === undefined && <p className="muted">Loading…</p>}

      {session === null && (
        <>
          <a href="/signup" className="btn" style={{ display: 'block', marginBottom: 10 }}>
            Get started
          </a>
          <a href="/login" className="btn secondary" style={{ display: 'block' }}>
            Log in
          </a>
        </>
      )}

      {session && (
        <a href="/dashboard" className="btn" style={{ display: 'block' }}>
          Go to your dashboard
        </a>
      )}
    </div>
  );
}
