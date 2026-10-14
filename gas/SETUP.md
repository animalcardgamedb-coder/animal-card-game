# GAS・スプレッドシート連携の追加手順

このフォルダーはGitHub Pages側のコードとは別に、既存のGoogle Apps Scriptプロジェクトへ追加するための補助コードです。GitHubへ反映しただけではスプレッドシートやGASは変更されません。

## 1. 商品リンク関連シートを作成する

1. 既存GASプロジェクトに ProductLinks.gs を追加して、その内容を貼り付けます。
2. GASエディタで setupProductLinkSheets を選んで実行し、権限を承認します。
3. 次の3シートが作成されます。
   - 商品リンク: カードと領土のID・名前を自動同期し、各販売サイトの検索URLを初期入力します。URLを手入力で修正しても、同じIDの行のURLは同期時に維持されます。
   - アフィリエイト: CardsシートにあるカードID・カード名を並べ、Amazon、楽天市場、メルカリ、ゲーマーズの列を用意します。URLは空欄のままなので手動で入力できます。
   - パック・デッキリンク: 商品種別、商品名、公式商品URL、各販売サイトURL、収録カードIDの列を用意します。商品ごとに1行を追加し、収録カードIDにはカードIDをカンマ区切りで入れてください。例: ACG-001,ACG-002,ACG-003

syncProductLinkSheets を実行すれば、カード・領土の新規IDをシートに同期できます。手入力済みのリンク列は同じIDである限り維持されます。新カード登録のたびに自動同期したい場合は、既存 Main.gs の doPost で bulkImport が正常終了したあとに syncProductLinkSheets() を呼び出してください。

## 2. GET APIにリンクデータを追加する

Main.gs の doGet がカード・領地などのデータをまとめているレスポンスオブジェクトに、次の3プロパティを追加してください。

    const linkData = getPurchaseLinkDataForApi_();
    responseData.productLinks = linkData.productLinks;
    responseData.affiliateLinks = linkData.affiliateLinks;
    responseData.packLinks = linkData.packLinks;

responseData は既存 doGet 内で cards、territories、userTags などを入れているレスポンスオブジェクト名に置き換えます。createJsonResponse(...) を呼ぶ前に追加してください。

## 3. キーワード能力の取りこぼしを修正する

KeywordParsingFix.gs の extractLeadingKeywordAbilities_ 関数を既存 HtmlParser.gs に追加します。次に、カード効果のHTML・テキストから official_keywords を作成している箇所で、この関数の結果を既存のキーワード一覧に統合し、重複を除いてから official_keywords 列へ書き込みます。統合例は KeywordParsingFix.gs 冒頭コメントにあります。

この補助関数は、効果区分（〖...〗）より前にあるすべての 《キーワード》 を抽出するため、先頭にキーワードが複数ある場合も回収できます。既存パーサーの変数名に合わせて接続してください。

## 4. アフィリエイト表示について

公式の「トレーディングカードゲーム商品等の著作物利用に関するガイドライン」には、営利目的と認められる著作物利用は禁止と記載されています。そのため、サイト側のアフィリエイト表示はコード上で初期無効（AFFILIATE_LINKS_ENABLED = false）にしてあります。許可やガイドラインとの整合性を確認できるまでは有効化しないでください。

## 5. Googleフォームについて

このリポジトリから利用者のGoogleアカウント内にGoogleフォームを作成することはできません。Google Formsでフォームを作成し、回答用の公開URL（forms.gle または回答画面のURL）を用意した後、js/site-menu.js の CONTACT_FORM_URL に設定してください。公開URLが設定されると、メニューの「お問い合わせフォーム」から直接開けます。準備中はメール問い合わせへのリンクが表示されます。

## 注意

商品リンクの初期URLは販売サイトで検索するためのURLです。検索パラメータが販売サイト側で変更された場合は、シート内のURLを直接修正できます。販売状況・商品名・在庫の有無は各販売サイトで確認してください。