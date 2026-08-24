#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
venv_dir="${ORRERY_VENV:-"${root_dir}/.venv"}"
python_bin="${venv_dir}/bin/python"

if [[ ! -x "${python_bin}" ]]; then
  python3 -m venv "${venv_dir}"
fi

if ! "${python_bin}" -c "import fastapi, neo4j, pytest, jsonschema" >/dev/null 2>&1; then
  "${python_bin}" -m pip install -r "${root_dir}/requirements-orrery-dev.txt"
fi

exec "${python_bin}" -m pytest -p no:cacheprovider -q \
  "${root_dir}/tests/test_harmonic_orrery_api.py" \
  "$@"
