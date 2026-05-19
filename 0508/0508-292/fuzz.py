#!/usr/bin/env python3
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src import Fuzzer, ParallelFuzzer, WebUI


def main():
    parser = argparse.ArgumentParser(
        description='Coverage-Guided Fuzzer - Similar to AFL/libFuzzer'
    )
    
    parser.add_argument(
        'target',
        help='Path to the target program to fuzz'
    )
    
    parser.add_argument(
        '-c', '--corpus',
        default='corpus',
        help='Directory to store corpus files (default: corpus)'
    )
    
    parser.add_argument(
        '-o', '--crashes',
        default='crashes',
        help='Directory to store crash files (default: crashes)'
    )
    
    parser.add_argument(
        '-d', '--dict',
        default=None,
        help='Path to dictionary file for mutations'
    )
    
    parser.add_argument(
        '-t', '--timeout',
        type=int,
        default=5,
        help='Timeout per execution in seconds (default: 5)'
    )
    
    parser.add_argument(
        '-j', '--jobs',
        type=int,
        default=None,
        help='Number of parallel worker processes (default: CPU count - 1)'
    )
    
    parser.add_argument(
        '--web-port',
        type=int,
        default=5000,
        help='Port for the web UI (default: 5000)'
    )
    
    parser.add_argument(
        '--no-web',
        action='store_true',
        help='Disable the web UI'
    )
    
    parser.add_argument(
        '--mem-limit',
        type=int,
        default=1024,
        help='Memory limit for fuzzer in MB (default: 1024)'
    )
    
    parser.add_argument(
        '--max-corpus',
        type=int,
        default=10000,
        help='Maximum number of seeds in corpus (default: 10000)'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.target):
        print(f"Error: Target program '{args.target}' not found")
        sys.exit(1)
    
    print("=" * 60)
    print("Coverage-Guided Fuzzer")
    print("=" * 60)
    print(f"Target: {args.target}")
    print(f"Corpus directory: {args.corpus}")
    print(f"Crashes directory: {args.crashes}")
    if args.dict:
        print(f"Dictionary: {args.dict}")
    print(f"Timeout: {args.timeout}s")
    print(f"Memory limit: {args.mem_limit} MB")
    print(f"Max corpus size: {args.max_corpus}")
    if args.jobs:
        print(f"Workers: {args.jobs}")
    print("=" * 60)
    
    web_ui = None
    fuzzer = None
    
    def status_callback(status):
        if web_ui:
            web_ui.emit_status(status)
            web_ui.emit_crashes(fuzzer.get_crashes())
        
        execs = status['total_execs'] if isinstance(status, dict) else status.total_execs
        exec_per_sec = status['execs_per_sec'] if isinstance(status, dict) else status.execs_per_sec
        coverage = status['coverage_count'] if isinstance(status, dict) else status.coverage_count
        crashes = status['crashes_found'] if isinstance(status, dict) else status.crashes_found
        corpus = status['corpus_size'] if isinstance(status, dict) else status.corpus_size
        
        print(
            f"\rExecs: {execs:,} | Speed: {exec_per_sec:.1f}/s | "
            f"Coverage: {coverage} | Corpus: {corpus} | Crashes: {crashes}",
            end=''
        )
    
    try:
        if args.jobs and args.jobs > 1:
            fuzzer = ParallelFuzzer(
                target_path=args.target,
                corpus_dir=args.corpus,
                crashes_dir=args.crashes,
                dict_path=args.dict,
                timeout=args.timeout,
                num_workers=args.jobs,
                mem_limit=args.mem_limit,
                max_corpus_size=args.max_corpus
            )
            
            if not args.no_web:
                web_ui = WebUI(port=args.web_port)
                web_ui.set_fuzzer(fuzzer)
                web_ui.run_in_background()
                print(f"Web UI running at http://localhost:{args.web_port}")
            
            print("\nStarting parallel fuzzing... (Press Ctrl+C to stop)\n")
            fuzzer.start(status_callback=status_callback)
            
            while True:
                import time
                time.sleep(1)
        
        else:
            fuzzer = Fuzzer(
                target_path=args.target,
                corpus_dir=args.corpus,
                crashes_dir=args.crashes,
                dict_path=args.dict,
                timeout=args.timeout,
                mem_limit=args.mem_limit,
                max_corpus_size=args.max_corpus
            )
            
            if not args.no_web:
                web_ui = WebUI(port=args.web_port)
                web_ui.set_fuzzer(fuzzer)
                web_ui.run_in_background()
                print(f"Web UI running at http://localhost:{args.web_port}")
            
            print("\nStarting fuzzing... (Press Ctrl+C to stop)\n")
            fuzzer.fuzz_loop(status_callback=status_callback)
    
    except KeyboardInterrupt:
        print("\n\nFuzzing stopped by user")
        if hasattr(fuzzer, 'stop'):
            fuzzer.stop()
        
        status = fuzzer.get_status()
        
        print("=" * 60)
        print("Fuzzing Summary")
        print("=" * 60)
        
        if isinstance(status, dict):
            print(f"Total executions: {status['total_execs']:,}")
            print(f"Average speed: {status['execs_per_sec']:.1f} exec/s")
            print(f"Edges covered: {status['coverage_count']}")
            print(f"Corpus size: {status['corpus_size']}")
            print(f"Crashes found: {status['crashes_found']}")
            print(f"Hangs found: {status['hangs_found']}")
        else:
            print(f"Total executions: {status.total_execs:,}")
            print(f"Average speed: {status.execs_per_sec:.1f} exec/s")
            print(f"Edges covered: {status.coverage_count}")
            print(f"Corpus size: {status.corpus_size}")
            print(f"Crashes found: {status.crashes_found}")
            print(f"Hangs found: {status.hangs_found}")
        
        print("=" * 60)


if __name__ == '__main__':
    main()
