// ── Render Module ──

function leagueColor(lid) { return LC[lid] || '#888'; }

function bcHTML(league) {
  const info = BROADCAST[league];
  if (!info || !info.p.length) return '';
  const tags = info.p.map(p => `<span class="bc-tag${info.free.includes(p)?' bc-free':''}">${p}</span>`).join('');
  const note = info.note ? `<span class="bc-note">${info.note}</span>` : '';
  return `<div class="bc-row">${tags}${note}</div>`;
}

function tagStyle(lid) {
  const c = leagueColor(lid);
  return `background:${c}22;color:${c}`;
}

// ── 統一 status 判斷（相容各 API 回傳格式）──
function isLiveStatus(s)  { return ['live','inprogress','in_progress','in progress'].includes((s||'').toLowerCase()); }
function isFinalStatus(s) { return ['final','closed','ft','finished','complete'].includes((s||'').toLowerCase()); }
function isSchedStatus(s) { return ['scheduled','pre_game','pregame','upcoming'].includes((s||'').toLowerCase()); }

function cardHTML(g) {
  const bc = bcHTML(g.league);
  if (g.singleEvent) {
    return `<div class="game-card">
      <div class="game-meta">
        <span class="league-tag" style="${tagStyle(g.league)}">${g.league}</span>
        <span class="status-time">${g.time||''}</span>
      </div>
      <div class="single-title">${g.title||''}</div>
      ${g.subtitle?`<div class="single-sub">${g.subtitle}</div>`:''}
      ${bc}
    </div>`;
  }
  const isl = isLiveStatus(g.status);
  const isf = isFinalStatus(g.status);
  const show = isl || isf;
  const aw = isf && g.winner === 'away';
  const hw = isf && g.winner === 'home';
  const isFav = Settings.favTeams.includes(g.away) || Settings.favTeams.includes(g.home);
  return `<div class="game-card${isl?' is-live':''}">
    <div class="game-meta">
      <div style="display:flex;align-items:center;gap:5px">
        <span class="league-tag" style="${tagStyle(g.league)}">${g.league}</span>
        ${isFav?'<span style="font-size:11px">⭐</span>':''}
      </div>
      ${isl?`<span class="status-live">● ${g.liveInfo||'LIVE'}</span>`:isf?`<span class="status-final">FINAL</span>`:`<span class="status-time">${g.time||''}</span>`}
    </div>
    <div class="teams">
      <div class="team-row">
        <span class="team-name${aw?' winner':isf?' loser':''}">${g.away||''}</span>
        ${show?`<span class="team-score${aw?' winner':isf?' loser':''}">${g.awayScore??'-'}</span>`:''}
      </div>
      <div class="team-row">
        <span class="team-name${hw?' winner':isf?' loser':''}">${g.home||''}</span>
        ${show?`<span class="team-score${hw?' winner':isf?' loser':''}">${g.homeScore??'-'}</span>`:''}
      </div>
    </div>
    ${bc}
  </div>`;
}

function standingsHTML(blocks, filterLid) {
  let list = blocks;
  if (filterLid && filterLid !== 'all') list = blocks.filter(b => b.lid === filterLid);
  if (!list.length) return '<div class="empty"><div class="empty-icon">📊</div>暫無排行資料</div>';
  return list.map(b => {
    const c = leagueColor(b.lid);
    const rows = b.rows.map((r, i) => `<tr>
      <td><div class="team-cell">
        <span class="rank-num">${i+1}</span>
        <div class="team-dot" style="background:${c}"></div>
        <span>${r[0]}</span>
      </div></td>
      ${r.slice(1).map(v=>`<td>${v}</td>`).join('')}
    </tr>`).join('');
    return `<div class="standings-block">
      <div class="standings-label" style="color:${c}">${b.label}</div>
      <table class="standings-table">
        <tr>${b.headers.map(h=>`<th>${h}</th>`).join('')}</tr>
        ${rows}
      </table>
    </div>`;
  }).join('');
}

function scheduleHTML(games, view, league) {
  const T = Settings.t();
  let list = games.filter(g => {
    if (!Settings.enabledLeagues.has(g.league)) return false;
    if (!g.singleEvent && !g.title && (!g.away || !g.home)) return false;
    return true;
  });
  if (league && league !== 'all') list = list.filter(g => g.league === league);

  const live  = list.filter(g => isLiveStatus(g.status));
  const sched = list.filter(g => isSchedStatus(g.status));
  const fin   = list.filter(g => isFinalStatus(g.status));
  let h = '';
  if (live.length)  h += `<div class="sec-label">${T.live_now}</div>` + live.map(cardHTML).join('');
  if (sched.length) h += `<div class="sec-label">${T.upcoming}</div>` + sched.map(cardHTML).join('');
  if (fin.length)   h += `<div class="sec-label">${T.finished}</div>` + fin.map(cardHTML).join('');
  return h || `<div class="empty"><div class="empty-icon">📭</div>${T.no_games}</div>`;
}

function skeletonHTML() {
  return `<div class="skeleton-wrap"><div class="sk-card"></div><div class="sk-card"></div><div class="sk-card"></div></div>`;
}
