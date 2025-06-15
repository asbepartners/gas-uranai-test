const OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  const ss = SpreadsheetApp.openById('1Ait1DQmAWoAFV_MwBGDRg36_iIoLtUj77916KhHrlsM');
  const json = JSON.parse(e.postData.contents);

  try {
    if (json.events) {
      // LINE Webhook用の処理
      return handleLineWebhook(json, ss);
    } else if (json.lastName && json.firstName && json.birthDate) {
      // Firebaseフォーム登録用の処理
      return handleFirebaseForm(json, ss);
    } else {
      throw new Error("不明な形式のPOSTデータです。");
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 🟡 LINE Webhookからのリクエスト
function handleLineWebhook(json, ss) {
  debugLog("🔧 handleLineWebhook開始");

  const sheet = ss.getSheetByName('userIdリスト');
  const dataSheet = ss.getSheetByName("登録データ");
  const token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");

  json.events.forEach(event => {
    try {
      debugLog("event.type: " + event.type);
      if (event.type === 'message' && event.message && event.message.type === 'text' && event.source && event.source.userId) {
      // if (event.type === 'message' && event.source && event.source.userId) {
        const userId = event.source.userId;
        const msgText = event.message.text.trim();
        debugLog("📩 受信メッセージ: " + msgText);
        const now = new Date();

        const all = sheet.getDataRange().getValues();
        const existing = all.some(row => row[0] === userId);

        // UserIdリストにユーザーIDを書き込む（未登録だったら）
        if (!existing) {
          sheet.appendRow([userId, "", now]);
        }

        // 🟢 ② メッセージに応じた応答分岐
        // let replyText = "";
        debugLog(userId);
        const myUserId = ""; //管理者のUserId
        if (msgText.includes("性格診断")) {
          const userData = findUserFromSheet(userId);
          debugLog("📦 userData: " + JSON.stringify(userData));
          if (userData) {
            // ここで、整形済みの診断文がスプレッドシートにある前提なら、それを返す
            replyText = userData.seimeiResultText || "診断結果が登録されていませんでした。";
          } else {
            replyText = "登録情報が見つかりませんでした。フォームから診断をお願いします。";
          }
        } else {
          // LINEのキャッシュ対応でURLの後ろに日付を入れる
          const firebaseUrl = "https://uranai-project-f42a6.web.app/";
          const today = new Date().toISOString().slice(0,10).replace(/-/g, '');
          const fullUrl = `${firebaseUrl}?v=${today}`;

          replyText = existing
            ? "📩 メッセージありがとうございます。\nできるだけ早くお返事しますね。"
            : `はじめまして！診断ご希望の方はこちら👇\n${fullUrl}`;
        }

        // 🔁 LINE返信
        const reply = {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }]
        };

        UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          payload: JSON.stringify(reply)
        });
      }
    } catch (err) {
      Logger.log("⚠️ イベント処理エラー: " + err);
    }    
  });

  return ContentService.createTextOutput("OK");
}

// 🟢 FirebaseフォームからのPOST（登録情報の保存）
function handleFirebaseForm(json, ss) {
  const sheet = ss.getSheetByName('登録情報');
  const fullName = json.lastName + json.firstName;

  sheet.appendRow([
    new Date(),
    json.lastName,
    json.firstName,
    fullName,
    json.birthDate,
    json.gender || "",
    json.userId || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 登録ユーザーの姓名判断を取り出す
function findUserFromSheet(userId) {
  debugLog("function Find User Sheet 開始");
  debugLog(userId);
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"));
  const sheet = ss.getSheetByName("登録情報");
  const values = sheet.getDataRange().getValues();
  const header = values[0];

  const idxMap = {};
  header.forEach((col, i) => idxMap[col] = i);

  for (let i = 1; i < values.length; i++) {
    if (values[i][idxMap["userId"]] === userId) {
      return {
        fullName: values[i][idxMap["氏名"]],
        gokaku: {
          "天格": values[i][idxMap["天格"]],
          "人格": values[i][idxMap["人格"]],
          "地格": values[i][idxMap["地格"]],
          "外格": values[i][idxMap["外格"]],
          "総格": values[i][idxMap["総格"]],
        },
        mainStar: values[i][idxMap["主星"]],
        personality: {
          type: values[i][idxMap["性格タイプ"]],
          keywords: values[i][idxMap["性格キーワード"]],
          strengths: values[i][idxMap["強み"]],
          weaknesses: values[i][idxMap["弱み"]],
        },
        seimeiResultText: values[i][idxMap["性格診断文"]]
      };
    }
  }
  debugLog("❌ userId に一致する行は見つからなかった");
  return null;
}

// ログを出力する
function debugLog(message) {
  const sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")).getSheetByName("ログ");
  sheet.appendRow([new Date(), message]);
}





