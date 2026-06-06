// ── 聯賽顏色設定 ──
const LC = {
  MLB:'#47b8ff', '中職':'#47ffaa', '日職':'#ffb347',
  NBA:'#c9a227', WNBA:'#ff6b9d', TPBL:'#47ffaa', PLG:'#c084fc', CBA:'#ffb347', BLeague:'#47b8ff',
  EPL:'#47b8ff', 'La Liga':'#47ffaa', Bundesliga:'#ffb347', 'Serie A':'#ff6b6b', 'Ligue 1':'#c084fc', 'Champions League':'#e8ff47',
  F1:'#ff4747', ATP:'#47b8ff', WTA:'#c084fc',
};

// ── 轉播平台（2026年最新，台灣） ──
const BROADCAST = {
  MLB:      { p:['愛爾達體育','緯來體育','HamiVideo','ELTA.tv'], free:[], note:'依各台節目表為準' },
  '中職':   { p:['CPBL TV','緯來體育','HamiVideo','ELTA.tv','DAZN','MyVideo'], free:['YouTube(部分)','Twitch(部分)'] },
  '日職':   { p:['DAZN'], free:[] },
  NBA:      { p:['緯來體育','愛爾達體育','HamiVideo'], free:[] },
  WNBA:     { p:['ESPN+','NBA League Pass'], free:[] },
  TPBL:     { p:['YouTube','DAZN'], free:['YouTube'] },
  PLG:      { p:['YouTube','DAZN'], free:['YouTube'] },
  CBA:      { p:['愛奇藝體育'], free:[] },
  BLeague:  { p:['DAZN','B.LEAGUE TV'], free:[] },
  EPL:      { p:['愛爾達體育','HamiVideo'], free:[] },
  'La Liga':{ p:['愛爾達體育','DAZN'], free:[] },
  Bundesliga:{ p:['愛爾達體育','DAZN'], free:[] },
  'Serie A':{ p:['DAZN'], free:[] },
  'Ligue 1':{ p:['DAZN'], free:[] },
  'Champions League':{ p:['愛爾達體育','HamiVideo'], free:[] },
  F1:       { p:['愛爾達體育','HamiVideo'], free:[] },
  ATP:      { p:['愛爾達體育','DAZN'], free:[] },
  WTA:      { p:['愛爾達體育','DAZN'], free:[] },
};

// ── 聯賽導覽列 ──
const SPORT_LEAGUES = {
  baseball:   [{id:'all',l:'全部'},{id:'MLB',l:'MLB'},{id:'中職',l:'中職'},{id:'日職',l:'日職'}],
  basketball: [{id:'all',l:'全部'},{id:'NBA',l:'NBA'},{id:'WNBA',l:'WNBA'},{id:'TPBL',l:'TPBL'},{id:'PLG',l:'P.League+'},{id:'CBA',l:'CBA'},{id:'BLeague',l:'B.League'}],
  soccer:     [{id:'all',l:'全部'},{id:'EPL',l:'EPL'},{id:'La Liga',l:'La Liga'},{id:'Bundesliga',l:'Bundesliga'},{id:'Serie A',l:'Serie A'},{id:'Ligue 1',l:'Ligue 1'}],
  f1:         [{id:'all',l:'全部'}],
  tennis:     [{id:'all',l:'全部'},{id:'ATP',l:'ATP'},{id:'WTA',l:'WTA'}],
};

// ── 設定面板聯賽清單 ──
const ALL_LEAGUES_CFG = [
  {id:'MLB',s:'棒球'},{id:'中職',s:'棒球'},{id:'日職',s:'棒球'},
  {id:'NBA',s:'籃球'},{id:'WNBA',s:'籃球'},{id:'TPBL',s:'籃球'},{id:'PLG',s:'籃球'},{id:'CBA',s:'籃球'},{id:'BLeague',s:'籃球'},
  {id:'EPL',s:'足球'},{id:'La Liga',s:'足球'},{id:'Bundesliga',s:'足球'},{id:'Serie A',s:'足球'},{id:'Ligue 1',s:'足球'},{id:'Champions League',s:'足球'},
  {id:'F1',s:'F1'},{id:'ATP',s:'網球'},{id:'WTA',s:'網球'},
];

