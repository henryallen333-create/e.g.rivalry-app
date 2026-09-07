'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const CATEGORIES = ['Cardio', 'Upper body', 'Core'];

export default function LogActivity() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [trackerName, setTrackerName] = useState('');
  const [category, setCategory] = useState('Cardio');
  const [minutes, setMinutes] = useState(30);
  const [withFriend, setWithFriend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function connectTracker(name) {
    // NOTE: this is a placeholder. Real integration means implementing
    // each provider's OAuth flow (Strava's is the most approachable —
    // see https://developers.strava.com/docs/getting-started/) and
    // pulling actual synced sessions instead of letting the user type
    // a duration in. Wiring that up is the next real engineering step.
    setTrackerName(name);
    setConnected(true);
  }

  const base = 2;
  const bonus = Math.floor(minutes / 15);
  const mult = category === 'Cardio' ? 2 : 1;
  const total = (base + bonus) * mult;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('activities').insert({
      user_id: session.user.id,
      category,
      minutes,
      points: total,
      tracker_source: trackerName,
      with_friend: withFriend,
      confirmed: !withFriend,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="shell">
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Log an activity</h1>

      {!connected && (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            Connect a tracker to log activities — this keeps scores trustworthy.
            (This demo skips real OAuth; see the code comment for what a real
            integration needs.)
          </p>
          {['Strava', 'Apple Health', 'Garmin', 'Google Fit'].map((name) => (
            <button key={name} className="btn secondary" style={{ marginBottom: 8 }} onClick={() => connectTracker(name)}>
              Connect {name}
            </button>
          ))}
        </>
      )}

      {connected && (
        <>
          <p className="muted" style={{ marginBottom: 12 }}>Synced via {trackerName}</p>

          <p className="muted" style={{ margin: '0 0 6px' }}>Category</p>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <p className="muted" style={{ margin: '0 0 6px' }}>Duration (minutes)</p>
          <input
            className="field"
            type="number"
            min={5}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0 16px', fontSize: 13 }}>
            <input type="checkbox" checked={withFriend} onChange={(e) => setWithFriend(e.target.checked)} />
            I did this with a friend (needs their confirmation)
          </label>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base</span><span>{base} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Duration bonus</span><span>+{bonus} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 6 }}>
              <span>Total{mult === 2 ? ' (2x cardio)' : ''}</span><span>{total} pts</span>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save activity'}
          </button>
        </>
      )}
    </div>
  );
}
