// ── ScoreHub 全自動資料抓取 ──
// 每天由 GitHub Actions 自動執行，結果存到 data/ 資料夾

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const today = new Date().toISOString().slice(0, 10);

// ── 工具函式 ──
function save(filename, data) {
  const fp = path.join(DATA_DIR, filename);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ 已儲存 ${filename}`);
}

function toTaipeiTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const taipeiNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const taipeiD = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const isToday = taipeiD.toDateString() === taipeiNow.toDateString();
    const tmr = new Date(taipeiNow); tmr.setDate(taipeiNow.getDate() + 1);
    const isTmr = taipeiD.toDateString() === tmr.toDateString();
    const timeStr = taipeiD.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isToday) return `今天 ${timeStr}`;
    if (isTmr) return `明天 ${timeStr}`;
    return `${taipeiD.getMonth()+1}/${taipeiD.getDate()} ${timeStr}`;
  } catch { return '--'; }
}

// ═══════════════════════════════════════
// ── MLB（官方免費 API）──
// ═══════════════════════════════════════
async function fetchMLB() {
  console.log('📡 抓取 MLB...');
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`);
    const json = await res.json();
    const schedule = [], standings = [];

    // 台灣時間今天的範圍
    const nowTW = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const startTW = new Date(nowTW); startTW.setHours(0,0,0,0);
    const endTW   = new Date(nowTW); endTW.setHours(23,59,59,999);

    for (const date of json.dates || []) {
      for (const g of date.games) {
        // 只取台灣時間今天的比賽
        const gameTW = new Date(new Date(g.gameDate).toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        if (gameTW < startTW || gameTW > endTW) continue;

        const away = g.teams.away, home = g.teams.home;
        const st = g.status.abstractGameState;
        const isLive = st === 'Live', isFinal = st === 'Final';
        const ls = g.linescore || {};
        schedule.push({
          league: 'MLB',
          away: away.team.name,
          home: home.team.name,
          awayScore: (isLive || isFinal) ? away.score : null,
          homeScore: (isLive || isFinal) ? home.score : null,
          status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
          liveInfo: isLive ? `${ls.currentInningHalf || ''} ${ls.currentInning || ''}局` : null,
          time: toTaipeiTime(g.gameDate),
          winner: isFinal ? (away.score > home.score ? 'away' : 'home') : null,
          gameDate: g.gameDate,
        });
      }
    }

    // 排行榜 - 全部 6 個分區
    const sRes = await fetch('https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2026&standingsTypes=regularSeason');
    const sJson = await sRes.json();
    for (const rec of (sJson.records || [])) {
      standings.push({
        label: `MLB ${rec.division.nameShort || rec.division.name}`,
        headers: ['球隊', '勝', '敗', '勝率'],
        rows: rec.teamRecords.map(t => [t.team.name, String(t.wins), String(t.losses), t.winningPercentage]),
      });
    }

    save('mlb.json', { schedule, standings, updatedAt: new Date().toISOString() });
  } catch (e) { console.error('❌ MLB 失敗:', e.message); save('mlb.json', { schedule: [], standings: [], error: e.message }); }
}

