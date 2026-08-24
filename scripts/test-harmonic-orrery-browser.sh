#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
frontend_dir="${root_dir}/orrery"
cli="${frontend_dir}/node_modules/.bin/playwright-cli"
vite="${frontend_dir}/node_modules/.bin/vite"
port="${ORRERY_BROWSER_PORT:-4174}"
base_url="http://127.0.0.1:${port}"

if [[ ! -x "${cli}" || ! -x "${vite}" ]]; then
  printf '%s\n' "Missing Orrery browser dependencies. Run npm install --prefix orrery."
  exit 1
fi

fixture_body="$(node "${frontend_dir}/test/fixtures/nodes-response.mjs")"
release_fixture_body="$(node "${frontend_dir}/test/fixtures/nodes-response.mjs" "harmonic-compression-candidate:CH_A012_q_v1:2.0.0")"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/orrery-browser.XXXXXX")"
api_session="orrery-api-unavailable-$$"
webgl_session="orrery-webgl-unavailable-$$"
shared_session="orrery-shared-session-$$"
invalid_link_session="orrery-invalid-link-$$"
stale_session="orrery-stale-session-$$"
incompatible_session="orrery-incompatible-response-$$"
audio_session="orrery-audio-$$"
vite_pid=""

cleanup() {
  "${cli}" -s="${api_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${webgl_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${shared_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${invalid_link_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${stale_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${incompatible_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${audio_session}" close >/dev/null 2>&1 || true

  if [[ -n "${vite_pid}" ]]; then
    kill "${vite_pid}" >/dev/null 2>&1 || true
    wait "${vite_pid}" >/dev/null 2>&1 || true
  fi

  rm -rf "${work_dir}"
}
trap cleanup EXIT INT TERM

export PLAYWRIGHT_MCP_OUTPUT_DIR="${work_dir}/playwright"
export PLAYWRIGHT_MCP_HEADLESS=true

"${vite}" --host 127.0.0.1 --port "${port}" --strictPort >"${work_dir}/vite.log" 2>&1 &
vite_pid="$!"

for ((attempt = 0; attempt < 100; attempt += 1)); do
  if curl --fail --silent --output /dev/null "${base_url}/"; then
    break
  fi

  sleep 0.1
done

if ! curl --fail --silent --output /dev/null "${base_url}/"; then
  printf '%s\n' "Timed out waiting for the Orrery Vite server at ${base_url}."
  exit 1
fi

run_cli() {
  local session="$1"
  shift
  "${cli}" -s="${session}" "$@"
}

assert_page() {
  local session="$1"
  local expression="$2"
  local description="$3"
  local result
  result="$(run_cli "${session}" --raw eval "${expression}")"
  if [[ "${result}" != "true" ]]; then
    printf '%s\n' "Browser assertion failed: ${description}"
    printf '%s\n' "Actual result: ${result}"
    exit 1
  fi
}

run_cli "${api_session}" open
run_cli "${api_session}" run-code "async page => {
  await page.addInitScript(() => {
    localStorage.setItem('seven-governors.harmonic-orrery.session', 'preserved-unavailable');
  });
}"
run_cli "${api_session}" route "**/api/nodes" \
  --status 503 \
  --body '{"detail":"Neo4j projection is unavailable"}' \
  --content-type application/json
run_cli "${api_session}" goto "${base_url}/"
run_cli "${api_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#api-status')?.dataset.state === 'error');
  const result = await page.evaluate(() => ({
    apiState: document.querySelector('#api-status')?.dataset.state,
    apiText: document.querySelector('#api-status')?.textContent?.trim(),
    messageState: document.querySelector('#scene-message')?.dataset.state,
    messageText: document.querySelector('#scene-message')?.textContent?.trim(),
    canvasHidden: document.querySelector('#orrery-canvas')?.hidden,
    anchorCount: document.querySelectorAll('#anchor-list .anchor-button').length,
    reloadHidden: document.querySelector('#reload-projection')?.hidden,
    sessionHealth: document.querySelector('#session-api-health')?.textContent?.trim(),
  }));
  if (
    result.apiState !== 'error' ||
    result.apiText !== 'Projection unavailable' ||
    result.messageState !== 'error' ||
    !result.messageText?.includes('Anchor projection request failed (503)') ||
    result.canvasHidden !== true ||
    result.anchorCount !== 0 ||
    result.reloadHidden !== false ||
    result.sessionHealth !== 'Projection unavailable'
  ) {
    throw new Error('Unexpected API-unavailable state: ' + JSON.stringify(result));
  }
}"
assert_page "${api_session}" "() => {
  const status = document.querySelector('#api-status');
  const message = document.querySelector('#scene-message');
  return (
    status?.dataset.state === 'error' &&
    status.textContent?.trim() === 'Projection unavailable' &&
    message?.dataset.state === 'error' &&
    message.textContent?.includes('Anchor projection request failed (503)') &&
    document.querySelector('#orrery-canvas')?.hidden === true &&
    document.querySelectorAll('#anchor-list .anchor-button').length === 0 &&
    document.querySelector('#reload-projection')?.hidden === false &&
    document.querySelector('#session-api-health')?.textContent?.trim() === 'Projection unavailable' &&
    localStorage.getItem('seven-governors.harmonic-orrery.session') === 'preserved-unavailable'
  );
}" "API unavailable state"

