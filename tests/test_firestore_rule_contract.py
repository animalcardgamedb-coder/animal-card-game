/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 18: /bin/ps: Operation not permitted
"""Static contract checks for Firestore rules and deck-builder writes.

These checks catch client/rules drift without contacting Firebase. Run with:
    python3 -m unittest discover -s tests -v
They complement (but do not replace) Firebase Emulator rule tests.
"""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
RULES = (ROOT / "firestore.rules").read_text(encoding="utf-8")
CLIENT = (ROOT / "firebase.js").read_text(encoding="utf-8")


def function_body(source: str, signature: str) -> str:
    start = source.index(signature)
    if signature.startswith("match "):
        opening = source.index("{\n", start)
    else:
        opening = re.search(r"\)\s*\{", source[start:]).start() + start
        opening = source.index("{", opening)
    depth = 0
    for position in range(opening, len(source)):
        if source[position] == "{":
            depth += 1
        elif source[position] == "}":
            depth -= 1
            if depth == 0:
                return source[opening + 1 : position]
    raise AssertionError(f"Unclosed function body: {signature}")


def quoted_keys(block: str) -> set[str]:
    return set(re.findall(r"'([A-Za-z][A-Za-z0-9]*)'", block))


class DeckRulesContractTests(unittest.TestCase):
    def test_territory_entry_limit_matches_client_for_create_and_update(self):
        for signature in ("function validNewDeck(data)", "function validDeckUpdate(data)"):
            body = function_body(RULES, signature)
            self.assertRegex(
                body,
                r"territoryCards is list && data\.territoryCards\.size\(\) <= 200",
                f"{signature} must match the 200-entry client limit",
            )
            self.assertNotRegex(body, r"territoryCards\.size\(\) <= 10")

        save_cards = function_body(CLIENT, "async saveCards(cards, pile = \"main\")")
        self.assertRegex(save_cards, r"cards\.length > 200")

    def test_create_payload_fields_are_allowed_by_create_rule(self):
        create_body = function_body(CLIENT, "async create(name, tags = [], extraZones = {})")
        payload_start = create_body.index("await addDoc(collection(db, \"decks\"), {")
        payload_end = create_body.index("});", payload_start)
        payload = create_body[payload_start:payload_end]
        client_fields = set(re.findall(r"^\s{6}([A-Za-z][A-Za-z0-9]*):", payload, re.MULTILINE))

        allowed = function_body(RULES, "function validNewDeck(data)")
        required_block = allowed.split("data.keys().hasAll([", 1)[1].split("])" , 1)[0]
        allowed_block = allowed.split("data.keys().hasOnly([", 1)[1].split("])" , 1)[0]
        self.assertTrue(client_fields, "Could not read deck create payload")
        self.assertLessEqual(quoted_keys(required_block), client_fields)
        self.assertLessEqual(client_fields, quoted_keys(allowed_block))

    def test_settings_update_fields_are_allowed_and_owner_checks_remain(self):
        update_body = function_body(CLIENT, "async updateSettings(name, isPublic,")
        payload_start = update_body.index("await updateDoc(doc(db, \"decks\", selectedDeckId), {")
        payload_end = update_body.index("});", payload_start)
        payload = update_body[payload_start:payload_end]
        client_fields = set(re.findall(r"^\s{6}([A-Za-z][A-Za-z0-9]*):", payload, re.MULTILINE))

        rule = function_body(RULES, "match /decks/{deckId} {")
        update_allowed = rule.split("affectedKeys().hasOnly([", 1)[1].split("])" , 1)[0]
        self.assertLessEqual(client_fields, quoted_keys(update_allowed))
        self.assertIn("allow create: if signedIn()", rule)
        self.assertIn("request.resource.data.ownerUid == request.auth.uid", rule)
        self.assertIn("allow update: if ownsDeck(resource.data.ownerUid)", rule)
        self.assertIn("request.resource.data.ownerUid == resource.data.ownerUid", rule)
        self.assertIn("allow delete: if ownsDeck(resource.data.ownerUid)", rule)


if __name__ == "__main__":
    unittest.main()
