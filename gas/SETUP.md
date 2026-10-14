# GAS・スプレッドシート連携の追加手順

このフォルダーはGitHub Pages側のコードとは別に、既存のGoogle Apps Scriptプロジェクトへ追加するための補助コードです。GitHubへ反映しただけではスプレッドシートやGASは変更されません。

## 1. 商品リンク関連シートを作成する

1. 既存GASプロジェクトに ProductLinks.gs を追加して、その内容を貼り付けます。
2. GASエディタで setupProductLinkSheets を選んで実行し、権限を承認します。
3. 次の3シートが作成されます。
   - 商品リンク: カードと領土のID・名前を自動同期し、各販売サイトの検索URLを初期入力します。URLを手入力で修正しても、同じIDの行のURLは同期時に維持されます。
   - アフィリエイト: CardsシートにあるカードID・カード名を並べ、Amazon、楽天市場、メルカリ、ゲーマーズの列を用意します。URLは空欄のままなので手動で入力できます。
   - パック・デッキリンク: 商品種別、商品名、公式商品URL、各販売サイトURL、収録カードIDの列を用意します。商品ごとに1行を追加し、収録カードIDにはカードIDをカンマ区切りで入れてください。例: ACG-001,ACG-002,ACG-003

### 公式商品情報を自動取り込みする

公式の商品一覧ページ（https://acgtcg.com/products.html）から、リンク先の商品詳細ページを巡回して商品情報を登録できます。

1. 既存GASプロジェクトに `OfficialProductImport.gs` を新しいスクリプトファイルとして追加し、同名ファイルの内容を全文貼り付けます。
2. `ProductLinks.gs` と同じプロジェクトに保存します。
3. 関数一覧から `importOfficialProductCatalog` を選択し、「実行」します。初回は外部サイトへのアクセス権限を確認・承認します。
4. 「パック・デッキリンク」シートにある商品名、商品種別、公式商品URL、発売日、希望小売価格、デッキコンセプトが自動入力されます。ページ内のリンクや画像属性で照合できたカードIDも追加します。

既存行は公式商品URLを基準に照合し、販売サイトURLなどの手入力値は保持します。取得できない項目は空欄のままです。カード画像だけで名前やIDが特定できない場合、収録カードIDは完全には自動入力できないため、必要に応じて手で補ってください。

毎週自動で公式ページを確認したい場合は、関数一覧から `installOfficialProductCatalogWeeklySync` を一度実行します。週次同期を止めるには `removeOfficialProductCatalogWeeklySync` を実行してください。週次同期は、GASを実行したGoogleアカウントの権限・タイムゾーンに従います。

この取り込みは公式サイトのページ構造に依存します。公式側でHTMLが変更されると取得に失敗することがあります。実行後は「パック・デッキリンク」シートの内容を確認してください。

syncProductLinkSheets を実行すれば、カード・領土の新規IDをシートに同期できます。手入力済みのリンク列は同じIDである限り維持されます。新カード登録のたびに自動同期するには、既存 Main.gs の doPost 内にある bulkImport 分岐を、次のように変更してください。ほかの分岐（addUserTag など）はそのまま残します。

    if (body.action === "bulkImport") {
      const html = body.html || "";
      if (!html) throw new Error("HTMLデータが空です。");
      const result = importBulkHtml(html);
      if (result && result.success) syncProductLinkSheets();
      return createJsonResponse(result);
    }

これにより、HTMLからのカード・領土登録が成功した後、商品リンク・アフィリエイトシートのID一覧も同期されます。

## 2. GET APIにリンクデータを追加する

Main.gs の doGet では、既存の const data = { ... } が cards、territories、userTags、cardUserTags などをまとめています。その data オブジェクトを作成した直後、return createJsonResponse(data, prefix); の前に、次のコードを追加してください。

    const linkData = getPurchaseLinkDataForApi_();
    data.productLinks = linkData.productLinks;
    data.affiliateLinks = linkData.affiliateLinks;
    data.packLinks = linkData.packLinks;

