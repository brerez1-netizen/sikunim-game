/* המנוע: חישוב הסיכון השיורי מהבקרות שנבחרו, ניקוד, וצבעי הרמזור.
   כל התשובות מחושבות מהנתונים ולא נכתבות ביד, כדי שהסיכון השיורי יהיה
   תוצאה של ההחלטות של הקבוצה ולא ערך קבוע. */
(function () {
  const G = window.gameData;
  const P = G.meta.points;
  const clamp = (v) => Math.max(1, Math.min(5, v));

  const controlsOf = (cs, ids) => (ids || []).map((id) => cs.controls.find((c) => c.id === id)).filter(Boolean);

  /* בקרות חופפות לא מצטברות במלואן: הבקרה החזקה בציר נספרת במלואה, וכל אחת אחריה
     בחצי (מעוגל כלפי מטה). בלי זה שלוש בקרות מנהלתיות וציוד מגן היו מורידות סיכון
     כמו סילוק והחלפה, וההיררכיה הייתה מאבדת את המשמעות שלה. */
  function reduce(values) {
    return values.filter((v) => v > 0).sort((a, b) => b - a)
      .reduce((sum, v, i) => sum + (i === 0 ? v : Math.floor(v / 2)), 0);
  }

  // הסיכון השיורי: לא יורד מתחת לדרגה 1 בשום ציר
  function residual(cs, ids) {
    const picked = controlsOf(cs, ids);
    return {
      prob: clamp(cs.gross.prob - reduce(picked.map((c) => c.dp))),
      sev: clamp(cs.gross.sev - reduce(picked.map((c) => c.ds))),
    };
  }

  const score = (cell) => cell.prob * cell.sev;
  // שיטת הרמזור מהשיעור: 1-6 ירוק, 8-12 צהוב, 15-25 אדום
  const band = (v) => (v <= 6 ? "green" : v <= 12 ? "yellow" : "red");
  const bandName = (v) => ({ green: "קביל", yellow: "קביל מותנה", red: "לא קביל" }[band(v)]);

  const near = (a, b) => Math.abs(a.prob - b.prob) + Math.abs(a.sev - b.sev) === 1;
  const same = (a, b) => a.prob === b.prob && a.sev === b.sev;

  function gradeCell(guess, truth, full, half) {
    if (!guess) return { kind: "none", pts: 0 };
    if (same(guess, truth)) return { kind: "exact", pts: full };
    if (near(guess, truth)) return { kind: "near", pts: half };
    return { kind: "off", pts: 0 };
  }

  /* ניקוד של תאונה אחת. ans: { g: {prob,sev}, picks: [id], r: {prob,sev}, blame: index } */
  function scoreCase(cs, ans) {
    ans = ans || {};
    const picked = controlsOf(cs, ans.picks);
    const truth = residual(cs, ans.picks);
    const g = gradeCell(ans.g, cs.gross, P.gross, P.grossNear);
    const r = gradeCell(ans.r, truth, P.residual, P.residualNear);
    const ctrl = picked.reduce((a, c) => a + c.pts, 0);
    const blame = cs.blame ? (ans.blame === 0 ? P.blame : 0) : 0;
    return {
      gross: g, resid: r, truth, picked,
      ctrlPts: ctrl,
      blamePts: blame,
      blameAnswered: !cs.blame || typeof ans.blame === "number",
      topTier: picked.filter((c) => c.tier <= 2).length,
      ppeOnly: picked.length > 0 && picked.every((c) => c.tier >= 4),
      landedGreen: band(score(truth)) === "green",
      pts: g.pts + r.pts + ctrl + blame,
    };
  }

  function maxCase(cs) {
    const best = cs.controls.slice().sort((a, b) => b.pts - a.pts).slice(0, G.meta.pickControls)
      .reduce((a, c) => a + c.pts, 0);
    return P.gross + P.residual + best + (cs.blame ? P.blame : 0);
  }
  const maxTotal = () => G.cases.reduce((a, c) => a + maxCase(c), 0);

  function total(all) {
    const t = { pts: 0, exact: 0, green: 0, topTier: 0, done: 0, per: {} };
    G.cases.forEach((cs) => {
      const a = all && all[cs.id];
      if (!a) return;
      const s = scoreCase(cs, a);
      t.per[cs.id] = s;
      t.pts += s.pts;
      t.done++;
      if (s.gross.kind === "exact") t.exact++;
      if (s.landedGreen) t.green++;
      t.topTier += s.topTier;
    });
    return t;
  }

  window.RISK = { residual, score, band, bandName, scoreCase, maxCase, maxTotal, total, controlsOf, near, same };
})();