// ═══════════════════════════════════════
// ── F1（Jolpica 免費 API）──
// ═══════════════════════════════════════
async function fetchF1() {
  console.log('📡 抓取 F1...');
  try {
    const year = new Date().getFullYear();
    const [raceRes, driverRes, ctorRes] = await Promise.all([
      fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`),
      fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`),
      fetch(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`),
    ]);
    const [raceJson, driverJson, ctorJson] = await Promise.all([raceRes.json(), driverRes.json(), ctorRes.json()]);

    const now = new Date();
    const schedule = (raceJson.MRData?.RaceTable?.Races || []).slice(0, 10).map(r => {
      const raceDate = new Date(r.date + 'T' + (r.time || '14:00:00Z'));
      return {
        league: 'F1', singleEvent: true,
        title: r.raceName,
        subtitle: `第${r.round}站 · ${r.Circuit.circuitName}`,
        time: r.date,
        gameDate: r.date + 'T' + (r.time || '14:00:00Z'),
        status: raceDate < now ? 'final' : 'scheduled',
      };
    });

    const driverStandings = driverJson.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    const ctorStandings = ctorJson.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    const standings = [
      {
        label: `F1 ${year} 車手積分榜`,
        headers: ['車手', '積分', '車隊'],
        rows: driverStandings.slice(0, 10).map(s => [`${s.Driver.givenName} ${s.Driver.familyName}`, s.points, s.Constructors?.[0]?.name || '-']),
      },
      {
        label: `F1 ${year} 車隊積分榜`,
        headers: ['車隊', '積分'],
        rows: ctorStandings.slice(0, 8).map(s => [s.Constructor.name, s.points]),
      },
    ];

    save('f1.json', { schedule, standings, updatedAt: new Date().toISOString() });
  } catch (e) { console.error('❌ F1 失敗:', e.message); save('f1.json', { schedule: [], standings: [], error: e.message }); }
}

// ═══════════════════════════════════════
// ── NBA / WNBA（免費非官方 API）──
// ═══════════════════════════════════════
async function fetchNBA() {
  console.log('📡 抓取 NBA...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const schedule = (json.events || []).map(e => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find(t => t.homeAway === 'home');
      const away = comp?.competitors?.find(t => t.homeAway === 'away');
      const status = comp?.status?.type?.name;
      const isFinal = status === 'STATUS_FINAL';
      const isLive = status === 'STATUS_IN_PROGRESS';
      return {
        league: 'NBA',
        home: home?.team?.displayName || '',
        away: away?.team?.displayName || '',
        homeScore: (isFinal || isLive) ? Number(home?.score) : null,
        awayScore: (isFinal || isLive) ? Number(away?.score) : null,
        status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
        time: toTaipeiTime(e.date),
        gameDate: e.date,
        liveInfo: isLive ? comp?.status?.displayClock : null,
        winner: isFinal ? (Number(home?.score) > Number(away?.score) ? 'home' : 'away') : null,
      };
    });
    save('nba.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) { console.error('❌ NBA 失敗:', e.message); save('nba.json', { schedule: [], error: e.message }); }
}

async function fetchWNBA() {
  console.log('📡 抓取 WNBA...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const schedule = (json.events || []).map(e => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find(t => t.homeAway === 'home');
      const away = comp?.competitors?.find(t => t.homeAway === 'away');
      const status = comp?.status?.type?.name;
      const isFinal = status === 'STATUS_FINAL';
      const isLive = status === 'STATUS_IN_PROGRESS';
      return {
        league: 'WNBA',
        home: home?.team?.displayName || '',
        away: away?.team?.displayName || '',
        homeScore: (isFinal || isLive) ? Number(home?.score) : null,
        awayScore: (isFinal || isLive) ? Number(away?.score) : null,
        status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
        time: toTaipeiTime(e.date),
        gameDate: e.date,
        liveInfo: isLive ? comp?.status?.displayClock : null,
        winner: isFinal ? (Number(home?.score) > Number(away?.score) ? 'home' : 'away') : null,
      };
    });
    save('wnba.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) { console.error('❌ WNBA 失敗:', e.message); save('wnba.json', { schedule: [], error: e.message }); }
}

// ═══════════════════════════════════════
// ── 中職 CPBL（官網爬蟲）──
// ═══════════════════════════════════════
async function fetchCPBL() {
  console.log('📡 抓取 中職...');
  try {
    const res = await fetch('https://www.cpbl.com.tw/schedule', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const schedule = [];

    $('.ScheduleTableList tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length < 4) return;
      const date = $(cols[0]).text().trim();
      const away = $(cols[1]).text().trim();
      const score = $(cols[2]).text().trim();
      const home = $(cols[3]).text().trim();
      if (!away || !home) return;

      const scores = score.match(/(\d+)[^\d]+(\d+)/);
      const isFinal = !!scores;
      schedule.push({
        league: '中職',
        away, home,
        awayScore: isFinal ? Number(scores[1]) : null,
        homeScore: isFinal ? Number(scores[2]) : null,
        status: isFinal ? 'final' : 'scheduled',
        time: date,
        winner: isFinal ? (Number(scores[1]) > Number(scores[2]) ? 'away' : 'home') : null,
      });
    });

    save('cpbl.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('❌ 中職 失敗:', e.message);
    // 備用靜態資料
    save('cpbl.json', {
      schedule: [
        { league:'中職', away:'中信兄弟', home:'統一7-ELEVEn獅', status:'scheduled', time:'今天 18:35', gameDate: new Date().toISOString() },
        { league:'中職', away:'樂天桃猿', home:'富邦悍將', status:'scheduled', time:'今天 18:35', gameDate: new Date().toISOString() },
        { league:'中職', away:'味全龍', home:'台鋼雄鷹', status:'scheduled', time:'今天 18:35', gameDate: new Date().toISOString() },
      ],
      error: e.message
    });
  }
}

// ═══════════════════════════════════════
// ── 日職 NPB（ESPN API）──
// ═══════════════════════════════════════
async function fetchNPB() {
  console.log('📡 抓取 日職...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    // NPB 備用靜態（ESPN 不含日職，直接用靜態）
    throw new Error('ESPN 不含日職，使用靜態資料');
  } catch {
    save('npb.json', {
      schedule: [
        { league:'日職', away:'讀賣巨人', home:'阪神虎', status:'scheduled', time:'今天 18:00', gameDate: new Date().toISOString() },
        { league:'日職', away:'福岡軟銀鷹', home:'埼玉西武獅', status:'scheduled', time:'今天 18:00', gameDate: new Date().toISOString() },
        { league:'日職', away:'東北樂天金鷹', home:'千葉羅德海洋', status:'scheduled', time:'今天 18:00', gameDate: new Date().toISOString() },
      ],
      note: '日職暫無免費API，顯示靜態賽程',
      updatedAt: new Date().toISOString()
    });
  }
}

// ═══════════════════════════════════════
// ── TPBL / PLG（ESPN 爬蟲）──
// ═══════════════════════════════════════
async function fetchTPBL() {
  console.log('📡 抓取 TPBL...');
  try {
    const res = await fetch('https://www.tpbl.basketball/schedule', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const schedule = [];

    // 抓今日賽程
    $('table tr, .game-row, .schedule-row').each((i, row) => {
      const text = $(row).text().trim();
      if (!text) return;
      const teams = ['新北國王','桃園台啤豹','新北中信特攻','高雄全家海神','臺北台新戰神','福爾摩沙夢想家','新竹御嵿攻城獅'];
      const found = teams.filter(t => text.includes(t));
      if (found.length >= 2) {
        schedule.push({ league:'TPBL', away:found[0], home:found[1], status:'scheduled', time:'今天 19:00' });
      }
    });

    if (!schedule.length) throw new Error('找不到賽程資料');
    save('tpbl.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('❌ TPBL 失敗:', e.message);
    save('tpbl.json', {
      schedule: [
        { league:'TPBL', away:'桃園台啤豹', home:'新北國王', status:'scheduled', time:'今天 19:00' },
        { league:'TPBL', away:'高雄全家海神', home:'福爾摩沙夢想家', status:'scheduled', time:'今天 19:00' },
      ],
      note: 'TPBL 賽季已結束（2026/5/19），顯示靜態資料',
      updatedAt: new Date().toISOString()
    });
  }
}

async function fetchPLG() {
  console.log('📡 抓取 P.League+...');
  save('plg.json', {
    schedule: [
      { league:'PLG', away:'台北富邦勇士', home:'桃園璞園領航猿', status:'scheduled', time:'今天 19:30' },
      { league:'PLG', away:'台鋼獵鷹', home:'洋基工程', status:'scheduled', time:'今天 19:30' },
    ],
    note: 'PLG 暫無免費API',
    updatedAt: new Date().toISOString()
  });
}

// ═══════════════════════════════════════
// ── CBA（ESPN）──
// ═══════════════════════════════════════
async function fetchCBA() {
  console.log('📡 抓取 CBA...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/cba/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const schedule = (json.events || []).map(e => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find(t => t.homeAway === 'home');
      const away = comp?.competitors?.find(t => t.homeAway === 'away');
      const status = comp?.status?.type?.name;
      const isFinal = status === 'STATUS_FINAL';
      const isLive = status === 'STATUS_IN_PROGRESS';
      return {
        league: 'CBA',
        home: home?.team?.displayName || '',
        away: away?.team?.displayName || '',
        homeScore: (isFinal || isLive) ? Number(home?.score) : null,
        awayScore: (isFinal || isLive) ? Number(away?.score) : null,
        status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
        time: toTaipeiTime(e.date),
        gameDate: e.date,
        winner: isFinal ? (Number(home?.score) > Number(away?.score) ? 'home' : 'away') : null,
      };
    });
    if (!schedule.length) throw new Error('無賽事');
    save('cba.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('❌ CBA 失敗:', e.message);
    save('cba.json', {
      schedule: [
        { league:'CBA', away:'廣東宏遠', home:'北京首鋼', status:'scheduled', time:'今天 19:35' },
      ],
      error: e.message, updatedAt: new Date().toISOString()
    });
  }
}

// ═══════════════════════════════════════
// ── B.League（ESPN）──
// ═══════════════════════════════════════
async function fetchBLeague() {
  console.log('📡 抓取 B.League...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/bleague/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const schedule = (json.events || []).map(e => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find(t => t.homeAway === 'home');
      const away = comp?.competitors?.find(t => t.homeAway === 'away');
      const status = comp?.status?.type?.name;
      const isFinal = status === 'STATUS_FINAL';
      const isLive = status === 'STATUS_IN_PROGRESS';
      return {
        league: 'BLeague',
        home: home?.team?.displayName || '',
        away: away?.team?.displayName || '',
        homeScore: (isFinal || isLive) ? Number(home?.score) : null,
        awayScore: (isFinal || isLive) ? Number(away?.score) : null,
        status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
        time: toTaipeiTime(e.date),
        gameDate: e.date,
        winner: isFinal ? (Number(home?.score) > Number(away?.score) ? 'home' : 'away') : null,
      };
    });
    if (!schedule.length) throw new Error('無賽事');
    save('bleague.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    save('bleague.json', {
      schedule: [{ league:'BLeague', away:'宇都宮Brex', home:'千葉Jets', status:'scheduled', time:'今天 18:05' }],
      error: e.message, updatedAt: new Date().toISOString()
    });
  }
}

// ═══════════════════════════════════════
// ── 足球（football-data.org）──
// ═══════════════════════════════════════
async function fetchSoccer() {
  console.log('📡 抓取 足球...');
  // football-data.org 需要 API key，這裡用 ESPN 替代
  try {
    const competitions = [
      { id: 'eng.1', label: 'EPL' },
      { id: 'esp.1', label: 'La Liga' },
      { id: 'ger.1', label: 'Bundesliga' },
      { id: 'ita.1', label: 'Serie A' },
      { id: 'fra.1', label: 'Ligue 1' },
    ];
    const schedule = [];
    for (const comp of competitions) {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${comp.id}/scoreboard?dates=${today.replace(/-/g,'')}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const json = await res.json();
        for (const e of (json.events || [])) {
          const c = e.competitions?.[0];
          const home = c?.competitors?.find(t => t.homeAway === 'home');
          const away = c?.competitors?.find(t => t.homeAway === 'away');
          const status = c?.status?.type?.name;
          const isFinal = status === 'STATUS_FINAL';
          const isLive = status === 'STATUS_IN_PROGRESS';
          schedule.push({
            league: comp.label,
            home: home?.team?.displayName || '',
            away: away?.team?.displayName || '',
            homeScore: (isFinal || isLive) ? Number(home?.score) : null,
            awayScore: (isFinal || isLive) ? Number(away?.score) : null,
            status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
            time: toTaipeiTime(e.date),
            gameDate: e.date,
            winner: isFinal ? (Number(home?.score) > Number(away?.score) ? 'home' : Number(away?.score) > Number(home?.score) ? 'away' : 'draw') : null,
          });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500)); // 避免太快
    }
    save('soccer.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('❌ 足球 失敗:', e.message);
    save('soccer.json', { schedule: [], error: e.message });
  }
}

// ═══════════════════════════════════════
// ── 網球（ATP/WTA）──
// ═══════════════════════════════════════
async function fetchTennis() {
  console.log('📡 抓取 網球...');
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=${today.replace(/-/g,'')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const schedule = (json.events || []).map(e => {
      const comp = e.competitions?.[0];
      const p1 = comp?.competitors?.[0];
      const p2 = comp?.competitors?.[1];
      const status = comp?.status?.type?.name;
      const isFinal = status === 'STATUS_FINAL';
      const isLive = status === 'STATUS_IN_PROGRESS';
      return {
        league: 'ATP',
        away: p1?.athlete?.displayName || '',
        home: p2?.athlete?.displayName || '',
        awayScore: (isFinal || isLive) ? p1?.score : null,
        homeScore: (isFinal || isLive) ? p2?.score : null,
        status: isFinal ? 'final' : isLive ? 'live' : 'scheduled',
        time: toTaipeiTime(e.date),
        gameDate: e.date,
        winner: isFinal ? (p1?.winner ? 'away' : 'home') : null,
      };
    });
    save('tennis.json', { schedule, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('❌ 網球 失敗:', e.message);
    save('tennis.json', { schedule: [], error: e.message });
  }
}

// ═══════════════════════════════════════
// ── 主程式：依序執行所有抓取 ──
// ═══════════════════════════════════════
async function main() {
  console.log(`\n🚀 開始抓取賽程資料 ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n`);

  await fetchMLB();
  await fetchF1();
  await fetchNBA();
  await fetchWNBA();
  await fetchCPBL();
  await fetchNPB();
  await fetchTPBL();
  await fetchPLG();
  await fetchCBA();
  await fetchBLeague();
  await fetchSoccer();
  await fetchTennis();

  // 產生更新時間戳記
  save('meta.json', {
    updatedAt: new Date().toISOString(),
    updatedAtTaipei: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
  });

  console.log('\n✨ 全部完成！\n');
}

main().catch(console.error);
