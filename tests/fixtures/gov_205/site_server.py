from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import time


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--mode", required=True)
    parser.add_argument("--status", type=int, required=True)
    parser.add_argument("--body", required=True)
    parser.add_argument("--delay", type=float, required=True)
    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    if arguments.mode == "early_exit":
        raise SystemExit(3)
    if arguments.mode == "delayed_start":
        time.sleep(arguments.delay)

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if arguments.mode == "delayed_response":
                time.sleep(arguments.delay)
            body = arguments.body.encode("utf-8")
            self.send_response(arguments.status)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format: str, *args: object) -> None:
            return

    HTTPServer(("127.0.0.1", arguments.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
