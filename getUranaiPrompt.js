function getUranaiPrompt({ fullName, birth, gender, gokaku, mainStar, weeklyChugyuList, personality }) {
  const start = Utilities.formatDate(new Date(weeklyChugyuList[0].date), 'Asia/Tokyo', 'yyyy年M月d日');
  const end = Utilities.formatDate(new Date(weeklyChugyuList.at(-1).date), 'Asia/Tokyo', 'M月d日');

  return `

以下の情報をもとに、週運占いの結果を日本語で800〜1000文字程度で作成してください。

【入力データ】
・名前：${fullName}
・性格タイプ（人格から）：${personality.type}
・性格キーワード：${personality.keywords}
・強み：${personality.strengths}
・弱み：${personality.weaknesses}
・姓名判断（五格）：
  天格：${gokaku["天格"]}
  人格：${gokaku["人格"]}
  地格：${gokaku["地格"]}
  外格：${gokaku["外格"]}
  総格：${gokaku["総格"]}
・主星（九星）：${mainStar}
・週運データ（毎日の中宮と関係）：
${JSON.stringify(weeklyChugyuList, null, 2)}

【出力フォーマット】
【週運占い：${start}〜${end}】

■ 性格・行動傾向（約300文字）  
姓名判断の五格（特に人格・総格）と、性格キーワード、主星（四緑木星）の特徴を組み合わせて、あなたの性格と行動傾向を具体的に説明してください。

■ 今週のテーマ（約100〜150文字）  
この1週間の流れや注意点、心がけたいことを、中宮とあなたの性格タイプに基づいてまとめてください。

■ 日別アドバイス（1日50文字以内）  
6/2（月）：  
6/3（火）：  
6/4（水）：  
6/5（木）：  
6/6（金）：  
6/7（土）：  
6/8（日）：

■ 今週のラッキーアクション  
ラッキーカラー：○○  
ラッキーアイテム：○○  
意識したいこと：○○（40〜60文字）

■ 今週のひとことメッセージ（50〜80文字）  
ポジティブで前向きな言葉で締めくくってください。

この情報をすべて統合して、読みやすく自然な日本語で800〜1000字でまとめてください。
出力は指定フォーマットに従い、見出しごとに整えてください。

【重要な注意点】
- 出力構成と順序は必ず守ってください。
- 各セクションの見出しは必ず表示してください。
- 「相剋」「比和」などの専門用語は、わかりやすい言葉に置き換えて説明してください。
- 性格と運勢の関係性を具体的に表現してください（例：「持続力に欠けるあなたにとって…」）。
`;
}

/**
 * 性格診断のプロンプトを生成
 */
function getSeikakuPrompt({ fullName, gokaku, mainStar, personality }) {
  return `
以下の情報をもとに、姓名判断に基づいた性格診断の結果を日本語で300〜400文字で作成してください。

【入力データ】
・名前：${fullName}
・性格タイプ（人格から）：${personality.type}
・性格キーワード：${personality.keywords}
・強み：${personality.strengths}
・弱み：${personality.weaknesses}
・姓名判断（五格）：
  天格：${gokaku["天格"]}
  人格：${gokaku["人格"]}
  地格：${gokaku["地格"]}
  外格：${gokaku["外格"]}
  総格：${gokaku["総格"]}
・主星（九星）：${mainStar}

【出力フォーマット】
■ 性格診断（300〜400字）
姓名判断の五格（特に人格・総格）と、性格キーワード、主星（四緑木星）の特徴を組み合わせて、性格と行動傾向を具体的に説明してください。

【注意点】
- 出力は「■ 性格診断」から始めてください。
- 難しい専門用語は避け、自然で優しい日本語にしてください。
- 強みや弱みを上手に織り交ぜ、ポジティブな印象でまとめてください。
`;
}

/**
 * 週運占いのプロンプトを生成（フルバージョンとの違いは性格をパラメータとして渡すところだけ）
 */
function makeWeeklyPromptFromSeikaku({ fullName, gokaku, mainStar, personality, weeklyChugyuList }) {
  const start = Utilities.formatDate(new Date(weeklyChugyuList[0].date), 'Asia/Tokyo', 'yyyy年M月d日');
  const end = Utilities.formatDate(new Date(weeklyChugyuList.at(-1).date), 'Asia/Tokyo', 'M月d日');

  const weeklyChugyuText = weeklyChugyuList.map((item) =>
    `${Utilities.formatDate(new Date(item.date), 'Asia/Tokyo', 'M月d日')}：${item.chugyu}（${item.relationship}）`
  ).join('\n');

  return `
以下の情報をもとに、週運占いの結果を日本語で800〜1000文字程度で作成してください。

【入力データ】
・名前：${fullName}
・性格タイプ（人格から）：${personality.type}
・性格キーワード：${personality.keywords}
・強み：${personality.strengths}
・弱み：${personality.weaknesses}
・姓名判断（五格）：
  天格：${gokaku["天格"]}
  人格：${gokaku["人格"]}
  地格：${gokaku["地格"]}
  外格：${gokaku["外格"]}
  総格：${gokaku["総格"]}
・主星（九星）：${mainStar}
・週運データ（毎日の中宮と関係）：
${weeklyChugyuText}

【出力フォーマット】
【週運占い：${start}〜${end}】

■ 今週のテーマ（約100〜150文字）  
この1週間の流れや注意点、心がけたいことを、中宮とあなたの性格タイプに基づいてまとめてください。

■ 日別アドバイス（1日50文字以内）  
（例：6/2（月）：○○○○○）

■ 今週のラッキーアクション  
ラッキーカラー：○○  
ラッキーアイテム：○○  
意識したいこと：○○（40〜60文字）

■ 今週のひとことメッセージ（50〜80文字）  
ポジティブで前向きな言葉で締めくくってください。

この情報をすべて統合して、読みやすく自然な日本語で800〜1000字でまとめてください。
出力は指定フォーマットに従い、見出しごとに整えてください。

【重要な注意点】
- 出力構成と順序は必ず守ってください。
- 各セクションの見出しは必ず表示してください。
- 「相剋」「比和」などの専門用語は、わかりやすい言葉に置き換えて説明してください。
- 性格と運勢の関係性を具体的に表現してください。
`;
}

