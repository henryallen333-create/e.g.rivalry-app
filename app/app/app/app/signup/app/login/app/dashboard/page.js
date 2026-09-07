'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function daysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [activities, setActivities] = useState([]);
  const [rank, setRank] = useState(null);
  const [leagueSize, setLeagueSize] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUsername(profileData?.username || '');

      const monthStart = startOfMonthISO();

      const { data: myActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false });
      setActivities(myActivities || []);

      // Everyone's monthly totals, to work out this user's rank.
      const { data: allActivities } = await supabase
        .from('activities')
        .select('user_id, points')
        .eq('confirmed', true)
        .gte('created_at', monthStart);

      if (allActivities) {
        const totals = {};
        allActivities.forEach((a) => { totals[a.user_id] = (totals[a.user_id] || 0) + a.points; });
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const position = sorted.findIndex(([uid]) => uid === session.user.id);
        setRank(position >= 0 ? position + 1 : null);
        setLeagueSize(sorted.length);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return <div className="shell"><p className="muted">Loading your dashboard…</p></div>;
  }

  const monthlyPoints = activities.reduce((sum, a) => sum + a.points, 0);
  const byCategory = activities.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + a.points;
    return acc;
  }, {});

  return (
    <div className="shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>{username ? `Hey ${username}` : 'Dashboard'}</h1>
        <button className="btn secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: 0 }}>Points this month</p>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 44, margin: '4px 0 0' }}>{monthlyPoints}</p>
        {rank && (
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Ranked #{rank} of {leagueSize} · {daysLeftInMonth()} days left this month
          </p>
        )}
      </div>

      <div className="card">
        <p className="muted" style={{ margin: '0 0 10px' }}>By category this month</p>
        {Object.keys(byCategory).length === 0 && (
          <p className="muted" style={{ margin: 0 }}>Nothing logged yet this month.</p>
        )}
        {Object.entries(byCategory).map(([cat, pts]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{cat}</span>
            <strong>{pts} pts</strong>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="muted" style={{ margin: '0 0 10px' }}>Recent activities</p>
        {activities.length === 0 && <p className="muted" style={{ margin: 0 }}>Nothing here yet.</p>}
        {activities.slice(0, 5).map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{a.category} · {a.minutes} min</span>
            <span>{a.points} pts</span>
          </div>
        ))}
      </div>

      <a href="/log" className="btn" style={{ display: 'block', textAlign: 'center', marginBottom: 10 }}>
        Log an activity
      </a>
      <a href="/standings" className="btn secondary" style={{ display: 'block', textAlign: 'center' }}>
        View monthly standings
      </a>
    </div>
  );
}
