function clearKakusuCache() {
  CacheService.getScriptCache().remove("kakusuMap");
  Logger.log("キャッシュを削除しました");
}

function checkEnvVars() {
  const token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  const sheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  console.log("Token:", token ? "✅" : "❌ MISSING");
  console.log("Sheet ID:", sheetId ? "✅" : "❌ MISSING");
}
