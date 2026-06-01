"""
Plugin Manager - Manages Wireshark plugin generation and installation
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

from .protocol_description import ProtocolDescription
from .lua_generator import LuaPluginGenerator


@dataclass
class PluginInfo:
    name: str
    short_name: str
    lua_file: str
    protocol_json: str
    generated_at: str
    version: str = "1.0.0"
    installed: bool = False
    install_path: str = ""


class PluginManager:
    """Manages Wireshark plugin lifecycle"""

    def __init__(self, plugins_dir: Optional[str] = None):
        self.plugins_dir = Path(plugins_dir) if plugins_dir else self._get_default_plugins_dir()
        self.generator = LuaPluginGenerator()
        self.plugins: Dict[str, PluginInfo] = {}

        self.plugins_dir.mkdir(parents=True, exist_ok=True)
        self._load_existing_plugins()

    def _get_default_plugins_dir(self) -> Path:
        if sys.platform.startswith("win"):
            return Path(os.environ.get("APPDATA", "")) / "Wireshark" / "plugins"
        elif sys.platform == "darwin":
            return Path.home() / ".config" / "wireshark" / "plugins"
        else:
            return Path.home() / ".wireshark" / "plugins"

    def _load_existing_plugins(self) -> None:
        if not self.plugins_dir.exists():
            return

        for lua_file in self.plugins_dir.glob("**/*.lua"):
            name = lua_file.stem
            json_file = lua_file.with_suffix(".json")
            if json_file.exists():
                try:
                    proto = ProtocolDescription.from_json_file(str(json_file))
                    self.plugins[name] = PluginInfo(
                        name=proto.name,
                        short_name=proto.short_name,
                        lua_file=str(lua_file),
                        protocol_json=str(json_file),
                        generated_at=lua_file.stat().st_mtime.__str__(),
                        installed=True,
                        install_path=str(lua_file)
                    )
                except Exception:
                    pass

    def generate_plugin(
        self,
        protocol_json: str,
        output_dir: Optional[str] = None,
        overwrite: bool = False
    ) -> PluginInfo:
        """Generate a Wireshark Lua plugin from a protocol description JSON file"""

        protocol = ProtocolDescription.from_json_file(protocol_json)

        errors = protocol.validate()
        if errors:
            raise ValueError(f"Protocol description has errors: {', '.join(errors)}")

        if output_dir is None:
            output_dir = self.plugins_dir
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        lua_output = output_path / f"{protocol.short_name}.lua"
        json_output = output_path / f"{protocol.short_name}.json"

        if lua_output.exists() and not overwrite:
            raise FileExistsError(f"Plugin already exists: {lua_output}")

        self.generator.generate_to_file(protocol, str(lua_output))
        shutil.copy2(protocol_json, str(json_output))

        from datetime import datetime
        info = PluginInfo(
            name=protocol.name,
            short_name=protocol.short_name,
            lua_file=str(lua_output),
            protocol_json=str(json_output),
            generated_at=datetime.now().isoformat()
        )

        self.plugins[protocol.short_name] = info
        return info

    def generate_plugin_from_description(
        self,
        protocol: ProtocolDescription,
        output_dir: Optional[str] = None,
        overwrite: bool = False
    ) -> PluginInfo:
        """Generate a plugin directly from a ProtocolDescription object"""

        import tempfile
        import json

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(protocol.to_dict(), f, indent=2)
            temp_json = f.name

        try:
            return self.generate_plugin(temp_json, output_dir, overwrite)
        finally:
            os.unlink(temp_json)

    def install_plugin(self, plugin_name: str) -> bool:
        """Install a generated plugin to the Wireshark plugins directory"""

        if plugin_name not in self.plugins:
            raise KeyError(f"Plugin not found: {plugin_name}")

        info = self.plugins[plugin_name]
        install_dir = self.plugins_dir

        install_dir.mkdir(parents=True, exist_ok=True)

        dest_lua = install_dir / Path(info.lua_file).name
        dest_json = install_dir / Path(info.protocol_json).name

        shutil.copy2(info.lua_file, str(dest_lua))
        shutil.copy2(info.protocol_json, str(dest_json))

        info.installed = True
        info.install_path = str(dest_lua)
        return True

    def uninstall_plugin(self, plugin_name: str) -> bool:
        """Uninstall a plugin from Wireshark"""

        if plugin_name not in self.plugins:
            raise KeyError(f"Plugin not found: {plugin_name}")

        info = self.plugins[plugin_name]
        if not info.installed:
            return False

        lua_path = Path(info.install_path)
        json_path = lua_path.with_suffix(".json")

        if lua_path.exists():
            lua_path.unlink()
        if json_path.exists():
            json_path.unlink()

        info.installed = False
        info.install_path = ""
        return True

    def list_plugins(self) -> List[PluginInfo]:
        """List all managed plugins"""
        return list(self.plugins.values())

    def get_plugin(self, plugin_name: str) -> Optional[PluginInfo]:
        """Get information about a specific plugin"""
        return self.plugins.get(plugin_name)

    def delete_plugin(self, plugin_name: str) -> bool:
        """Delete a plugin (both generated and installed)"""

        if plugin_name not in self.plugins:
            raise KeyError(f"Plugin not found: {plugin_name}")

        info = self.plugins[plugin_name]

        if info.installed:
            self.uninstall_plugin(plugin_name)

        lua_path = Path(info.lua_file)
        json_path = Path(info.protocol_json)

        if lua_path.exists():
            lua_path.unlink()
        if json_path.exists() and json_path != lua_path:
            json_path.unlink()

        del self.plugins[plugin_name]
        return True

    def validate_plugin(self, lua_file: str) -> Tuple[bool, List[str]]:
        """Validate a generated Lua plugin for syntax errors"""

        try:
            result = subprocess.run(
                ["lua", "-p", lua_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                return True, []
            else:
                return False, [result.stderr]
        except FileNotFoundError:
            return True, ["Lua interpreter not found, skipping validation"]
        except subprocess.TimeoutExpired:
            return False, ["Validation timed out"]

    def test_plugin(self, plugin_name: str, pcap_file: str) -> Dict[str, any]:
        """Test a plugin against a pcap file"""

        if plugin_name not in self.plugins:
            raise KeyError(f"Plugin not found: {plugin_name}")

        info = self.plugins[plugin_name]

        try:
            tshark_path = shutil.which("tshark")
            if not tshark_path:
                return {"success": False, "error": "tshark not found"}

            env = os.environ.copy()
            env["WIRESHARK_PLUGIN_DIRS"] = str(Path(info.lua_file).parent)

            result = subprocess.run(
                [
                    tshark_path,
                    "-r", pcap_file,
                    "-Y", info.short_name,
                    "-c", "100",
                    "-T", "fields",
                    "-e", "frame.number"
                ],
                capture_output=True,
                text=True,
                env=env,
                timeout=60
            )

            packet_count = len([l for l in result.stdout.strip().split('\n') if l])

            return {
                "success": result.returncode == 0,
                "packet_count": packet_count,
                "stdout": result.stdout,
                "stderr": result.stderr
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_wireshark_version(self) -> Optional[str]:
        """Get installed Wireshark version"""

        try:
            tshark_path = shutil.which("tshark")
            if tshark_path:
                result = subprocess.run(
                    [tshark_path, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                first_line = result.stdout.split('\n')[0]
                return first_line
        except Exception:
            pass

        try:
            wireshark_path = shutil.which("wireshark")
            if wireshark_path:
                result = subprocess.run(
                    [wireshark_path, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                first_line = result.stdout.split('\n')[0]
                return first_line
        except Exception:
            pass

        return None
