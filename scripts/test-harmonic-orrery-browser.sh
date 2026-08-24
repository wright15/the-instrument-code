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
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/orrery-browser.XXXXXX")"
api_session="orrery-api-unavailable-$$"
webgl_session="orrery-webgl-unavailable-$$"
vite_pid=""

cleanup() {
  "${cli}" -s="${api_session}" close >/dev/null 2>&1 || true
  "${cli}" -s="${webgl_session}" close >/dev/null 2>&1 || true

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

run_cli "${api_session}" open
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
  }));
  if (
    result.apiState !== 'error' ||
    result.apiText !== 'Projection unavailable' ||
    result.messageState !== 'error' ||
    !result.messageText?.includes('Anchor projection request failed (503)') ||
    result.canvasHidden !== true ||
    result.anchorCount !== 0
  ) {
    throw new Error('Unexpected API-unavailable state: ' + JSON.stringify(result));
  }
}"

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

  const target = page.locator(\"button[data-state-id='3']\");
  await target.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#inspector-heading')?.textContent === 'Mars A0');

  const selection = await page.evaluate(() => ({
    activeStateId: document.activeElement?.getAttribute('data-state-id'),
    pressed: document.querySelector(\"button[data-state-id='3']\")?.getAttribute('aria-pressed'),
    heading: document.querySelector('#inspector-heading')?.textContent,
    identity: document.querySelector('#selected-identity')?.textContent,
  }));
  if (
    selection.activeStateId !== '3' ||
    selection.pressed !== 'true' ||
    selection.heading !== 'Mars A0' ||
    selection.identity !== 'scale:3 / A0 / 7-35'
  ) {
    throw new Error('Keyboard selection did not update the fallback index: ' + JSON.stringify(selection));
  }
}"

printf '%s\n' "Orrery browser fallback checks passed."
