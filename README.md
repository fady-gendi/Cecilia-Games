# Cecilia's Games

Learning games for Cecilia, played on iPad, hosted free on GitHub Pages:
**https://fady-gendi.github.io/Cecilia-Games/**

## The idea (the target)

1. **Learn & Earn**: Cecilia plays learning games (words, sentences and maths in English, French and Arabic). Every right answer earns coins.
2. **One coin box**: all games share ONE coin account in the cloud. Coins earned on any device show everywhere.
3. **Spend on an adventure**: in **Rainbow Kingdom** she spends those coins on things she needs to finish missions (a key, a boat, a lantern…), plus clothes, pets and decorations.
4. **The loop**: when she runs out of coins, the game sends her back to the learning games. The fun pulls her back to learning.
5. **Grown-ups** see all her progress, per game and per language, on one page (`parent/`).

Coins can only be **earned** in learning games. Rainbow Kingdom only **spends** them.

## The games

| Folder | Game | Kind | What she does | Coins |
|---|---|---|---|---|
| `word-garden/` | 🌻 Word Garden | learn | Guess hidden words (EN / FR / AR) | earns |
| `sentence-stars/` | ⭐ Sentence Stars | learn | Read a sentence, pick the right answer | earns |
| `word-match/` | 🔤 Word Match | learn | Drag words onto pictures | earns |
| `math-quest/` | 🚀 Math Quest | learn | 36 maths levels in 12 worlds | earns |
| `rainbow-kingdom/` | 🌈 Rainbow Kingdom | adventure | 8 lands, 40 levels, story, shop | spends |
| `fashion-studio/` | 🎀 Fashion Studio | play | Dress-up and design | none |
| `account/` | My Coins | page | Her coin box, how to earn, coin history | — |
| `parent/` | Parent Dashboard | page | Progress for grown-ups (sign-in needed) | can give gifts |
| `_template/` | Template | — | Start here for a new game | — |

`little-world/` only redirects old bookmarks to Rainbow Kingdom.

### Rainbow Kingdom

Grumpy Cloud took the colors of the kingdom. Cecilia helps one friend in each land and finds 7 magic gems, then makes friends with Grumpy Cloud in Cloud Castle.

- **8 lands × 5 levels = 40 levels**: Strawberry Meadow, Pumpkin Farm, Honey Hills, Whisper Forest, Shell Beach, Snowy Mountain, Candy Town, Cloud Castle. Each land starts grey and gets its colors back when she finds its gem.
- **Level steps** (mixed in every level): talk, *buy & give* (needs coins), find hidden things, catch flying things, tap to grow, tap numbers in order, follow a recipe, what comes next (patterns), memory pairs, sort into boxes, look in the dark with a torch.
- **Help for a young reader**: very short sentences, everything is read aloud (🔊), and a 💡 **Clue** button. A second or third tap gives a stronger clue (the answer shines, things slow down, the torch gets bigger). There is no way to fail.
- **Shop**: quest items (needed to go on), dresses, hats, pets and tree-house decorations. Some unlock in later lands.
- **Not enough coins?** She sees "You need 12 more coins" and big buttons to the learning games. The adventure saves and waits for her.
- **Cost**: the story needs about 2,350 coins (around 200 right answers). Clothes, pets and the home add about 3,000 more. To change all prices, edit `PRICE_SCALE` in `rainbow-kingdom/index.html`.
- **Content is data**: lands, levels, story text and items are plain lists (`LANDS`, `ITEMS`) at the top of the script. You can add levels or change words without touching the engine.

## How it fits together

```
index.html                 hub: cards come from the games list
shared/cecilia.js          ONE runtime for every page (ES5)
   CeciliaGames            games list (the registry), coin rules, progress summaries
   CeciliaWallet           shared coins: award / spend / balance / purchases (offline-safe ledger)
   CeciliaCloud            cloud save per game: load(profile) / save(profile, state)
   CeciliaUI               top bar, "+15" coin animation, toast, modal, read-aloud, sounds, confetti
shared/cecilia.css         ONE look: top bar, buttons (.cg-btn), cards (.cg-card), CSS coin (.cg-c)
shared/emoji-old-ipad.js   pictures for newer emoji, loaded only on old iPads
backend/                   Google Apps Script server (coin ledger + saves in a Google Sheet)
sw.js                      offline cache for newer iPads
tests/                     node tests (npm test)
```

