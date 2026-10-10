import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

/*
  Firebase project configuration.
  These browser settings identify the Firebase project; Firestore rules
  provide the actual protection for user data.
*/
const firebaseConfig = {
  apiKey: "AIzaSyBx56x3h9_VGWTxGnKPom3tVh-vO3f3PQk",
  authDomain: "animal-card-game-ee36b.firebaseapp.com",
  projectId: "animal-card-game-ee36b",
  storageBucket: "animal-card-game-ee36b.firebasestorage.app",
  messagingSenderId: "704030396662",
  appId: "1:704030396662:web:2e28d6cb4db7efbadd5cd7"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let signedInUser = null;
let selectedDeckId = "";
let selectedDeck = null;

const byId = id => document.getElementById(id);

function normalizeTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : []).map(tag => String(tag).trim()).filter(Boolean))]
    .slice(0, 12)
    .map(tag => tag.slice(0, 24));
}

function normalizeSharedDeckTags(tags) {
  const unique = new Map();
  (Array.isArray(tags) ? tags : []).forEach(value => {
    const tag = String(value || "").trim().slice(0, 24);
    const key = tag.toLocaleLowerCase("ja-JP");
    if (tag && !unique.has(key)) unique.set(key, tag);
  });
  return [...unique.values()].sort((a, b) => a.localeCompare(b, "ja"));
}

function sharedDeckTagDocumentId(value) {
  return "tag-" + encodeURIComponent(String(value || "").trim().toLocaleLowerCase("ja-JP"));
}

function sharedDeckTagDocument(value) {
  const tag = String(value || "").trim().slice(0, 24);
  return {
    name: tag,
    normalized: tag.toLocaleLowerCase("ja-JP"),
    createdAt: serverTimestamp(),
    createdByUid: signedInUser.uid
  };
}

function setStatus(elementId, message) {
  const element = byId(elementId);
  if (element) element.textContent = message;
}

function showModal(id) {
  const modal = byId(id);
  if (modal) modal.style.display = "block";
}

function hideModal(id) {
  const modal = byId(id);
  if (modal) modal.style.display = "none";
}

function readableError(error) {
  const messages = {
    "auth/email-already-in-use": "このメールアドレスは登録済みです。ログインをお試しください。",
    "auth/invalid-email": "メールアドレスの形式を確認してください。",
    "auth/weak-password": "パスワードを見直してください。",
    "auth/invalid-credential": "メールアドレスまたはパスワードを確認してください。",
    "auth/popup-closed-by-user": "Googleログインをキャンセルしました。",
    "auth/unauthorized-domain": "このサイトのドメインがFirebaseで許可されていません。FirebaseのAuthentication設定で許可が必要です。",
    "permission-denied": "Firestoreのアクセスが拒否されました。Firebaseのルール設定を確認してください。"
  };
  if (!error?.code && error?.message) return error.message;
  return messages[error?.code] || `処理に失敗しました。時間をおいて再度お試しください。 (${error?.code || "エラー"})`;
}

async function runAuthAction(action, successMessage = "ログインしました。") {
  setStatus("account-status", "処理中です……");
  try {
    if (location.protocol === "file:") {
      throw new Error("このローカルファイルではFirebaseログインを使えません。GitHub Pages上のサイトを開いてログインしてください。");
    }
    await action();
    setStatus("account-status", successMessage);
  } catch (error) {
    setStatus("account-status", readableError(error));
  }
}

byId("account-open-button")?.addEventListener("click", () => showModal("account-modal"));
byId("deck-open-button")?.addEventListener("click", async () => {
  showModal("deck-modal");
  if (signedInUser) await loadOwnedDecks();
  await loadPublicDecks();
});

document.querySelectorAll("[data-close-modal]").forEach(button => {
  button.addEventListener("click", () => hideModal(button.dataset.closeModal));
});

document.querySelectorAll(".feature-modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) hideModal(modal.id);
  });
});

byId("email-signin-button")?.addEventListener("click", () => {
  const email = byId("account-email").value.trim();
  const password = byId("account-password").value;
  runAuthAction(() => signInWithEmailAndPassword(auth, email, password));
});

