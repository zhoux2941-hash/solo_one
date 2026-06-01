#!/usr/bin/env python3
"""
LLM Load Test Python Worker
Standalone entry point for Python worker nodes.
"""

import argparse
import asyncio
import os
import sys

from worker.server import main as server_main
from worker.worker import run_standalone_worker


def main():
    parser = argparse.ArgumentParser(description="LLM Load Test Python Worker")
    parser.add_argument(
        "--mode",
        choices=["server", "standalone"],
        default="standalone",
        help="Run mode: server (managed) or standalone (direct)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("WORKER_PORT", "8001")),
        help="Server port (for server mode)",
    )

    args = parser.parse_args()

    if args.mode == "server":
        os.environ["WORKER_PORT"] = str(args.port)
        server_main()
    else:
        asyncio.run(run_standalone_worker())


if __name__ == "__main__":
    main()
