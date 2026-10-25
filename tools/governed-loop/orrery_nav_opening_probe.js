async (page) => {
  const log = { consoleErrors: [], pageErrors: [], expressibility: null };
  page.on("console", (message) => {
    if (message.type() === "error") log.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => log.pageErrors.push(String(error.message)));

  await page.waitForFunction(
    () => document.querySelector("#inspector-heading")?.textContent === "Saturn A0",
  );

  await page.evaluate(() => {
    const root = document.createElement("div");
    root.id = "orrery-nav-expressibility-probe";
    root.style.cssText =
      "position:fixed;left:0;top:0;width:900px;height:620px;z-index:2147483000;" +
      "background:#101418;color:#eee;font:12px monospace;padding:8px;overflow:auto;";
    const grid = document.createElement("div");
    grid.id = "probe-grid";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(12,48px);gap:2px;";
    for (let phase = 0; phase < 12; phase += 1) {
      for (let office = 0; office < 7; office += 1) {
        const cell = document.createElement("div");
        cell.className = "orrery-nav-cell";
        cell.dataset.phase = String(phase);
        cell.dataset.office = String(office);
        cell.style.cssText = "height:24px;background:#223;border:1px solid #334;";
        grid.appendChild(cell);
      }
    }
    const strip = document.createElement("div");
    strip.id = "probe-boundary";
    for (let phase = 0; phase < 12; phase += 1) {
      const chip = document.createElement("div");
      chip.className = "orrery-nav-boundary-chip";
      chip.dataset.phase = String(phase);
      chip.style.cssText =
        "display:inline-block;width:40px;height:18px;margin:2px;" +
        "background:#332;border:1px dashed #665;";
      strip.appendChild(chip);
    }
    const legend = document.createElement("div");
    legend.className = "nav-hl-tier1 nav-hl-seam nav-hl-boundary";
    legend.textContent = "three-state highlight classes";
    root.append(grid, strip, legend);
    document.body.appendChild(root);
  });

  const stats = await page.evaluate(() => {
    const cells = document.querySelectorAll(".orrery-nav-cell");
    const chips = document.querySelectorAll(".orrery-nav-boundary-chip");
    const classes = ["nav-hl-tier1", "nav-hl-seam", "nav-hl-boundary"].filter(
      (name) => document.querySelector(`.${name}`),
    );
    return {
      cells: cells.length,
      boundaryChips: chips.length,
      classes,
      rootPresent: Boolean(document.querySelector("#orrery-nav-expressibility-probe")),
    };
  });

  log.expressibility = stats;
  log.allPass =
    stats.cells === 84 &&
    stats.boundaryChips === 12 &&
    stats.classes.length === 3 &&
    log.consoleErrors.length === 0 &&
    log.pageErrors.length === 0;

  await page.evaluate((payload) => {
    window.__orreryNavLog = JSON.stringify(payload);
  }, log);
  return "expressibility-probe-complete";
}