byId("email-signup-button")?.addEventListener("click", () => {
  const email = byId("account-email").value.trim();
  const password = byId("account-password").value;
  runAuthAction(() => createUserWithEmailAndPassword(auth, email, password));
});

byId("google-signin-button")?.addEventListener("click", () => {
  runAuthAction(() => signInWithPopup(auth, new GoogleAuthProvider()));
});

byId("signout-button")?.addEventListener("click", () => {
  runAuthAction(() => signOut(auth), "ログアウトしました。");
});

onAuthStateChanged(auth, async user => {
  signedInUser = user;
  const accountButton = byId("account-open-button");
  if (accountButton) accountButton.textContent = user ? "ログイン中" : "ログイン";
  byId("signout-button").hidden = !user;
  byId("email-signin-button").hidden = Boolean(user);
  byId("email-signup-button").hidden = Boolean(user);
  byId("google-signin-button").hidden = Boolean(user);
  byId("deck-editor").hidden = !user;
  byId("deck-login-hint").hidden = Boolean(user);
  if (user) {
    setStatus("account-status", `ログイン中：${user.displayName || user.email || "ユーザー"}`);
    byId("menu-account-status")?.replaceChildren(document.createTextNode(user.displayName || user.email || "ログイン中"));
    await loadOwnedDecks();
  } else {
    selectedDeckId = "";
    selectedDeck = null;
    byId("owned-deck-select").innerHTML = '<option value="">デッキを選択してください</option>';
    byId("selected-deck-editor").hidden = true;
    updateAddCardButton();
    setStatus("menu-account-status", "ログインしていません");
  }
  window.dispatchEvent(new CustomEvent("animaldeck:authchange", { detail: { signedIn: Boolean(user) } }));
});

