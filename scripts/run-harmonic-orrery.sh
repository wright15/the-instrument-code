#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
venv_dir="${ORRERY_VENV:-"${root_dir}/.venv"}"
python_bin="${venv_dir}/bin/python"

if [[ ! -x "${python_bin}" ]]; then
  python3 -m venv "${venv_dir}"
fi

if ! "${python_bin}" -c "import fastapi, neo4j, uvicorn" >/dev/null 2>&1; then
  "${python_bin}" -m pip install -r "${root_dir}/requirements-orrery.txt"
fi

if [[ ! -f "${root_dir}/.env" ]]; then
  printf '%s\n' "Missing ${root_dir}/.env. Copy .env.example and set the Neo4j credentials."
  exit 1
fi

exec "${python_bin}" -m uvicorn main:app \
  --app-dir "${root_dir}" \
  --env-file "${root_dir}/.env" \
  --host "${ORRERY_HOST:-127.0.0.1}" \
  --port "${ORRERY_PORT:-8000}" \
  "$@"
