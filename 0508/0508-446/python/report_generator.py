"""
Report Generator - Generates analysis reports in various formats
"""

import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from .analyzer import AnalysisReport


class ReportGenerator:
    """Generates formatted analysis reports"""

    @staticmethod
    def generate_text_report(report: AnalysisReport) -> str:
        """Generate human-readable text report"""

        lines = []
        lines.append("=" * 80)
        lines.append("WIRESHARK PLUGIN SUITE - ANALYSIS REPORT")
        lines.append("=" * 80)
        lines.append("")

        lines.append(f"File: {report.filename}")
        lines.append(f"Analysis Start: {datetime.fromtimestamp(report.analysis_start_time)}")
        lines.append(f"Analysis End: {datetime.fromtimestamp(report.analysis_end_time)}")
        lines.append(f"Duration: {report.analysis_end_time - report.analysis_start_time:.2f} seconds")
        lines.append("")

        lines.append("-" * 80)
        lines.append("GLOBAL STATISTICS")
        lines.append("-" * 80)
        lines.append(f"Total Packets: {report.total_packets_processed:,}")
        lines.append(f"Total Bytes: {self._format_bytes(report.total_bytes_processed)}")
        lines.append(f"Total Sessions: {report.total_sessions:,}")
        lines.append("")

        if report.global_anomalies:
            lines.append("!" * 80)
            lines.append("GLOBAL ANOMALIES")
            lines.append("!" * 80)
            for anomaly in report.global_anomalies:
                lines.append(f"  [ANOMALY] {anomaly}")
            lines.append("")

        for proto_name, stats in sorted(report.protocol_stats.items()):
            lines.append("=" * 80)
            lines.append(f"PROTOCOL: {proto_name}")
            lines.append("=" * 80)
            lines.append(f"Packets: {stats.total_packets:,}")
            lines.append(f"Bytes: {self._format_bytes(stats.total_bytes)}")
            lines.append(f"Sessions: {stats.total_sessions:,}")
            
            if stats.total_packets > 0:
                lines.append(f"Packets/Session: {stats.total_packets / stats.total_sessions:.2f}")
                lines.append(f"Bytes/Packet: {stats.total_bytes / stats.total_packets:.2f}")
            lines.append("")

            if stats.top_field_values:
                lines.append("-" * 40)
                lines.append("TOP 10 FIELD VALUES")
                lines.append("-" * 40)
                
                current_field = None
                for key, count in sorted(stats.top_field_values.items(), 
                                        key=lambda x: x[1], reverse=True)[:10]:
                    field_name, value = key.rsplit(':', 1)
                    if field_name != current_field:
                        lines.append(f"  {field_name}:")
                        current_field = field_name
                    lines.append(f"    {value}: {count} times")
                lines.append("")

            if stats.anomalies:
                lines.append("!" * 40)
                lines.append("ANOMALIES")
                lines.append("!" * 40)
                for anomaly in stats.anomalies[:20]:
                    lines.append(f"  [ANOMALY] {anomaly}")
                if len(stats.anomalies) > 20:
                    lines.append(f"  ... and {len(stats.anomalies) - 20} more anomalies")
                lines.append("")

            if stats.warnings:
                lines.append("*" * 40)
                lines.append("WARNINGS")
                lines.append("*" * 40)
                for warning in stats.warnings[:20]:
                    lines.append(f"  [WARNING] {warning}")
                if len(stats.warnings) > 20:
                    lines.append(f"  ... and {len(stats.warnings) - 20} more warnings")
                lines.append("")

        lines.append("=" * 80)
        lines.append("END OF REPORT")
        lines.append("=" * 80)

        return "\n".join(lines)

    @staticmethod
    def generate_json_report(report: AnalysisReport, pretty: bool = True) -> str:
        """Generate JSON format report"""

        data = report.to_dict()
        indent = 2 if pretty else None
        return json.dumps(data, indent=indent, default=str)

    @staticmethod
    def generate_csv_report(report: AnalysisReport, output_dir: str) -> List[str]:
        """Generate CSV format reports (multiple files)"""

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        files = []

        summary_file = output_path / "summary.csv"
        with open(summary_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'filename', 'total_packets', 'total_bytes', 'total_sessions',
                'duration_seconds', 'start_time', 'end_time'
            ])
            writer.writerow([
                report.filename,
                report.total_packets_processed,
                report.total_bytes_processed,
                report.total_sessions,
                report.analysis_end_time - report.analysis_start_time,
                datetime.fromtimestamp(report.analysis_start_time).isoformat(),
                datetime.fromtimestamp(report.analysis_end_time).isoformat()
            ])
        files.append(str(summary_file))

        proto_file = output_path / "protocols.csv"
        with open(proto_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'protocol', 'packets', 'bytes', 'sessions',
                'anomalies_count', 'warnings_count'
            ])
            for proto_name, stats in report.protocol_stats.items():
                writer.writerow([
                    proto_name,
                    stats.total_packets,
                    stats.total_bytes,
                    stats.total_sessions,
                    len(stats.anomalies),
                    len(stats.warnings)
                ])
        files.append(str(proto_file))

        anomalies_file = output_path / "anomalies.csv"
        with open(anomalies_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['protocol', 'type', 'message'])
            for anomaly in report.global_anomalies:
                writer.writerow(['GLOBAL', 'anomaly', anomaly])
            for proto_name, stats in report.protocol_stats.items():
                for anomaly in stats.anomalies:
                    writer.writerow([proto_name, 'anomaly', anomaly])
                for warning in stats.warnings:
                    writer.writerow([proto_name, 'warning', warning])
        files.append(str(anomalies_file))

        top_values_file = output_path / "top_field_values.csv"
        with open(top_values_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['protocol', 'field_name', 'value', 'count'])
            for proto_name, stats in report.protocol_stats.items():
                for key, count in sorted(stats.top_field_values.items(), 
                                        key=lambda x: x[1], reverse=True):
                    field_name, value = key.rsplit(':', 1)
                    writer.writerow([proto_name, field_name, value, count])
        files.append(str(top_values_file))

        return files

    @staticmethod
    def generate_html_report(report: AnalysisReport) -> str:
        """Generate HTML format report"""

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wireshark Plugin Suite - Analysis Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        h1 {{ color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 10px; }}
        h2 {{ color: #0078d4; margin-top: 30px; }}
        h3 {{ color: #555; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
        .summary-card {{ background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #0078d4; }}
        .summary-card .label {{ font-size: 0.9em; color: #666; }}
        .summary-card .value {{ font-size: 1.5em; font-weight: bold; color: #0078d4; }}
        .anomaly {{ background: #fde7e9; padding: 10px; margin: 5px 0; border-left: 4px solid #d13438; border-radius: 4px; }}
        .warning {{ background: #fff4ce; padding: 10px; margin: 5px 0; border-left: 4px solid #ffc620; border-radius: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #0078d4; color: white; }}
        tr:hover {{ background-color: #f5f5f5; }}
        .protocol-section {{ margin: 30px 0; padding: 20px; background: #fafafa; border-radius: 8px; }}
        .top-values {{ columns: 2; column-gap: 20px; }}
        .top-value-item {{ break-inside: avoid; padding: 8px; background: #f0f7ff; margin: 5px 0; border-radius: 4px; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 6px; overflow-x: auto; }}
    </style>
</head>
<body>
<div class="container">
    <h1>📊 Wireshark Plugin Suite - Analysis Report</h1>
    
    <h2>📋 Summary</h2>
    <p><strong>File:</strong> {report.filename}</p>
    <p><strong>Start Time:</strong> {datetime.fromtimestamp(report.analysis_start_time)}</p>
    <p><strong>End Time:</strong> {datetime.fromtimestamp(report.analysis_end_time)}</p>
    <p><strong>Duration:</strong> {report.analysis_end_time - report.analysis_start_time:.2f} seconds</p>
    
    <div class="summary">
        <div class="summary-card">
            <div class="label">Total Packets</div>
            <div class="value">{report.total_packets_processed:,}</div>
        </div>
        <div class="summary-card">
            <div class="label">Total Bytes</div>
            <div class="value">{ReportGenerator._format_bytes(report.total_bytes_processed)}</div>
        </div>
        <div class="summary-card">
            <div class="label">Total Sessions</div>
            <div class="value">{report.total_sessions:,}</div>
        </div>
    </div>
"""

        if report.global_anomalies:
            html += """
    <h2>⚠️ Global Anomalies</h2>
"""
            for anomaly in report.global_anomalies:
                html += f'    <div class="anomaly">🚨 {anomaly}</div>\n'

        for proto_name, stats in sorted(report.protocol_stats.items()):
            html += f"""
    <div class="protocol-section">
        <h2>🔌 Protocol: {proto_name}</h2>
        
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Packets</td><td>{stats.total_packets:,}</td></tr>
            <tr><td>Bytes</td><td>{ReportGenerator._format_bytes(stats.total_bytes)}</td></tr>
            <tr><td>Sessions</td><td>{stats.total_sessions:,}</td></tr>
"""
            if stats.total_sessions > 0:
                html += f'            <tr><td>Packets/Session</td><td>{stats.total_packets / stats.total_sessions:.2f}</td></tr>\n'
            if stats.total_packets > 0:
                html += f'            <tr><td>Bytes/Packet</td><td>{stats.total_bytes / stats.total_packets:.2f}</td></tr>\n'
            html += f"""
            <tr><td>Anomalies</td><td style="color: {'red' if stats.anomalies else 'green'}">{len(stats.anomalies)}</td></tr>
            <tr><td>Warnings</td><td style="color: {'orange' if stats.warnings else 'green'}">{len(stats.warnings)}</td></tr>
        </table>
"""

            if stats.top_field_values:
                html += f"""
        <h3>🏆 Top 10 Field Values</h3>
        <div class="top-values">
"""
                for key, count in sorted(stats.top_field_values.items(), 
                                        key=lambda x: x[1], reverse=True)[:10]:
                    field_name, value = key.rsplit(':', 1)
                    html += f'            <div class="top-value-item"><strong>{field_name}</strong> = {value}: {count} times</div>\n'
                html += "        </div>\n"

            if stats.anomalies:
                html += f"        <h3>🚨 Anomalies ({len(stats.anomalies)})</h3>\n"
                for anomaly in stats.anomalies[:15]:
                    html += f'        <div class="anomaly">{anomaly}</div>\n'
                if len(stats.anomalies) > 15:
                    html += f'        <p>... and {len(stats.anomalies) - 15} more anomalies</p>\n'

            if stats.warnings:
                html += f"        <h3>⚠️ Warnings ({len(stats.warnings)})</h3>\n"
                for warning in stats.warnings[:15]:
                    html += f'        <div class="warning">{warning}</div>\n'
                if len(stats.warnings) > 15:
                    html += f'        <p>... and {len(stats.warnings) - 15} more warnings</p>\n'

            html += "    </div>\n"

        html += """
</div>
</body>
</html>
"""
        return html

    @staticmethod
    def save_report(report: AnalysisReport, output_path: str, 
                   format: str = 'text') -> Optional[str]:
        """Save report to file in specified format"""

        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        if format == 'text':
            content = ReportGenerator.generate_text_report(report)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return str(path)

        elif format == 'json':
            content = ReportGenerator.generate_json_report(report)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return str(path)

        elif format == 'html':
            content = ReportGenerator.generate_html_report(report)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return str(path)

        elif format == 'csv':
            files = ReportGenerator.generate_csv_report(report, str(path))
            return str(path)

        else:
            raise ValueError(f"Unknown format: {format}")

    @staticmethod
    def _format_bytes(num_bytes: int) -> str:
        """Format bytes to human-readable string"""
        if num_bytes < 1024:
            return f"{num_bytes} B"
        elif num_bytes < 1024 * 1024:
            return f"{num_bytes / 1024:.2f} KB"
        elif num_bytes < 1024 * 1024 * 1024:
            return f"{num_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{num_bytes / (1024 * 1024 * 1024):.2f} GB"