Every page shows the same **top bar**: 🏠 Home · game title · coins. Tap the coins to see how many she has, where to earn more and where to spend them. When she earns coins, a "+15" flies into the counter in every game.

### Coin rules (the same in every learning game)

| Event | Coins | Constant |
|---|---|---|
| Right answer | +10 | `CeciliaGames.coins.correct` |
| Right on the first try / no hint | +5 more | `.perfect` |
| Every 5 in a row | +10 | `.streak5` |
| Level up | +30 | `.level` |
| Perfect level | +20 more | `.perfectLevel` |
| Hint (optional) | −5 | `.hint` |

Rules for the server: one award is at most 200 coins. Each award needs a **unique id** (for example `wg:answer:<uid>`), so a retry never pays twice. The adventure source (`littleworld`) and `parent` can never "earn" (parents give gifts with kind `parent`).

### Saves and progress

Each game saves on the iPad (`localStorage`, key from the registry) **and** in the cloud (`CeciliaCloud.save(profile, state)`). The server keeps the save with the highest `total` / newest `ts`.

The **standard progress fields** let the parent page and hub read any game automatically:

```js
{ ts: Date, total: answersSolved, stars: n, best: bestStreak,
  lv: {en:1, fr:1, ar:1}, solved: {en:0, fr:0, ar:0}, target: {en:10, fr:10, ar:10} }
```

Leave out `lv/solved/target` for games without languages.

### Parent dashboard

Open `parent/` (link "👪 Grown-ups" at the bottom of the hub). It is protected by a parent name and password. Only a SHA-256 fingerprint of them is in the code (`LOGIN_HASH` in `parent/index.html`), and the comment there shows how to change it.

It shows: coins now, answers solved, stars, last played, a **language table** (level and progress in English, French and Arabic for each language game), one card per game, coins earned per game and spent in Rainbow Kingdom, the latest coin events, and buttons to give coins.

This is a light lock for a static website. The backend has no key, so do not put private data in game saves.

## Deploy

- **Games (website)**: push to `main`. GitHub Pages publishes in about a minute at https://fady-gendi.github.io/Cecilia-Games/. On the iPad, open the page, close it and open it again (it keeps an offline copy and updates in the background). Add it to the Home Screen via Share → *Add to Home Screen*.
- **Server (coins/saves)**: only after changing `backend/Cecilia_Auto_Account_CodeGS.txt`, redeploy it as described in **Backend** below.

## Restart Rainbow Kingdom from scratch

Parent page (`parent/`) → **🌈 Restart Rainbow Kingdom** → *Restart from scratch*. It restarts the story, levels, gems and bought things on every iPad. Tick *Give back the coins spent* to return the coins. The learning games and her other coins are not touched.

How it works: the save gets `resetAt` = now; the game ignores levels and purchases older than that, on every device, when it next goes online.

## Old iPad rules (must follow)

Cecilia's iPad is about 13 years old (iOS 9 Safari). Everything must work there:

