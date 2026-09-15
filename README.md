# Vitalis Health

An iOS-friendly web app that imitates the Apple Health / Fitness experience: log calories, workouts, water and weight, and track progress against a weight goal. Pure HTML/CSS/JS — no build step, no backend, no tracking. All data stays in the browser's local storage.

Live once deployed: `https://<your-username>.github.io/<repo-name>/`

---

## Features

| Tab | What it does |
| --- | --- |
| **Summary** | Calorie difference from target, macro rings, natural-language food logging, Apple-Watch style workout list, water intake, daily weight entry |
| **Goal** | Target weight + target date → automatic daily calorie goal, required pace, progress bar, safety warnings |
| **Food** | Your food library (per 100 g/ml macros), search, add new foods, capture a nutrition label photo to auto-fill Protein / Fat / Carbs / Fiber |
| **Profile** | Sex, age, height, starting weight, activity level, water goal → BMR, TDEE, BMI; export / import / erase data |

**Calorie difference from target = intake − active kcal − daily target.**
Zero or negative is shown in Apple lime (deficit achieved); positive is shown in pink/red.

### Natural language food input
Type what you ate; the app parses quantity, unit and food name, then matches the name against your **Food list** only:

```
200g chicken breast
2 servings oats
300ml milk
150 g white rice, 100g broccoli and 250ml milk
half avocado
a coffee
```

Supported units: `g`, `ml`, `l`, `cup`, `serving` / `portion` / `piece`. If no unit is given, one serving is assumed using the serving size stored with that food. Words like `a`, `one`, `two`, `half` are understood. If the food isn't in your library, the app tells you instead of guessing.

### How the numbers are calculated
- **BMR** — Mifflin-St Jeor equation.
- **TDEE (maintenance)** — BMR × activity factor (1.2 – 1.9).
- **Daily adjustment** — `(current weight − target weight) × 7,700 kcal ÷ days remaining`.
- **Daily target** — maintenance − adjustment, floored at 1,200 kcal (female) / 1,500 kcal (male).
- **Active kcal (auto)** — `MET × 3.5 × body weight (kg) ÷ 200 × minutes`, or enter kcal manually.
- **Current weight** — always the latest weight recorded in the Summary tab; falls back to the starting weight in Profile.

A warning appears if the plan exceeds roughly 1 kg per week.

---

## Deploy to GitHub Pages

### Option A — upload in the browser (easiest)
1. Create a new **public** repository on GitHub.
2. Click **Add file → Upload files** and drag in every file and folder from this package.
3. `.nojekyll` and `.github/` are hidden on macOS — press **Cmd + Shift + .** in Finder to reveal them before dragging, or create them directly on GitHub with **Add file → Create new file** (type `.github/workflows/deploy.yml` as the name to create the folder path).
4. Commit to the `main` branch.
5. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
6. The **Deploy to GitHub Pages** workflow runs automatically. When it turns green, open the URL shown in the run summary.

### Option B — command line
```bash
git init
git add .
git commit -m "Vitalis Health"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Then set **Settings → Pages → Source → GitHub Actions**.

### No deployment showing under the Actions tab?
- Pages source must be set to **GitHub Actions**, not "Deploy from a branch".
- The workflow must sit at exactly `.github/workflows/deploy.yml`.
- The repository must be public (or Pages enabled on a paid plan).
- Push any commit to `main`, or open **Actions → Deploy to GitHub Pages → Run workflow**.

### Alternative: no workflow at all
This is a plain static site, so you can instead set **Settings → Pages → Source → Deploy from a branch → main / (root)**. The `.nojekyll` file is already included so GitHub serves the files as-is.

---

## Install on iPhone
Open the Pages URL in Safari → **Share** → **Add to Home Screen**. It launches full screen with the dark theme and respects the safe area on notched devices.

---

## Repository structure
```
.
├── .github/workflows/deploy.yml   GitHub Pages deployment
├── assets/                        App icons (180 / 192 / 512 px)
├── .gitignore
├── .nojekyll                      Serve files as-is, no Jekyll build
├── LICENSE                        MIT
├── README.md
├── app.js                         All application logic
├── index.html                     Four-tab shell
├── manifest.webmanifest           PWA / Add-to-Home-Screen
└── styles.css                     Apple dark theme
```

## Privacy
Everything is stored in `localStorage` on your device. Nutrition-label scanning loads Tesseract.js from a CDN and runs the OCR locally in your browser — the photo is never uploaded. Use **Profile → Export data** to back up or move to another device.

## Disclaimer
Vitalis Health is a personal tracking tool, not medical advice. Consult a qualified professional before starting any weight-loss or exercise programme.

## License
MIT — see [LICENSE](LICENSE).