run_cli "${webgl_session}" open
run_cli "${webgl_session}" run-code "async page => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextId, ...args) {
      if (contextId === 'webgl' || contextId === 'webgl2') {
        return this.id === 'orrery-canvas' ? null : {};
      }
      return getContext.call(this, contextId, ...args);
    };
  });
}"
run_cli "${webgl_session}" route "**/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json
run_cli "${webgl_session}" goto "${base_url}/"
run_cli "${webgl_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#api-status')?.dataset.state === 'ready');
  const initial = await page.evaluate(() => ({
    apiText: document.querySelector('#api-status')?.textContent?.trim(),
    canvasHidden: document.querySelector('#orrery-canvas')?.hidden,
    messageState: document.querySelector('#scene-message')?.dataset.state,
    messageText: document.querySelector('#scene-message')?.textContent?.trim(),
    sceneCount: document.querySelector('#scene-count')?.textContent?.trim(),
    anchorCount: document.querySelectorAll('#anchor-list .anchor-button').length,
  }));
  if (
    initial.apiText !== 'Live projection / harmonic-orrery.nodes.v1' ||
    initial.canvasHidden !== true ||
    initial.messageState !== 'notice' ||
    initial.messageText !== 'WebGL is unavailable. Use the keyboard-accessible anchor index to inspect the live projection.' ||
    initial.sceneCount !== '21 / 21 anchors' ||
    initial.anchorCount !== 21
  ) {
    throw new Error('Unexpected WebGL fallback state: ' + JSON.stringify(initial));
  }
}"
assert_page "${webgl_session}" "() => {
  return (
    document.querySelector('#api-status')?.textContent?.trim() === 'Live projection / harmonic-orrery.nodes.v1' &&
    document.querySelector('#orrery-canvas')?.hidden === true &&
    document.querySelector('#scene-message')?.textContent === 'WebGL is unavailable. Use the keyboard-accessible anchor index to inspect the live projection.' &&
    document.querySelectorAll('#anchor-list .anchor-button').length === 21 &&
    document.querySelector('#inspector-heading')?.textContent === 'Choose an anchor' &&
    document.querySelector('#session-selected')?.textContent?.trim() === 'No anchor selected' &&
    document.querySelector('#session-visited')?.textContent?.trim() === '0 / 21 visited' &&
    document.querySelector('#session-court')?.textContent?.trim() === 'C0 / Major Pentatonic / local-only' &&
    document.querySelectorAll('#court-controls [data-court-position]').length === 5 &&
    document.querySelector('[data-court-position="C0"]')?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('[data-court-position="C0"]')?.disabled === false &&
    document.querySelector('[data-court-position="C1"]')?.disabled === false &&
    document.querySelector('[data-court-position="C2"]')?.disabled === true &&
    document.querySelector('#court-current')?.textContent?.trim() === 'C0 / Major Pentatonic / Fire / Mars' &&
    document.querySelector('#court-mask')?.textContent?.trim() === '661 / 101010010100' &&
    document.querySelector('#court-pitch-classes')?.textContent?.trim() === '{0, 2, 4, 7, 9}' &&
    document.querySelectorAll('[data-court-pole]').length === 4 &&
    document.querySelector('[data-court-pole="Mercury"]') === null &&
    document.querySelectorAll('#court-poles button, #court-poles input').length === 0 &&
    document.querySelector('#court-mercury')?.textContent?.includes('not a binary Court pole or toggle') &&
    document.querySelectorAll('.anchor-button[aria-pressed=true]').length === 0
  );
}" "first-visit WebGL fallback state"
run_cli "${webgl_session}" run-code "async page => {
  const c1 = page.locator('[data-court-position=\"C1\"]');
  await c1.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C1\"]')?.getAttribute('aria-pressed') === 'true');
  const moved = await page.evaluate(() => ({
    court: document.querySelector('#session-court')?.textContent?.trim(),
    focused: document.activeElement?.getAttribute('data-court-position'),
    c0Enabled: document.querySelector('[data-court-position=\"C0\"]')?.disabled === false,
    c2Enabled: document.querySelector('[data-court-position=\"C2\"]')?.disabled === false,
    c3Disabled: document.querySelector('[data-court-position=\"C3\"]')?.disabled === true,
    route: document.querySelector('#court-route-status')?.textContent?.trim(),
    mars: document.querySelector('[data-court-pole=\"Mars\"]')?.textContent?.trim(),
  }));
  if (
    moved.court !== 'C1 / Scottish Pentatonic / local-only' ||
    moved.focused !== 'C1' ||
    !moved.c0Enabled ||
    !moved.c2Enabled ||
    !moved.c3Disabled ||
    !moved.route?.includes('C0, C2') ||
    moved.mars !== 'MarsInternal'
  ) {
    throw new Error('Court adjacency controls did not render correctly: ' + JSON.stringify(moved));
  }

  await page.locator('[data-court-position=\"C2\"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C2\"]')?.getAttribute('aria-pressed') === 'true');
  const c2 = await page.evaluate(() => ({
    court: document.querySelector('#session-court')?.textContent?.trim(),
    mask: document.querySelector('#court-mask')?.textContent?.trim(),
    mercuryActive: document.querySelector('#court-mercury')?.dataset.active,
    poles: Array.from(document.querySelectorAll('[data-court-pole]')).map(item => item.textContent?.trim()),
  }));
  if (
    c2.court !== 'C2 / Qing Yu / local-only' ||
    c2.mask !== '1189 / 101001010010' ||
    c2.mercuryActive !== 'true' ||
    JSON.stringify(c2.poles) !== JSON.stringify(['MarsInternal', 'JupiterInternal', 'VenusExternal', 'SaturnExternal'])
  ) {
    throw new Error('Court C2 did not render its canonical filter: ' + JSON.stringify(c2));
  }

  await page.locator('[data-court-position=\"C3\"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C3\"]')?.getAttribute('aria-pressed') === 'true');
  const c3 = await page.evaluate(() => ({
    court: document.querySelector('#session-court')?.textContent?.trim(),
    mask: document.querySelector('#court-mask')?.textContent?.trim(),
    c1Disabled: document.querySelector('[data-court-position=\"C1\"]')?.disabled === true,
    venus: document.querySelector('[data-court-pole=\"Venus\"]')?.textContent?.trim(),
  }));
  if (
    c3.court !== 'C3 / Minor Pentatonic / local-only' ||
    c3.mask !== '1193 / 100101010010' ||
    !c3.c1Disabled ||
    c3.venus !== 'VenusInternal'
  ) {
    throw new Error('Court C3 did not render its canonical filter: ' + JSON.stringify(c3));
  }

  await page.locator('[data-court-position=\"C4\"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C4\"]')?.getAttribute('aria-pressed') === 'true');
  const c4 = await page.evaluate(() => ({
    court: document.querySelector('#session-court')?.textContent?.trim(),
    mask: document.querySelector('#court-mask')?.textContent?.trim(),
    c2Disabled: document.querySelector('[data-court-position=\"C2\"]')?.disabled === true,
    c3Enabled: document.querySelector('[data-court-position=\"C3\"]')?.disabled === false,
    saturn: document.querySelector('[data-court-pole=\"Saturn\"]')?.textContent?.trim(),
  }));
  if (
    c4.court !== 'C4 / Man Gong / local-only' ||
    c4.mask !== '1321 / 100101001010' ||
    !c4.c2Disabled ||
    !c4.c3Enabled ||
    c4.saturn !== 'SaturnInternal'
  ) {
    throw new Error('Court C4 did not render its canonical filter: ' + JSON.stringify(c4));
  }

  for (const position of ['C3', 'C2', 'C1', 'C0']) {
    await page.locator('[data-court-position=\"' + position + '\"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction((target) => document.querySelector('[data-court-position=\"' + target + '\"]')?.getAttribute('aria-pressed') === 'true', position);
  }
}"
assert_page "${webgl_session}" "() => {
  const stored = JSON.parse(localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
  return (
    document.querySelector('#session-court')?.textContent?.trim() === 'C0 / Major Pentatonic / local-only' &&
    stored?.courtPresentationPosition === 'C0' &&
    !new URL(window.location.href).searchParams.has('court')
  );
}" "adjacent keyboard Court controls and local persistence"
run_cli "${webgl_session}" run-code "async page => {
  const target = page.locator(\"button[data-state-id='3']\");
  await target.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Mars A0');
}"
assert_page "${webgl_session}" "() => {
  return (
    document.activeElement?.getAttribute('data-state-id') === '3' &&
    document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('#inspector-heading')?.textContent === 'Mars A0' &&
    document.querySelector('#selected-identity')?.textContent === 'scale:3 / A0 / 7-35' &&
    document.querySelector('#session-selected')?.textContent?.trim() === 'Mars A0 / scale:3' &&
    document.querySelector('#session-visited')?.textContent?.trim() === '1 / 21 visited'
  );
}" "WebGL fallback selection"
run_cli "${webgl_session}" reload
run_cli "${webgl_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Mars A0');
  const restored = await page.evaluate(() => ({
    selected: document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed'),
    visited: document.querySelector('#session-visited')?.textContent?.trim(),
  }));
  if (restored.selected !== 'true' || restored.visited !== '1 / 21 visited') {
    throw new Error('WebGL fallback did not restore local progress: ' + JSON.stringify(restored));
  }
}"
assert_page "${webgl_session}" "() => {
  return (
    document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('#session-visited')?.textContent?.trim() === '1 / 21 visited'
  );
}" "WebGL fallback reload persistence"

