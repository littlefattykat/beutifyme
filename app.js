/* ============================================================
   BeautifyMe — Apple Health style calorie, activity & weight tracker
   Vanilla JS. All data stored locally (localStorage).
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'beautifyme.v1';
  const LEGACY_KEY = 'vitalis.v1';
  const KCAL_PER_KG = 7700;
  const $ = (id) => document.getElementById(id);
  const num = (v, d = 0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const round = (n, p = 0) => { const f = Math.pow(10, p); return Math.round(n * f) / f; };

  const dateKey = (d) => {
    const x = new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const todayKey = () => dateKey(new Date());
  const shiftKey = (key, days) => {
    const d = new Date(key + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return dateKey(d);
  };

  /** currently viewed day in the Summary tab */
  let VIEW = todayKey();

  /* ---------------- default food library (per 100 g/ml) ---------------- */
  const SEED_FOODS = [
    ['Chicken breast, cooked', 31, 0, 3.6, 0, 120, 'g'],
    ['Beef, lean cooked',      26, 0, 10,  0, 120, 'g'],
    ['Pork loin, cooked',      27, 0, 8,   0, 120, 'g'],
    ['Salmon, cooked',         25, 0, 13,  0, 120, 'g'],
    ['Tuna, canned in water',  24, 0, 1,   0, 100, 'g'],
    ['Shrimp, cooked',         24, 0.2, 1, 0, 100, 'g'],
    ['Egg, whole',             13, 1.1, 11, 0, 50, 'g'],
    ['Tofu, firm',             12, 2,   7,  1, 100, 'g'],
    ['White rice, cooked',     2.7, 28, 0.3, 0.4, 150, 'g'],
    ['Brown rice, cooked',     2.6, 23, 0.9, 1.8, 150, 'g'],
    ['Rice noodles, cooked',   1.8, 25, 0.2, 1,  180, 'g'],
    ['Pho noodle soup',        4.5, 9,  1.5, 0.5, 400, 'g'],
    ['Bread, wholemeal',       13, 41, 3.4, 7,  40,  'g'],
    ['Oats, dry',              13, 67, 7,   10, 40,  'g'],
    ['Pasta, cooked',          5.8, 31, 1.1, 1.8, 180, 'g'],
    ['Potato, boiled',         2,  20, 0.1, 1.8, 150, 'g'],
    ['Sweet potato, boiled',   1.6, 20, 0.1, 3,  150, 'g'],
    ['Banana',                 1.1, 23, 0.3, 2.6, 120, 'g'],
    ['Apple',                  0.3, 14, 0.2, 2.4, 180, 'g'],
    ['Orange',                 0.9, 12, 0.1, 2.4, 150, 'g'],
    ['Mango',                  0.8, 15, 0.4, 1.6, 200, 'g'],
    ['Avocado',                2,   9,  15,  7,  100, 'g'],
    ['Broccoli, cooked',       2.4, 7,  0.4, 3.3, 100, 'g'],
    ['Mixed salad greens',     1.5, 3,  0.2, 2,  80,  'g'],
    ['Tomato',                 0.9, 3.9, 0.2, 1.2, 120, 'g'],
    ['Greek yogurt, plain',    10, 3.6, 0.4, 0,  150, 'g'],
    ['Milk, full cream',       3.4, 4.8, 3.6, 0, 250, 'ml'],
    ['Milk, skim',             3.4, 5,  0.1, 0,  250, 'ml'],
    ['Cheese, cheddar',        25, 1.3, 33, 0,  30,  'g'],
    ['Peanut butter',          25, 20, 50, 6,   20,  'g'],
    ['Almonds',                21, 22, 50, 12,  30,  'g'],
    ['Olive oil',              0,  0,  100, 0,  14,  'ml'],
    ['Coffee, black',          0.1, 0, 0,  0,   240, 'ml'],
    ['Orange juice',           0.7, 10, 0.2, 0.2, 250, 'ml'],
    ['Beer, regular',          0.5, 3.6, 0, 0,  330, 'ml'],
    ['Dark chocolate 70%',     7.8, 46, 43, 11, 25,  'g']
  ].map(([name, p, c, f, fi, serving, unit]) => ({
    id: 'seed-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name, protein: p, carb: c, fat: f, fiber: fi, serving, unit
  }));

  /* ---------------- Apple Watch style workout list (MET) ---------------- */
  const ACTIVITIES = [
    ['Walking', 3.5], ['Walking, brisk', 4.3], ['Outdoor Run', 9.8], ['Indoor Run', 9.0],
    ['Outdoor Cycle', 8.0], ['Indoor Cycle', 7.0], ['Elliptical', 5.0], ['Rower', 7.0],
    ['Stair Stepper', 9.0], ['HIIT', 10.0], ['Functional Strength Training', 5.5],
    ['Traditional Strength Training', 3.5], ['Core Training', 4.0], ['Yoga', 3.0],
    ['Pilates', 3.5], ['Dance', 5.5], ['Swimming', 8.0], ['Hiking', 6.0],
    ['Tennis', 7.3], ['Badminton', 5.5], ['Football', 7.0], ['Basketball', 6.5],
    ['Golf', 4.8], ['Boxing', 9.0], ['Martial Arts', 10.3], ['Jump Rope', 12.0],
    ['Cooldown', 2.3], ['Other', 4.0]
  ];

  /* ---------------- state ---------------- */
  const blankDay = () => ({ foods: [], workouts: [], water: 0, weight: null });
  const defaults = () => ({
    profile: { name: '', sex: 'female', age: 35, height: 170, startWeight: 70, activity: 1.55, waterGoal: 2000 },
    goal: { targetWeight: null, targetDate: null },
    foods: SEED_FOODS.slice(),
    days: {}
  });

  let S = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY));
      if (!raw) return defaults();
      const d = defaults();
      return {
        profile: Object.assign(d.profile, raw.profile || {}),
        goal: Object.assign(d.goal, raw.goal || {}),
        foods: Array.isArray(raw.foods) && raw.foods.length ? raw.foods : d.foods,
        days: raw.days || {}
      };
    } catch (e) { return defaults(); }
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(S));
  function day(k) { k = k || VIEW; if (!S.days[k]) S.days[k] = blankDay(); return S.days[k]; }

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------------- calculations ---------------- */
  const kcalOf = (p, c, f) => p * 4 + c * 4 + f * 9;

  /** latest recorded weight up to and including the given day */
  function weightAsOf(key) {
    const keys = Object.keys(S.days).filter(k => S.days[k].weight != null && k <= key).sort();
    if (keys.length) return { kg: S.days[keys[keys.length - 1]].weight, date: keys[keys.length - 1] };
    return latestWeight();
  }
  function latestWeight() {
    const keys = Object.keys(S.days).filter(k => S.days[k].weight != null).sort();
    if (keys.length) return { kg: S.days[keys[keys.length - 1]].weight, date: keys[keys.length - 1] };
    return { kg: num(S.profile.startWeight, 70), date: null };
  }

  function bmr(w) {
    const p = S.profile;
    const kg = w != null ? w : latestWeight().kg;
    const base = 10 * kg + 6.25 * num(p.height, 170) - 5 * num(p.age, 30);
    return Math.max(0, p.sex === 'male' ? base + 5 : base - 161);
  }
  const tdee = (w) => bmr(w) * num(S.profile.activity, 1.55);

  function goalCalc() {
    const cur = latestWeight().kg;
    const maint = tdee();
    const tw = S.goal.targetWeight, td = S.goal.targetDate;
    const floor = S.profile.sex === 'male' ? 1500 : 1200;
    const out = { current: cur, maintenance: maint, adjust: 0, target: maint, days: 0, delta: 0, rate: 0, warn: '' };
    if (tw == null || !td) { out.target = Math.max(floor, maint); out.warn = 'Add a target weight and date to generate your daily calorie goal.'; return out; }

    const msDay = 86400000;
    const t0 = new Date(todayKey() + 'T00:00:00').getTime();
    const t1 = new Date(td + 'T00:00:00').getTime();
    const days = Math.max(1, Math.round((t1 - t0) / msDay));
    const delta = cur - tw;
    const rate = (delta / days) * 7;
    const adjust = (delta * KCAL_PER_KG) / days;

    if (Math.abs(rate) > 1) out.warn = 'This pace exceeds 1 kg per week. Consider extending the target date.';
    if (t1 <= t0) out.warn = 'Target date is today or in the past — pick a future date.';

    let target = maint - adjust;
    if (target < floor) { target = floor; out.warn = 'Target capped at the ' + floor + ' kcal safety floor — extend your date for a realistic plan.'; }

    out.days = days; out.delta = delta; out.rate = rate; out.adjust = adjust; out.target = target;
    return out;
  }

  function dayTotals(k) {
    const d = day(k);
    const t = { kcal: 0, protein: 0, carb: 0, fat: 0, fiber: 0, active: 0, water: d.water || 0 };
    d.foods.forEach(f => { t.kcal += f.kcal; t.protein += f.protein; t.carb += f.carb; t.fat += f.fat; t.fiber += f.fiber; });
    d.workouts.forEach(w => { t.active += w.kcal; });
    return t;
  }

  /* ---------------- natural language food parsing ---------------- */
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const WORD_NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5 };

  function matchFood(text) {
    const q = norm(text);
    if (!q) return null;
    let best = null, bestScore = 0;
    S.foods.forEach(f => {
      const n = norm(f.name);
      let score = 0;
      if (n === q) score = 100;
      else if (q.includes(n)) score = 80 + n.length / 100;
      else if (n.includes(q)) score = 60 + q.length / 100;
      else {
        const qt = q.split(' '), nt = n.split(' ');
        const hits = nt.filter(t => t.length > 2 && qt.some(x => x.startsWith(t) || t.startsWith(x))).length;
        if (hits) score = 20 + hits * 10;
      }
      if (score > bestScore) { bestScore = score; best = f; }
    });
    return bestScore >= 25 ? best : null;
  }

  function parsePhrase(raw) {
    let s = raw.trim(); if (!s) return null;
    let qty = null, unit = null;

    let m = s.match(/(\d+(?:[.,]\d+)?)\s*(g|gram|grams|gr|ml|millilitre|milliliter|l|litre|liter|serving|servings|serve|serves|portion|portions|pc|pcs|piece|pieces|cup|cups)\b/i);
    if (m) {
      qty = parseFloat(m[1].replace(',', '.'));
      unit = m[2].toLowerCase();
      s = (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).trim();
    } else {
      m = s.match(/^(\d+(?:[.,]\d+)?)\s+/);
      if (m) { qty = parseFloat(m[1].replace(',', '.')); s = s.slice(m[0].length); }
      else {
        const w = s.match(/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|half)\s+/i);
        if (w) { qty = WORD_NUM[w[1].toLowerCase()]; s = s.slice(w[0].length); }
      }
    }

    s = s.replace(/^(of|de)\s+/i, '').replace(/\b(for|at|in the)\s+(breakfast|lunch|dinner|snack)\b/i, '').trim();
    const food = matchFood(s);
    if (!food) return { error: s || raw };

    let grams, label;
    const servingSize = num(food.serving, 100) || 100;
    if (unit === null) {
      if (qty === null) qty = 1;
      grams = qty * servingSize; label = qty + ' serving' + (qty === 1 ? '' : 's');
    } else if (/^(g|gram|grams|gr)$/.test(unit)) { grams = qty; label = qty + ' g'; }
    else if (/^(ml|millilitre|milliliter)$/.test(unit)) { grams = qty; label = qty + ' ml'; }
    else if (/^(l|litre|liter)$/.test(unit)) { grams = qty * 1000; label = qty + ' L'; }
    else if (/^cups?$/.test(unit)) { grams = qty * 240; label = qty + ' cup' + (qty === 1 ? '' : 's'); }
    else { grams = qty * servingSize; label = qty + ' serving' + (qty === 1 ? '' : 's'); }
    if (!isFinite(grams) || grams <= 0) return { error: raw };

    const r = grams / 100;
    return {
      entry: {
        id: 'e' + Date.now() + Math.random().toString(36).slice(2, 6),
        foodId: food.id, name: food.name, qtyLabel: label, grams: round(grams, 1),
        protein: round(food.protein * r, 1), carb: round(food.carb * r, 1),
        fat: round(food.fat * r, 1), fiber: round(food.fiber * r, 1),
        kcal: round(kcalOf(food.protein * r, food.carb * r, food.fat * r), 0)
      }
    };
  }

  function parseLine(text) {
    const parts = text.split(/,|;|\band\b|\+|\n/i).map(p => p.trim()).filter(Boolean);
    const ok = [], bad = [];
    parts.forEach(p => { const r = parsePhrase(p); if (!r) return; r.entry ? ok.push(r.entry) : bad.push(r.error); });
    return { ok, bad };
  }

  /* ---------------- date navigator ---------------- */
  const fmtLong = k => new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtShort = k => new Date(k + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  function relLabel(k) {
    const t = todayKey();
    if (k === t) return 'Today';
    if (k === shiftKey(t, -1)) return 'Yesterday';
    if (k === shiftKey(t, 1)) return 'Tomorrow';
    return new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function setView(k) {
    if (k > todayKey()) { toast('Future dates cannot be logged.'); return; }
    VIEW = k;
    renderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderDatebar() {
    const isToday = VIEW === todayKey();
    $('dLabel').textContent = relLabel(VIEW);
    $('dSub').textContent = isToday ? 'Tap to choose a date' : fmtLong(VIEW);
    $('dPick').value = VIEW;
    $('dPick').max = todayKey();
    $('dNext').classList.toggle('off', isToday);
    $('dToday').hidden = isToday;
    $('navDate').innerHTML = fmtLong(VIEW) + (isToday ? '' : ' <span class="past-flag">Editing past day</span>');
    $('wLbl').textContent = isToday ? "Today's weight" : relLabel(VIEW) + ' weight';
  }

  /* ---------------- rendering ---------------- */
  function renderSummary() {
    renderDatebar();
    const t = dayTotals(VIEW), g = goalCalc();
    const diff = round(t.kcal - t.active - g.target, 0);
    const over = diff > 0;

    $('diffValue').textContent = (diff > 0 ? '+' : '') + diff;
    $('diffValue').className = 'hero-value ' + (over ? 'over' : 'lime');
    $('diffChip').textContent = over ? 'Above target' : 'On track';
    $('diffChip').className = 'chip' + (over ? ' over' : '');
    $('diffNote').textContent = over
      ? 'You are ' + Math.abs(diff) + ' kcal above your target — move more or eat lighter to stay in deficit.'
      : 'Deficit achieved: ' + Math.abs(diff) + ' kcal below target.';
    const pct = g.target > 0 ? Math.min(100, ((t.kcal - t.active) / g.target) * 100) : 0;
    const bar = $('diffBar'); bar.style.width = Math.max(0, pct) + '%';
    bar.className = 'bar-fill' + (over ? ' over' : '');
    $('sumIntake').textContent = round(t.kcal);
    $('sumActive').textContent = round(t.active);
    $('sumTarget').textContent = round(g.target);

    const refP = (g.target * 0.30) / 4, refC = (g.target * 0.40) / 4, refF = (g.target * 0.30) / 9, refFi = 30;
    const set = (v, b, val, ref) => {
      $(v).textContent = round(val, 1) + 'g';
      $(b).style.width = Math.min(100, ref ? (val / ref) * 100 : 0) + '%';
    };
    set('mProtein', 'bProtein', t.protein, refP);
    set('mCarb', 'bCarb', t.carb, refC);
    set('mFat', 'bFat', t.fat, refF);
    set('mFiber', 'bFiber', t.fiber, refFi);

    const d = day(VIEW);
    $('foodLog').innerHTML = d.foods.length ? d.foods.map(f => `
      <div class="item">
        <div class="ic">🍽️</div>
        <div class="main">
          <div class="t1">${esc(f.name)}</div>
          <div class="t2">${esc(f.qtyLabel)} · P ${f.protein} · C ${f.carb} · F ${f.fat} · Fib ${f.fiber}</div>
        </div>
        <div class="val">${f.kcal}</div>
        <div class="del" data-del-food="${f.id}">×</div>
      </div>`).join('') : '<div class="empty">No food logged for ' + relLabel(VIEW).toLowerCase() + '.</div>';

    $('actLog').innerHTML = d.workouts.length ? d.workouts.map(w => `
      <div class="item">
        <div class="ic act">🔥</div>
        <div class="main">
          <div class="t1">${esc(w.name)}</div>
          <div class="t2">${w.minutes} min</div>
        </div>
        <div class="val">−${w.kcal}</div>
        <div class="del" data-del-act="${w.id}">×</div>
      </div>`).join('') : '<div class="empty">No workouts logged for ' + relLabel(VIEW).toLowerCase() + '.</div>';

    const wg = num(S.profile.waterGoal, 2000) || 2000;
    $('waterChip').textContent = round(d.water) + ' / ' + wg + ' ml';
    $('waterBar').style.width = Math.min(100, (d.water / wg) * 100) + '%';

    // weight history — no leading icon
    const wk = Object.keys(S.days).filter(k => S.days[k].weight != null).sort().reverse().slice(0, 7);
    $('weightLog').innerHTML = wk.length ? '<div class="card list">' + wk.map(k => `
      <div class="item${k === VIEW ? ' sel' : ''}">
        <div class="main">
          <div class="t1">${fmtShort(k)}</div>
          <div class="t2">${relLabel(k)}</div>
        </div>
        <div class="val">${S.days[k].weight} kg</div>
        <div class="del" data-del-w="${k}">×</div>
      </div>`).join('') + '</div>' : '<div class="empty">No weight recorded yet.</div>';

    $('wInput').value = d.weight != null ? d.weight : '';
    const wa = weightAsOf(VIEW);
    $('wInput').placeholder = wa.kg ? String(wa.kg) : '70.0';
  }

  function renderGoal() {
    const g = goalCalc(), lw = latestWeight();
    $('goalKcal').textContent = round(g.target);
    $('goalChip').textContent = g.adjust >= 0 ? 'Deficit plan' : 'Surplus plan';
    $('goalChip').className = 'chip' + (g.adjust < 0 ? ' over' : '');
    $('goalTdee').textContent = round(g.maintenance);
    $('goalAdj').textContent = (g.adjust >= 0 ? '−' : '+') + round(Math.abs(g.adjust));
    $('goalRate').textContent = round(Math.abs(g.rate), 2);
    $('goalNote').textContent = S.goal.targetWeight == null
      ? 'Set a target below to calculate automatically.'
      : 'Maintenance ' + round(g.maintenance) + ' kcal minus a ' + round(Math.abs(g.adjust)) + ' kcal daily adjustment.';

    $('gCurrent').textContent = lw.kg + ' kg' + (lw.date ? ' · ' + fmtShort(lw.date) : ' · from profile');
    $('gDelta').textContent = S.goal.targetWeight == null ? '—' : (g.delta > 0 ? '−' : '+') + round(Math.abs(g.delta), 1) + ' kg';
    $('gDays').textContent = S.goal.targetWeight == null ? '—' : g.days + ' days';

    const start = num(S.profile.startWeight, lw.kg);
    const tw = S.goal.targetWeight;
    let prog = 0;
    if (tw != null && start !== tw) prog = Math.max(0, Math.min(100, ((start - lw.kg) / (start - tw)) * 100));
    $('gProgress').textContent = tw == null ? '—' : round(prog) + '%';
    $('gBar').style.width = prog + '%';
    $('gWarn').textContent = g.warn;
    $('gWarn').style.color = g.warn ? 'var(--pink)' : '';
  }

  function renderProfile() {
    $('pTdee').textContent = round(tdee());
    $('pBmr').textContent = round(bmr());
    const h = num(S.profile.height, 170) / 100, w = latestWeight().kg;
    $('pBmi').textContent = h > 0 ? round(w / (h * h), 1) : '—';
    $('pWeight').textContent = w + ' kg';
    $('pFormula').textContent = 'Mifflin-St Jeor × ' + S.profile.activity + ' activity factor';
  }

  function renderFoods(filter) {
    const q = norm(filter || '');
    const list = S.foods.filter(f => !q || norm(f.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name));
    $('foodCount').textContent = S.foods.length;
    $('foodList').innerHTML = list.length ? list.map(f => `
      <div class="item">
        <div class="ic">🥗</div>
        <div class="main">
          <div class="t1">${esc(f.name)}</div>
          <div class="t2">P ${f.protein} · C ${f.carb} · F ${f.fat} · Fib ${f.fiber} · 1 serving ${f.serving}${f.unit}</div>
        </div>
        <div class="val">${round(kcalOf(f.protein, f.carb, f.fat))}</div>
        <div class="del" data-del-lib="${f.id}">×</div>
      </div>`).join('') : '<div class="empty">No matching food. Add it below.</div>';
  }

  function renderSuggest() {
    const picks = S.foods.slice(0, 40).sort(() => 0.5 - Math.random()).slice(0, 4);
    $('nlSuggest').innerHTML = picks.map(f =>
      `<span data-sug="${esc(f.serving + f.unit + ' ' + f.name)}">${esc(f.serving + f.unit + ' ' + f.name.split(',')[0])}</span>`).join('');
  }

  function renderAll() { renderSummary(); renderGoal(); renderProfile(); renderFoods($('foodSearch').value); }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- form binding ---------------- */
  function fillForms() {
    const p = S.profile;
    $('pName').value = p.name || ''; $('pSex').value = p.sex; $('pAge').value = p.age;
    $('pHeight').value = p.height; $('pStart').value = p.startWeight;
    $('pAct').value = String(p.activity); $('pWater').value = p.waterGoal;
    $('gWeight').value = S.goal.targetWeight ?? '';
    $('gDate').value = S.goal.targetDate || '';
    $('gDate').min = todayKey();
    $('actSelect').innerHTML = ACTIVITIES.map(([n, m]) => `<option value="${m}">${n}</option>`).join('');
  }

  function bindProfile() {
    const map = { pName: 'name', pSex: 'sex', pAge: 'age', pHeight: 'height', pStart: 'startWeight', pAct: 'activity', pWater: 'waterGoal' };
    Object.keys(map).forEach(id => {
      $(id).addEventListener('input', () => {
        const f = map[id], v = $(id).value;
        S.profile[f] = (f === 'name' || f === 'sex') ? v : num(v, S.profile[f]);
        save(); renderProfile(); renderGoal(); renderSummary();
      });
    });
    ['gWeight', 'gDate'].forEach(id => $(id).addEventListener('input', () => {
      S.goal.targetWeight = $('gWeight').value === '' ? null : num($('gWeight').value);
      S.goal.targetDate = $('gDate').value || null;
      save(); renderGoal(); renderSummary();
    }));
  }

  /* ---------------- events ---------------- */
  function bind() {
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      $('page-' + t.dataset.tab).classList.add('active');
      window.scrollTo(0, 0);
      renderAll();
    }));

    /* date navigation */
    $('dPrev').addEventListener('click', () => setView(shiftKey(VIEW, -1)));
    $('dNext').addEventListener('click', () => setView(shiftKey(VIEW, 1)));
    $('dPick').addEventListener('change', () => { if ($('dPick').value) setView($('dPick').value); });
    $('dToday').addEventListener('click', () => setView(todayKey()));
    // swipe left/right on the summary page to change day
    let sx = 0, sy = 0;
    const page = $('page-summary');
    page.addEventListener('touchstart', e => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
    page.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) setView(shiftKey(VIEW, dx < 0 ? 1 : -1));
    }, { passive: true });

    /* natural language food */
    const addFood = () => {
      const txt = $('nlInput').value.trim();
      if (!txt) { toast('Type what you ate first.'); return; }
      const { ok, bad } = parseLine(txt);
      if (ok.length) { day(VIEW).foods.push(...ok); save(); $('nlInput').value = ''; renderSummary(); }
      if (bad.length) toast('Not in your Food list: ' + bad.join(', '));
      else if (ok.length) toast('Logged ' + ok.length + ' item' + (ok.length > 1 ? 's' : '') + ' to ' + relLabel(VIEW).toLowerCase() + '.');
    };
    $('nlAdd').addEventListener('click', addFood);
    $('nlClear').addEventListener('click', () => { $('nlInput').value = ''; $('nlInput').dispatchEvent(new Event('input')); });
    $('nlInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addFood(); } });
    $('nlInput').addEventListener('input', () => {
      const v = $('nlInput').value.trim();
      if (!v) {
        $('nlHint').textContent = 'Natural language · quantity + unit (g / ml / serving) + food from your Food list.';
        $('nlHint').style.color = ''; return;
      }
      const last = v.split(/,|;|\band\b|\+/i).pop().trim();
      const r = parsePhrase(last);
      $('nlHint').textContent = r && r.entry
        ? '✓ ' + r.entry.name + ' · ' + r.entry.qtyLabel + ' · ' + r.entry.kcal + ' kcal'
        : '✕ No match in your Food list — add it in the Food tab.';
      $('nlHint').style.color = r && r.entry ? 'var(--lime)' : 'var(--dim2)';
    });
    $('nlSuggest').addEventListener('click', e => {
      const s = e.target.closest('[data-sug]'); if (!s) return;
      const cur = $('nlInput').value.trim();
      $('nlInput').value = cur ? cur.replace(/,\s*$/, '') + ', ' + s.dataset.sug : s.dataset.sug;
      $('nlInput').dispatchEvent(new Event('input'));
    });

    /* workouts */
    $('actAdd').addEventListener('click', () => {
      const sel = $('actSelect'), min = num($('actMin').value);
      if (min <= 0) { toast('Enter workout minutes.'); return; }
      const met = num(sel.value, 4), w = weightAsOf(VIEW).kg;
      const manual = $('actKcal').value;
      const kcal = manual !== '' ? round(num(manual)) : round(met * 3.5 * w / 200 * min);
      day(VIEW).workouts.push({ id: 'w' + Date.now(), name: sel.options[sel.selectedIndex].text, minutes: min, kcal });
      save(); $('actMin').value = ''; $('actKcal').value = ''; renderSummary();
      toast('Workout logged · ' + kcal + ' kcal');
    });

    /* deletes */
    document.addEventListener('click', e => {
      const df = e.target.closest('[data-del-food]');
      if (df) { const d = day(VIEW); d.foods = d.foods.filter(f => f.id !== df.dataset.delFood); save(); renderSummary(); return; }
      const da = e.target.closest('[data-del-act]');
      if (da) { const d = day(VIEW); d.workouts = d.workouts.filter(w => w.id !== da.dataset.delAct); save(); renderSummary(); return; }
      const dw = e.target.closest('[data-del-w]');
      if (dw) {
        const k = dw.dataset.delW;
        if (S.days[k]) S.days[k].weight = null;
        save(); renderSummary(); renderGoal(); renderProfile(); toast('Weight entry removed.'); return;
      }
      const dl = e.target.closest('[data-del-lib]');
      if (dl) {
        S.foods = S.foods.filter(f => f.id !== dl.dataset.delLib);
        save(); renderFoods($('foodSearch').value); renderSuggest(); toast('Food removed from library.');
      }
    });

    /* water */
    $('waterQuick').addEventListener('click', e => {
      const s = e.target.closest('[data-ml]'); if (!s) return;
      const d = day(VIEW); d.water = Math.max(0, num(d.water) + num(s.dataset.ml));
      save(); renderSummary();
    });

    /* weight */
    $('wAdd').addEventListener('click', () => {
      const v = num($('wInput').value, 0);
      if (v <= 0) { toast('Enter a valid weight.'); return; }
      day(VIEW).weight = round(v, 1); save();
      renderSummary(); renderGoal(); renderProfile();
      toast('Weight recorded for ' + relLabel(VIEW).toLowerCase() + '.');
    });

    /* food library */
    $('foodSearch').addEventListener('input', () => renderFoods($('foodSearch').value));
    ['fProtein', 'fCarb', 'fFat'].forEach(id => $(id).addEventListener('input', () => {
      $('fKcal').textContent = round(kcalOf(num($('fProtein').value), num($('fCarb').value), num($('fFat').value))) + ' kcal / 100';
    }));
    $('fSave').addEventListener('click', () => {
      const name = $('fName').value.trim();
      if (!name) { toast('Food name is required.'); return; }
      S.foods.push({
        id: 'u' + Date.now(), name,
        protein: num($('fProtein').value), carb: num($('fCarb').value),
        fat: num($('fFat').value), fiber: num($('fFiber').value),
        serving: num($('fServing').value, 100) || 100, unit: $('fUnit').value
      });
      save(); resetFoodForm(); renderFoods($('foodSearch').value); renderSuggest();
      toast(name + ' added to your Food list.');
    });
    $('fReset').addEventListener('click', resetFoodForm);
    $('labelPhoto').addEventListener('change', handleLabel);

    /* data tools */
    $('dExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'beautifyme-data-' + todayKey() + '.json'; a.click();
      URL.revokeObjectURL(a.href); toast('Data exported.');
    });
    $('dImport').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { localStorage.setItem(KEY, r.result); S = load(); VIEW = todayKey(); fillForms(); renderAll(); renderSuggest(); toast('Data imported.'); }
        catch (err) { toast('Invalid file.'); }
      };
      r.readAsText(f); e.target.value = '';
    });
    $('dReset').addEventListener('click', () => {
      if (!confirm('Erase all BeautifyMe data on this device?')) return;
      localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY);
      S = defaults(); VIEW = todayKey(); fillForms(); renderAll(); renderSuggest(); toast('All data erased.');
    });
  }

  function resetFoodForm() {
    ['fName', 'fProtein', 'fCarb', 'fFat', 'fFiber', 'fServing'].forEach(id => $(id).value = '');
    $('fKcal').textContent = '0 kcal / 100';
    $('ocrBox').hidden = true;
  }

  /* ---------------- nutrition label OCR ---------------- */
  function handleLabel(e) {
    const file = e.target.files[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    $('ocrImg').src = url; $('ocrBox').hidden = false;
    $('ocrStatus').textContent = 'Reading label…';
    loadTesseract()
      .then(T => T.recognize(url, 'eng'))
      .then(res => applyLabelText(res.data.text))
      .catch(() => { $('ocrStatus').textContent = 'Could not read automatically — type the values from the photo above.'; })
      .finally(() => { e.target.value = ''; });
  }

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = () => window.Tesseract ? res(window.Tesseract) : rej();
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function applyLabelText(text) {
    const t = text.toLowerCase().replace(/,/g, '.');
    const grab = (patterns) => {
      for (const p of patterns) {
        const m = t.match(new RegExp(p + '[^0-9\\-]{0,24}(\\d+(?:\\.\\d+)?)', 'i'));
        if (m) return m[1];
      }
      return null;
    };
    const p = grab(['protein', 'protéines', 'chất đạm', 'đạm']);
    const c = grab(['total carbohydrate', 'carbohydrate', 'carbs', 'tinh bột']);
    const f = grab(['total fat', 'fat', 'chất béo', 'béo']);
    const fi = grab(['dietary fiber', 'fibre', 'fiber', 'chất xơ', 'xơ']);
    const sv = grab(['serving size', 'per serve', 'khẩu phần']);

    let filled = 0;
    if (p) { $('fProtein').value = p; filled++; }
    if (c) { $('fCarb').value = c; filled++; }
    if (f) { $('fFat').value = f; filled++; }
    if (fi) { $('fFiber').value = fi; filled++; }
    if (sv) $('fServing').value = sv;
    $('fKcal').textContent = round(kcalOf(num($('fProtein').value), num($('fCarb').value), num($('fFat').value))) + ' kcal / 100';
    $('ocrStatus').textContent = filled
      ? 'Found ' + filled + ' value' + (filled > 1 ? 's' : '') + ' — check them above, add a name, then save.'
      : 'No values detected — type them from the photo above.';
  }

  /* ---------------- init ---------------- */
  fillForms(); bind(); bindProfile(); renderSuggest(); renderAll();
})();
