# Cecilia's Games — instructions for AI coding agents (Codex, ChatGPT, Claude)

Read **README.md** first. It explains the purpose, every game, the shared coin account, and "Make a new game".

Hard rules:
- Target device: a ~13-year-old iPad (iOS 9 Safari). **ES5 JavaScript only**, XMLHttpRequest instead of fetch, no CSS grid, variables or flex gap, Unicode 6.0 emoji in new pages.
- Every page loads `../shared/cecilia.css?v=31` and `../shared/cecilia.js?v=31` and sets `<body data-cg-game="<id>">`. Never copy wallet or cloud code into a game.
- New game = copy `_template/`, add one entry to `GAMES` in `shared/cecilia.js`, follow the coin rules (`CeciliaGames.coins`) and the standard save fields.
- Coins are earned only in learning games; Rainbow Kingdom (source `littleworld`, profile `cecilia_little_world`; legacy ids the server knows) only spends.
- Run `npm install && npm test` before committing. Deploy = push to `main` (GitHub Pages).
- Keep text for Cecilia short, read-aloud friendly, with clues and no fail states. Never put personal data in saves; the backend has no key.
