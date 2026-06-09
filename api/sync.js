export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured on server.' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation',
  };

  // ── LOAD progress for a user ──────────────────────────────
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/progress?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      { headers }
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ found: false });
    }
    return res.status(200).json({ found: true, progress: data[0].data });
  }

  // ── SAVE progress for a user ──────────────────────────────
  if (req.method === 'POST') {
    const { userId, progress } = req.body;
    if (!userId || !progress) return res.status(400).json({ error: 'userId and progress required' });

    // Upsert — insert or update if already exists
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/progress`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          data: progress,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ saved: true });
    }
    return res.status(500).json({ error: JSON.stringify(data) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
