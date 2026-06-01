#!/usr/bin/env python3
"""
Wireshark Plugin Suite Command Line Interface
"""

import argparse
import sys
import os
import json
from pathlib import Path

from .protocol_description import ProtocolDescription
from .lua_generator import LuaPluginGenerator
from .plugin_manager import PluginManager
from .analyzer import PcapAnalyzer
from .report_generator import ReportGenerator


def cmd_generate(args):
    """Generate Wireshark Lua plugin from JSON protocol description"""
    print(f"Generating plugin from: {args.input}")
    
    try:
        protocol = ProtocolDescription.from_json_file(args.input)
        protocol.validate()
        
        generator = LuaPluginGenerator()
        lua_code = generator.generate(protocol)
        
        output_path = args.output
        if not output_path:
            output_path = f"{protocol.short_name}.lua"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(lua_code)
        
        print(f"✅ Plugin generated successfully: {output_path}")
        print(f"   Protocol: {protocol.display_name}")
        print(f"   Fields: {len(protocol.fields)}")
        
        if args.install:
            manager = PluginManager()
            installed_path = manager.install_plugin(output_path)
            print(f"✅ Plugin installed to: {installed_path}")
            
    except Exception as e:
        print(f"❌ Error generating plugin: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_install(args):
    """Install a Lua plugin to Wireshark plugins directory"""
    print(f"Installing plugin: {args.plugin}")
    
    try:
        manager = PluginManager()
        path = manager.install_plugin(args.plugin)
        print(f"✅ Plugin installed successfully: {path}")
    except Exception as e:
        print(f"❌ Error installing plugin: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_uninstall(args):
    """Uninstall a Wireshark plugin"""
    print(f"Uninstalling plugin: {args.name}")
    
    try:
        manager = PluginManager()
        manager.uninstall_plugin(args.name)
        print(f"✅ Plugin uninstalled successfully")
    except Exception as e:
        print(f"❌ Error uninstalling plugin: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_list(args):
    """List all installed Wireshark plugins"""
    try:
        manager = PluginManager()
        plugins = manager.list_plugins()
        
        if not plugins:
            print("No plugins installed")
            return
        
        print(f"Found {len(plugins)} plugin(s):")
        print("-" * 60)
        for i, plugin in enumerate(plugins, 1):
            print(f"{i}. {plugin['name']}")
            print(f"   Path: {plugin['path']}")
            print(f"   Size: {plugin['size']} bytes")
            if 'modified' in plugin:
                print(f"   Modified: {plugin['modified']}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing plugins: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_validate(args):
    """Validate a protocol description JSON file"""
    print(f"Validating: {args.input}")
    
    try:
        protocol = ProtocolDescription.from_json_file(args.input)
        errors = protocol.validate()
        
        if errors:
            print(f"❌ Validation failed with {len(errors)} error(s):")
            for error in errors:
                print(f"   - {error}")
            sys.exit(1)
        else:
            print("✅ Protocol description is valid")
            print(f"   Name: {protocol.display_name}")
            print(f"   Fields: {len(protocol.fields)}")
            if protocol.heuristic_rules:
                print(f"   Heuristic rules: {len(protocol.heuristic_rules)}")
            
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Validation error: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_analyze(args):
    """Analyze pcap file and generate statistics report"""
    print(f"Analyzing pcap file: {args.pcap}")
    print(f"Using protocol: {args.protocol}")
    
    try:
        protocol = ProtocolDescription.from_json_file(args.protocol)
        protocol.validate()
        
        analyzer = PcapAnalyzer(num_threads=args.threads)
        analyzer.register_protocol(protocol)
        
        print(f"Starting analysis with {args.threads} thread(s)...")
        
        def progress_callback(packets, bytes_read, percent):
            if packets % 10000 == 0 and packets > 0:
                print(f"\rProcessed {packets:,} packets, {bytes_read:,} bytes ({percent:.1f}%)", end='')
        
        report = analyzer.analyze_file(
            args.pcap,
            use_heuristic=args.heuristic,
            progress_callback=progress_callback
        )
        
        print(f"\n✅ Analysis complete!")
        print(f"   Total packets: {report.total_packets_processed:,}")
        print(f"   Total bytes: {report.total_bytes_processed:,}")
        print(f"   Protocols detected: {len(report.protocol_stats)}")
        
        report_gen = ReportGenerator()
        
        output_base = args.output or os.path.splitext(args.pcap)[0] + "_report"
        
        if args.format == 'text' or args.format == 'all':
            text_report = report_gen.generate_text_report(report)
            with open(f"{output_base}.txt", 'w', encoding='utf-8') as f:
                f.write(text_report)
            print(f"   Text report: {output_base}.txt")
        
        if args.format == 'json' or args.format == 'all':
            json_report = report_gen.generate_json_report(report)
            with open(f"{output_base}.json", 'w', encoding='utf-8') as f:
                f.write(json_report)
            print(f"   JSON report: {output_base}.json")
        
        if args.format == 'html' or args.format == 'all':
            html_report = report_gen.generate_html_report(report)
            with open(f"{output_base}.html", 'w', encoding='utf-8') as f:
                f.write(html_report)
            print(f"   HTML report: {output_base}.html")
        
        if args.format == 'csv' or args.format == 'all':
            csv_files = report_gen.generate_csv_report(report, output_base)
            print(f"   CSV files: {', '.join(os.path.basename(f) for f in csv_files)}")
        
        total_anomalies = sum(
            len(proto.anomalies) 
            for proto in report.protocol_stats.values()
        ) + len(report.global_anomalies)
        
        if total_anomalies > 0:
            print(f"\n⚠️  Detected {total_anomalies} anomalies")
        else:
            print(f"\n✅ No anomalies detected")
            
    except Exception as e:
        print(f"❌ Analysis error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


def cmd_test(args):
    """Test a generated plugin with tshark"""
    print(f"Testing plugin: {args.plugin}")
    
    try:
        manager = PluginManager()
        result = manager.test_plugin(args.plugin, args.pcap)
        
        if result['success']:
            print("✅ Plugin test passed!")
            if 'packets' in result:
                print(f"   Packets parsed: {result['packets']}")
            if 'output' in result and args.verbose:
                print("\nOutput:")
                print(result['output'])
        else:
            print("❌ Plugin test failed")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test error: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_template(args):
    """Generate a template JSON protocol description file"""
    output_path = args.output or "protocol_template.json"
    
    template = {
        "name": "my_protocol",
        "display_name": "My Custom Protocol",
        "short_name": "myproto",
        "default_port_tcp": 1234,
        "default_port_udp": 1234,
        "requires_reassembly": True,
        "reassembly_timeout_ms": 5000,
        "handshake_fields": ["msg_type", "version"],
        "fields": [
            {
                "name": "version",
                "display_name": "Protocol Version",
                "type": "uint8",
                "byte_order": "big_endian",
                "offset": 0,
                "length": 1,
                "description": "Protocol version number",
                "valid_values": [1, 2]
            },
            {
                "name": "msg_type",
                "display_name": "Message Type",
                "type": "uint8",
                "byte_order": "big_endian",
                "offset": 1,
                "length": 1,
                "valid_values": [1, 2, 3, 4]
            },
            {
                "name": "length",
                "display_name": "Payload Length",
                "type": "uint16",
                "byte_order": "big_endian",
                "offset": 2,
                "length": 2
            },
            {
                "name": "payload",
                "display_name": "Payload Data",
                "type": "variable",
                "is_variable_length": True,
                "length_field": "length",
                "depends_on_field": "msg_type",
                "depends_on_condition": "== 2"
            },
            {
                "name": "src_ip",
                "display_name": "Source IP",
                "type": "ipv4",
                "offset": 4,
                "length": 4
            },
            {
                "name": "src_mac",
                "display_name": "Source MAC",
                "type": "mac",
                "offset": 8,
                "length": 6
            }
        ],
        "heuristic_rules": [
            {
                "type": "fixed_bytes",
                "name": "Magic number",
                "offset": 0,
                "expected_bytes": [170, 187],
                "weight": 3.0
            },
            {
                "type": "port_range",
                "name": "Default port",
                "port_min": 1234,
                "port_max": 1234,
                "weight": 2.0
            },
            {
                "type": "entropy_range",
                "name": "Encrypted payload",
                "offset": 10,
                "entropy_min": 7.0,
                "entropy_max": 8.0,
                "weight": 1.0
            }
        ]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(template, f, indent=2)
    
    print(f"✅ Template generated: {output_path}")
    print("   Edit this file to describe your protocol, then run:")
    print(f"   wps generate {output_path}")


def main():
    parser = argparse.ArgumentParser(
        prog='wps',
        description='Wireshark Plugin Suite - Custom Protocol Analysis Toolkit',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a protocol description template
  wps template -o my_protocol.json
  
  # Generate plugin from protocol description
  wps generate my_protocol.json -o my_protocol.lua --install
  
  # Analyze pcap file
  wps analyze capture.pcap -p my_protocol.json -f html
  
  # List installed plugins
  wps list
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate Lua plugin from JSON')
    gen_parser.add_argument('input', help='Input JSON protocol description file')
    gen_parser.add_argument('-o', '--output', help='Output Lua file path')
    gen_parser.add_argument('--install', action='store_true', help='Install plugin after generation')
    gen_parser.set_defaults(func=cmd_generate)
    
    # Install command
    inst_parser = subparsers.add_parser('install', help='Install a Lua plugin')
    inst_parser.add_argument('plugin', help='Path to Lua plugin file')
    inst_parser.set_defaults(func=cmd_install)
    
    # Uninstall command
    uninst_parser = subparsers.add_parser('uninstall', help='Uninstall a plugin')
    uninst_parser.add_argument('name', help='Plugin name (e.g., myproto.lua)')
    uninst_parser.set_defaults(func=cmd_uninstall)
    
    # List command
    list_parser = subparsers.add_parser('list', help='List installed plugins')
    list_parser.set_defaults(func=cmd_list)
    
    # Validate command
    val_parser = subparsers.add_parser('validate', help='Validate protocol description')
    val_parser.add_argument('input', help='Input JSON protocol description file')
    val_parser.set_defaults(func=cmd_validate)
    
    # Analyze command
    ana_parser = subparsers.add_parser('analyze', help='Analyze pcap file')
    ana_parser.add_argument('pcap', help='Input pcap file')
    ana_parser.add_argument('-p', '--protocol', required=True, help='Protocol description JSON')
    ana_parser.add_argument('-o', '--output', help='Output report base name')
    ana_parser.add_argument('-f', '--format', default='text', 
                          choices=['text', 'json', 'html', 'csv', 'all'],
                          help='Report format')
    ana_parser.add_argument('-t', '--threads', type=int, default=0,
                          help='Number of threads (0=auto)')
    ana_parser.add_argument('--no-heuristic', action='store_true',
                          help='Disable heuristic detection')
    ana_parser.set_defaults(func=cmd_analyze)
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Test plugin with tshark')
    test_parser.add_argument('plugin', help='Path to Lua plugin')
    test_parser.add_argument('--pcap', help='Test pcap file')
    test_parser.add_argument('-v', '--verbose', action='store_true', help='Show detailed output')
    test_parser.set_defaults(func=cmd_test)
    
    # Template command
    tmpl_parser = subparsers.add_parser('template', help='Generate protocol description template')
    tmpl_parser.add_argument('-o', '--output', help='Output JSON file path')
    tmpl_parser.set_defaults(func=cmd_template)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == 'analyze':
        args.heuristic = not args.no_heuristic
        if args.threads == 0:
            args.threads = os.cpu_count() or 4
    
    args.func(args)


if __name__ == '__main__':
    main()