既存の data オブジェクト名はそのまま使います。

## 3. キーワード能力の取りこぼしを修正する

KeywordParsingFix.gs の内容を使い、既存 HtmlParser.gs の function extractOfficialKeywordsForImport(effectLines) 全体を置き換えてください。別ファイルに同名関数を追加するのではなく、元の関数を置換します。

原因は旧関数が各行に対して /^《([^》]+)》/ を使い、行頭にあるキーワードを1つしか取得していなかったことです。修正版は各行の 《...》 を末尾まで繰り返し取得するため、たとえば 《先制》 《貫通》 のように同じ行に複数のキーワードが並んでいても全て登録します。重複したキーワードは引き続き1回だけ記録します。

## 4. アフィリエイトリンクについて

商品詳細画面では、アフィリエイトシートのAmazon・楽天市場・メルカリ・ゲーマーズ欄にURLがある場合、そのURLを優先して表示する設定になっています（AFFILIATE_LINKS_ENABLED = true）。URLが空欄の場合は、通常の販売サイト検索URLが表示されます。パック・デッキリンクシートのURLは商品ごとのリンクとして表示されます。

ページ内には「一部リンクにはアフィリエイトリンクを含む場合があります」と表示します。公式の「トレーディングカードゲーム商品等の著作物利用に関するガイドライン」では営利目的の著作物利用を禁止しているため、アフィリエイト利用が許可されていると断定できるわけではありません。実際に利用する場合は、ガイドラインや運営からの連絡に応じて判断・調整してください。

## 5. Googleフォームについて

お問い合わせフォームURLは js/site-menu.js の CONTACT_FORM_URL に設定済みです。公開サイトのメニューにある「お問い合わせフォーム」を押すと、指定されたGoogleフォームを新しいタブで開きます。


## 6. カードリストと商品情報を毎月第4金曜日に自動同期する

1. `MonthlyOfficialSync.gs` を既存GASプロジェクトに新しいスクリプトファイルとして追加し、GitHubの同名ファイルを全文貼り付けます。
2. `Import.gs`、`ProductLinks.gs`、`OfficialProductImport.gs`、`MonthlyOfficialSync.gs` を同じGASプロジェクトに保存します。
3. Apps Script の「プロジェクトの設定」でタイムゾーンを `Asia/Tokyo` に設定します。
4. 関数一覧から `runMonthlyOfficialSyncNow` を手動実行し、権限を承認して最初の同期結果を確認します。
5. エラーがないことを確認したら、`installMonthlyOfficialSyncTrigger` を一度実行します。

定期トリガーは毎週金曜日の午前4時〜5時ごろに起動しますが、処理本体は第4金曜日（22〜28日）と判定した月だけ実行します。これにより、毎月第4金曜日にのみカードリスト・購入リンク・公式商品カタログをまとめて同期します。毎月の同期はカードIDを基準に既存カードを更新するため、同じカードIDの行を重複追加しません。自動同期結果は `自動同期ログ` シートに記録されます。

不要になった場合は `removeMonthlyOfficialSyncTrigger` を実行してトリガーを削除してください。インストーラーは、以前に設定した `importOfficialProductCatalog` の単独トリガーも削除し、商品情報が週次で別に二重更新されるのを防ぎます。

### キーワード抽出関数について

添付いただいた `Import.gs` には、実際にカード取り込みで使われる `extractOfficialKeywordsForImport(effectLines)` が定義されています。複数の `《キーワード》` が同じ行にある場合にすべて保存するため、**既存の Import.gs にある同名関数を**次のコードに置き換えてください。別ファイルに同名関数を増やさないでください。

```javascript
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
```

以前の案内どおり `HtmlParser.gs` に同名関数も追加していた場合は、重複定義を避け、修正版を Import.gs の既存関数へ統合してください。

## 注意

商品リンクの初期URLは販売サイトで検索するためのURLです。検索パラメータが販売サイト側で変更された場合は、シート内のURLを直接修正できます。販売状況・商品名・在庫の有無は各販売サイトで確認してください。