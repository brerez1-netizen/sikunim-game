/* משותף לשלושת המסכים: ציור מטריצת 5x5, כרטיסי הבקרות, ותגי ההיררכיה.
   המטריצה בנויה כ-grid: ציר ההסתברות מלמעלה (5) למטה (1), ציר החומרה מימין (1)
   לשמאל (5), כמו שקוראים עברית. */
(function () {
  const G = window.gameData, R = window.RISK;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* o: { sel, marks: [{prob,sev,cls,label,title}], pick: bool, id, small: bool } */
  function matrixHTML(o) {
    o = o || {};
    const marks = o.marks || [];
    const cells = [];
    for (let p = 5; p >= 1; p--) {
      cells.push(`<div class="mx-ax mx-p">${p}<span>${esc(G.scales.prob[p - 1])}</span></div>`);
      for (let s = 1; s <= 5; s++) {
        const v = p * s;
        const here = marks.filter((m) => m.prob === p && m.sev === s);
        const sel = o.sel && o.sel.prob === p && o.sel.sev === s;
        const tag = o.pick ? "button" : "div";
        cells.push(
          `<${tag} class="mx-c ${R.band(v)} ${sel ? "sel" : ""}" ${o.pick ? `data-p="${p}" data-s="${s}" aria-label="הסתברות ${p} כפול חומרה ${s}, ציון ${v}"` : ""}>` +
          `<span class="mx-v">${v}</span>` +
          here.map((m) => `<span class="mx-m ${m.cls || ""}" ${m.title ? `title="${esc(m.title)}"` : ""} ${m.color ? `style="background:${m.color}"` : ""}>${esc(m.label || "")}</span>`).join("") +
          `</${tag}>`);
      }
    }
    const head = ['<div class="mx-corner"><span>הסתברות</span><span>חומרה</span></div>']
      .concat([1, 2, 3, 4, 5].map((s) => `<div class="mx-ax mx-s">${s}<span>${esc(G.scales.sev[s - 1])}</span></div>`));
    return `<div class="mx ${o.small ? "small" : ""}" ${o.id ? `id="${o.id}"` : ""}>${head.join("")}${cells.join("")}</div>`;
  }

  const tierOf = (n) => G.scales.tiers.find((t) => t.n === n);

  function controlHTML(c, st) {
    const t = tierOf(c.tier);
    return `<button class="ctl ${st && st.sel ? "sel" : ""} ${st && st.locked ? "locked" : ""} tier${c.tier}" data-c="${c.id}" ${st && st.locked ? "disabled" : ""}>
      <span class="ctl-t">${c.tier}. ${esc(t.name)}</span>
      <span class="ctl-x">${esc(c.text)}</span>
      ${st && st.note ? `<span class="ctl-n">${esc(c.note)}</span>` : ""}
      ${st && st.pts ? `<span class="ctl-p">${c.pts} נק'</span>` : ""}
    </button>`;
  }

  function cellLine(cell) {
    const v = R.score(cell);
    return `<b class="${R.band(v)}">${v}</b> <span class="dim">(${cell.prob} כפול ${cell.sev}, ${R.bandName(v)})</span>`;
  }

  function caseHeadHTML(cs, n) {
    return `<div class="cs-hd">
      <div class="cs-n">תאונה ${n} מתוך ${G.cases.length}</div>
      <div class="cs-t">${esc(cs.title)}</div>
      <div class="cs-b">${esc(cs.brief)}</div>
    </div>`;
  }

  function figHTML(cs) {
    return `<figure class="fig"><div class="fig-in">
      <img src="${esc(cs.image)}" alt="${esc(cs.alt)}" onerror="this.parentNode.classList.add('noimg')">
      <div class="fig-ph" aria-hidden="true">${esc(cs.title)}</div>
    </div></figure>`;
  }

  window.RISK_UI = { esc, matrixHTML, controlHTML, cellLine, caseHeadHTML, figHTML, tierOf };
})();
