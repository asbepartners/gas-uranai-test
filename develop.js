function clearKakusuCache() {
  CacheService.getScriptCache().remove("kakusuMap");
  Logger.log("キャッシュを削除しました");
}

