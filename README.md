# BeautifyMe

An iOS-friendly web app that imitates the Apple Health / Fitness experience: log calories, workouts, water and weight, and track progress against a weight goal. Pure HTML/CSS/JS — no build step, no backend, no tracking. All data stays in the browser's local storage.

Live once deployed: `https://<your-username>.github.io/<repo-name>/`

---

## Features

| Tab | What it does |
| --- | --- |
| **Summary** | Date navigator for logging any past day, calorie difference from target, macro bars, natural-language food logging, Apple-Watch style workouts, water, daily weight |
| **Goal** | Target weight + target date → automatic daily calorie goal, required pace, progress bar, safety warnings |
| **Food** | Your food library (per 100 g/ml macros), search, add foods, capture a nutrition label photo to auto-fill Protein / Fat / Carbs / Fiber |
| **Profile** | Sex, age, height, starting weight, activity level, water goal → BMR, TDEE, BMI; export / import / erase data |

**Calorie difference from target = intake − active kcal − daily target.**
Zero or negative shows in Apple lime (deficit achieved); positive shows in pink/red.

### Logging on past dates
The Summary tab opens on today and has a date navigator at the top:

- **‹ / ›** step one day back or forward
- **Tap the date** to open the native iOS date picker and jump to any day
- **Swipe left / right** anywhere on the Summary page to change day
- **Back to today** appears whenever you're viewing another day

An orange *Editing past day* flag sits next to the heading so you always know which day you're writing to. Food, workouts, water and weight all save to the day currently displayed. Future dates are blocked.

### Natural language food input
Type what you ate; the app parses quantity, unit and food name, then matches against your **Food list** only:

```
200g chicken breast
2 servings oats
300ml milk
150 g white rice, 100g broccoli and 250ml milk
half avocado
a coffee
```

Supported units: `g`, `ml`, `l`, `cup`, `serving` / `portion` / `piece`. With no unit, one serving is assumed using that food's stored serving size. Words like `a`, `one`, `two`, `half` are understood. Foods not in your library are reported rather than guessed.

### How the numbers are calculated
- **BMR** — Mifflin-St Jeor equation.
- **TDEE (maintenance)** — BMR × activity factor (1.2 – 1.9).
- **Daily adjustment** — `(current weight − target weight) × 7,700 kcal ÷ days remaining`.
- **Daily target** — maintenance − adjustment, floored at 1,200 kcal (female) / 1,500 kcal (male).
- **Active kcal (auto)** — `MET × 3.5 × body weight (kg) ÷ 200 × minutes`, or enter kcal manually.
- **Current weight** — the latest weight recorded in Summary; falls back to the starting weight in Profile.

A warning appears if the plan exceeds roughly 1 kg per week.

---

## Deploy to GitHub Pages

### Option A — upload in the browser
1. Create a new **public** repository (no README / .gitignore / license — this package has them).
2. **Add file → Upload files**, drag in everything, commit to `main`.
3. Reveal hidden files first: macOS **Cmd + Shift + .**, Windows **View → Hidden items**. If `.github/workflows/deploy.yml` won't drag, use **Add file → Create new file** and type that full path as the name.
4. **Settings → Pages → Source → GitHub Actions**.
5. Watch the **Actions** tab; the URL appears in the run summary when it turns green.

### Option B — command line
```bash
git init
git add .
git commit -m "BeautifyMe"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Then set **Settings → Pages → Source → GitHub Actions**.

### No deployment under Actions?
- Source is still "Deploy from a branch" → switch to **GitHub Actions**
- Workflow isn't at exactly `.github/workflows/deploy.yml`
- Repo is private on a free plan → make it public
- Nothing pushed to `main` since enabling Pages → push a commit, or **Actions → Deploy to GitHub Pages → Run workflow**

### Simpler route
This is a plain static site, so **Settings → Pages → Source → Deploy from a branch → main / (root)** also works. `.nojekyll` is included.

---

## Install on iPhone
Open the Pages URL in **Safari**, tap **Share → Add to Home Screen**. The BeautifyMe rings icon is installed and the app launches full screen in the dark theme, respecting the safe area on notched devices.

---

## Repository structure
```
.
├── .github/workflows/deploy.yml   GitHub Pages deployment
├── assets/
│   ├── icon-180.png               iOS home screen
│   ├── icon-192.png               PWA
│   ├── icon-512.png               PWA
│   ├── icon-rounded-512.png       Maskable
│   └── favicon-64.png             Browser tab
├── .gitignore
├── .nojekyll
├── LICENSE                        MIT
├── README.md
├── app.js                         All application logic
├── index.html                     Four-tab shell
├── manifest.webmanifest           PWA / Add-to-Home-Screen
└── styles.css                     Apple dark theme
```

## Privacy
Everything is stored in `localStorage` on your device. Nutrition-label scanning loads Tesseract.js from a CDN and runs the OCR locally in your browser — the photo is never uploaded. Use **Profile → Export data** to back up or move devices.

## Disclaimer
BeautifyMe is a personal tracking tool, not medical advice. Consult a qualified professional before starting any weight-loss or exercise programme.

## License
MIT — see [LICENSE](LICENSE).
