// ── 聯賽顏色設定 ──
const LC = {
  MLB:'#47b8ff', '中職':'#47ffaa', '日職':'#ffb347',
  NBA:'#c9a227', WNBA:'#ff6b9d', TPBL:'#47ffaa', PLG:'#c084fc', CBA:'#ffb347', BLeague:'#47b8ff',
  EPL:'#47b8ff', 'La Liga':'#47ffaa', Bundesliga:'#ffb347', 'Serie A':'#ff6b6b', 'Ligue 1':'#c084fc', 'Champions League':'#e8ff47',
  F1:'#ff4747', ATP:'#47b8ff', WTA:'#c084fc',
};

// ── 轉播平台（2026年，台灣）──
const BROADCAST = {
  MLB:         { p:['愛爾達體育','緯來體育','HamiVideo','ELTA.tv'], free:[], note:'依各台節目表為準' },
  '中職':      { p:['CPBL TV','緯來體育','HamiVideo','ELTA.tv','DAZN','MyVideo'], free:['YouTube(部分)','Twitch(部分)'] },
  '日職':      { p:['DAZN'], free:[] },
  NBA:         { p:['緯來體育','愛爾達體育','HamiVideo'], free:[] },
  WNBA:        { p:['ESPN+','NBA League Pass'], free:[] },
  TPBL:        { p:['YouTube','DAZN'], free:['YouTube'] },
  PLG:         { p:['YouTube','DAZN'], free:['YouTube'] },
  CBA:         { p:['愛奇藝體育'], free:[] },
  BLeague:     { p:['DAZN','B.LEAGUE TV'], free:[] },
  EPL:         { p:['愛爾達體育','HamiVideo'], free:[] },
  'La Liga':   { p:['愛爾達體育','DAZN'], free:[] },
  Bundesliga:  { p:['愛爾達體育','DAZN'], free:[] },
  'Serie A':   { p:['DAZN'], free:[] },
  'Ligue 1':   { p:['DAZN'], free:[] },
  'Champions League': { p:['愛爾達體育','HamiVideo'], free:[] },
  F1:          { p:['愛爾達體育','HamiVideo'], free:[] },
  ATP:         { p:['愛爾達體育','DAZN'], free:[] },
  WTA:         { p:['愛爾達體育','DAZN'], free:[] },
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

// ── 完整球隊名單（分層選擇用）──
const TEAMS_BY_SPORT = {
  棒球: {
    'MLB': [
      // 美聯東區
      'New York Yankees','Boston Red Sox','Toronto Blue Jays','Baltimore Orioles','Tampa Bay Rays',
      // 美聯中區
      'Cleveland Guardians','Minnesota Twins','Detroit Tigers','Chicago White Sox','Kansas City Royals',
      // 美聯西區
      'Houston Astros','Seattle Mariners','Texas Rangers','Los Angeles Angels','Athletics',
      // 國聯東區
      'Atlanta Braves','New York Mets','Philadelphia Phillies','Miami Marlins','Washington Nationals',
      // 國聯中區
      'Chicago Cubs','Milwaukee Brewers','St. Louis Cardinals','Pittsburgh Pirates','Cincinnati Reds',
      // 國聯西區
      'Los Angeles Dodgers','San Diego Padres','San Francisco Giants','Arizona Diamondbacks','Colorado Rockies',
    ],
    '中職 CPBL': ['中信兄弟','統一7-ELEVEn獅','樂天桃猿','富邦悍將','味全龍','台鋼雄鷹'],
    '日職 NPB': ['讀賣巨人','阪神虎','廣島東洋鯉魚','中日龍','橫濱DeNA海灣之星','東京養樂多燕子',
                 '福岡軟銀鷹','東北樂天金鷹','埼玉西武獅','千葉羅德海洋','北海道日本火腿鬥士','歐力士猛牛'],
  },
  籃球: {
    'NBA': [
      '亞特蘭大老鷹 Hawks','波士頓塞爾提克 Celtics','布魯克林籃網 Nets','夏洛特黃蜂 Hornets','芝加哥公牛 Bulls',
      '克里夫蘭騎士 Cavaliers','達拉斯獨行俠 Mavericks','丹佛金塊 Nuggets','底特律活塞 Pistons','金州勇士 Warriors',
      '休士頓火箭 Rockets','印第安納溜馬 Pacers','洛杉磯快艇 Clippers','洛杉磯湖人 Lakers','曼菲斯灰熊 Grizzlies',
      '邁阿密熱火 Heat','密爾瓦基公鹿 Bucks','明尼蘇達森林狼 Timberwolves','紐奧良鵜鶘 Pelicans','紐約尼克 Knicks',
      '奧克拉荷馬雷霆 Thunder','奧蘭多魔術 Magic','費城76人 76ers','鳳凰城太陽 Suns','波特蘭拓荒者 Trail Blazers',
      '沙加緬度國王 Kings','聖安東尼奧馬刺 Spurs','多倫多暴龍 Raptors','猶他爵士 Jazz','華盛頓巫師 Wizards',
    ],
    'WNBA': [
      'Atlanta Dream','Chicago Sky','Connecticut Sun','Indiana Fever','New York Liberty','Washington Mystics','Toronto Tempo',
      'Dallas Wings','Golden State Valkyries','Las Vegas Aces','Los Angeles Sparks','Minnesota Lynx','Phoenix Mercury','Seattle Storm','Portland Fire',
    ],
    'TPBL': ['新北國王','桃園台啤豹','新北中信特攻','高雄全家海神','臺北台新戰神','福爾摩沙夢想家','新竹御嵿攻城獅'],
    'P.League+': ['臺北富邦勇士','桃園璞園領航猿','台鋼獵鷹','洋基工程'],
    'CBA': ['廣東宏遠','北京首鋼','遼寧本鋼','上海久事','浙江稠州','新疆廣匯','山東高速','江蘇肯帝亞',
            '深圳馬可波羅','廣州龍獅','同曦體育','四川金強','吉林東北虎','天津先行者','廣廈豪勇',
            '南京頭排','九台農商','青島國信','福建晉江文旅','山西汾酒'],
    'B.League': ['宇都宮Brex','千葉Jets','群馬Crane Thunders','Alvark Tokyo','北海道Levanga',
                 '仙台89ers','橫濱B-Corsairs','Sunrockers Shibuya','越谷Alphas','琉球Golden Kings',
                 '名古屋Diamond Dolphins','大阪Evessa','三遠NeoPhoenix','京都Hannaryz','秋田Northern Happinets',
                 '廣島Dragonflies','富山Grouses','茨城Robots','長崎Velca','西宮Storks',
                 '信州Brave Warriors','佐賀Ballooners','島根智慧鸛','湘南United','熊本Volters','福岡'],
  },
  足球: {
    'EPL 英超': ['Arsenal','Aston Villa','Bournemouth','Brentford','Brighton','Chelsea','Crystal Palace',
                 'Everton','Fulham','Ipswich','Leicester','Liverpool','Man City','Man United','Newcastle',
                 'Nottm Forest','Southampton','Tottenham','West Ham','Wolves'],
    'La Liga 西甲': ['Athletic Bilbao','Atletico Madrid','Barcelona','Betis','Celta Vigo','Espanyol',
                     'Getafe','Girona','Las Palmas','Leganes','Mallorca','Osasuna','Rayo Vallecano',
                     'Real Madrid','Real Sociedad','Sevilla','Valencia','Valladolid','Villarreal','Alaves'],
    'Bundesliga 德甲': ['Augsburg','Bayer Leverkusen','Bayern Munich','Borussia Dortmund','Eintracht Frankfurt',
                        'Freiburg','Gladbach','Hoffenheim','Holstein Kiel','Mainz','RB Leipzig','St. Pauli',
                        'Stuttgart','Union Berlin','Werder Bremen','Wolfsburg','Heidenheim','Bochum'],
  },
  F1: {
    'F1 車手': ['Max Verstappen','Lando Norris','Charles Leclerc','Carlos Sainz','Lewis Hamilton',
                'Fernando Alonso','Oscar Piastri','Lance Stroll','George Russell','Esteban Ocon',
                'Pierre Gasly','Nico Hülkenberg','Valtteri Bottas','Guanyu Zhou','Yuki Tsunoda',
                'Daniel Ricciardo','Kevin Magnussen','Alexander Albon','Logan Sargeant','Sergio Pérez'],
  },
  網球: {
    'ATP 男子': ['Jannik Sinner','Carlos Alcaraz','Alexander Zverev','Novak Djokovic','Ben Shelton',
                 'Daniil Medvedev','Andrey Rublev','Holger Rune','Alex de Minaur','Casper Ruud'],
    'WTA 女子': ['Aryna Sabalenka','Elena Rybakina','Iga Swiatek','Coco Gauff','Jessica Pegula',
                 'Amanda Anisimova','Elina Svitolina','Mirra Andreeva','Emma Raducanu','Qinwen Zheng'],
  },
};

// ── 語言設定 ──
const LANGS = {
  zh: { schedule:'賽程', live:'即時', standings:'排行', favorites:'最愛', settings:'設定',
        live_now:'🔴 直播中', upcoming:'即將開賽', finished:'已結束', no_games:'今日暫無賽事',
        no_live:'目前無直播賽事', week:'週', month:'月', back:'返回', add:'+ 新增', remove:'移除',
        sport:'運動', league:'聯盟', team:'球隊', fav_empty:'還沒有追蹤的球隊',
        fav_hint:'點右下角設定新增', fav_no_games:'追蹤球隊今日無賽事',
        select_sport:'選擇運動', select_league:'選擇聯盟', select_team:'選擇球隊',
        display_leagues:'顯示聯賽 & 顏色', fav_teams:'追蹤球隊', language:'語言', timezone:'時區' },
  en: { schedule:'Schedule', live:'Live', standings:'Standings', favorites:'Favorites', settings:'Settings',
        live_now:'🔴 Live', upcoming:'Upcoming', finished:'Final', no_games:'No games today',
        no_live:'No live games', week:'Week', month:'Month', back:'Back', add:'+ Add', remove:'Remove',
        sport:'Sport', league:'League', team:'Team', fav_empty:'No favourite teams yet',
        fav_hint:'Go to Settings to add teams', fav_no_games:'No games for favourite teams today',
        select_sport:'Select Sport', select_league:'Select League', select_team:'Select Team',
        display_leagues:'Leagues & Colors', fav_teams:'Favourite Teams', language:'Language', timezone:'Timezone' },
  ja: { schedule:'スケジュール', live:'ライブ', standings:'順位', favorites:'お気に入り', settings:'設定',
        live_now:'🔴 中継中', upcoming:'試合予定', finished:'終了', no_games:'本日試合なし',
        no_live:'中継なし', week:'週', month:'月', back:'戻る', add:'+ 追加', remove:'削除',
        sport:'スポーツ', league:'リーグ', team:'チーム', fav_empty:'お気に入りチームなし',
        fav_hint:'設定から追加してください', fav_no_games:'お気に入りの試合なし',
        select_sport:'スポーツを選択', select_league:'リーグを選択', select_team:'チームを選択',
        display_leagues:'リーグ & カラー', fav_teams:'お気に入りチーム', language:'言語', timezone:'タイムゾーン' },
  ko: { schedule:'일정', live:'라이브', standings:'순위', favorites:'즐겨찾기', settings:'설정',
        live_now:'🔴 라이브', upcoming:'예정', finished:'종료', no_games:'오늘 경기 없음',
        no_live:'라이브 없음', week:'주간', month:'월간', back:'뒤로', add:'+ 추가', remove:'제거',
        sport:'스포츠', league:'리그', team:'팀', fav_empty:'즐겨찾는 팀 없음',
        fav_hint:'설정에서 팀을 추가하세요', fav_no_games:'즐겨찾는 팀의 경기 없음',
        select_sport:'스포츠 선택', select_league:'리그 선택', select_team:'팀 선택',
        display_leagues:'리그 & 색상', fav_teams:'즐겨찾는 팀', language:'언어', timezone:'시간대' },
  fr: { schedule:'Calendrier', live:'En Direct', standings:'Classement', favorites:'Favoris', settings:'Paramètres',
        live_now:'🔴 En direct', upcoming:'À venir', finished:'Terminé', no_games:'Aucun match aujourd\'hui',
        no_live:'Aucun match en direct', week:'Semaine', month:'Mois', back:'Retour', add:'+ Ajouter', remove:'Retirer',
        sport:'Sport', league:'Ligue', team:'Équipe', fav_empty:'Aucune équipe favorite',
        fav_hint:'Allez dans Paramètres pour ajouter', fav_no_games:'Pas de match pour vos équipes',
        select_sport:'Choisir un sport', select_league:'Choisir une ligue', select_team:'Choisir une équipe',
        display_leagues:'Ligues & Couleurs', fav_teams:'Équipes favorites', language:'Langue', timezone:'Fuseau horaire' },
};

// ── 時區清單 ──
const TIMEZONES = [
  { v:'Asia/Taipei',       l:'🇹🇼 台灣 UTC+8' },
  { v:'Asia/Tokyo',        l:'🇯🇵 日本 UTC+9' },
  { v:'Asia/Seoul',        l:'🇰🇷 韓國 UTC+9' },
  { v:'America/New_York',  l:'🇺🇸 紐約 UTC-5' },
  { v:'America/Los_Angeles',l:'🇺🇸 洛杉磯 UTC-8' },
  { v:'Europe/London',     l:'🇬🇧 倫敦 UTC+0' },
  { v:'Europe/Paris',      l:'🇫🇷 巴黎 UTC+1' },
];

// ── 使用者設定 ──
const Settings = {
  favTeams:       JSON.parse(localStorage.getItem('sh_favTeams')       || '[]'),
  enabledLeagues: new Set(JSON.parse(localStorage.getItem('sh_enabled') || JSON.stringify(Object.keys(LC)))),
  lang:           localStorage.getItem('sh_lang') || 'zh',
  tz:             localStorage.getItem('sh_tz')   || 'Asia/Taipei',
  save() {
    localStorage.setItem('sh_favTeams', JSON.stringify(this.favTeams));
    localStorage.setItem('sh_enabled',  JSON.stringify([...this.enabledLeagues]));
    localStorage.setItem('sh_lang',     this.lang);
    localStorage.setItem('sh_tz',       this.tz);
  },
  t() { return LANGS[this.lang] || LANGS.zh; },
  formatTime(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit', hour12:false, timeZone: this.tz });
    } catch { return isoStr; }
  },
};

