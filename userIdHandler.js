// 登録情報からUserIdをキーとして性格診断を取得する
function getSeikakuByUserId(userId) {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"));
  const sheet = ss.getSheetByName('登録情報');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdIndex = headers.indexOf("userId");
  const seimeiIndex = headers.indexOf("性格診断文");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[userIdIndex]===userId) {
      return row[seimeiIndex];
    }
  }
  return null;
}

// 登録情報からUserIdをキーとして週運を取得する(姓名診断が終わっていない＝性格がNULLの人は対象外)
function generateWeeklyUranaiByUserId(userId) {
  const seikaku = getSeikakuByUserId(userId);
  if (!seikaku) {
    return "⚠️ 性格診断が未登録です。";
  }
  const data = getUserFortuneData(userId);
  const weeklyPrompt = makeWeeklyPromptFromSeikaku(data);
  console.log("weeklyPrompt=%s", weeklyPrompt);
  const weeklyResult = callOpenAI(weeklyPrompt);

  return weeklyResult;
}

// 登録情報からUserIdをキーとして「週運」を一括送信
function pushWeeklyFortuneToAll() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("登録情報");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdIndex = headers.indexOf("userId");
  Logger.log (userIdIndex);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const userId = row[userIdIndex];
    Logger.log(userId);
    if (!userId) continue;
    const weekResult = generateWeeklyUranaiByUserId(userId);
    pushResultToUser(userId, weekResult);

    // ✅ ここで保存！
    const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"));
    const sheet = ss.getSheetByName('週占い'); 
    if (!sheet) throw new Error('シート「週占い」が見つかりません');
    sheet.appendRow([
      new Date(),          // 実行時刻
      userId,
      weekResult
  ]);


  }
}

// 登録情報からUserIdをキーとして初回の「性格診断＋週運」を送っていない人に一括送信
function pushAllUnsentDiagnoses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("登録情報");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const now = new Date();
  const userIdIndex = headers.indexOf("userId");
  const seimeiIndex = headers.indexOf("性格診断文");
  const sentIndex = headers.indexOf("診断送信日");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const userId = row[userIdIndex];
    const seimeiText = row[seimeiIndex];
    const alreadySent = row[sentIndex];

    if (userId && seimeiText && !alreadySent) {
      pushInitialDiagnosis(userId);
      sheet.getRange(i + 1, sentIndex + 1).setValue(now);
      SpreadsheetApp.flush();  // 念のため即時反映
    }
  }
}

// 登録情報からUserIdをキーとして性格診断+週運を作成する
function pushInitialDiagnosis(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("登録情報");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const row = data.find(row => row[headers.indexOf("userId")] === userId);
  if (!row) return;

  // 性格診断文までは登録済みのスプレッドシートから取得
  const seimeiText = row[headers.indexOf("性格診断文")];

  // 今週の週運を取得
  const fortuneData = getUserFortuneData(userId);
  const weeklyPrompt = makeWeeklyPromptFromSeikaku(fortuneData);
  console.log("weeklyPrompt=%s",weeklyPrompt);
  const weeklyResult = callOpenAI(weeklyPrompt);    

  const fullText = `${seimeiText}\n\n【今週の運勢】\n${weeklyResult}`;
  console.log("fullText=%s",fullText);
  pushResultToUser(userId, fullText);
}

// 週運プロンプト生成のためのデータ整形を行うヘルパー関数
function getUserFortuneData(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("登録情報");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const row = data.find(r => r[headers.indexOf("userId")] === userId);
  if (!row) return null;

  const fullName = row[headers.indexOf("氏名")];

  const gokaku = {
    "天格": row[headers.indexOf("天格")],
    "人格": row[headers.indexOf("人格")],
    "地格": row[headers.indexOf("地格")],
    "外格": row[headers.indexOf("外格")],
    "総格": row[headers.indexOf("総格")]
  };
  const mainStar = row[headers.indexOf("主星（九星）")];
  const personality = {
    type: row[headers.indexOf("性格タイプ")],
    keywords: row[headers.indexOf("性格キーワード")],
    strengths: row[headers.indexOf("強味")],
    weaknesses: row[headers.indexOf("弱み")]
  };
  const weeklyChugyuList = getWeeklyChugyuList(mainStar);

  return {
    fullName,
    gokaku,
    mainStar,
    personality,
    weeklyChugyuList
  };
}

/**
 * 指定された userId に対してメッセージをPush送信する
 * @param {string} userId - LINEのuserId
 * @param {string} text - 送信するメッセージ本文
 */
function pushResultToUser(userId, text) {
  const token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");

  const payload = {
    to: userId,
    messages: [
      {
        type: "text",
        text: text
      }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token
    },
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
}