run_cli "${shared_session}" open
run_cli "${shared_session}" route "**/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json
run_cli "${shared_session}" goto "${base_url}/?anchor=3&court=C4"
run_cli "${shared_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Mars A0');
  const result = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
    return {
      search: window.location.search,
      pressed: document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed'),
      selected: document.querySelector('#session-selected')?.textContent?.trim(),
      visited: document.querySelector('#session-visited')?.textContent?.trim(),
      court: document.querySelector('#session-court')?.textContent?.trim(),
      health: document.querySelector('#session-api-health')?.textContent?.trim(),
       labels: Array.from(document.querySelectorAll('.measurements dt')).map(item => item.textContent?.trim()),
       storedCourt: stored?.courtPresentationPosition,
       storedSelected: stored?.selectedAnchorId,
      storedVisited: stored?.visitedAnchorIds,
    };
  });
  if (
    result.search !== '?anchor=3' ||
    result.pressed !== 'true' ||
    result.selected !== 'Mars A0 / scale:3' ||
    result.visited !== '1 / 21 visited' ||
    result.court !== 'C0 / Major Pentatonic / local-only' ||
    result.health !== 'Live projection / harmonic-orrery.nodes.v1' ||
    JSON.stringify(result.labels) !== JSON.stringify([
      'State Governor',
      'Tier band',
      'Representative wavelength',
      'Photonic compression (C_P)',
      'Scoped anchor weight (W_A012)',
      'Profile release',
    ]) ||
    result.storedCourt !== 'C0' ||
    result.storedSelected !== 3 ||
    JSON.stringify(result.storedVisited) !== JSON.stringify([3])
  ) {
    throw new Error('Shared URL did not hydrate the expected local session: ' + JSON.stringify(result));
  }

}"
assert_page "${shared_session}" "() => {
  const stored = JSON.parse(window.localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
  const labels = Array.from(document.querySelectorAll('.measurements dt')).map(item => item.textContent?.trim());
  return (
    window.location.search === '?anchor=3' &&
    document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('#session-selected')?.textContent?.trim() === 'Mars A0 / scale:3' &&
    document.querySelector('#session-visited')?.textContent?.trim() === '1 / 21 visited' &&
    document.querySelector('#session-court')?.textContent?.trim() === 'C0 / Major Pentatonic / local-only' &&
    document.querySelector('#session-api-health')?.textContent?.trim() === 'Live projection / harmonic-orrery.nodes.v1' &&
    JSON.stringify(labels) === JSON.stringify([
      'State Governor',
      'Tier band',
      'Representative wavelength',
      'Photonic compression (C_P)',
      'Scoped anchor weight (W_A012)',
      'Profile release',
    ]) &&
    stored?.courtPresentationPosition === 'C0' &&
    stored?.selectedAnchorId === 3 &&
    JSON.stringify(stored?.visitedAnchorIds) === JSON.stringify([3])
  );
}" "shared URL hydration and inspector labels"
run_cli "${shared_session}" run-code "async page => {
  const target = page.locator(\"button[data-state-id='2']\");
  await target.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Moon A0');
  await page.evaluate(() => window.history.replaceState(null, '', window.location.pathname));
}"
run_cli "${shared_session}" reload
run_cli "${shared_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Moon A0');
  const restored = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
    return {
      search: window.location.search,
      pressed: document.querySelector(\"button[data-state-id='2']\")?.getAttribute('aria-pressed'),
       visited: document.querySelector('#session-visited')?.textContent?.trim(),
       court: document.querySelector('#session-court')?.textContent?.trim(),
       storedSelected: stored?.selectedAnchorId,
       storedVisited: stored?.visitedAnchorIds,
       storedCourt: stored?.courtPresentationPosition,
    };
  });
  if (
    restored.search !== '?anchor=2' ||
    restored.pressed !== 'true' ||
    restored.visited !== '2 / 21 visited' ||
    restored.court !== 'C0 / Major Pentatonic / local-only' ||
    restored.storedSelected !== 2 ||
    JSON.stringify(restored.storedVisited) !== JSON.stringify([2, 3]) ||
    restored.storedCourt !== 'C0'
  ) {
    throw new Error('Reload did not restore local exploration progress: ' + JSON.stringify(restored));
  }

  await page.locator(\"button[data-state-id='1']\").focus();
  const firstAnchor = await page.evaluate(() => document.activeElement?.getAttribute('data-state-id'));
  for (let index = 1; index < 21; index += 1) {
    await page.keyboard.press('Tab');
  }
  const lastAnchor = await page.evaluate(() => document.activeElement?.getAttribute('data-state-id'));
  if (firstAnchor !== '1' || lastAnchor !== '207') {
    throw new Error('Anchor index focus order is not complete: ' + JSON.stringify({ firstAnchor, lastAnchor }));
  }
}"
assert_page "${shared_session}" "() => {
  const stored = JSON.parse(window.localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
  return (
    window.location.search === '?anchor=2' &&
    document.querySelector(\"button[data-state-id='2']\")?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('#session-visited')?.textContent?.trim() === '2 / 21 visited' &&
    document.querySelector('#session-court')?.textContent?.trim() === 'C0 / Major Pentatonic / local-only' &&
    stored?.selectedAnchorId === 2 &&
    JSON.stringify(stored?.visitedAnchorIds) === JSON.stringify([2, 3]) &&
    stored?.courtPresentationPosition === 'C0' &&
    document.activeElement?.getAttribute('data-state-id') === '207'
  );
}" "local session reload and anchor focus order"

run_cli "${invalid_link_session}" open
run_cli "${invalid_link_session}" run-code "async page => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'seven-governors.harmonic-orrery.session',
      JSON.stringify({
        schemaVersion: 'harmonic-orrery.session.v1',
        source: {
          nodesSchemaVersion: 'harmonic-orrery.nodes.v1',
          profileRegistryReleaseId: 'canonical-feature-profile-registry:0.1.0',
          harmonicDescriptorReleaseId: 'harmonic-compression-candidate:CH_A012_q_v1:1.0.0',
          harmonicDescriptorFingerprint: 'a'.repeat(64),
        },
        selectedAnchorId: 3,
        visitedAnchorIds: [3],
        courtPresentationPosition: null,
      }),
    );
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'seven-governors.harmonic-orrery.session') {
        throw new DOMException('Local storage quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
}"
run_cli "${invalid_link_session}" route "**/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json
run_cli "${invalid_link_session}" goto "${base_url}/?anchor=999999"
run_cli "${invalid_link_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#api-status')?.dataset.state === 'ready');
}"
assert_page "${invalid_link_session}" "() => {
  return (
    document.querySelector('#inspector-heading')?.textContent?.trim() === 'Choose an anchor' &&
    document.querySelector('#session-selected')?.textContent?.trim() === 'No anchor selected' &&
    document.querySelectorAll('.anchor-button[aria-pressed=true]').length === 0 &&
    document.querySelector('#session-message')?.textContent?.includes('not present in this live projection') &&
    document.querySelector('#session-message')?.textContent?.includes('different projection release') &&
    document.querySelector('#session-message')?.textContent?.includes('could not be saved') &&
    document.querySelector('#clear-link-selection')?.hidden === false
  );
}" "invalid shared link with blocked local storage"
run_cli "${invalid_link_session}" run-code "async page => {
  await page.locator('#clear-link-selection').click();
  await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('anchor'));
}"
assert_page "${invalid_link_session}" "() => {
  return (
    window.location.search === '' &&
    document.querySelector('#inspector-heading')?.textContent?.trim() === 'Choose an anchor' &&
    document.querySelector('#session-message')?.textContent?.includes('Link selection cleared') &&
    document.querySelector('#session-message')?.textContent?.includes('could not be saved') &&
    document.querySelectorAll('.anchor-button[aria-pressed=true]').length === 0 &&
    document.activeElement?.getAttribute('data-state-id') === '1'
  );
}" "invalid shared link recovery with blocked local storage"

