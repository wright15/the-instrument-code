(() => {
  if (window.__orreryNav) return;

  const BRIDGE = window.__ORRERY_NAV_BRIDGE__ || "http://127.0.0.1:8765";
  const CLASS_NAMES = ["nav-hl-tier1", "nav-hl-seam", "nav-hl-boundary"];

  const state = {
    ready: false,
    nodes: [],
    nodeById: new Map(),
    catalog: [],
    boundary: null,
    tier1Cache: new Map(),
    current: null,
    lastCounts: { tier1: 0, seam: 0, boundary: 0 },
    lastVerdict: null,
    displayAnchors: new Set(),
    log: { emissions: [], steps: [], states: [], errors: [] },
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  async function fetchJSON(path) {
    const response = await fetch(`${BRIDGE}${path}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function installStyles() {
    const style = document.createElement("style");
    style.id = "orrery-nav-style";
    style.textContent = `
      #orrery-nav-overlay {
        position: fixed; left: 10px; top: 10px; width: 742px; max-height: 94vh;
        overflow: auto; z-index: 2147483000; background: rgba(10,13,18,0.94);
        color: #e8edf2; border: 1px solid #3a4654; border-radius: 6px;
        font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 10px 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.55);
      }
      #orrery-nav-overlay h2 { font-size: 13px; margin: 0 0 2px; letter-spacing: .04em; }
      #orrery-nav-overlay .nav-sub { color: #93a2b3; margin-bottom: 8px; }
      #orrery-nav-active { color: #f0d58a; margin: 6px 0; }
      #orrery-nav-summary { color: #a9b8c8; margin-bottom: 8px; }
      #orrery-nav-grid {
        display: grid; grid-template-columns: repeat(12, 54px);
        grid-auto-rows: 28px; gap: 2px; margin: 4px 0 8px;
      }
      .orrery-nav-cell {
        background: #18202a; border: 1px solid #2c3744; border-radius: 3px;
        padding: 1px 3px; font-size: 10px; color: #b7c4d2; overflow: hidden;
      }
      .orrery-nav-cell.is-active { outline: 2px solid #f0d58a; color: #fff; }
      .orrery-nav-cell.nav-hl-tier1 { background: #16324f; border-color: #3d8fd1; }
      .orrery-nav-cell.nav-hl-seam { background: #3a2f14; border-color: #d1a13d; }
      .orrery-nav-cell.nav-hl-boundary { border-style: dashed; border-color: #7d8b99; }
      #orrery-nav-boundary { margin: 2px 0 8px; }
      .orrery-nav-boundary-chip {
        display: inline-block; min-width: 42px; padding: 2px 5px; margin: 1px;
        background: #1d232b; border: 1px dashed #55636f; border-radius: 3px;
        color: #9aa9b8; font-size: 10px; text-align: center;
      }
      .orrery-nav-boundary-chip.is-active { outline: 2px solid #f0d58a; }
      .orrery-nav-boundary-chip.nav-hl-boundary { background: #2a2f26; border-color: #9aa88b; color: #d6e0c8; }
      #orrery-nav-moves { border-top: 1px solid #2c3744; padding-top: 6px; }
      #orrery-nav-moves .nav-class { margin: 3px 0; }
      #orrery-nav-moves .nav-class strong { color: #dbe6f2; }
      #orrery-nav-moves .nav-list { color: #9fb0c2; word-break: break-all; }
      #orrery-nav-legend { color: #93a2b3; margin-top: 6px; font-size: 11px; }
      #orrery-nav-toggle {
        float: right; background: #1d232b; color: #dbe6f2; border: 1px solid #3a4654;
        border-radius: 3px; font: inherit; padding: 1px 7px; cursor: pointer;
      }
      .nav-dot { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 2px; }
      .nav-dot.tier1 { background: #3d8fd1; }
      .nav-dot.seam { background: #d1a13d; }
      .nav-dot.boundary { background: #7d8b99; }
    `;
    document.head.appendChild(style);
  }

  function installUI() {
    const root = el("section");
    root.id = "orrery-nav-overlay";
    root.setAttribute("aria-label", "Orrery full-phase navigation overlay");

    const toggle = el("button", null, "hide");
    toggle.id = "orrery-nav-toggle";
    toggle.type = "button";
    toggle.addEventListener("click", () => {
      const body = document.getElementById("orrery-nav-body");
      const hidden = body.style.display === "none";
      body.style.display = hidden ? "" : "none";
      toggle.textContent = hidden ? "hide" : "show";
    });

    const title = el("h2", null, "ORRERY-NAV-1 — full-phase navigation");
    const subtitle = el("div", "nav-sub",
      "Policy-v3 · read-only overlay · served from pinned artifacts");
    const active = el("div", null, "Awaiting node selection");
    active.id = "orrery-nav-active";
    const summary = el("div", null, "");
    summary.id = "orrery-nav-summary";

    const grid = el("div");
    grid.id = "orrery-nav-grid";
    const boundary = el("div");
    boundary.id = "orrery-nav-boundary";
    const moves = el("div");
    moves.id = "orrery-nav-moves";
    const legend = el("div");
    legend.id = "orrery-nav-legend";
    legend.append(
      dot("tier1"), document.createTextNode("tier-1  "),
      dot("seam"), document.createTextNode("seam-catalog  "),
      dot("boundary"), document.createTextNode("boundary-transit  "),
      document.createTextNode("· "),
      el("span", null, "raised / lowered images pending"),
    );

    const body = el("div");
    body.id = "orrery-nav-body";
    body.append(active, summary, grid, boundary, moves, legend);

    root.append(toggle, title, subtitle, body);
    document.body.appendChild(root);
  }

  function dot(kind) {
    const span = el("span", `nav-dot ${kind}`);
    return span;
  }

  function buildGrid() {
    const grid = document.getElementById("orrery-nav-grid");
    grid.textContent = "";
    const offices = [...new Set(state.nodes.filter((n) => n.officeIndex !== null).map((n) => n.officeIndex))]
      .sort((a, b) => a - b);
    const counts = new Map();
    for (const node of state.nodes) {
      if (node.officeIndex === null) continue;
      const key = `${node.phase}:${node.officeIndex}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (let phase = 0; phase < 12; phase += 1) {
      for (const office of offices) {
        const cell = el("div", "orrery-nav-cell");
        cell.dataset.phase = String(phase);
        cell.dataset.office = String(office);
        cell.dataset.count = String(counts.get(`${phase}:${office}`) || 0);
        cell.title = `phase ${phase} · office ${office}`;
        cell.textContent = `${phase}/${office} ${cell.dataset.count}`;
        grid.appendChild(cell);
      }
    }

    const boundaryStrip = document.getElementById("orrery-nav-boundary");
    boundaryStrip.textContent = "";
    const phaseCounts = new Map();
    for (const node of state.nodes) {
      if (!node.boundary) continue;
      phaseCounts.set(node.phase, (phaseCounts.get(node.phase) || 0) + 1);
    }
    for (let phase = 0; phase < 12; phase += 1) {
      const chip = el("div", "orrery-nav-boundary-chip");
      chip.dataset.phase = String(phase);
      chip.dataset.count = String(phaseCounts.get(phase) || 0);
      chip.textContent = `b${phase} ${chip.dataset.count}`;
      boundaryStrip.appendChild(chip);
    }
  }

  function updateActive() {
    document.querySelectorAll(".orrery-nav-cell.is-active, .orrery-nav-boundary-chip.is-active")
      .forEach((node) => node.classList.remove("is-active"));
    const current = state.current;
    if (!current) return;
    const active = document.getElementById("orrery-nav-active");
    active.textContent =
      `${current.id} · ${current.role}` +
      (current.office ? ` · ${current.office}` : "") +
      ` · phase ${current.phase}`;
    if (current.boundary) {
      const chip = document.querySelector(`.orrery-nav-boundary-chip[data-phase="${current.phase}"]`);
      if (chip) chip.classList.add("is-active");
    } else {
      const cell = document.querySelector(
        `.orrery-nav-cell[data-phase="${current.phase}"][data-office="${current.officeIndex}"]`,
      );
      if (cell) cell.classList.add("is-active");
    }
  }

  function updateSummary() {
    const gridNodes = state.nodes.filter((n) => !n.boundary).length;
    const boundaryNodes = state.nodes.filter((n) => n.boundary).length;
    const summary = document.getElementById("orrery-nav-summary");
    const raised = state.catalog.filter((m) => m.kind === "familyA" && m.operatorId === "R1").length;
    const lowered = state.catalog.filter((m) => m.kind === "familyA" && m.operatorId === "L1").length;
    summary.textContent =
      `grid ${gridNodes} + boundary ${boundaryNodes} = ${state.nodes.length} lifted nodes · ` +
      `seam catalog ${state.catalog.length} · raised images ${raised} / lowered ${lowered}`;
  }

  function seamFor(node) {
    const moves = [];
    for (const move of state.catalog) {
      if (move.kind === "familyA") {
        if (move.sourceId === node.mask && move.sourcePhase === node.phase) moves.push(move);
      } else if (move.leftMask === node.mask || move.rightMask === node.mask) {
        moves.push(move);
      }
    }
    return moves;
  }

  function boundaryExits(node) {
    if (!state.boundary) return [];
    return state.boundary.rows.filter(
      (row) => row.side === "exit" && row.sourceId === node.mask,
    );
  }

  function targetOf(move, node) {
    if (move.kind === "familyA") {
      return state.nodeById.get(`${move.targetId}@${move.targetPhase}`) || null;
    }
    const other = move.leftMask === node.mask ? move.rightMask : move.leftMask;
    return state.nodeById.get(`${other}@${node.phase}`) || null;
  }

  function clearHighlights() {
    document.querySelectorAll(`.${CLASS_NAMES.join(", .")}`)
      .forEach((node) => CLASS_NAMES.forEach((name) => node.classList.remove(name)));
  }

  function revealClass(target) {
    if (!target) return;
    if (target.boundary) {
      const chip = document.querySelector(
        `.orrery-nav-boundary-chip[data-phase="${target.phase}"]`,
      );
      if (chip) chip.classList.add("nav-hl-boundary");
      return;
    }
    const cell = document.querySelector(
      `.orrery-nav-cell[data-phase="${target.phase}"][data-office="${target.officeIndex}"]`,
    );
    if (cell) cell.classList.add("nav-hl-boundary");
  }

  function applyHighlights(node, tier1, seam, boundaryRows) {
    clearHighlights();
    const ownCell = document.querySelector(
      `.orrery-nav-cell[data-phase="${node.phase}"][data-office="${node.officeIndex}"]`,
    );
    if (tier1.length > 0 && ownCell) ownCell.classList.add("nav-hl-tier1");

    for (const move of seam) {
      const target = targetOf(move, node);
      if (!target) continue;
      if (target.boundary) revealClass(target);
      else {
        const cell = document.querySelector(
          `.orrery-nav-cell[data-phase="${target.phase}"][data-office="${target.officeIndex}"]`,
        );
        if (cell) cell.classList.add("nav-hl-seam");
      }
    }

    for (const row of boundaryRows) {
      const targetPhase = (node.phase + row.phaseCarry + 12) % 12;
      const chip = document.querySelector(
        `.orrery-nav-boundary-chip[data-phase="${targetPhase}"]`,
      );
      if (chip) chip.classList.add("nav-hl-boundary");
    }
  }

  function renderMoves(node, tier1, seam, boundaryRows) {
    const panel = document.getElementById("orrery-nav-moves");
    panel.textContent = "";
    const classes = [
      ["tier-1", tier1.map((m) => m.candidateId)],
      ["seam-catalog", seam.map((m) => m.id)],
      ["boundary-transit", boundaryRows.map((m) => `${m.applicationId} @ phase ${(node.phase + m.phaseCarry + 12) % 12}`)],
    ];
    for (const [name, entries] of classes) {
      const row = el("div", "nav-class");
      row.append(el("strong", null, `${name} (${entries.length})`));
      if (entries.length) {
        row.append(el("div", "nav-list", entries.slice(0, 8).join(" · ") + (entries.length > 8 ? " · …" : "")));
      }
      panel.appendChild(row);
    }
  }

  async function select(nodeId) {
    const node = state.nodeById.get(nodeId);
    if (!node) throw new Error(`unknown node ${nodeId}`);
    state.current = node;
    updateActive();
    let tier1 = state.tier1Cache.get(nodeId);
    if (!tier1) {
      const payload = await fetchJSON(`/api/tier1-moves?node=${encodeURIComponent(nodeId)}`);
      tier1 = payload.moves;
      state.tier1Cache.set(nodeId, tier1);
    }
    const seam = seamFor(node);
    const boundaryRows = boundaryExits(node);
    applyHighlights(node, tier1, seam, boundaryRows);
    renderMoves(node, tier1, seam, boundaryRows);
    state.lastCounts = {
      tier1: tier1.length,
      seam: seam.length,
      boundary: boundaryRows.length,
    };
    state.log.states.push({ node: nodeId, counts: { ...state.lastCounts } });
    return { node: nodeId, counts: { ...state.lastCounts } };
  }

  function displayAnchorFor(target, source, buttons) {
    if (target.role === "anchor" && buttons.has(target.mask)) return target.mask;
    if (target.governingRoot !== null && buttons.has(target.governingRoot)) {
      return target.governingRoot;
    }
    if (target.boundary) {
      const sourceAnchor = source.role === "anchor" ? source.mask : source.governingRoot;
      if (sourceAnchor !== null && buttons.has(sourceAnchor)) return sourceAnchor;
    }
    return null;
  }

  function triggerSound(target, source, verdict) {
    if (verdict !== "ACCEPT") {
      return { type: "rest", reason: "veto", target: target.id };
    }
    const buttons = new Set(
      [...document.querySelectorAll("button[data-state-id]")]
        .map((button) => Number(button.dataset.stateId)),
    );
    const displayAnchor = displayAnchorFor(target, source, buttons);
    if (displayAnchor === null) {
      return { type: "rest", reason: "no-display-anchor", target: target.id };
    }
    const button = document.querySelector(`button[data-state-id="${displayAnchor}"]`);
    if (!button) {
      return { type: "rest", reason: "button-missing", displayAnchor, target: target.id };
    }
    button.click();
    return {
      type: "voiced",
      displayAnchor,
      target: target.id,
      source: source.id,
    };
  }

  function applyMove(candidateId, verdict, citation) {
    const target = state.nodeById.get(candidateId);
    if (!target) throw new Error(`unknown candidate ${candidateId}`);
    const source = state.current;
    if (!source) throw new Error("no current node");
    const emission = triggerSound(target, source, verdict);
    state.lastVerdict = { candidate: candidateId, verdict, citation, emission };
    state.log.emissions.push({ ...emission, verdict, citation, candidate: candidateId });
    state.log.steps.push({
      current: source.id,
      candidate: candidateId,
      verdict,
      citation,
      emission,
    });
    if (verdict === "ACCEPT") {
      state.current = target;
      updateActive();
    }
    return {
      state: state.current ? state.current.id : null,
      emission,
      verdict,
      citation,
    };
  }

  function inspect() {
    const cells = [...document.querySelectorAll(".orrery-nav-cell")];
    const chips = [...document.querySelectorAll(".orrery-nav-boundary-chip")];
    const gridCount = cells.reduce((sum, cell) => sum + Number(cell.dataset.count || 0), 0);
    const boundaryCount = chips.reduce((sum, chip) => sum + Number(chip.dataset.count || 0), 0);
    const classes = CLASS_NAMES.filter((name) => document.querySelector(`.${name}`));
    return {
      cells: cells.length,
      boundaryChips: chips.length,
      classes,
      nodes: state.nodes.length,
      seamCatalog: state.catalog.length,
      boundaryRows: state.boundary ? state.boundary.rows.length : 0,
      gridCount,
      boundaryCount,
      total: gridCount + boundaryCount,
      displayAnchorButtons: document.querySelectorAll("button[data-state-id]").length,
    };
  }

  async function init() {
    try {
      const [nodesPayload, movesPayload, boundaryPayload] = await Promise.all([
        fetchJSON("/api/nodes"),
        fetchJSON("/api/legal-moves"),
        fetchJSON("/api/boundary-transit"),
      ]);
      state.nodes = nodesPayload.nodes;
      state.nodeById = new Map(state.nodes.map((node) => [node.id, node]));
      state.catalog = movesPayload.moves;
      state.boundary = boundaryPayload;
      installStyles();
      installUI();
      buildGrid();
      updateSummary();
      state.ready = true;
    } catch (error) {
      state.log.errors.push(String(error.message || error));
      const active = document.getElementById("orrery-nav-active");
      if (active) active.textContent = `overlay error: ${String(error.message || error)}`;
      throw error;
    }
  }

  window.__orreryNav = {
    get ready() {
      return state.ready;
    },
    select,
    applyMove,
    inspect,
    state: () => ({
      node: state.current ? state.current.id : null,
      mask: state.current ? state.current.mask : null,
      phase: state.current ? state.current.phase : null,
      role: state.current ? state.current.role : null,
    }),
    counts: () => ({ ...state.lastCounts }),
    lastVerdict: () => ({ ...state.lastVerdict }),
    log: () => JSON.parse(JSON.stringify(state.log)),
    bridge: BRIDGE,
  };

  init();
})();