// ── 可追蹤球隊清單 ──
const FAV_TEAMS_LIST = [
  '中信兄弟','統一7-ELEVEn獅','樂天桃猿','富邦悍將','味全龍','台鋼雄鷹',
  '新北國王','桃園台啤豹','新北中信特攻','高雄全家海神','臺北台新戰神','福爾摩沙夢想家','新竹御嵿攻城獅',
  '台北富邦勇士','桃園璞園領航猿','台鋼獵鷹','洋基工程',
  'LA Lakers','Boston Celtics','Golden State Warriors','OKC Thunder','New York Knicks','San Antonio Spurs','Houston Rockets',
  'Indiana Fever','New York Liberty','Las Vegas Aces','Minnesota Lynx','Portland Fire','Toronto Tempo','Golden State Valkyries',
];

// ── 靜態備用排行榜（API 失敗時顯示）──
const STATIC_STANDINGS = {
  baseball: [
    { label:'MLB 美聯東區', lid:'MLB', headers:['球隊','勝','敗','勝率'],
      rows:[['NY Yankees','36','19','.655'],['Baltimore','32','23','.582'],['Boston','29','26','.527'],['Toronto','27','28','.491'],['Tampa Bay','24','31','.436']] },
    { label:'中職 CPBL 2026', lid:'中職', headers:['球隊','勝','敗','勝率'],
      rows:[['統一7-ELEVEn獅','32','18','.640'],['中信兄弟','30','20','.600'],['富邦悍將','26','24','.520'],['樂天桃猿','24','26','.480'],['台鋼雄鷹','20','30','.400'],['味全龍','18','32','.360']] },
    { label:'日職 NPB 2026 央聯', lid:'日職', headers:['球隊','勝','敗','平','勝率'],
      rows:[['阪神虎','38','22','2','.633'],['讀賣巨人','35','25','2','.583'],['廣島東洋鯉魚','32','28','2','.533'],['中日龍','28','32','2','.467'],['橫濱DeNA海灣之星','26','34','2','.433'],['東京養樂多燕子','22','38','2','.367']] },
  ],
  basketball: [
    { label:'NBA 東區 2025-26', lid:'NBA', headers:['球隊','勝','敗','勝率'],
      rows:[['Detroit Pistons','60','22','.732'],['Boston Celtics','56','26','.683'],['New York Knicks','53','29','.646'],['Cleveland Cavaliers','52','30','.634'],['Atlanta Hawks','46','36','.561']] },
    { label:'NBA 西區 2025-26', lid:'NBA', headers:['球隊','勝','敗','勝率'],
      rows:[['OKC Thunder','64','18','.780'],['San Antonio Spurs','62','20','.756'],['Denver Nuggets','54','28','.659'],['LA Lakers','53','29','.646'],['Houston Rockets','52','30','.634']] },
    { label:'WNBA 2026 東區', lid:'WNBA', headers:['球隊','勝','負','勝率'],
      rows:[['Atlanta Dream','5','2','.714'],['New York Liberty','5','4','.556'],['Toronto Tempo','5','4','.556'],['Indiana Fever','4','4','.500'],['Washington Mystics','3','4','.429'],['Chicago Sky','3','5','.375'],['Connecticut Sun','2','8','.200']] },
    { label:'WNBA 2026 西區', lid:'WNBA', headers:['球隊','勝','負','勝率'],
      rows:[['Minnesota Lynx','6','2','.750'],['Golden State Valkyries','5','2','.714'],['Dallas Wings','5','3','.625'],['Portland Fire','6','4','.600'],['Las Vegas Aces','4','3','.571'],['Los Angeles Sparks','4','4','.500'],['Seattle Storm','3','6','.333'],['Phoenix Mercury','2','7','.222']] },
    { label:'TPBL 2025-26', lid:'TPBL', headers:['球隊','勝','負','勝率'],
      rows:[['新北國王','18','6','.750'],['桃園台啤豹','16','8','.667'],['高雄全家海神','14','10','.583'],['臺北台新戰神','12','12','.500'],['福爾摩沙夢想家','10','14','.417'],['新竹御嵿攻城獅','8','16','.333'],['新北中信特攻','4','20','.167']] },
    { label:'P.League+ 2025-26', lid:'PLG', headers:['球隊','勝','負','勝率'],
      rows:[['台北富邦勇士','20','4','.833'],['桃園璞園領航猿','17','7','.708'],['台鋼獵鷹','10','14','.417'],['洋基工程','5','19','.208']] },
    { label:'CBA 2025-26', lid:'CBA', headers:['球隊','勝','負','勝率'],
      rows:[['廣東宏遠','38','6','.864'],['北京首鋼','35','9','.795'],['遼寧本鋼','33','11','.750'],['上海久事','30','14','.682'],['浙江稠州','27','17','.614']] },
    { label:'B1 League 東區', lid:'BLeague', headers:['球隊','勝','負','勝率'],
      rows:[['宇都宮Brex','41','13','.759'],['千葉Jets','37','17','.685'],['Alvark Tokyo','36','18','.667'],['北海道Levanga','33','21','.611'],['仙台89ers','33','21','.611']] },
  ],
  soccer: [
    { label:'EPL 英超 2025-26', lid:'EPL', headers:['球隊','積分','勝','平','負'],
      rows:[['Arsenal','85','26','7','5'],['Man City','78','23','9','6'],['Man United','71','20','11','7'],['Aston Villa','65','19','8','11'],['Liverpool','60','17','9','12']] },
    { label:'La Liga 2025-26', lid:'La Liga', headers:['球隊','積分','勝','平','負'],
      rows:[['FC Barcelona','94','31','1','6'],['Real Madrid','86','27','5','6'],['Villarreal','72','22','6','10'],['Atletico Madrid','69','21','6','11'],['Real Betis','60','15','15','8']] },
    { label:'Bundesliga 2025-26', lid:'Bundesliga', headers:['球隊','積分','勝','平','負'],
      rows:[['Bayern Munich','89','28','5','1'],['Borussia Dortmund','73','22','7','5'],['RB Leipzig','65','20','5','9'],['VfB Stuttgart','62','18','8','8'],['TSG Hoffenheim','61','18','7','9']] },
  ],
  tennis: [
    { label:'ATP 世界排名 2026', lid:'ATP', headers:['球員','積分'],
      rows:[['Jannik Sinner','14,750'],['Carlos Alcaraz','11,960'],['Alexander Zverev','5,705'],['Novak Djokovic','4,460'],['Ben Shelton','4,070']] },
    { label:'WTA 世界排名 2026', lid:'WTA', headers:['球員','積分'],
      rows:[['Aryna Sabalenka','9,960'],['Elena Rybakina','8,313'],['Iga Swiatek','7,273'],['Coco Gauff','6,749'],['Jessica Pegula','6,286']] },
  ],
};

// ── 使用者設定（localStorage 儲存）──
const Settings = {
  favTeams: JSON.parse(localStorage.getItem('sh_favTeams') || '[]'),
  enabledLeagues: new Set(JSON.parse(localStorage.getItem('sh_enabledLeagues') || JSON.stringify(Object.keys(LC)))),
  save() {
    localStorage.setItem('sh_favTeams', JSON.stringify(this.favTeams));
    localStorage.setItem('sh_enabledLeagues', JSON.stringify([...this.enabledLeagues]));
  },
};