run_cli "${stale_session}" open
run_cli "${stale_session}" run-code "async page => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'seven-governors.harmonic-orrery.session',
      JSON.stringify({
        schemaVersion: 'harmonic-orrery.session.v1',
        source: {
          nodesSchemaVersion: 'harmonic-orrery.nodes.v1',
          profileRegistryReleaseId: 'canonical-feature-profile-registry:0.1.0',
          harmonicDescriptorReleaseId: 'harmonic-compression-candidate:CH_A012_q_v1:1.0.0',
          harmonicDescriptorFingerprint: 'a'.repeat(64),
        },
        selectedAnchorId: 3,
        visitedAnchorIds: [3],
        courtPresentationPosition: null,
      }),
    );
    localStorage.setItem('orrery-unrelated', 'preserved');
  });
}"
run_cli "${stale_session}" route "**/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json
run_cli "${stale_session}" goto "${base_url}/"
run_cli "${stale_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#session-message')?.textContent?.includes('different projection release'));
  const reset = await page.evaluate(() => ({
    selected: document.querySelector('#session-selected')?.textContent?.trim(),
    ownStorage: localStorage.getItem('seven-governors.harmonic-orrery.session'),
    unrelatedStorage: localStorage.getItem('orrery-unrelated'),
    message: document.querySelector('#session-message')?.textContent?.trim(),
  }));
  if (
    reset.selected !== 'No anchor selected' ||
    reset.ownStorage !== null ||
    reset.unrelatedStorage !== 'preserved' ||
    !reset.message?.includes('different projection release')
  ) {
    throw new Error('Stale local progress was not safely reset: ' + JSON.stringify(reset));
  }
}"
assert_page "${stale_session}" "() => {
  return (
    document.querySelector('#session-selected')?.textContent?.trim() === 'No anchor selected' &&
    localStorage.getItem('seven-governors.harmonic-orrery.session') === null &&
    localStorage.getItem('orrery-unrelated') === 'preserved' &&
    document.querySelector('#session-message')?.textContent?.includes('different projection release')
  );
}" "stale local session reset"

