/*
 * HtmlParser.gs 用: 効果先頭に複数あるキーワード能力をまとめて抽出します。
 * effectText は、可能ならタグを除去する前のテキスト、またはHTML文字列を渡してください。
 *
 * 既存パーサーでキーワード一覧を作っているところで次のように統合してください。
 * const recovered = extractLeadingKeywordAbilities_(effectText);
 * const keywords = [...new Set([...(existingKeywords || []), ...recovered])];
 * official_keywords = keywords.join("、");
 */
function extractLeadingKeywordAbilities_(effectText) {
  const text = String(effectText || "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
  const leadingBlock = (text.split(/[〖【]/, 1)[0] || "").trim();
  const names = [];
  const pattern = /《\s*([^》]+?)\s*》/g;
  let match;
  while ((match = pattern.exec(leadingBlock)) !== null) {
    const keyword = String(match[1] || "").trim();
    if (keyword && !names.includes(keyword)) names.push(keyword);
  }
  return names;
}