// ── 靜態排行榜 ──
const STATIC_STANDINGS = {
  baseball: [
    { label:'MLB 美聯東區', lid:'MLB', headers:['球隊','勝','敗','勝率'],
      rows:[['NY Yankees','36','19','.655'],['Baltimore','32','23','.582'],['Boston','29','26','.527'],['Toronto','27','28','.491'],['Tampa Bay','24','31','.436']] },
    { label:'中職 CPBL 2026', lid:'中職', headers:['球隊','勝','敗','勝率'],
      rows:[['統一7-ELEVEn獅','32','18','.640'],['中信兄弟','30','20','.600'],['富邦悍將','26','24','.520'],['樂天桃猿','24','26','.480'],['台鋼雄鷹','20','30','.400'],['味全龍','18','32','.360']] },
    { label:'日職 NPB 央聯', lid:'日職', headers:['球隊','勝','敗','平','勝率'],
      rows:[['阪神虎','38','22','2','.633'],['讀賣巨人','35','25','2','.583'],['廣島東洋鯉魚','32','28','2','.533'],['中日龍','28','32','2','.467'],['橫濱DeNA海灣之星','26','34','2','.433'],['東京養樂多燕子','22','38','2','.367']] },
  ],
  basketball: [
    { label:'NBA 東區', lid:'NBA', headers:['球隊','勝','敗','勝率'],
      rows:[['Detroit Pistons','60','22','.732'],['Boston Celtics','56','26','.683'],['New York Knicks','53','29','.646'],['Cleveland Cavaliers','52','30','.634'],['Indiana Pacers','48','34','.585'],['Atlanta Hawks','46','36','.561'],['Miami Heat','44','38','.537'],['Chicago Bulls','40','42','.488'],['Orlando Magic','38','44','.463'],['Toronto Raptors','32','50','.390']] },
    { label:'NBA 西區', lid:'NBA', headers:['球隊','勝','敗','勝率'],
      rows:[['OKC Thunder','64','18','.780'],['San Antonio Spurs','62','20','.756'],['Denver Nuggets','54','28','.659'],['LA Lakers','53','29','.646'],['Houston Rockets','52','30','.634'],['Golden State Warriors','48','34','.585'],['LA Clippers','46','36','.561'],['Dallas Mavericks','44','38','.537'],['Memphis Grizzlies','40','42','.488'],['Phoenix Suns','36','46','.439']] },
    { label:'WNBA 2026 東區', lid:'WNBA', headers:['球隊','勝','負','勝率'],
      rows:[['Atlanta Dream','5','2','.714'],['New York Liberty','5','4','.556'],['Toronto Tempo','5','4','.556'],['Indiana Fever','4','4','.500'],['Washington Mystics','3','4','.429'],['Chicago Sky','3','5','.375'],['Connecticut Sun','2','8','.200']] },
    { label:'WNBA 2026 西區', lid:'WNBA', headers:['球隊','勝','負','勝率'],
      rows:[['Minnesota Lynx','6','2','.750'],['Golden State Valkyries','5','2','.714'],['Dallas Wings','5','3','.625'],['Portland Fire','6','4','.600'],['Las Vegas Aces','4','3','.571'],['Los Angeles Sparks','4','4','.500'],['Seattle Storm','3','6','.333'],['Phoenix Mercury','2','7','.222']] },
    { label:'TPBL 2025-26', lid:'TPBL', headers:['球隊','勝','負','勝率'],
      rows:[['新北國王','18','6','.750'],['桃園台啤豹','16','8','.667'],['高雄全家海神','14','10','.583'],['臺北台新戰神','12','12','.500'],['福爾摩沙夢想家','10','14','.417'],['新竹御嵿攻城獅','8','16','.333'],['新北中信特攻','4','20','.167']] },
    { label:'P.League+ 2025-26', lid:'PLG', headers:['球隊','勝','負','勝率'],
      rows:[['臺北富邦勇士','20','4','.833'],['桃園璞園領航猿','17','7','.708'],['台鋼獵鷹','10','14','.417'],['洋基工程','5','19','.208']] },
    { label:'CBA 2025-26', lid:'CBA', headers:['球隊','勝','負','勝率'],
      rows:[['廣東宏遠','38','6','.864'],['北京首鋼','35','9','.795'],['遼寧本鋼','33','11','.750'],['上海久事','30','14','.682'],['浙江稠州','27','17','.614']] },
    { label:'B1 League 東區', lid:'BLeague', headers:['球隊','勝','負','勝率'],
      rows:[['宇都宮Brex','45','15','.750'],['千葉Jets','42','18','.700'],['群馬Crane Thunders','42','18','.700'],['Alvark Tokyo','41','19','.683'],['北海道Levanga','37','23','.617']] },
  ],
  soccer: [
    { label:'EPL 2025-26', lid:'EPL', headers:['球隊','積分','勝','平','負'],
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
