// 九星（早生まれ対応あり）算出
function getMainStar(year, month, day) {
  const birthDate = new Date(year, month - 1, day);
  const risshun = new Date(year, 1, 4); // 2月4日：立春

  // 節入り前は前年扱い
  const effectiveYear = birthDate < risshun ? year - 1 : year;

  // 九星の計算：11 - （西暦の各桁の和を1桁にしたもの）
  let sum = String(effectiveYear).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  while (sum > 9) {
    sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  let number = 11 - sum;
  if (number > 9) number -= 9;
  if (number <= 0) number += 9;

  const stars = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];

  return stars[number - 1];
}

//五格を計算する
function getGokaku(lastName, firstName) {
  const kakusuMap = getKakusuMap();
  const addReisu = (name) => name.length === 1 ? 1 : 0;

  // 🔥 エラーを出すバージョンに変更
  const calcTotal = (chars) => {
    console.log("【calcTotal】対象文字列:", chars);
    return chars.split('').reduce((sum, char) => {
      console.log(`  → チェック中:「${char}」`);
      if (!(char in kakusuMap)) {
        console.log(`  ❌ 未定義の文字:「${char}」`);
        Logger.log("🔴 getGokaku内 throw直前：%s", char);
        throw new Error(`「${char}」の画数が定義されていません。`);
      }
      return sum + kakusuMap[char];
    }, 0);
  };

  const reisuLast = addReisu(lastName);
  const reisuFirst = addReisu(firstName);

  const tenkaku = calcTotal(lastName) + reisuLast;
  const chikaku = calcTotal(firstName) + reisuFirst;
  const soukaku = tenkaku + chikaku;

  const seiLast = lastName.charAt(lastName.length - 1);
  const meiFirst = firstName.charAt(0);
  const jinkaku = calcTotal(seiLast + meiFirst);
  const gaikaku = soukaku - jinkaku;

  return {
    天格: tenkaku,
    人格: jinkaku,
    地格: chikaku,
    外格: gaikaku,
    総格: soukaku
  };
}

/**
 * スプレッドシートから kakusuMap を読み込む
 * 初回のみ読み込み、以降はキャッシュを利用
 */
function getKakusuMap() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("kakusuMap");
  if (cached) {
    return JSON.parse(cached);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("画数辞書");
  if (!sheet) throw new Error("シート『画数辞書』が見つかりません");

  const values = sheet.getDataRange().getValues(); // A1から全データ取得
  const map = {};
  for (let i = 1; i < values.length; i++) {
    const [kanji, count] = values[i];
    if (kanji && typeof count === 'number') {
      map[kanji] = count;
    }
  }

  // キャッシュに保存（有効期限は最大6時間 = 21600秒）
  cache.put("kakusuMap", JSON.stringify(map), 21600);
  return map;
}

// 未登録の漢字を画数辞書に追記する
function recordMissingKakusuu(char, strokes) {
  Logger.log("recordmissingKakusu");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("画数辞書");
  const data = sheet.getDataRange().getValues(); // すべてのデータ取得

  // すでに登録済みかチェック（1列目：漢字列）
  const existingChars = data.map(row => row[0]);
  if (existingChars.includes(char)) return;

  // 未登録なら末尾に追記（初期値は0、手動フラグはTRUE）
  sheet.appendRow([char, strokes, true]); 

  // 🔄 キャッシュクリア
  CacheService.getScriptCache().remove("kakusuMap");

  return true; // 成功通知

}

