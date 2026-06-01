"""
Wireshark Plugin Suite - Python API

This module provides Python bindings and management tools for the
Wireshark Plugin Development Suite.
"""

__version__ = "1.0.0"
__author__ = "Wireshark Plugin Suite Team"

from .protocol_description import ProtocolDescription, FieldDescription, HeuristicRule
from .lua_generator import LuaPluginGenerator
from .plugin_manager import PluginManager
from .analyzer import PcapAnalyzer, AnalysisReport
from .report_generator import ReportGenerator

__all__ = [
    "ProtocolDescription",
    "FieldDescription",
    "HeuristicRule",
    "LuaPluginGenerator",
    "PluginManager",
    "PcapAnalyzer",
    "AnalysisReport",
    "ReportGenerator",
]
