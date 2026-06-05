// ── App Controller ──

const App = {
  sport: 'baseball',
  league: 'all',
  view: 'schedule',
  cache: {},

  async init() {
    this.bindSportNav();
    this.bindViewBar();
    this.bindBottomNav();
    this.bindSettings();
    this.renderLeagueBar();
    await this.loadAndRender();
    this.startAutoRefresh();
    this.loadMeta();
  },

  bindSportNav() {
    document.getElementById('sport-nav').addEventListener('click', async e => {
      const btn = e.target.closest('.sport-btn');
      if (!btn) return;
      this.sport = btn.dataset.sport;
      this.league = 'all';
      document.querySelectorAll('.sport-btn').forEach(b => b.classList.toggle('active', b === btn));
      this.renderLeagueBar();
      await this.loadAndRender();
    });
  },

  bindViewBar() {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.view = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === this.view));
        await this.loadAndRender();
      });
    });
  },

  bindBottomNav() {
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.view = btn.dataset.view;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === this.view));
        await this.loadAndRender();
      });
    });
  },

  bindSettings() {
    document.getElementById('settings-nav-btn').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('open');
      renderSettingsPanel();
    });
    document.getElementById('settings-close').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.remove('open');
      this.cache = {};
      this.loadAndRender();
    });
  },

  renderLeagueBar() {
    const bar = document.getElementById('league-bar');
    const ls = SPORT_LEAGUES[this.sport] || [];
    bar.innerHTML = ls.map(l =>
      `<button class="league-pill${l.id === this.league ? ' active' : ''}" data-l="${l.id}">${l.l}</button>`
    ).join('');
    bar.querySelectorAll('.league-pill').forEach(pill => {
      pill.addEventListener('click', async () => {
        this.league = pill.dataset.l;
        bar.querySelectorAll('.league-pill').forEach(p => p.classList.toggle('active', p === pill));
        await this.loadAndRender();
      });
    });
  },

  showLoading() {
    document.getElementById('content').innerHTML = skeletonHTML();
  },

  async loadAndRender() {
    if (this.view === 'favorites') { await this.renderFavorites(); return; }
    this.showLoading();
    try {
      const { games, standings } = await this.fetchData();
      const el = document.getElementById('content');
      if (this.view === 'standings') {
        el.innerHTML = `<div class="content-inner">${standingsHTML(standings, this.league)}</div>`;
      } else {
        el.innerHTML = `<div class="content-inner">${scheduleHTML(games, this.view, this.league)}</div>`;
      }
    } catch(e) {
      document.getElementById('content').innerHTML = `<div class="error-box">⚠️ 資料載入失敗：${e.message}</div>`;
    }
  },

  async loadJSON(file) {
    try {
      const res = await fetch(`/data/${file}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } catch { return null; }
  },

  async fetchData() {
    const key = `${this.sport}_${this.view}_${this.league}`;
    if (this.cache[key] && Date.now() - this.cache[key].ts < 60000) return this.cache[key].data;

    let games = [], standings = [];

    if (this.sport === 'baseball') {
      const [mlb, cpbl, npb] = await Promise.all([this.loadJSON('mlb.json'), this.loadJSON('cpbl.json'), this.loadJSON('npb.json')]);
      games = [...(mlb?.schedule||[]), ...(cpbl?.schedule||[]), ...(npb?.schedule||[])];
      standings = mlb?.standings?.length ? mlb.standings : [];
      // 補上靜態排行（中職、日職）
      if (this.view === 'standings') {
        const extra = STATIC_STANDINGS.baseball.filter(s => s.lid !== 'MLB');
        standings = [...standings, ...extra];
      }
    }
    else if (this.sport === 'basketball') {
      const [nba, wnba, tpbl, plg, cba, bl] = await Promise.all([
        this.loadJSON('nba.json'), this.loadJSON('wnba.json'), this.loadJSON('tpbl.json'),
        this.loadJSON('plg.json'), this.loadJSON('cba.json'), this.loadJSON('bleague.json'),
      ]);
      games = [...(nba?.schedule||[]), ...(wnba?.schedule||[]), ...(tpbl?.schedule||[]),
               ...(plg?.schedule||[]), ...(cba?.schedule||[]), ...(bl?.schedule||[])];
      standings = STATIC_STANDINGS.basketball;
    }
    else if (this.sport === 'soccer') {
      const soccer = await this.loadJSON('soccer.json');
      games = soccer?.schedule || [];
      standings = STATIC_STANDINGS.soccer;
    }
    else if (this.sport === 'f1') {
      const f1 = await this.loadJSON('f1.json');
      games = f1?.schedule || [];
      standings = f1?.standings || [];
    }
    else if (this.sport === 'tennis') {
      const tennis = await this.loadJSON('tennis.json');
      games = tennis?.schedule || [];
      standings = STATIC_STANDINGS.tennis;
    }

    const data = { games, standings };
    this.cache[key] = { ts: Date.now(), data };
    return data;
  },

  async renderFavorites() {
    const el = document.getElementById('content');
    if (!Settings.favTeams.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">⭐</div>還沒有追蹤的球隊<br><span style="font-size:11px;color:var(--text3);margin-top:8px;display:block">點右下角設定新增</span></div>`;
      return;
    }
    el.innerHTML = skeletonHTML();
    const sports = ['baseball','basketball','soccer','f1','tennis'];
    let all = [];
    for (const s of sports) {
      const origSport = this.sport;
      this.sport = s;
      try { const {games} = await this.fetchData(); all = [...all, ...games]; } catch {}
      this.sport = origSport;
    }
    const fav = all.filter(g => Settings.favTeams.includes(g.away)||Settings.favTeams.includes(g.home));
    if (!fav.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>追蹤球隊今日無賽事</div>`; return; }
    const live=fav.filter(g=>g.status==='live'), sched=fav.filter(g=>g.status==='scheduled'), fin=fav.filter(g=>g.status==='final');
    let h = '<div class="content-inner">';
    if (live.length)  h += `<div class="sec-label">🔴 直播中</div>` + live.map(cardHTML).join('');
    if (sched.length) h += `<div class="sec-label">即將開賽</div>` + sched.map(cardHTML).join('');
    if (fin.length)   h += `<div class="sec-label">已結束</div>` + fin.map(cardHTML).join('');
    el.innerHTML = h + '</div>';
  },

  startAutoRefresh() {
    setInterval(() => { this.cache = {}; this.loadAndRender(); }, 60000);
  },

  async loadMeta() {
    const meta = await this.loadJSON('meta.json');
    const el = document.getElementById('upd-time');
    if (el && meta?.updatedAtTaipei) el.textContent = `更新 ${meta.updatedAtTaipei.slice(11,16)}`;
    else if (el) el.textContent = new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false});
  },
};

// ── Settings Panel ──
function renderSettingsPanel() {
  const avail = FAV_TEAMS_LIST.filter(t => !Settings.favTeams.includes(t));
  document.getElementById('settings-body').innerHTML = `
    <div class="sg">
      <div class="sg-title">顯示聯賽 &amp; 顏色</div>
      ${ALL_LEAGUES_CFG.map(l => {
        const c = LC[l.id]||'#888', on = Settings.enabledLeagues.has(l.id);
        return `<div class="lcheck">
          <div class="lcheck-l"><div><div class="lname">${l.id}</div><div class="lsport">${l.s}</div></div></div>
          <div class="lcheck-r">
            <div class="cswatch" style="background:${c}">
              <input type="color" value="${c}" onchange="chColor('${l.id}',this.value)" oninput="chColor('${l.id}',this.value)">
            </div>
            <div class="toggle${on?' on':''}" onclick="togLeague('${l.id}',this)"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="sg">
      <div class="sg-title">追蹤球隊</div>
      ${Settings.favTeams.map(t=>`
        <div class="fav-item">
          <span>⭐ ${t}</span>
          <button class="fav-rm" onclick="rmFav('${t}')">✕</button>
        </div>`).join('')}
      <div class="fadd-row">
        <select class="fsel" id="fsel">${avail.map(t=>`<option>${t}</option>`).join('')}</select>
        <button class="fadd-btn" onclick="addFav()">+ 新增</button>
      </div>
    </div>
    <div class="sg">
      <div class="sg-title">語言</div>
      <div class="lang-grid">
        ${[['zh','🇹🇼 中文'],['en','🇺🇸 English'],['ja','🇯🇵 日本語'],['ko','🇰🇷 한국어'],['fr','🇫🇷 Français']].map(([id,l])=>
          `<div class="lang-btn" onclick="alert('語言切換功能開發中')">${l}</div>`).join('')}
      </div>
    </div>
    <div class="sg">
      <div class="sg-title">時區</div>
      <select class="tz-sel">
        ${[['Asia/Taipei','🇹🇼 台灣 UTC+8'],['Asia/Tokyo','🇯🇵 日本 UTC+9'],['America/New_York','🇺🇸 紐約 UTC-5'],['America/Los_Angeles','🇺🇸 洛杉磯 UTC-8'],['Europe/London','🇬🇧 倫敦 UTC+0']].map(([v,l])=>
          `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
  `;
}

function chColor(id, c) { LC[id]=c; document.querySelectorAll(`input[type=color]`).forEach(el=>{ if(el.closest('.lcheck')?.querySelector('.lname')?.textContent===id) el.parentElement.style.background=c; }); }
function togLeague(id, el) { if(Settings.enabledLeagues.has(id)) Settings.enabledLeagues.delete(id); else Settings.enabledLeagues.add(id); el.classList.toggle('on'); Settings.save(); }
function addFav() { const v=document.getElementById('fsel')?.value; if(v&&!Settings.favTeams.includes(v)){Settings.favTeams.push(v);Settings.save();renderSettingsPanel();} }
function rmFav(t) { Settings.favTeams=Settings.favTeams.filter(x=>x!==t); Settings.save(); renderSettingsPanel(); }

document.addEventListener('DOMContentLoaded', () => App.init());