- **JavaScript ES5 only**: `var` and `function`; no `let`, `const`, `=>`, `async`/`await`, template strings, classes, `?.` or `??`. Use `XMLHttpRequest` (not `fetch`), and use `.then()` on promises.
- **CSS**: no CSS grid, no CSS variables, no flex `gap`, no `clamp()`/`env()` without a fallback. Use `display:-webkit-flex;display:flex` (or inline-block), and keep `-webkit-` prefixes for transform, transition, animation and filter.
- **Emoji**: new pages use Unicode 6.0 emoji only (🦊 🦄 🪙 🧁 🧩 🗺 are too new). Older games keep theirs: `shared/emoji-old-ipad.js` shows pictures instead on old iPads. After adding new emoji to a game, rebuild that file (see `tools/build-emoji-fallback.cjs`).
- **Coins on screen**: use the CSS coin `CeciliaUI.coin` (`<i class="cg-c"></i>`) in HTML.
- **Touch**: buttons at least 52 px, `touch-action:manipulation`, no hover-only features, no `alert`/`confirm`/`window.open`.
- **Child-friendly**: short sentences, big text (22px+), read-aloud (`CeciliaUI.say(text, 'en'|'fr'|'ar')`), clues, and no fail states.
- Run `npm test` before committing. It fails on non-ES5 code and on too-new emoji in new pages.

## Make a new game (step by step)

Tell Claude or ChatGPT: *"Read README.md in the Cecilia-Games repo and make a new learning game about X following 'Make a new game'."*

1. **Copy** `_template/` to a new folder, e.g. `animal-sounds/` (lowercase, dashes).
2. **Register it** in `shared/cecilia.js`: add one line to `GAMES`:
   ```js
   {id:'as',folder:'animal-sounds',title:'Animal Sounds',icon:'🐮',color:'#4f8cff',bg:'#e3efff',kind:'learn',
    source:'as',profile:'cecilia_animal_sounds',key:'animalsounds_v1',langs:['en','fr','ar'],units:'animals',desc:'Hear a sound, find the animal'}
   ```
   - `source`: lowercase letters/digits, 2–20 characters, unique. The coins earned are recorded under it.
   - `profile`: `cecilia_<name>`, unique. This is the cloud save.
   - `kind`: `learn` (earns coins), `play` (no coins) or `adventure` (spends).

   The hub card, the top bar, the coin panel and the parent page then pick the game up automatically.
3. **Set** `<body data-cg-game="as">`, keep the two shared tags (`../shared/cecilia.css?v=31` and `../shared/cecilia.js?v=31`), and write the game in ES5.
4. **Coins**: `CeciliaWallet.award(coins, SOURCE, 'Right answer', SOURCE+':answer:'+CeciliaWallet.uid())`, following the coin rules above. Spending: `CeciliaWallet.spend(price, SOURCE, 'Item name', uniqueId, {type:'...', item:'...'})` returns `false` when she cannot afford it.
5. **Save** with the standard progress fields, locally and with `CeciliaCloud.save(profile, state)`. The template shows both.
6. **Look**: use `.cg-btn` (`cg-pink`, `cg-green`, `cg-blue`, `cg-orange`, `cg-gold`), `.cg-card`, `body class="cg-page"`, big emoji art and the palette in `shared/cecilia.css`.
7. **Test**: `npm install && npm test`, then try it in portrait and landscape on an iPad. If you used newer emoji, rebuild the emoji pictures.
8. **Ship**: commit and push to `main`. GitHub Pages updates in about a minute.

Changing `shared/cecilia.js` or `cecilia.css`? Bump `?v=31` → `?v=32` in **all** pages and `CACHE` in `sw.js`, so iPads fetch the new copy.

## Backend (Google Apps Script)

The coin ledger and saves live in a Google Sheet behind a Google Apps Script web app. Its address is `ENDPOINT` in `shared/cecilia.js`. The server code is `backend/Cecilia_Auto_Account_CodeGS.txt`.

**Version 3.1 is in the repo; it needs to be redeployed once by the owner.** It adds:
- new games can earn and save without editing the server (any `source` id / any `cecilia_<name>` profile)
- `?action=history`, which lets the parent page show coins per game from **all** devices

To redeploy: open the Apps Script project (script.google.com) → paste the file's content over `Code.gs` → **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Keep the same deployment so the URL does not change. Until then everything works with the old server, except new games' coins and the cross-device coin table.

## Credits

Emoji pictures for old iPads: [Twemoji](https://github.com/jdecked/twemoji) by Twitter/jdecked, CC-BY 4.0.
