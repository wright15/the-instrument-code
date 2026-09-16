// Run against Vite with playwright-cli run-code --filename=tests/taxonomy-browser.js.
async (page) => {
  const origin = "http://127.0.0.1:5183";
  const assert = (condition, label) => { if (!condition) throw new Error(label); };
  let phase = "initial 462-record load";
  const diagnostics = [];
  const onConsole = (message) => { if (message.type() === "error" || message.type() === "warning") diagnostics.push(`${message.type()}: ${message.text()}`); };
  const onPageError = (error) => diagnostics.push(`pageerror: ${error.message}`);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
  await page.goto(origin);
  await page.waitForFunction(() => document.querySelectorAll("#taxonomy-record-list button").length === 462);
  const fixtures = await page.evaluate(async () => ({
    taxonomy: JSON.parse((await import("/src/generated/taxonomy-read-model.v1.json?raw")).default),
    dataset: JSON.parse((await import("/src/generated/d-tier-taxonomy-dataset.v1.json?raw")).default),
    context: await (await fetch((await import("/src/taxonomy-explain.ts")).taxonomySourceLink("canonical/fivefold-incubator/twin-hub-convergence-v0.json"))).json(),
    contextUrl: (await import("/src/taxonomy-explain.ts")).taxonomySourceLink("canonical/fivefold-incubator/twin-hub-convergence-v0.json"),
  }));
  let monitor = false;
  const requests = [];
  page.context().on("request", (request) => { if (monitor) requests.push({ method: request.method(), url: request.url() }); });
  const storage = () => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const before = await storage();
  monitor = true;
  await page.locator("#taxonomy-authority").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  assert(await page.locator("#taxonomy-authority").inputValue() === "canonical_release", "keyboard authority filter");
  await page.locator("#taxonomy-role").selectOption("boundary");
  assert(await page.locator("#taxonomy-record-list button").count() === 154, "boundary partition");
  await page.locator("#taxonomy-record-list button").first().click();
  assert((await page.locator("#taxonomy-inspector").textContent()).includes("declared_office / withheld"), "withheld office explanation");
  await page.locator("#taxonomy-state-id").fill("4096");
  await page.locator("#taxonomy-state-id").press("Tab");
  assert((await page.locator("#taxonomy-inspector").textContent()).includes("No nearby record is substituted"), "invalid ID");
  await page.locator("#taxonomy-role").selectOption("");
  await page.locator("#d-tier-taxonomy-list button").first().click();
  phase = "desktop optional GOV-510 available";
  await page.waitForFunction(() => document.querySelector("#taxonomy-inspector").textContent.includes("Optional GOV-510 context / planning_evidence / available"));
  const original = await page.locator("#taxonomy-inspector").textContent();
  const links = await page.locator("#taxonomy-inspector a").evaluateAll((nodes) => nodes.map((node) => node.href));
  assert(links.length >= 5, "declared relationship and context sources");
  assert(await page.locator("#taxonomy-inspector button, #taxonomy-inspector input, #taxonomy-inspector select, #taxonomy-inspector form").count() === 0, "no execution affordance");
  for (let i = 0; i < links.length; i++) {
    const popupPromise = page.waitForEvent("popup");
    await page.locator("#taxonomy-inspector a").nth(i).click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    assert(popup.url() === links[i], `deterministic source link ${i}`);
    assert((await popup.locator("body").textContent()).includes("{"), `source document loads ${i}`);
    await popup.close();
  }
  await page.locator("#d-tier-taxonomy-list button").first().click();
  assert(await page.locator("#taxonomy-inspector").textContent() === original, "deterministic labels/order");
  assert(await storage() === before, "explanation/filter controls must not persist session mutations");
  assert(requests.every((request) => request.method === "GET" && !request.url.includes("/api/")), "no graph, move, mutation, office, or admission request");
  monitor = false;

  const matrix = [];
  for (const [kind, fixture, pattern, selector] of [
    ["taxonomy", fixtures.taxonomy, (url) => url.pathname.endsWith("/src/generated/taxonomy-read-model.v1.json") && url.searchParams.has("raw"), "#taxonomy-status"],
    ["dataset", fixtures.dataset, (url) => url.pathname.endsWith("/src/generated/d-tier-taxonomy-dataset.v1.json") && url.searchParams.has("raw"), "#d-tier-taxonomy-status"],
    ["context", fixtures.context, fixtures.contextUrl, "#taxonomy-inspector"],
  ]) {
    const variants = kind === "taxonomy" ? ["absent", "malformed", "incompatible"] : ["confirmed", "refuted", "partial", "absent", "malformed", "stale"];
    for (const variant of variants) {
      phase = `${kind}:${variant}`;
      const input = JSON.parse(JSON.stringify(fixture));
      if (kind === "dataset" && ["confirmed", "refuted", "partial"].includes(variant)) input.censusBinding.researchVerdict.verdict = variant;
      if (kind === "context") input.verdict = variant;
      if (variant === "stale") {
        if (kind === "dataset") input.censusBinding.candidateFingerprint = "0".repeat(64);
        else input.candidateFingerprint = "0".repeat(64);
      }
      if (variant === "incompatible") input.schemaVersion = "unsupported";
      await page.route(pattern, (route) => variant === "absent" ? route.abort() : route.fulfill(kind === "context"
        ? { contentType: "application/json", body: variant === "malformed" ? "{" : JSON.stringify(input) }
        : { contentType: "text/javascript", body: `export default ${JSON.stringify(variant === "malformed" ? "{" : JSON.stringify(input))};` }));
      await page.goto(origin);
      if (kind === "context") {
        await page.waitForFunction(() => document.querySelectorAll("#d-tier-taxonomy-list button").length === 175);
        await page.locator("#d-tier-taxonomy-list button").first().click();
      }
      const expected = ["confirmed", "refuted", "partial"].includes(variant) ? variant : variant === "absent" ? "unavailable" : "incompatible";
      await page.waitForFunction(({ selector, expected, kind }) => {
        const text = document.querySelector(selector)?.textContent ?? "";
        const verdict = ["confirmed", "refuted", "partial"].includes(expected);
        return kind === "context"
          ? text.includes(`Optional GOV-510 context / planning_evidence / ${verdict ? `available / ${expected}` : expected}`)
          : text.startsWith(verdict ? `ready / ${expected} /` : `${expected} /`);
      }, { selector, expected, kind });
      if (kind === "taxonomy") assert(await page.locator("#taxonomy-record-list button, #d-tier-taxonomy-list button").count() === 0, "unavailable taxonomy has no substitute records");
      if (kind === "dataset") {
        assert(await page.locator("#d-tier-taxonomy-list button").count() === 175, "D-tier identity remains visible");
        if (!["confirmed", "refuted", "partial"].includes(variant)) {
          const rows = await page.locator("#d-tier-taxonomy-list button").allTextContents();
          assert(rows.every((row) => row.includes("fifth-space unavailable")), "fallback invents no measurements");
          assert(rows.filter((row) => row.startsWith("1. ")).length === 7, "ordinal resets once per D tier");
        }
      }
      if (kind === "context") {
        const text = await page.locator(selector).textContent();
        assert(text.split("Optional GOV-510 context")[0] === original.split("Optional GOV-510 context")[0], "GOV-510 cannot change base explanation");
      }
      matrix.push(`${kind}:${variant}`);
      await page.unroute(pattern);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  phase = "mobile 462-record load";
  await page.goto(origin);
  await page.waitForFunction(() => document.querySelectorAll("#taxonomy-record-list button").length === 462);
  await page.locator("#taxonomy-authority").selectOption("canonical_release");
  await page.locator("#taxonomy-record-list button").first().click();
  assert((await page.locator("#taxonomy-inspector").textContent()).includes("source_derivation"), "mobile inspector");
  return { verdict: "PASS", records: 462, dTierRecords: 175, sourceLinksExercised: links.length, matrix, negativeActions: "no API requests or storage writes from filters, selectors, or any explanation link", mobile: "PASS" };
  } catch (error) {
    return { verdict: "FAIL", phase, error: String(error), stack: error.stack, diagnostics, state: await page.evaluate(() => Object.fromEntries(["taxonomy-status", "d-tier-taxonomy-status", "taxonomy-inspector"].map((id) => [id, document.getElementById(id)?.textContent]))) };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    await page.unrouteAll({ behavior: "wait" });
  }
}
