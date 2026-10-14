/*
 * HtmlParser.gs にある既存の extractOfficialKeywordsForImport(effectLines) を
 * この関数で丸ごと置き換えてください。
 *
 * 修正点:
 * 旧版は /^《([^》]+)》/ で行頭のキーワードを1つだけ取っていました。
 * この版では各行にある《...》をすべて取得するため、
 * 《○○》《△△》のように連続する複数キーワードも漏れなく保存します。
 */
function extractOfficialKeywordsForImport(effectLines) {
  const result = [];

  (Array.isArray(effectLines) ? effectLines : []).forEach(function(line) {
    const text = String(line || "");
    const regex = /《([^》]+)》/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const keyword = String(match[1] || "").trim();
      if (keyword && result.indexOf(keyword) === -1) {
        result.push(keyword);
      }
    }
  });

  return result;
}
