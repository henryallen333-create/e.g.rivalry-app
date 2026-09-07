'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function monthLabel() {
  return new Date().toLocaleString('default', { month: 'long' });
}

export default function Standings() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Monthly table: sums confirmed points logged since the 1st of this
      // month. Nothing needs to run to "reset" it — a new month just means
      // this query naturally starts from zero, since the filter is a date.
      // For a real multi-league app, add .eq('league_id', ...) here too.
      const { data, error } = await supabase
        .from('activities')
        .select('user_id, points, profiles(username)')
        .eq('confirmed', true)
        .gte('created_at', startOfMonthISO());

      if (!error && data) {
        const totals = {};
        data.forEach((row) => {
          const name = row.profiles?.username || 'Unknown';
          totals[name] = (totals[name] || 0) + row.points;
        });
        const sorted = Object.entries(totals)
          .map(([name, points]) => ({ name, points }))
          .sort((a, b) => b.points - a.points);
        setRows(sorted);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <div className="shell">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{monthLabel()} standings</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Total points logged this month. Resets automatically on the 1st.
      </p>

      {loading && <p className="muted">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="muted">No confirmed activities logged yet this month.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="card">
          {rows.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <span>{i + 1}. {r.name}</span>
              <strong>{r.points} pts</strong>
            </div>
          ))}
        </div>
      )}

      <a href="/dashboard" className="btn secondary" style={{ display: 'block', textAlign: 'center' }}>
        Back to dashboard
      </a>
    </div>
  );
}
