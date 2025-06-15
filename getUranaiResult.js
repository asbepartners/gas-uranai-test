// 占い実行
function getUranaiResult(data) {
  const fullName = data.lastName + " " + data.firstName;

  // 五格を取得
  let gokaku;
  // space除去
  const cleanedLastName = data.lastName.replace(/\s/g, '').replace(/　/g, '');
  const cleanedFirstName = data.firstName.replace(/\s/g, '').replace(/　/g, ''); 
  console.log(`姓：${cleanedLastName}`);
  console.log(`名：${cleanedFirstName}`);
  try {
    Logger.log("🟡 try内：getGokaku呼び出し直前");
    gokaku = getGokaku(cleanedLastName, cleanedFirstName);
    Logger.log("🟢 try内：getGokaku呼び出し成功");
      // → 画数がOKなら正常に五格が返ってくる
  } catch (e) {
    Logger.log("catchに入るかtest");
    Logger.log("🔥 エラーメッセージ:%s", e.message);
    const msg = e.message;

    if (msg.includes("の画数が定義されていません")) {
      const match = msg.match(/「(.+?)」の画数が定義されていません/);
      const kanji = match ? match[1] : null;

      Logger.log("🔍 抽出された漢字: %s", kanji);

      return {
        success: false,
        type: 'missingKanji',
        message: msg,
        kanji: kanji
      };
    } else {
      return {
        success: false,
        type: 'unknownError',
        message: msg,
        kanji: null
      };
    }
  }
  console.log("gokaku:", gokaku);

  // 生年月日から年・月・日を取得
  const birthParts = data.birth.split('-'); // "1969-03-12" → ["1969", "03", "12"]
  const year = parseInt(birthParts[0], 10);
  const month = parseInt(birthParts[1], 10);
  const day = parseInt(birthParts[2], 10);

  // 九星を取得
  const mainStar = getMainStar(year, month, day);

  // 週間の中宮九星リストを取得
  // 今週の月曜日を取得
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay(); // 0=日曜, 1=月曜, ...
    const diff = (day === 0) ? -6 : 1 - day; // 日曜なら前の月曜を基準に
    monday.setDate(today.getDate() + diff);
    return monday;
  };
  const weeklyChugyuList = getWeeklyChugyuList(mainStar, getMondayOfCurrentWeek());

  // 人格から性格のキーワード取得
  const personality = personalityMap[gokaku["人格"]] || {
    type: '不明タイプ',
    strengths: '',
    weaknesses: '',
    keywords: ''
  };

  // 性格診断
  const seikakuPrompt = getSeikakuPrompt({
    fullName,
    gokaku,
    mainStar,
    personality,
  });
  console.log("seikakuPrompt=%s",seikakuPrompt);
  const seikakuResult = callOpenAI(seikakuPrompt);


  // 週占い
  const weeklyPrompt = makeWeeklyPromptFromSeikaku({
    fullName,
    gokaku,
    mainStar,
    personality,
    weeklyChugyuList,
  });
  console.log("weeklyPrompt=%s",weeklyPrompt);
  const weeklyResult = callOpenAI(weeklyPrompt);

  // ✅ ここで保存！
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"));
  const sheet = ss.getSheetByName('総合占い'); 
  if (!sheet) throw new Error('シート「総合占い」が見つかりません');
  sheet.appendRow([
    new Date(),          // 実行時刻
    data.lastName,
    data.firstName,
    data.birth,
    data.gender,
    gokaku.天格,
    gokaku.人格,
    gokaku.地格,
    gokaku.外格,
    gokaku.総格,
    mainStar,
    personality.type,
    personality.keywords,
    personality.strengths,
    personality.weaknesses,
    seikakuResult,
    weeklyResult
  ]);

  return seikakuResult + "\n\n" + weeklyResult;
}
