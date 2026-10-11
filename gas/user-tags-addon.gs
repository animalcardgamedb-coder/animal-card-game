/**
 * ANIMALCARDGAME DB - User tag GAS add-on
 *
 * This file is a helper/add-on for the existing Google Apps Script project
 * which serves js/api.js. It does NOT replace the existing doGet(e), because
 * that handler also returns the current cards/territories feed.
 *
 * Integration steps:
 * 1. Open the existing Apps Script project attached to the card database.
 * 2. Add this entire file as a script file (for example user-tags-addon.gs).
 * 3. At the VERY START of the existing doGet(e), add:
 *
 *      const userTagResponse = handleUserTagAction_(e);
 *      if (userTagResponse) return userTagResponse;
 *
 *    Keep the existing card-data response code after those two lines intact.
 * 4. Save and deploy a new version of the existing Web App deployment. Keep
 *    its current URL so the existing API_URL in js/api.js stays valid.
 *
 * Sheet created automatically on first use: 「ユーザータグ」
 * Columns: cardType | cardId | cardName | tag
 * Catalog rows have blank cardType/cardId/cardName. Card assignment rows
 * record one card/tag pair per row. Deleting a tag removes both its catalog
 * row and all card assignments for that tag.
 *
 * This web app endpoint is accessible to anyone who can access the website.
 * Do not store private information in this sheet.
 */

function handleUserTagAction_(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || '').trim();
  if (!action) return null;

  const supported = ['listUserTags', 'addUserTag', 'deleteUserTag', 'setCardTags'];
  if (supported.indexOf(action) < 0) return null;

  const callback = String(params.prefix || '').replace(/[^A-Za-z0-9_$]/g, '');
  const respond = function(payload) {
    const json = JSON.stringify(payload || {});
    const body = callback
      ? callback + '(' + json.replace(/</g, '\\u003c') + ');'
      : json;
    return ContentService.createTextOutput(body)
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  };

  try {
    const result = withUserTagSheetLock_(function(sheet) {
      const table = readUserTagTable_(sheet);
      const requestedTag = normalizeUserTag_(params.tag);
      const cardType = String(params.cardType || '').trim();
      const cardId = String(params.cardId || '').trim();
      const cardName = String(params.cardName || '').trim().slice(0, 200);

      if (action === 'listUserTags') {
        return { ok: true, tags: table.tags, assignments: table.assignments };
      }

      if (action === 'addUserTag') {
        if (!requestedTag) throw new Error('タグ名を入力してください。');
        if (!table.tags.some(function(tag) { return normalizeUserTag_(tag) === normalizeUserTag_(requestedTag); })) {
          sheet.appendRow(['', '', '', requestedTag]);
        }
        return { ok: true };
      }

      if (action === 'deleteUserTag') {
        if (!requestedTag) throw new Error('削除するタグ名を確認できません。');
        const rows = sheet.getDataRange().getValues();
        for (let index = rows.length - 1; index >= 1; index--) {
          if (normalizeUserTag_(rows[index][3]) === normalizeUserTag_(requestedTag)) {
            sheet.deleteRow(index + 1);
          }
        }
        return { ok: true };
      }

      if (action === 'setCardTags') {
        if (!cardId || (cardType !== 'card' && cardType !== 'territory')) {
          throw new Error('カード種別またはカードIDを確認できません。');
        }
        let requestedTags = [];
        try {
          requestedTags = JSON.parse(String(params.tags || '[]'));
        } catch (error) {
          throw new Error('タグのデータを読み取れませんでした。');
        }
        if (!Array.isArray(requestedTags)) throw new Error('タグの形式が正しくありません。');
        requestedTags = requestedTags.map(normalizeUserTag_).filter(Boolean);
        const available = {};
        table.tags.forEach(function(tag) { available[normalizeUserTag_(tag)] = tag; });
        requestedTags = Array.from(new Set(requestedTags))
          .filter(function(tag) { return Object.prototype.hasOwnProperty.call(available, tag); })
          .map(function(tag) { return available[tag]; });

        const rows = sheet.getDataRange().getValues();
        for (let index = rows.length - 1; index >= 1; index--) {
          if (String(rows[index][0]) === cardType && String(rows[index][1]) === cardId) {
            sheet.deleteRow(index + 1);
          }
        }
        requestedTags.forEach(function(tag) {
          sheet.appendRow([cardType, cardId, cardName, tag]);
        });
        return { ok: true };
      }

      return { ok: false, error: '未対応の操作です。' };
    });
    return respond(result);
  } catch (error) {
    return respond({ ok: false, error: String(error && error.message || 'ユーザータグの処理に失敗しました。') });
  }
}

function normalizeUserTag_(value) {
  return String(value == null ? '' : value).trim().slice(0, 24);
}

function withUserTagSheetLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error('このGASを対象スプレッドシートに紐付けてください。');
    }
    let sheet = spreadsheet.getSheetByName('ユーザータグ');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('ユーザータグ');
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 4).setValues([['cardType', 'cardId', 'cardName', 'tag']]);
      sheet.setFrozenRows(1);
    }
    return callback(sheet);
  } finally {
    lock.releaseLock();
  }
}

function readUserTagTable_(sheet) {
  const rows = sheet.getDataRange().getValues();
  const tags = [];
  const seen = {};
  const assignments = {};
  for (let index = 1; index < rows.length; index++) {
    const cardType = String(rows[index][0] || '').trim();
    const cardId = String(rows[index][1] || '').trim();
    const tag = normalizeUserTag_(rows[index][3]);
    if (!tag) continue;
    const normalized = normalizeUserTag_(tag);
    if (!seen[normalized]) {
      seen[normalized] = tag;
      tags.push(tag);
    }
    if (cardId && (cardType === 'card' || cardType === 'territory')) {
      const key = cardType + ':' + cardId;
      if (!assignments[key]) assignments[key] = [];
      if (assignments[key].indexOf(tag) < 0) assignments[key].push(tag);
    }
  }
  tags.sort(function(a, b) { return a.localeCompare(b, 'ja'); });
  return { tags: tags, assignments: assignments };
}