// パーソナル診断
const personalityMap = {
  1: { type: '独立志向', strengths: '発想力、先見性', weaknesses: '孤立しがち', keywords: 'スタート、アイデア、自由' },
  2: { type: '協調性タイプ', strengths: '面倒見の良さ、柔軟性', weaknesses: '自己主張が弱い', keywords: '支援、縁の下、安心感' },
  3: { type: '社交性タイプ', strengths: '明るさ、行動力', weaknesses: '飽きっぽい', keywords: '発信、人気、人脈' },
  4: { type: '慎重計画タイプ', strengths: '綿密さ、安定感', weaknesses: '保守的', keywords: '整える、地道、信頼' },
  5: { type: '中心型リーダー', strengths: '統率力、公平性', weaknesses: 'プレッシャーに弱い', keywords: '責任、指導、軸' },
  6: { type: '職人気質タイプ', strengths: '実直さ、継続力', weaknesses: '柔軟性に欠ける', keywords: '技術、蓄積、本物志向' },
  7: { type: '表現型アーティスト', strengths: '美的感覚、表現力', weaknesses: '自己中心的', keywords: '美しさ、魅せる、センス' },
  8: { type: '改革型実行者', strengths: '実行力、改革精神', weaknesses: '衝動的', keywords: '変化、突破、スピード' },
  9: { type: '情熱タイプ', strengths: '直感力、カリスマ性', weaknesses: '空回りしやすい', keywords: '情熱、導く、精神性' },
  10: { type: '柔軟思考タイプ', strengths: '思いやり、柔軟性', weaknesses: '決断力に欠ける', keywords: '共感、適応、対話' },
  11: { type: '挑戦型リーダー', strengths: '情熱、リーダーシップ', weaknesses: '短気、衝動的', keywords: '突破、先導、勝負' },
  12: { type: '献身型サポーター', strengths: '支える力、誠実さ', weaknesses: '自己犠牲的', keywords: '支援、配慮、思いやり' },
  13: { type: '戦略家タイプ', strengths: '計画性、分析力', weaknesses: '慎重すぎる', keywords: '戦略、整然、知性' },
  14: { type: '開拓者タイプ', strengths: '挑戦力、行動力', weaknesses: '持続力に欠ける', keywords: '冒険、挑戦、拡大' },
  15: { type: '安定志向タイプ', strengths: '落ち着き、信頼性', weaknesses: '変化に弱い', keywords: '安定、地道、継続' },
  16: { type: '洞察型思索者', strengths: '直感、洞察力', weaknesses: '内向的すぎる', keywords: '観察、感受性、深さ' },
  17: { type: '情熱推進タイプ', strengths: '推進力、活力', weaknesses: '独善的', keywords: '前進、情熱、集中' },
  18: { type: '均衡型安定者', strengths: 'バランス感覚、協調性', weaknesses: '決断が遅い', keywords: '調整、中庸、共存' },
  19: { type: '創造型発信者', strengths: '創造力、影響力', weaknesses: '浮き沈みが激しい', keywords: '創造、革新、伝える' },
  20: { type: '内省型支援者', strengths: '思慮深さ、共感力', weaknesses: '引っ込み思案', keywords: '内面、助け合い、調和' },
  21: { type: '強運型決断者', strengths: '行動力、決断力', weaknesses: '強引さ', keywords: '決断、勢い、実行' },
  22: { type: '多才型応用者', strengths: '多才、適応力', weaknesses: '焦りやすい', keywords: '応用、柔軟、発展' },
  23: { type: '豪快型冒険者', strengths: 'パワー、大胆さ', weaknesses: '無計画', keywords: '豪快、冒険、情熱' },
  24: { type: '愛情型包容者', strengths: '愛情深さ、受容力', weaknesses: '甘やかし', keywords: '包む、育てる、愛' },
  25: { type: '堅実型職人', strengths: '堅実さ、継続力', weaknesses: '変化が苦手', keywords: '努力、信頼、蓄積' },
  26: { type: '主張型指導者', strengths: '主張力、影響力', weaknesses: '支配的', keywords: '主導、意志、発信' },
  27: { type: '直感型挑戦者', strengths: '直感、実行力', weaknesses: '無鉄砲', keywords: '直感、挑戦、本能' },
  28: { type: '慎重型調整者', strengths: '慎重さ、調整力', weaknesses: '消極的', keywords: '調整、控えめ、準備' },
  29: { type: '鋭敏型改革者', strengths: '鋭さ、変化力', weaknesses: '疲れやすい', keywords: '改革、刷新、判断' },
  30: { type: '柔和型支援者', strengths: '包容力、穏やかさ', weaknesses: '優柔不断', keywords: '癒し、支える、和やか' },
  31: { type: '先導型実行者', strengths: 'リーダーシップ、行動力', weaknesses: '独善的', keywords: '先頭、実行、影響' },
  32: { type: '交渉型平和主義者', strengths: '交渉力、調和力', weaknesses: '八方美人', keywords: '調和、交渉、和解' },
  33: { type: '情熱型創造者', strengths: '創造性、カリスマ性', weaknesses: '感情的', keywords: '創造、魅了、情熱' }
};

// 指定された日付の中宮九星を取得
function getChugyuFor(dateStr) {
  const baseDate = new Date('2025-06-02'); // 任意の基準日（この日の中宮を基準）
  const baseStarIndex = 5; // 六白金星（0スタートで数える）

  const stars = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
  const target = new Date(dateStr);
  const diffDays = Math.floor((target - baseDate) / (1000 * 60 * 60 * 24));
  const index = (baseStarIndex + diffDays + 9) % 9;
  return stars[index];
}

// 今日から7日分の日付を順に作成して、その日の中宮九星を取得
function getWeeklyChugyuList(mainStar, startDate = new Date()) {
  const result = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const chugyu = getChugyuFor(dateStr);
    const relation = getRelation(mainStar, chugyu);

    result.push({ date: dateStr, chugyu, relation });
  }
  return result;
}

// 本命星と中宮九星の関係を取得
function getRelation(mainStar, chugyuStar) {
  const goGyoMap = {
    '一白水星': '水',
    '二黒土星': '土',
    '三碧木星': '木',
    '四緑木星': '木',
    '五黄土星': '土',
    '六白金星': '金',
    '七赤金星': '金',
    '八白土星': '土',
    '九紫火星': '火'
  };

  const relationTable = {
    '木': { '火': '相生', '土': '相剋', '金': '剋され', '水': '生まれ', '木': '比和' },
    '火': { '土': '相生', '水': '相剋', '金': '剋され', '木': '生まれ', '火': '比和' },
    '土': { '金': '相生', '木': '相剋', '水': '剋され', '火': '生まれ', '土': '比和' },
    '金': { '水': '相生', '火': '相剋', '木': '剋され', '土': '生まれ', '金': '比和' },
    '水': { '木': '相生', '火': '相剋', '土': '剋され', '金': '生まれ', '水': '比和' }
  };

  const main = goGyoMap[mainStar];
  const target = goGyoMap[chugyuStar];
  return relationTable[main][target];
}


/**
 * 性格診断をもとに週運占いを生成する
 * @param {string} seikaku - 性格診断結果のテキスト
 * @return {string} - 週運占いの結果
 */
function generateShuUnFromSeikaku(seikaku) {
  const prompt = makeWeeklyPromptFromSeikaku(seikaku);
  const result = callOpenAI(prompt); // これは内部でAPI呼び出し
  return result;
}

/**
 * オープンAI呼び出し処理（共通関数）
 */
function callOpenAI(promptText) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: "gpt-4o",
    messages: [
      { role: 'system', content: 'あなたはプロの占い師です。' },
      { role: 'user', content: promptText }
    ],
    temperature: 0.7,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${apiKey}` },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.choices[0].message.content.trim();
}