run_cli "${incompatible_session}" open
run_cli "${incompatible_session}" run-code "async page => {
  await page.addInitScript(() => {
    localStorage.setItem('seven-governors.harmonic-orrery.session', 'preserved-incompatible');
  });
}"
run_cli "${incompatible_session}" route "**/api/nodes" \
  --body '{"schemaVersion":"harmonic-orrery.nodes.v2"}' \
  --content-type application/json
run_cli "${incompatible_session}" goto "${base_url}/"
run_cli "${incompatible_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#api-status')?.textContent?.trim() === 'Projection update required');
  const incompatible = await page.evaluate(() => ({
    apiState: document.querySelector('#api-status')?.dataset.state,
    health: document.querySelector('#session-api-health')?.textContent?.trim(),
    message: document.querySelector('#scene-message')?.textContent?.trim(),
    anchorCount: document.querySelectorAll('#anchor-list .anchor-button').length,
    reloadHidden: document.querySelector('#reload-projection')?.hidden,
    storage: localStorage.getItem('seven-governors.harmonic-orrery.session'),
  }));
  if (
    incompatible.apiState !== 'error' ||
    incompatible.health !== 'Projection update required' ||
    !incompatible.message?.includes('cannot safely read') ||
    incompatible.anchorCount !== 0 ||
    incompatible.reloadHidden !== false ||
    incompatible.storage !== 'preserved-incompatible'
  ) {
    throw new Error('Incompatible projection was not isolated from local state: ' + JSON.stringify(incompatible));
  }
}"
assert_page "${incompatible_session}" "() => {
  return (
    document.querySelector('#api-status')?.dataset.state === 'error' &&
    document.querySelector('#session-api-health')?.textContent?.trim() === 'Projection update required' &&
    document.querySelector('#scene-message')?.textContent?.includes('cannot safely read') &&
    document.querySelectorAll('#anchor-list .anchor-button').length === 0 &&
    document.querySelector('#reload-projection')?.hidden === false &&
    localStorage.getItem('seven-governors.harmonic-orrery.session') === 'preserved-incompatible'
  );
}" "schema-incompatible projection"
run_cli "${incompatible_session}" unroute "**/api/nodes"
run_cli "${incompatible_session}" route "**/api/nodes" \
  --body "${release_fixture_body}" \
  --content-type application/json