async function loadOwnedDecks() {
  if (!signedInUser) return;
  setStatus("deck-status", "自分のデッキを読み込んでいます……");
  try {
    const deckQuery = query(
      collection(db, "decks"),
      where("ownerUid", "==", signedInUser.uid)
    );
    const snapshot = await getDocs(deckQuery);
    const select = byId("owned-deck-select");
    select.replaceChildren(new Option("デッキを選択してください", ""));
    snapshot.forEach(deckDoc => {
      const data = deckDoc.data();
      select.add(new Option(data.name || "名前のないデッキ", deckDoc.id));
    });
    if (selectedDeckId && snapshot.docs.some(deckDoc => deckDoc.id === selectedDeckId)) {
      select.value = selectedDeckId;
      await loadSelectedDeck(selectedDeckId);
    } else {
      selectedDeckId = "";
      selectedDeck = null;
      byId("selected-deck-editor").hidden = true;
      updateAddCardButton();
    }
    setStatus("deck-status", snapshot.empty ? "まだデッキがありません。名前を入力して作成できます。" : "自分のデッキを読み込みました。");
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
}

byId("create-deck-button")?.addEventListener("click", async () => {
  if (!signedInUser) return;
  const name = byId("new-deck-name").value.trim();
  if (!name) {
    setStatus("deck-status", "デッキ名を入力してください。");
    return;
  }
  try {
    const deckRef = await addDoc(collection(db, "decks"), {
      ownerUid: signedInUser.uid,
      ownerName: String(signedInUser.displayName || "プレイヤー").slice(0, 50),
      name,
      isPublic: false,
      cards: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    byId("new-deck-name").value = "";
    selectedDeckId = deckRef.id;
    await loadOwnedDecks();
    setStatus("deck-status", "非公開デッキを作成しました。");
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
});

byId("owned-deck-select")?.addEventListener("change", event => {
  if (event.target.value) loadSelectedDeck(event.target.value);
  else {
    selectedDeckId = "";
    selectedDeck = null;
    byId("selected-deck-editor").hidden = true;
    updateAddCardButton();
  }
});

async function loadSelectedDeck(deckId) {
  if (!signedInUser) return;
  try {
    const snapshot = await getDoc(doc(db, "decks", deckId));
    if (!snapshot.exists() || snapshot.data().ownerUid !== signedInUser.uid) {
      throw new Error("permission-denied");
    }
    selectedDeckId = snapshot.id;
    selectedDeck = snapshot.data();
    byId("selected-deck-name").value = selectedDeck.name || "";
    byId("selected-deck-visibility").value = selectedDeck.isPublic ? "public" : "private";
    byId("selected-deck-editor").hidden = false;
    renderOwnedDeckCards();
    updateAddCardButton();
    setStatus("deck-status", `「${selectedDeck.name}」を選択中です。`);
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
}

byId("save-deck-settings-button")?.addEventListener("click", async () => {
  if (!selectedDeckId || !selectedDeck || !signedInUser) return;
  const name = byId("selected-deck-name").value.trim();
  if (!name) {
    setStatus("deck-status", "デッキ名を入力してください。");
    return;
  }
  try {
    await updateDoc(doc(db, "decks", selectedDeckId), {
      name,
      isPublic: byId("selected-deck-visibility").value === "public",
      updatedAt: serverTimestamp()
    });
    selectedDeck.name = name;
    selectedDeck.isPublic = byId("selected-deck-visibility").value === "public";
    await loadOwnedDecks();
    setStatus("deck-status", selectedDeck.isPublic ? "デッキを公開しました。" : "デッキを非公開にしました。");
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
});

byId("delete-deck-button")?.addEventListener("click", async () => {
  if (!selectedDeckId || !signedInUser) return;
  if (!window.confirm("このデッキを削除します。よろしいですか？")) return;
  try {
    await deleteDoc(doc(db, "decks", selectedDeckId));
    selectedDeckId = "";
    selectedDeck = null;
    await loadOwnedDecks();
    setStatus("deck-status", "デッキを削除しました。");
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
});

function updateAddCardButton() {
  const button = byId("add-card-to-deck-button");
  if (button) button.disabled = !(signedInUser && selectedDeckId && selectedDeck);
}

async function saveDeckCards(cards, successMessage) {
  try {
    await updateDoc(doc(db, "decks", selectedDeckId), {
      cards,
      updatedAt: serverTimestamp()
    });
    selectedDeck.cards = cards;
    renderOwnedDeckCards();
    setStatus("deck-status", successMessage);
  } catch (error) {
    setStatus("deck-status", readableError(error));
    await loadSelectedDeck(selectedDeckId);
  }
}

function renderOwnedDeckCards() {
  const list = byId("deck-card-list");
  list.replaceChildren();
  (selectedDeck?.cards || []).forEach((card, index) => {
    const item = document.createElement("li");
    item.append(document.createTextNode(`${card.name || "カード"} × ${card.quantity || 1}`));
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "1枚減らす";
    removeButton.addEventListener("click", () => {
      const cards = [...selectedDeck.cards];
      const quantity = Number(cards[index].quantity || 1);
      if (quantity <= 1) cards.splice(index, 1);
      else cards[index] = { ...cards[index], quantity: quantity - 1 };
      saveDeckCards(cards, "デッキを更新しました。");
    });
    item.append(removeButton);
    list.append(item);
  });
  if (!list.childElementCount) {
    const empty = document.createElement("li");
    empty.textContent = "カードはまだ入っていません。カード詳細から追加できます。";
    list.append(empty);
  }
}

byId("refresh-public-decks-button")?.addEventListener("click", loadPublicDecks);

async function loadPublicDecks() {
  setStatus("deck-status", "公開デッキを読み込んでいます……");
  try {
    const publicQuery = query(
      collection(db, "decks"),
      where("isPublic", "==", true),
      limit(30)
    );
    const snapshot = await getDocs(publicQuery);
    const list = byId("public-deck-list");
    list.replaceChildren();
    const decks = snapshot.docs.map(deckDoc => ({ id: deckDoc.id, ...deckDoc.data() }));
    decks.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    decks.forEach(data => {
      const item = document.createElement("li");
      const cards = Array.isArray(data.cards) ? data.cards : [];
      const summary = cards.map(card => `${card.name || "カード"} × ${card.quantity || 1}`).join("、");
      item.textContent = `${data.name || "名前のないデッキ"}（${data.ownerName || "プレイヤー"}）${summary ? `：${summary}` : "：カードなし"}`;
      list.append(item);
    });
    if (snapshot.empty) {
      const empty = document.createElement("li");
      empty.textContent = "公開デッキはまだありません。";
      list.append(empty);
    }
    setStatus("deck-status", "公開デッキを読み込みました。");
  } catch (error) {
    setStatus("deck-status", readableError(error));
  }
}

/*
  新しい画面から安全に使うデッキ操作。
  所有権の確認とFirestoreへの保存は、従来どおりサーバールールでも検証されます。
*/
window.animalDeckApp = {
  isSignedIn() {
    return Boolean(signedInUser);
  },
  current() {
    return selectedDeck ? { id: selectedDeckId, ...selectedDeck } : null;
  },
  isOwner() {
    return Boolean(signedInUser && selectedDeck && selectedDeck.ownerUid === signedInUser.uid);
  },
  viewPublic(deck) {
    if (!deck?.id || deck.isPublic !== true) throw new Error("このデッキは公開されていません。");
    selectedDeckId = deck.id;
    selectedDeck = { ...deck };
    return this.current();
  },
  async listOwned() {
    if (!signedInUser) return [];
    const snapshot = await getDocs(query(
      collection(db, "decks"),
      where("ownerUid", "==", signedInUser.uid)
    ));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  },
  async listPublic() {
    const snapshot = await getDocs(query(
      collection(db, "decks"),
      where("isPublic", "==", true),
      limit(100)
    ));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  },
  async listDeckTags() {
    let snapshot = await getDocs(collection(db, "deckTagCatalog"));
    const knownIds = new Set(snapshot.docs.map(item => item.id));
    let migratedLegacyTags = false;

    // Promote tags from the previous per-user list into the shared catalogue.
    if (signedInUser) {
      const legacySnapshot = await getDoc(doc(db, "users", signedInUser.uid));
      const legacyTags = normalizeTags(legacySnapshot.exists() ? legacySnapshot.data().deckTags : []);
      for (const tag of legacyTags) {
        const tagId = sharedDeckTagDocumentId(tag);
        if (knownIds.has(tagId)) continue;
        await setDoc(doc(db, "deckTagCatalog", tagId), sharedDeckTagDocument(tag));
        knownIds.add(tagId);
        migratedLegacyTags = true;
      }
    }

    if (migratedLegacyTags) snapshot = await getDocs(collection(db, "deckTagCatalog"));
    return normalizeSharedDeckTags(snapshot.docs.map(item => item.data().name));
  },
  async addDeckTag(value) {
    if (!signedInUser) throw new Error("共通デッキタグを登録するにはログインしてください。");
    const tag = String(value || "").trim().slice(0, 24);
    if (!tag) throw new Error("タグ名を入力してください。");

    const ref = doc(db, "deckTagCatalog", sharedDeckTagDocumentId(tag));
    const existing = await getDoc(ref);
    if (existing.exists()) return this.listDeckTags();

    try {
      await setDoc(ref, sharedDeckTagDocument(tag));
    } catch (error) {
      // A simultaneous registration of the same tag may have created the same document.
      const concurrent = await getDoc(ref);
      if (!concurrent.exists()) throw error;
    }
    return this.listDeckTags();
  },
  async select(id) {
    await loadSelectedDeck(id);
    if (!selectedDeck || selectedDeckId !== id) throw new Error("permission-denied");
    return this.current();
  },
  async create(name, tags = []) {
    if (!signedInUser) throw new Error("ログインしてください。");
    const safeName = String(name || "").trim().slice(0, 50);
    if (!safeName) throw new Error("デッキ名を入力してください。");
    const deckRef = await addDoc(collection(db, "decks"), {
      ownerUid: signedInUser.uid,
      ownerName: String(signedInUser.displayName || "プレイヤー").slice(0, 50),
      name: safeName,
      tags: normalizeTags(tags),
      isPublic: false,
      cards: [], territoryCards: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await loadSelectedDeck(deckRef.id);
    return this.current();
  },
  async importDeck(data) {
    if (!data || data.format !== "animal-card-game-deck" || data.version !== 1) throw new Error("このデッキファイル形式には対応していません。");
    const main = Array.isArray(data.mainCards) ? data.mainCards : [];
    const territory = Array.isArray(data.territoryCards) ? data.territoryCards : [];
    if (main.length > 200 || territory.length > 200) throw new Error("カードの種類数が上限を超えています。");
    const clean = (list, pile) => list.map(card => {
      const itemId = String(card.itemId || "").trim();
      const name = String(card.name || "").trim().slice(0, 100);
      const quantity = Math.max(1, Math.min(99, Number(card.quantity) || 1));
      if (!itemId || !name) throw new Error("読み込むデッキにカードIDまたはカード名がありません。");
      return { itemId: `${pile}:${itemId.replace(/^(card|territory):/, "")}`, name, quantity };
    });
    const created = await this.create(`${String(data.name || "読み込みデッキ").slice(0, 44)} のコピー`, normalizeTags(data.tags));
    try {
      await this.saveCards(clean(main, "card"), "main");
      await this.saveCards(clean(territory, "territory"), "territory");
      return this.current();
    } catch (error) {
      throw error;
    }
  },
  async updateSettings(name, isPublic, tags = selectedDeck?.tags || []) {
    if (!signedInUser || !selectedDeckId || !selectedDeck) throw new Error("ログインしてデッキを選択してください。");
    const safeName = String(name || "").trim().slice(0, 50);
    if (!safeName) throw new Error("デッキ名を入力してください。");
    await updateDoc(doc(db, "decks", selectedDeckId), {
      name: safeName,
      isPublic: Boolean(isPublic),
      tags: normalizeTags(tags),
      updatedAt: serverTimestamp()
    });
    selectedDeck = { ...selectedDeck, name: safeName, isPublic: Boolean(isPublic), tags: normalizeTags(tags) };
    return this.current();
  },
  async saveCards(cards, pile = "main") {
    if (!signedInUser || !selectedDeckId || !selectedDeck) throw new Error("ログインしてデッキを選択してください。");
    if (!Array.isArray(cards) || cards.length > 200) throw new Error("デッキに登録できる種類数の上限を超えています。");
    const field = pile === "territory" ? "territoryCards" : "cards";
    await updateDoc(doc(db, "decks", selectedDeckId), { [field]: cards, updatedAt: serverTimestamp() });
    selectedDeck = { ...selectedDeck, [field]: cards };
    renderOwnedDeckCards();
    return this.current();
  },
  async addCard(item, pile = "main") {
    if (!selectedDeck) throw new Error("先にデッキを選択してください。");
    const rawId = String(item?.card_id || item?.territory_id || item?.itemId || "");
    const id = `${pile === "territory" ? "territory" : "card"}:${rawId.replace(/^(card|territory):/, "")}`;
    const name = String(item?.card_name || item?.territory_name || item?.name || "");
    if (!rawId || !name) throw new Error("カードIDを確認できませんでした。");
    const field = pile === "territory" ? "territoryCards" : "cards";
    const cards = [...(selectedDeck[field] || [])];
    const found = cards.find(card => String(card.itemId) === id);
    if (found) found.quantity = Math.min(99, Number(found.quantity || 1) + 1);
    else cards.push({ itemId: id, name, quantity: 1 });
    return this.saveCards(cards, pile);
  },
  async changeQuantity(itemId, change, pile = "main") {
    if (!selectedDeck) throw new Error("先にデッキを選択してください。");
    const field = pile === "territory" ? "territoryCards" : "cards";
    const cards = [...(selectedDeck[field] || [])];
    const found = cards.find(card => String(card.itemId) === String(itemId));
    if (!found) return this.current();
    const quantity = Number(found.quantity || 1) + Number(change || 0);
    if (quantity <= 0) cards.splice(cards.indexOf(found), 1);
    else found.quantity = Math.min(99, quantity);
    return this.saveCards(cards, pile);
  },
  async deleteCurrent() {
    if (!signedInUser || !selectedDeckId) throw new Error("先にデッキを選択してください。");
    await deleteDoc(doc(db, "decks", selectedDeckId));
    selectedDeckId = "";
    selectedDeck = null;
    return true;
  }
};
