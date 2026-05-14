// ─────────────────────────────────────────────────────────────
//  js/db.js  —  All Supabase / database interactions
// ─────────────────────────────────────────────────────────────

// Initialise the Supabase client (uses globals from config.js)
// NOTE: named `supabaseClient` to avoid clashing with the `supabase`
// global that the CDN script exposes on window.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Session ID ────────────────────────────────────────────────
// A lightweight unique ID stored in sessionStorage so one browser
// tab = one vote.  Resets when the tab is closed.
function getSessionId() {
  let id = sessionStorage.getItem('vp_session');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
    sessionStorage.setItem('vp_session', id);
  }
  return id;
}

// ── DB API ────────────────────────────────────────────────────

/**
 * Fetch current vote counts for both candidates.
 * Returns: { A: number, B: number }
 */
async function db_getVotes() {
  const { data, error } = await supabaseClient
    .from('votes')
    .select('candidate');

  if (error) throw error;

  const counts = { A: 0, B: 0 };
  data.forEach(row => {
    if (row.candidate === 'A') counts.A++;
    if (row.candidate === 'B') counts.B++;
  });
  return counts;
}

/**
 * Check if this session has already voted.
 * Returns: 'A' | 'B' | null
 */
async function db_getMyVote() {
  const session_id = getSessionId();
  const { data, error } = await supabaseClient
    .from('votes')
    .select('candidate')
    .eq('session_id', session_id)
    .maybeSingle();

  if (error) throw error;
  return data ? data.candidate : null;
}

/**
 * Insert a vote row.
 * Returns: the inserted row.
 */
async function db_castVote(candidate) {
  const session_id = getSessionId();

  // Guard: prevent duplicate vote from same session
  const existing = await db_getMyVote();
  if (existing) throw new Error('already_voted');

  const { data, error } = await supabaseClient
    .from('votes')
    .insert([{ candidate, session_id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch the last N votes for the activity feed.
 * Returns: array of { candidate, created_at }
 */
async function db_getRecentVotes(limit = 8) {
  const { data, error } = await supabaseClient
    .from('votes')
    .select('candidate, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Delete all votes (admin reset).
 */
async function db_resetVotes() {
  const { error } = await supabaseClient
    .from('votes')
    .delete()
    .gte('id', 0); // matches all rows

  if (error) throw error;

  // Also clear the local session so the user can vote again
  sessionStorage.removeItem('vp_session');
}

/**
 * Subscribe to real-time INSERT events on the votes table.
 * onInsert(payload) is called for every new vote.
 * Returns the channel (call .unsubscribe() to stop).
 */
function db_subscribeToVotes(onInsert) {
  const channel = supabaseClient
    .channel('public:votes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes' },
      onInsert
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'votes' },
      onInsert   // reuse same handler; app will re-fetch counts
    )
    .subscribe();

  return channel;
}
