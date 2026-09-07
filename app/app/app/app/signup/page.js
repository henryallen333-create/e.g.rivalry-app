'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Supabase sends a confirmation email by default.
    router.push('/login?justSignedUp=1');
  }

  return (
    <div className="shell">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Create your account</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Start or join a league with your friends.
      </p>

      <form onSubmit={handleSignUp}>
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