run_cli "${incompatible_session}" reload
run_cli "${incompatible_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#api-status')?.textContent?.trim() === 'Projection update required');
  const releaseMismatch = await page.evaluate(() => ({
    message: document.querySelector('#scene-message')?.textContent?.trim(),
    anchorCount: document.querySelectorAll('#anchor-list .anchor-button').length,
    reloadHidden: document.querySelector('#reload-projection')?.hidden,
  }));
  if (
    !releaseMismatch.message?.includes('Unexpected harmonic descriptor release') ||
    releaseMismatch.anchorCount !== 0 ||
    releaseMismatch.reloadHidden !== false
  ) {
    throw new Error('Descriptor release mismatch was not visibly rejected: ' + JSON.stringify(releaseMismatch));
  }
}"
assert_page "${incompatible_session}" "() => {
  return (
    document.querySelector('#scene-message')?.textContent?.includes('Unexpected harmonic descriptor release') &&
    document.querySelectorAll('#anchor-list .anchor-button').length === 0 &&
    document.querySelector('#reload-projection')?.hidden === false &&
    localStorage.getItem('seven-governors.harmonic-orrery.session') === 'preserved-incompatible'
  );
}" "descriptor-release-incompatible projection"

PLAYWRIGHT_MCP_DEVICE="iPhone 15" run_cli "${audio_session}" open
run_cli "${audio_session}" run-code "async page => {
  await page.addInitScript(() => {
    const events = {
      assetFetches: [],
      bufferSources: 0,
      closes: 0,
      contexts: 0,
      frequencies: [],
      resumes: 0,
      suspends: 0,
    };
    window.__orreryAudioEvents = events;

    class FakeAudioParam {
      constructor(kind) {
        this.kind = kind;
      }
      setValueAtTime(value) {
        if (this.kind === 'frequency') {
          events.frequencies.push(value);
        }
      }
      linearRampToValueAtTime() {}
    }

    class FakeAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
    }

    class FakeAudioContext {
      constructor() {
        events.contexts += 1;
        this.currentTime = 1;
        this.destination = new FakeAudioNode();
      }
      createGain() {
        const gain = new FakeAudioNode();
        gain.gain = new FakeAudioParam('gain');
        return gain;
      }
      createOscillator() {
        const oscillator = new FakeAudioNode();
        oscillator.detune = new FakeAudioParam('detune');
        oscillator.frequency = new FakeAudioParam('frequency');
        oscillator.onended = null;
        oscillator.start = () => {};
        oscillator.stop = () => {};
        oscillator.type = 'sine';
        return oscillator;
      }
      createBufferSource() {
        events.bufferSources += 1;
        const source = new FakeAudioNode();
        source.buffer = null;
        source.loop = false;
        source.loopStart = 0;
        source.loopEnd = 0;
        source.onended = null;
        source.start = () => {};
        source.stop = () => {};
        return source;
      }
      decodeAudioData() {
        return Promise.resolve({ duration: 2 });
      }
      resume() {
        events.resumes += 1;
        return Promise.resolve();
      }
      suspend() {
        events.suspends += 1;
        return Promise.resolve();
      }
      close() {
        events.closes += 1;
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext,
      writable: true,
    });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/audio/')) {
        events.assetFetches.push(url);
      }
      return originalFetch(...args);
    };
  });
}"
run_cli "${audio_session}" route "**/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json
run_cli "${audio_session}" goto "${base_url}/?anchor=1"
run_cli "${audio_session}" run-code "async page => {
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Sun A0');
  const initial = await page.evaluate(() => ({
    contexts: window.__orreryAudioEvents.contexts,
    assetFetches: window.__orreryAudioEvents.assetFetches.length,
    frequencies: window.__orreryAudioEvents.frequencies.length,
    enableDisabled: document.querySelector('#audio-enable')?.disabled,
    palette: document.querySelector('#selected-audio-palette')?.textContent?.trim(),
    court: document.querySelector('#session-court')?.textContent?.trim(),
  }));
  if (
    initial.contexts !== 0 ||
    initial.assetFetches !== 0 ||
    initial.frequencies !== 0 ||
    initial.enableDisabled !== false ||
    initial.palette !== 'Sun A0 / Lydian / source {0, 2, 4, 6, 7, 9, 11}' ||
    initial.court !== 'C0 / Major Pentatonic / local-only'
  ) {
    throw new Error('Audio began before an explicit gesture: ' + JSON.stringify(initial));
  }
  await page.locator('[data-court-position=\"C1\"]').tap();
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C1\"]')?.getAttribute('aria-pressed') === 'true');
  const afterCourtSelection = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('seven-governors.harmonic-orrery.session') ?? 'null');
    return {
      contexts: window.__orreryAudioEvents.contexts,
      assetFetches: window.__orreryAudioEvents.assetFetches.length,
      frequencies: window.__orreryAudioEvents.frequencies.length,
      filter: document.querySelector('#selected-court-filter')?.textContent?.trim(),
      storedCourt: stored?.courtPresentationPosition,
    };
  });
  if (
    afterCourtSelection.contexts !== 0 ||
    afterCourtSelection.assetFetches !== 0 ||
    afterCourtSelection.frequencies !== 0 ||
    afterCourtSelection.filter !== 'Court C1 / Scottish Pentatonic / mask 677 retains {0, 2, 7, 9} and suppresses {4, 6, 11}.' ||
    afterCourtSelection.storedCourt !== 'C1'
  ) {
    throw new Error('Court selection began audio or did not expose its filter: ' + JSON.stringify(afterCourtSelection));
  }
}"
assert_page "${audio_session}" "() => {
  return (
    window.__orreryAudioEvents.contexts === 0 &&
    window.__orreryAudioEvents.assetFetches.length === 0 &&
    window.__orreryAudioEvents.frequencies.length === 0 &&
    document.querySelector('#audio-enable')?.disabled === false &&
    window.location.search === '?anchor=1' &&
    document.querySelector('#session-court')?.textContent?.trim() === 'C1 / Scottish Pentatonic / local-only'
  );
}" "no audio before explicit enable or local Court selection"
run_cli "${audio_session}" run-code "async page => {
  await page.locator('#audio-enable').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#audio-pause')?.textContent === 'Pause sound');
  const enabled = await page.evaluate(() => ({
    contexts: window.__orreryAudioEvents.contexts,
    assetFetches: window.__orreryAudioEvents.assetFetches.length,
    frequencies: window.__orreryAudioEvents.frequencies.length,
    resumes: window.__orreryAudioEvents.resumes,
  }));
  if (
    enabled.contexts !== 1 ||
    enabled.assetFetches !== 3 ||
    enabled.frequencies !== 4 ||
    enabled.resumes !== 1
  ) {
    throw new Error('Explicit audio enable did not initialize deterministically: ' + JSON.stringify(enabled));
  }
}"
run_cli "${audio_session}" run-code "async page => {
  const expectedByStateId = {
    1: [0, 2, 7, 9],
    2: [0, 2, 5, 7, 9],
    3: [0, 2, 5, 7, 9],
    4: [0, 2, 5, 7, 9],
    5: [0, 2, 5, 7],
    6: [0, 5, 7],
    7: [0, 5],
  };
  for (const [stateId, expected] of Object.entries(expectedByStateId)) {
    await page.evaluate(() => {
      window.__orreryAudioEvents.frequencies.length = 0;
    });
    const target = page.locator('button[data-state-id=\"' + stateId + '\"]');
    await target.focus();
    await page.keyboard.press('Enter');
    const actual = await page.evaluate(() =>
      window.__orreryAudioEvents.frequencies.map((frequency) => {
        const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
        return ((midi % 12) + 12) % 12;
      }),
    );
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error('Unexpected A0 palette for state ' + stateId + ': ' + JSON.stringify(actual));
    }
  }
  await page.locator('button[data-state-id=\"101\"]').tap();
  await page.waitForFunction(() => document.querySelector('#selected-audio-note')?.textContent?.includes('remains an A1 state'));
}"
assert_page "${audio_session}" "() => {
  return (
    document.querySelector('#selected-audio-palette')?.textContent?.trim() === 'Sun A0 / Lydian / source {0, 2, 4, 6, 7, 9, 11}' &&
    document.querySelector('#selected-audio-note')?.textContent?.includes('remains an A1 state') &&
    Array.from(document.querySelectorAll('.audio-controls button')).every((button) => button.getBoundingClientRect().height >= 44)
  );
}" "all A0 Court-filtered palettes and A1 inheritance"
run_cli "${audio_session}" run-code "async page => {
  await page.evaluate(() => {
    window.__orreryAudioEvents.frequencies.length = 0;
  });
  const c2 = page.locator('[data-court-position=\"C2\"]');
  const bounds = await c2.boundingBox();
  if (!bounds || bounds.height < 44) {
    throw new Error('Court control is not visible for touch input.');
  }
  await c2.tap();
  await page.waitForFunction(() => document.querySelector('[data-court-position=\"C2\"]')?.getAttribute('aria-pressed') === 'true');
  const result = await page.evaluate(() => ({
    contexts: window.__orreryAudioEvents.contexts,
    assetFetches: window.__orreryAudioEvents.assetFetches.length,
    frequencies: window.__orreryAudioEvents.frequencies.map((frequency) => {
      const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
      return ((midi % 12) + 12) % 12;
    }),
    filter: document.querySelector('#selected-court-filter')?.textContent?.trim(),
  }));
  if (
    result.contexts !== 1 ||
    result.assetFetches !== 3 ||
    JSON.stringify(result.frequencies) !== JSON.stringify([0, 2, 7]) ||
    result.filter !== 'Court C2 / Qing Yu / mask 1189 retains {0, 2, 7} and suppresses {4, 6, 9, 11}.'
  ) {
    throw new Error('Court revoicing was not local and filtered: ' + JSON.stringify(result));
  }
}"
assert_page "${audio_session}" "() => {
  return (
    document.querySelector('#session-court')?.textContent?.trim() === 'C2 / Qing Yu / local-only' &&
    document.querySelector('[data-court-position=\"C1\"]')?.disabled === false &&
    document.querySelector('[data-court-position=\"C3\"]')?.disabled === false &&
    document.querySelector('[data-court-position=\"C4\"]')?.disabled === true &&
    document.querySelector('#court-mercury')?.dataset.active === 'true'
  );
}" "touch Court revoicing and C2 Mercury emblem"
run_cli "${audio_session}" run-code "async page => {
  await page.locator('#audio-mute').tap();
  await page.waitForFunction(() => document.querySelector('#audio-mute')?.getAttribute('aria-pressed') === 'true');
  await page.locator('#audio-pause').tap();
  await page.waitForFunction(() => document.querySelector('#audio-pause')?.textContent === 'Resume sound');
  await page.locator('#audio-pause').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#audio-pause')?.textContent === 'Pause sound');
  const volumeControl = page.locator('#audio-volume');
  const volumeBounds = await volumeControl.boundingBox();
  if (!volumeBounds) {
    throw new Error('Audio volume control is not visible for touch input.');
  }
  await volumeControl.tap({ position: { x: volumeBounds.width * 0.2, y: volumeBounds.height / 2 } });
  await page.waitForFunction(() => Number(document.querySelector('#audio-volume')?.value) < 0.4);
  await page.locator('#audio-visual-only').tap();
  await page.waitForFunction(() => document.querySelector('#audio-status')?.textContent?.includes('Visual-only mode is active'));
  const frequencyCount = await page.evaluate(() => window.__orreryAudioEvents.frequencies.length);
  await page.locator('button[data-state-id=\"102\"]').tap();
  const afterSelection = await page.evaluate(() => window.__orreryAudioEvents.frequencies.length);
  if (afterSelection !== frequencyCount) {
    throw new Error('Visual-only mode created a new oscillator event.');
  }
}"
assert_page "${audio_session}" "() => {
  return (
    document.querySelector('#audio-mute')?.getAttribute('aria-pressed') === 'true' &&
    Number(document.querySelector('#audio-volume')?.value) < 0.4 &&
    document.querySelector('#audio-visual-only')?.checked === true &&
    document.querySelector('#audio-enable')?.disabled === true
  );
}" "keyboard and touch audio controls with visual-only suppression"

printf '%s\n' "Orrery browser checks passed."
