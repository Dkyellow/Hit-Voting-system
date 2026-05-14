// ─────────────────────────────────────────────────────────────
//  js/app.js  —  UI logic, wired to db.js
// ─────────────────────────────────────────────────────────────

// ── State ─────────────────────────────────────────────────────
let myVote  = null;   // 'A' | 'B' | null
let counts  = { A: 0, B: 0 };

// ── Initialise ────────────────────────────────────────────────
async function init() {
  showState('loading');

  // Apply poll config labels
  document.getElementById('questionText').textContent = POLL_CONFIG.question;
  document.getElementById('nameA').textContent        = POLL_CONFIG.candidateA;
  document.getElementById('nameB').textContent        = POLL_CONFIG.candidateB;
  document.getElementById('resultNameA').textContent  = POLL_CONFIG.candidateA;
  document.getElementById('resultNameB').textContent  = POLL_CONFIG.candidateB;
  document.getElementById('avatarA').textContent      = POLL_CONFIG.candidateA[0];
  document.getElementById('avatarB').textContent      = POLL_CONFIG.candidateB[0];

  try {
    // Fetch initial data in parallel
    [counts, myVote] = await Promise.all([
      db_getVotes(),
      db_getMyVote(),
    ]);

    renderPoll();
    await renderFeed();
    showState('content');

    // Start real-time subscription
    db_subscribeToVotes(handleRealtimeEvent);

  } catch (err) {
    console.error('Init error:', err);
    showState('error');
  }
}

// ── Real-time handler ─────────────────────────────────────────
async function handleRealtimeEvent(payload) {
  // Re-fetch counts from DB (most reliable approach)
  try {
    counts = await db_getVotes();
    renderBars();
    await renderFeed();

    // If it was an external vote, add a subtle feed flash
    if (payload.eventType === 'INSERT') {
      const c = payload.new.candidate;
      const name = c === 'A' ? POLL_CONFIG.candidateA : POLL_CONFIG.candidateB;
      // Feed already updated; just refresh bars + total
    }
  } catch (err) {
    console.error('Realtime update error:', err);
  }
}

// ── Cast Vote ─────────────────────────────────────────────────
async function castVote(candidate) {
  if (myVote) {
    showToast("You've already voted!");
    return;
  }

  // Optimistic UI update
  counts[candidate]++;
  myVote = candidate;
  renderPoll();

  try {
    await db_castVote(candidate);
    const name = candidate === 'A' ? POLL_CONFIG.candidateA : POLL_CONFIG.candidateB;
    showToast(`✓ Voted for ${name}!`);

    // Pulse the bar
    const bar = document.getElementById('bar' + candidate);
    bar.classList.remove('pulse');
    void bar.offsetWidth;
    bar.classList.add('pulse');

  } catch (err) {
    // Rollback optimistic update
    counts[candidate]--;
    myVote = null;
    renderPoll();

    if (err.message === 'already_voted') {
      showToast("You've already voted!");
    } else {
      console.error('Vote error:', err);
      showToast('⚠️ Failed to save vote. Try again.');
    }
  }
}

// ── Reset Poll ────────────────────────────────────────────────
async function resetPoll() {
  if (!confirm('Reset all votes? This cannot be undone.')) return;

  try {
    await db_resetVotes();
    counts = { A: 0, B: 0 };
    myVote = null;
    renderPoll();
    renderFeed();
    showToast('Poll has been reset.');
  } catch (err) {
    console.error('Reset error:', err);
    showToast('⚠️ Reset failed. Check Supabase RLS policies.');
  }
}

// ── Render Helpers ────────────────────────────────────────────
function renderPoll() {
  renderBars();
  renderVotedState();
}

function renderBars() {
  const total = counts.A + counts.B;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);

  document.getElementById('barA').style.width   = pct(counts.A) + '%';
  document.getElementById('barB').style.width   = pct(counts.B) + '%';
  document.getElementById('statsA').textContent = `${counts.A} vote${counts.A !== 1 ? 's' : ''} · ${pct(counts.A)}%`;
  document.getElementById('statsB').textContent = `${counts.B} vote${counts.B !== 1 ? 's' : ''} · ${pct(counts.B)}%`;
  document.getElementById('totalVotes').textContent = total;
}

function renderVotedState() {
  const pollContent = document.getElementById('pollContent');
  const btnA = document.getElementById('btnA');
  const btnB = document.getElementById('btnB');

  // Remove old voted classes
  pollContent.classList.remove('voted-A', 'voted-B');
  btnA.disabled = false;
  btnB.disabled = false;

  if (myVote) {
    pollContent.classList.add('voted-' + myVote);
    btnA.disabled = true;
    btnB.disabled = true;
  }
}

async function renderFeed() {
  const list = document.getElementById('feedList');
  try {
    const rows = await db_getRecentVotes(8);
    if (!rows || rows.length === 0) {
      list.innerHTML = '<li class="feed-item muted">No votes yet…</li>';
      return;
    }

    list.innerHTML = rows.map(row => {
      const c    = row.candidate;
      const name = c === 'A' ? POLL_CONFIG.candidateA : POLL_CONFIG.candidateB;
      const time = timeAgo(new Date(row.created_at));
      return `<li class="feed-item ${c.toLowerCase()}">
        <span class="dot">●</span>
        Someone voted for <strong>${name}</strong>
        <span class="time">${time}</span>
      </li>`;
    }).join('');

  } catch (err) {
    console.error('Feed error:', err);
  }
}

// ── State Manager ─────────────────────────────────────────────
function showState(state) {
  document.getElementById('stateLoading').classList.toggle('hidden', state !== 'loading');
  document.getElementById('stateError').classList.toggle('hidden',   state !== 'error');
  document.getElementById('pollContent').classList.toggle('hidden',  state !== 'content');
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Time Ago Util ─────────────────────────────────────────────
function timeAgo(date) {
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs <  5)  return 'just now';
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
