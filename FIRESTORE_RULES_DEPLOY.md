# Firestore rules deployment

The production site uses Firebase project `animal-card-game-ee36b`. The GitHub
Pages deployment publishes the website files, but does not deploy Firestore
rules. Keep this file and `firebase.json` in sync with the rules deployed in
Firebase Console.

After authenticating the Firebase CLI with an account that has permission to
manage Firestore rules, deploy the checked-in rules with:

```sh
npx firebase-tools deploy --only firestore:rules --project animal-card-game-ee36b
```

Do not report the production fix as complete until the deployed rules version
has been checked in Firebase Console or a signed-in application operation has
confirmed that the new rules are active.
