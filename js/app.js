// ── App Controller ──

const App = {
  sport: 'baseball', league: 'all', view: 'schedule', cache: {},
  favCalView: 'week', // 'week' or 'month'
  favCalDate: new Date(),

  async init() {
    this.applyLang();
    this.bindSportNav();
    this.bindBottomNav();
    this.bindSettings();
    this.renderLeagueBar();
    await this.loadAndRender();
    this.startAutoRefresh();
    this.loadMeta();
  },

  applyLang() {
    const T = Settings.t();
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

  bindBottomNav() {
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.view = btn.dataset.view;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b === btn));
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
      // 優先用API抓到的NBA排行，沒有才用靜態
      const nbaStandings = nba?.standings?.length ? nba.standings : STATIC_STANDINGS.basketball.filter(s=>s.lid==='NBA');
      const otherStandings = STATIC_STANDINGS.basketball.filter(s=>s.lid!=='NBA');
      standings = [...nbaStandings, ...otherStandings];
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
    // 抓所有運動資料
    const jsonFiles = ['mlb','cpbl','npb','nba','wnba','tpbl','plg','cba','bleague','soccer','f1','tennis'];
    let allGames = [];
    for (const f of jsonFiles) {
      const d = await this.loadJSON(`${f}.json`);
      if (d?.schedule) allGames = [...allGames, ...d.schedule];
    }
    // 篩選追蹤球隊的賽事（用包含比對，更寬鬆）
    const favGames = allGames.filter(g => {
      const awayName = (g.away || '').toLowerCase();
      const homeName = (g.home || '').toLowerCase();
      return Settings.favTeams.some(t => {
        const tl = t.toLowerCase();
        return awayName.includes(tl) || homeName.includes(tl) ||
               tl.includes(awayName) || tl.includes(homeName);
      });
    });
    // 把每場比賽的日期轉成台灣時間的 dateKey
    const gamesWithKey = favGames.map(g => {
      let dateKey = null;
      try {
        const raw = g.gameDate || g.start_time || g.time || '';
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d)) {
            const tw = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
            dateKey = `${tw.getFullYear()}-${tw.getMonth()}-${tw.getDate()}`;
          }
        }
      } catch {}
      return { ...g, _dateKey: dateKey };
    });
    this._favGames = gamesWithKey;
    el.innerHTML = `<div class="content-inner">${this.favCalHTML(gamesWithKey)}</div>`;
  },

  favCalHTML(games) {
    const T = Settings.t();
    const viewToggle = `<div class="fav-cal-toolbar">
      <button class="fav-cal-nav" onclick="App.favCalPrev()">‹</button>
      <div class="fav-cal-btns">
        <button class="fav-cal-view-btn${this.favCalView==='week'?' on':''}" onclick="App.setFavCalView('week')">${T.week}</button>
        <button class="fav-cal-view-btn${this.favCalView==='month'?' on':''}" onclick="App.setFavCalView('month')">${T.month}</button>
      </div>
      <button class="fav-cal-nav" onclick="App.favCalNext()">›</button>
    </div>`;
    if (this.favCalView === 'week') return viewToggle + this.weekCalHTML(games, this.favCalDate);
    return viewToggle + this.monthCalHTML(games, this.favCalDate);
  },

  weekCalHTML(games, date) {
    const today = new Date(); today.setHours(0,0,0,0);
    const start = new Date(date); start.setDate(date.getDate() - date.getDay());
    const days = ['日','一','二','三','四','五','六'];
    const endDate = new Date(start.getTime()+6*86400000);
    const label = `${start.getMonth()+1}/${start.getDate()} – ${endDate.getMonth()+1}/${endDate.getDate()}`;
    let html = `<div class="fav-week-label">${label}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const isToday = d.toDateString() === today.toDateString();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const dayGames = games.filter(g => g._dateKey === key);
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

    // 建立 dateKey → games 的 map
    const gameMap = {};
    games.forEach(g => {
      if (!g._dateKey) return;
      if (!gameMap[g._dateKey]) gameMap[g._dateKey] = [];
      gameMap[g._dateKey].push(g);
    });

    const days = ['日','一','二','三','四','五','六'];
    let html = `<div class="fav-month-label">${monthName}</div>
    <div class="fav-month-grid">
      ${days.map(d=>`<div class="fav-month-dow">${d}</div>`).join('')}`;
    for (let i=0;i<first;i++) html += `<div class="fav-month-cell empty"></div>`;

    // 選中的日期（預設今天）
    const selKey = this._selDayKey || `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    for (let d=1;d<=daysInMonth;d++) {
      const key = `${y}-${m}-${d}`;
      const isToday = y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate();
      const isSel = key === selKey;
      const dayGames = gameMap[key]||[];
      const dots = dayGames.slice(0,3).map(g=>`<div class="fav-dot" style="background:${LC[g.league]||'#888'}"></div>`).join('');
      html += `<div class="fav-month-cell${isToday?' today':''}${isSel?' sel':''}" onclick="App.showDayGames(${y},${m},${d})">
        <div class="fav-cell-num">${d}</div>
        ${dots?`<div class="fav-dots">${dots}</div>`:''}
      </div>`;
    }
    html += `</div>`;

    // 選中日期的賽事
    const selGames = gameMap[selKey]||[];
    if (selGames.length) {
      html += `<div class="fav-day-label">${parseInt(selKey.split('-')[2])}日賽事</div>`;
      html += `<div class="fav-day-games">${selGames.map(cardHTML).join('')}</div>`;
    } else {
      html += `<div class="fav-week-empty" style="padding:12px 0;text-align:center">今日無追蹤球隊賽事</div>`;
    }
    return html;
  },

  showDayGames(y, m, d) {
    this._selDayKey = `${y}-${m}-${d}`;
    const games = this._favGames || [];
    const el = document.getElementById('content');
    el.innerHTML = `<div class="content-inner">${this.favCalHTML(games)}</div>`;
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
  const sports = Object.keys(TEAMS_BY_SPORT);
  const curSport = selSport || sports[0];
  const leagues = Object.keys(TEAMS_BY_SPORT[curSport] || {});
  const curLeague = selLeague && leagues.includes(selLeague) ? selLeague : leagues[0];
  const teams = (TEAMS_BY_SPORT[curSport]?.[curLeague] || []).filter(t => !Settings.favTeams.includes(t));

  el.innerHTML = `
    <div class="fav-dropdowns">
      <select class="fav-sel" onchange="pickSport(this.value)">
        ${sports.map(s=>`<option value="${s}"${s===curSport?' selected':''}>${s}</option>`).join('')}
      </select>
      <select class="fav-sel" onchange="pickLeague(this.value)">
        ${leagues.map(l=>`<option value="${l}"${l===curLeague?' selected':''}>${l}</option>`).join('')}
      </select>
      <select class="fav-sel" id="fav-team-sel">
        ${teams.length
          ? teams.map(t=>`<option value="${t}">${t}</option>`).join('')
          : `<option disabled>（全部已追蹤）</option>`}
      </select>
    </div>
    <button class="fadd-btn" style="width:100%;margin-top:8px" onclick="addFavFromSel()">＋ 新增到追蹤</button>
  `;
}

function pickSport(s) { selSport=s; selLeague=null; renderFavPicker(); }
function pickLeague(l) { selLeague=l; renderFavPicker(); }
function addFavFromSel() {
  const sel = document.getElementById('fav-team-sel');
  if (!sel || !sel.value) return;
  addFav(sel.value);
}
function addFav(t) { if(t&&!Settings.favTeams.includes(t)){Settings.favTeams.push(t);Settings.save();renderFavList();renderFavPicker();} }
function rmFav(t) { Settings.favTeams=Settings.favTeams.filter(x=>x!==t); Settings.save(); renderFavList(); }
function chColor(id,c) { LC[id]=c; document.querySelectorAll('.lcheck').forEach(el=>{ if(el.querySelector('.lname')?.textContent===id) el.querySelector('.cswatch').style.background=c; }); }
function togLeague(id,el) { if(Settings.enabledLeagues.has(id))Settings.enabledLeagues.delete(id);else Settings.enabledLeagues.add(id); el.classList.toggle('on'); Settings.save(); }
function setLang(l) { Settings.lang=l; Settings.save(); renderSettingsPanel(); }
function setTZ(v) { Settings.tz=v; Settings.save(); }

document.addEventListener('DOMContentLoaded', ()=>App.init());
