// ── App Controller ──

const App = {
  sport: 'baseball', league: 'all', view: 'schedule', cache: {},
  favCalView: 'week', // 'week' or 'month'
  favCalDate: new Date(),

  async init() {
    this.applyLang();
    this.bindSportNav();
    this.bindViewBar();
    this.bindBottomNav();
    this.bindSettings();
    this.renderLeagueBar();
    await this.loadAndRender();
    this.startAutoRefresh();
    this.loadMeta();
  },

  applyLang() {
    const T = Settings.t();
    document.querySelectorAll('.view-btn').forEach(b => { if(b.dataset.view) b.textContent = T[b.dataset.view] || b.textContent; });
    document.querySelectorAll('.nav-btn span').forEach(s => {
      const v = s.closest('.nav-btn')?.dataset.view;
      if (v && T[v]) s.textContent = T[v];
    });
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
      this.applyLang();
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

  showLoading() { document.getElementById('content').innerHTML = skeletonHTML(); },

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
      standings = [...(mlb?.standings||[]), ...STATIC_STANDINGS.baseball.filter(s=>s.lid!=='MLB')];
    } else if (this.sport === 'basketball') {
      const [nba,wnba,tpbl,plg,cba,bl] = await Promise.all([
        this.loadJSON('nba.json'),this.loadJSON('wnba.json'),this.loadJSON('tpbl.json'),
        this.loadJSON('plg.json'),this.loadJSON('cba.json'),this.loadJSON('bleague.json'),
      ]);
      games = [...(nba?.schedule||[]),...(wnba?.schedule||[]),...(tpbl?.schedule||[]),...(plg?.schedule||[]),...(cba?.schedule||[]),...(bl?.schedule||[])];
      standings = STATIC_STANDINGS.basketball;
    } else if (this.sport === 'soccer') {
      const soccer = await this.loadJSON('soccer.json');
      games = soccer?.schedule || [];
      standings = STATIC_STANDINGS.soccer;
    } else if (this.sport === 'f1') {
      const f1 = await this.loadJSON('f1.json');
      games = f1?.schedule || [];
      standings = f1?.standings || [];
    } else if (this.sport === 'tennis') {
      const tennis = await this.loadJSON('tennis.json');
      games = tennis?.schedule || [];
      standings = STATIC_STANDINGS.tennis;
    }
    if (this.league !== 'all') {
      games = games.filter(g => g.league === this.league);
      standings = standings.filter(s => s.lid === this.league);
    }
    const data = { games, standings };
    this.cache[key] = { ts: Date.now(), data };
    return data;
  },

  // ── 最愛頁面：月曆 / 週曆 ──
  async renderFavorites() {
    const el = document.getElementById('content');
    const T = Settings.t();
    if (!Settings.favTeams.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">⭐</div>${T.fav_empty}<br><span style="font-size:11px;color:var(--text3);margin-top:8px;display:block">${T.fav_hint}</span></div>`;
      return;
    }
    el.innerHTML = skeletonHTML();
    // 抓所有運動的資料
    const sports = ['baseball','basketball','soccer','f1','tennis'];
    let allGames = [];
    for (const s of sports) {
      const orig = this.sport; this.sport = s;
      try { const {games} = await this.fetchData(); allGames = [...allGames, ...games]; } catch {}
      this.sport = orig;
    }
    const favGames = allGames.filter(g => Settings.favTeams.includes(g.away)||Settings.favTeams.includes(g.home));
    el.innerHTML = `<div class="content-inner">${this.favCalHTML(favGames)}</div>`;
  },

  favCalHTML(games) {
    const T = Settings.t();
    const now = this.favCalDate;
    const viewToggle = `<div class="fav-cal-toolbar">
      <button class="fav-cal-nav" onclick="App.favCalPrev()">‹</button>
      <div class="fav-cal-btns">
        <button class="fav-cal-view-btn${this.favCalView==='week'?' on':''}" onclick="App.setFavCalView('week')">${T.week}</button>
        <button class="fav-cal-view-btn${this.favCalView==='month'?' on':''}" onclick="App.setFavCalView('month')">${T.month}</button>
      </div>
      <button class="fav-cal-nav" onclick="App.favCalNext()">›</button>
    </div>`;

    if (this.favCalView === 'week') return viewToggle + this.weekCalHTML(games, now);
    return viewToggle + this.monthCalHTML(games, now);
  },

  weekCalHTML(games, date) {
    const today = new Date(); today.setHours(0,0,0,0);
    const start = new Date(date); start.setDate(date.getDate() - date.getDay());
    const days = ['日','一','二','三','四','五','六'];
    const dateLabel = `${start.getMonth()+1}/${start.getDate()} – ${new Date(start.getTime()+6*86400000).getMonth()+1}/${new Date(start.getTime()+6*86400000).getDate()}`;
    let html = `<div class="fav-week-label">${dateLabel}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const isToday = d.toDateString() === today.toDateString();
      const ds = d.toDateString();
      const dayGames = games.filter(g => {
        try { return new Date(g.gameDate||g.time||'').toDateString()===ds; } catch { return false; }
      });
      html += `<div class="fav-week-day${isToday?' today':''}">
        <div class="fav-week-day-label">${days[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}${isToday?' ◀':''}</div>
        ${dayGames.length ? dayGames.map(cardHTML).join('') : `<div class="fav-week-empty">—</div>`}
      </div>`;
    }
    return html;
  },

  monthCalHTML(games, date) {
    const today = new Date(); today.setHours(0,0,0,0);
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y,m,1).getDay(), daysInMonth = new Date(y,m+1,0).getDate();
    const monthName = new Date(y,m,1).toLocaleDateString('zh-TW',{year:'numeric',month:'long'});
    // 建立每天有哪些追蹤賽事的map
    const gameMap = {};
    games.forEach(g => {
      try {
        const gd = new Date(g.gameDate||g.time||'');
        if (isNaN(gd)) return;
        const key = `${gd.getFullYear()}-${gd.getMonth()}-${gd.getDate()}`;
        if (!gameMap[key]) gameMap[key] = [];
        gameMap[key].push(g);
      } catch {}
    });
    const days = ['日','一','二','三','四','五','六'];
    let html = `<div class="fav-month-label">${monthName}</div>
    <div class="fav-month-grid">
      ${days.map(d=>`<div class="fav-month-dow">${d}</div>`).join('')}`;
    for (let i=0;i<first;i++) html += `<div class="fav-month-cell empty"></div>`;
    for (let d=1;d<=daysInMonth;d++) {
      const key = `${y}-${m}-${d}`;
      const isToday = y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate();
      const dayGames = gameMap[key]||[];
      const dots = dayGames.slice(0,3).map(g=>`<div class="fav-dot" style="background:${LC[g.league]||'#888'}"></div>`).join('');
      html += `<div class="fav-month-cell${isToday?' today':''}" onclick="App.showDayGames(${y},${m},${d})">
        <div class="fav-cell-num">${d}</div>
        ${dots?`<div class="fav-dots">${dots}</div>`:''}
      </div>`;
    }
    html += `</div>`;
    // 選中日期的賽事列表
    const selKey = `${y}-${m}-${today.getDate()}`;
    const selGames = gameMap[selKey]||[];
    if (selGames.length) html += `<div class="fav-day-games">${selGames.map(cardHTML).join('')}</div>`;
    return html;
  },

  showDayGames(y,m,d) {
    const key = `${y}-${m}-${d}`;
    // 重新渲染，傳入選中日期
    this.favCalDate = new Date(y,m,d);
    this.renderFavorites();
  },

  favCalPrev() {
    if (this.favCalView==='week') this.favCalDate.setDate(this.favCalDate.getDate()-7);
    else this.favCalDate.setMonth(this.favCalDate.getMonth()-1);
    this.renderFavorites();
  },
  favCalNext() {
    if (this.favCalView==='week') this.favCalDate.setDate(this.favCalDate.getDate()+7);
    else this.favCalDate.setMonth(this.favCalDate.getMonth()+1);
    this.renderFavorites();
  },
  setFavCalView(v) { this.favCalView=v; this.renderFavorites(); },

  startAutoRefresh() { setInterval(()=>{this.cache={};this.loadAndRender();},60000); },

  async loadMeta() {
    const meta = await this.loadJSON('meta.json');
    const el = document.getElementById('upd-time');
    if (el && meta?.updatedAtTaipei) el.textContent=`更新 ${meta.updatedAtTaipei.slice(11,16)}`;
    else if (el) el.textContent=new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false});
  },
};

// ── Settings Panel ──
// 追蹤球隊三層選擇狀態
let selSport=null, selLeague=null;

function renderSettingsPanel() {
  const T = Settings.t();
  document.getElementById('settings-body').innerHTML = `
    <div class="sg"><div class="sg-title">${T.display_leagues}</div>
      ${ALL_LEAGUES_CFG.map(l=>{
        const c=LC[l.id]||'#888', on=Settings.enabledLeagues.has(l.id);
        return `<div class="lcheck">
          <div class="lcheck-l"><div><div class="lname">${l.id}</div><div class="lsport">${l.s}</div></div></div>
          <div class="lcheck-r">
            <div class="cswatch" style="background:${c}"><input type="color" value="${c}" onchange="chColor('${l.id}',this.value)" oninput="chColor('${l.id}',this.value)"></div>
            <div class="toggle${on?' on':''}" onclick="togLeague('${l.id}',this)"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="sg"><div class="sg-title">${T.fav_teams}</div>
      <div id="fav-teams-list"></div>
      <div class="fav-picker" id="fav-picker"></div>
    </div>
    <div class="sg"><div class="sg-title">${T.language}</div>
      <div class="lang-grid">
        ${[['zh','🇹🇼 中文'],['en','🇺🇸 English'],['ja','🇯🇵 日本語'],['ko','🇰🇷 한국어'],['fr','🇫🇷 Français']].map(([id,l])=>
          `<div class="lang-btn${Settings.lang===id?' on':''}" onclick="setLang('${id}')">${l}</div>`).join('')}
      </div>
    </div>
    <div class="sg"><div class="sg-title">${T.timezone}</div>
      <select class="tz-sel" onchange="setTZ(this.value)">
        ${TIMEZONES.map(tz=>`<option value="${tz.v}"${Settings.tz===tz.v?' selected':''}>${tz.l}</option>`).join('')}
      </select>
    </div>`;
  renderFavList();
  renderFavPicker();
}

function renderFavList() {
  const el = document.getElementById('fav-teams-list');
  if (!el) return;
  el.innerHTML = Settings.favTeams.map(t=>`
    <div class="fav-item"><span>⭐ ${t}</span><button class="fav-rm" onclick="rmFav('${t}')">✕</button></div>`
  ).join('') || '';
}

function renderFavPicker() {
  const el = document.getElementById('fav-picker');
  if (!el) return;
  const T = Settings.t();
  if (!selSport) {
    // 第一層：選運動
    el.innerHTML = `<div class="picker-label">${T.select_sport}</div>
      <div class="picker-grid">
        ${Object.keys(TEAMS_BY_SPORT).map(s=>`<button class="picker-btn" onclick="pickSport('${s}')">${s}</button>`).join('')}
      </div>`;
  } else if (!selLeague) {
    // 第二層：選聯盟
    el.innerHTML = `<button class="picker-back" onclick="pickSport(null)">← ${T.back}</button>
      <div class="picker-label">${selSport} › ${T.select_league}</div>
      <div class="picker-grid">
        ${Object.keys(TEAMS_BY_SPORT[selSport]).map(l=>`<button class="picker-btn" onclick="pickLeague('${l}')">${l}</button>`).join('')}
      </div>`;
  } else {
    // 第三層：選球隊
    const teams = TEAMS_BY_SPORT[selSport][selLeague]||[];
    el.innerHTML = `<button class="picker-back" onclick="pickLeague(null)">← ${T.back}</button>
      <div class="picker-label">${selLeague} › ${T.select_team}</div>
      <div class="picker-teams">
        ${teams.filter(t=>!Settings.favTeams.includes(t)).map(t=>`<button class="picker-team-btn" onclick="addFav('${t.replace(/'/g,"\\'")}')">+ ${t}</button>`).join('')}
      </div>`;
  }
}

function pickSport(s) { selSport=s; selLeague=null; renderFavPicker(); }
function pickLeague(l) { selLeague=l; renderFavPicker(); }
function addFav(t) { if(!Settings.favTeams.includes(t)){Settings.favTeams.push(t);Settings.save();renderFavList();renderFavPicker();} }
function rmFav(t) { Settings.favTeams=Settings.favTeams.filter(x=>x!==t); Settings.save(); renderFavList(); }
function chColor(id,c) { LC[id]=c; document.querySelectorAll('.lcheck').forEach(el=>{ if(el.querySelector('.lname')?.textContent===id) el.querySelector('.cswatch').style.background=c; }); }
function togLeague(id,el) { if(Settings.enabledLeagues.has(id))Settings.enabledLeagues.delete(id);else Settings.enabledLeagues.add(id); el.classList.toggle('on'); Settings.save(); }
function setLang(l) { Settings.lang=l; Settings.save(); renderSettingsPanel(); }
function setTZ(v) { Settings.tz=v; Settings.save(); }

document.addEventListener('DOMContentLoaded', ()=>App.init());
