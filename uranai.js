// 九星（早生まれ対応あり）算出
function getKyuusei(year, month, day) {
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
        recordMissingKakusuu(char); // ← ここで記録する
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
function recordMissingKakusuu(char) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("画数辞書");
  const data = sheet.getDataRange().getValues(); // すべてのデータ取得

  // すでに登録済みかチェック（1列目：漢字列）
  const existingChars = data.map(row => row[0]);
  if (existingChars.includes(char)) return;

  // 未登録なら末尾に追記（初期値は0、手動フラグはTRUE）
  sheet.appendRow([char, 0, true]); 
}




