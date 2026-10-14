# GAS・スプレッドシート連携の追加手順

このフォルダーはGitHub Pages側のコードとは別に、既存のGoogle Apps Scriptプロジェクトへ追加するための補助コードです。GitHubへ反映しただけではスプレッドシートやGASは変更されません。

## 1. 商品リンク関連シートを作成する

1. 既存GASプロジェクトに ProductLinks.gs を追加して、その内容を貼り付けます。
2. GASエディタで setupProductLinkSheets を選んで実行し、権限を承認します。
3. 次の3シートが作成されます。
   - 商品リンク: カードと領土のID・名前を自動同期し、各販売サイトの検索URLを初期入力します。URLを手入力で修正しても、同じIDの行のURLは同期時に維持されます。
   - アフィリエイト: CardsシートにあるカードID・カード名を並べ、Amazon、楽天市場、メルカリ、ゲーマーズの列を用意します。URLは空欄のままなので手動で入力できます。
   - パック・デッキリンク: 商品種別、商品名、公式商品URL、各販売サイトURL、収録カードIDの列を用意します。商品ごとに1行を追加し、収録カードIDにはカードIDをカンマ区切りで入れてください。例: ACG-001,ACG-002,ACG-003

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

## 4. アフィリエイト表示について

公式の「トレーディングカードゲーム商品等の著作物利用に関するガイドライン」には、営利目的と認められる著作物利用は禁止と記載されています。そのため、サイト側のアフィリエイト表示はコード上で初期無効（AFFILIATE_LINKS_ENABLED = false）にしてあります。許可やガイドラインとの整合性を確認できるまでは有効化しないでください。

## 5. Googleフォームについて

このリポジトリから利用者のGoogleアカウント内にGoogleフォームを作成することはできません。Google Formsでフォームを作成し、回答用の公開URL（forms.gle または回答画面のURL）を用意した後、js/site-menu.js の CONTACT_FORM_URL に設定してください。公開URLが設定されると、メニューの「お問い合わせフォーム」から直接開けます。準備中はメール問い合わせへのリンクが表示されます。

## 注意

商品リンクの初期URLは販売サイトで検索するためのURLです。検索パラメータが販売サイト側で変更された場合は、シート内のURLを直接修正できます。販売状況・商品名・在庫の有無は各販売サイトで確認してください。