#!/usr/bin/env bash
# ORRERY-NAV-1 Playwright runner: Vite + read-only routes + injected probe.
# Zero orrery writes; the Vite cache is gitignored. Cleanup is PID-scoped.
set -euo pipefail

scratch="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo="/home/erick/projects/integrated-release"
frontend="${repo}/orrery"
cli="${frontend}/node_modules/.bin/playwright-cli"
vite="${frontend}/node_modules/.bin/vite"
port="${ORRERY_NAV_VITE_PORT:-4199}"
base_url="http://127.0.0.1:${port}"
probe_js="${1:?usage: orrery_nav_run.sh <probe.js> <out.json>}"
out_log="${2:?usage: orrery_nav_run.sh <probe.js> <out.json>}"

session="orrery-nav-$$-${RANDOM}"
vite_pid=""

cleanup() {
  "${cli}" -s="${session}" close >/dev/null 2>&1 || true
  if [[ -n "${vite_pid}" ]]; then
    kill "${vite_pid}" >/dev/null 2>&1 || true
    wait "${vite_pid}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

(
  cd "${frontend}"
  exec "${vite}" --host 127.0.0.1 --port "${port}" --strictPort
) >/tmp/opencode/orrery_nav_vite.log 2>&1 &
vite_pid="$!"

for ((attempt = 0; attempt < 120; attempt += 1)); do
  if curl --fail --silent --output /dev/null "${base_url}/"; then
    break
  fi
  sleep 0.1
done
if ! curl --fail --silent --output /dev/null "${base_url}/"; then
  printf '%s\n' "Timed out waiting for Orrery Vite server at ${base_url}."
  exit 1
fi

fixture_body="$(node "${frontend}/test/fixtures/nodes-response.mjs")"

run_cli() {
  "${cli}" -s="${session}" "$@"
}

run_cli open >/dev/null
run_cli run-code --filename "${scratch}/bridge_init.js" >/dev/null
run_cli route "${base_url}/api/nodes" \
  --body "${fixture_body}" \
  --content-type application/json >/dev/null
run_cli route "**/@fs/**/twin-hub-convergence-v0.json" \
  --body "$(cat "${repo}/canonical/fivefold-incubator/twin-hub-convergence-v0.json")" \
  --content-type application/json >/dev/null
run_cli goto "${base_url}/?anchor=1387" >/dev/null
run_cli run-code --filename "${probe_js}" >/dev/null
run_cli --raw eval "() => window.__orreryNavLog" > "${out_log}"

python3 - "${out_log}" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    log = json.load(handle)
if isinstance(log, str):
    log = json.loads(log)
if not log.get("allPass"):
    print("ORRERY-NAV PROBE FAILED:", json.dumps(log)[:4000])
    raise SystemExit(1)
print(
    "ORRERY-NAV PROBE OK: "
    f"steps={len(log.get('steps', []))} "
    f"consoleErrors={len(log.get('consoleErrors', []))} "
    f"pageErrors={len(log.get('pageErrors', []))}"
)
PY
