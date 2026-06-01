"""
Protocol Description Module - Handles JSON protocol description parsing
"""

import json
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Union
from enum import Enum


class FieldType(Enum):
    UINT8 = "uint8"
    UINT16 = "uint16"
    UINT32 = "uint32"
    UINT64 = "uint64"
    INT8 = "int8"
    INT16 = "int16"
    INT32 = "int32"
    INT64 = "int64"
    STRING = "string"
    IPV4 = "ipv4"
    IPV6 = "ipv6"
    MAC = "mac"
    BYTES = "bytes"
    VARIABLE = "variable"


class ByteOrder(Enum):
    BIG_ENDIAN = "big_endian"
    LITTLE_ENDIAN = "little_endian"
    NETWORK = "network"
    BE = "be"
    LE = "le"


class HeuristicRuleType(Enum):
    FIXED_BYTES = "fixed_bytes"
    PORT_RANGE = "port_range"
    ENTROPY_RANGE = "entropy_range"
    FIELD_VALUE = "field_value"
    PROTOCOL_PATTERN = "protocol_pattern"


@dataclass
class HeuristicRule:
    type: HeuristicRuleType
    name: str = ""
    offset: int = 0
    expected_bytes: List[int] = field(default_factory=list)
    mask: List[int] = field(default_factory=list)
    port_min: int = 0
    port_max: int = 0
    entropy_min: float = 0.0
    entropy_max: float = 8.0
    weight: float = 1.0
    use_tcp: bool = True
    use_udp: bool = True

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HeuristicRule':
        return cls(
            type=HeuristicRuleType(data.get("type", "fixed_bytes")),
            name=data.get("name", ""),
            offset=data.get("offset", 0),
            expected_bytes=data.get("expected_bytes", []),
            mask=data.get("mask", []),
            port_min=data.get("port_min", 0),
            port_max=data.get("port_max", 0),
            entropy_min=data.get("entropy_min", 0.0),
            entropy_max=data.get("entropy_max", 8.0),
            weight=data.get("weight", 1.0),
            use_tcp=data.get("use_tcp", True),
            use_udp=data.get("use_udp", True),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "name": self.name,
            "offset": self.offset,
            "expected_bytes": self.expected_bytes,
            "mask": self.mask,
            "port_min": self.port_min,
            "port_max": self.port_max,
            "entropy_min": self.entropy_min,
            "entropy_max": self.entropy_max,
            "weight": self.weight,
            "use_tcp": self.use_tcp,
            "use_udp": self.use_udp,
        }


@dataclass
class FieldDescription:
    name: str
    display_name: str = ""
    type: FieldType = FieldType.UINT8
    byte_order: ByteOrder = ByteOrder.BIG_ENDIAN
    offset: int = -1
    length: int = 0
    description: str = ""
    filter_name: str = ""
    is_variable_length: bool = False
    length_field: str = ""
    fixed_value: List[int] = field(default_factory=list)
    depends_on_field: str = ""
    depends_on_condition: str = ""
    valid_values: List[int] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FieldDescription':
        return cls(
            name=data["name"],
            display_name=data.get("display_name", data["name"]),
            type=FieldType(data.get("type", "uint8")),
            byte_order=ByteOrder(data.get("byte_order", "big_endian")),
            offset=data.get("offset", -1),
            length=data.get("length", 0),
            description=data.get("description", ""),
            filter_name=data.get("filter_name", data["name"]),
            is_variable_length=data.get("is_variable_length", False),
            length_field=data.get("length_field", ""),
            fixed_value=data.get("fixed_value", []),
            depends_on_field=data.get("depends_on_field", ""),
            depends_on_condition=data.get("depends_on_condition", ""),
            valid_values=data.get("valid_values", []),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "type": self.type.value,
            "byte_order": self.byte_order.value,
            "offset": self.offset,
            "length": self.length,
            "description": self.description,
            "filter_name": self.filter_name,
            "is_variable_length": self.is_variable_length,
            "length_field": self.length_field,
            "fixed_value": self.fixed_value,
            "depends_on_field": self.depends_on_field,
            "depends_on_condition": self.depends_on_condition,
            "valid_values": self.valid_values,
        }


@dataclass
class ProtocolDescription:
    name: str
    display_name: str = ""
    short_name: str = ""
    default_port: int = 0
    default_port_tcp: int = 0
    default_port_udp: int = 0
    fields: List[FieldDescription] = field(default_factory=list)
    handshake_fields: List[str] = field(default_factory=list)
    requires_reassembly: bool = False
    reassembly_timeout_ms: int = 5000
    heuristic_rules: List[HeuristicRule] = field(default_factory=list)

    @classmethod
    def from_json_file(cls, filepath: str) -> 'ProtocolDescription':
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls.from_dict(data)

    @classmethod
    def from_json_string(cls, json_str: str) -> 'ProtocolDescription':
        data = json.loads(json_str)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProtocolDescription':
        default_port = data.get("default_port", 0)
        fields = [FieldDescription.from_dict(f) for f in data.get("fields", [])]
        heuristic_rules = [HeuristicRule.from_dict(r) for r in data.get("heuristic_rules", [])]

        return cls(
            name=data["name"],
            display_name=data.get("display_name", data["name"]),
            short_name=data.get("short_name", data["name"].lower()[:8]),
            default_port=default_port,
            default_port_tcp=data.get("default_port_tcp", default_port),
            default_port_udp=data.get("default_port_udp", default_port),
            fields=fields,
            handshake_fields=data.get("handshake_fields", []),
            requires_reassembly=data.get("requires_reassembly", False),
            reassembly_timeout_ms=data.get("reassembly_timeout_ms", 5000),
            heuristic_rules=heuristic_rules,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "short_name": self.short_name,
            "default_port": self.default_port,
            "default_port_tcp": self.default_port_tcp,
            "default_port_udp": self.default_port_udp,
            "fields": [f.to_dict() for f in self.fields],
            "handshake_fields": self.handshake_fields,
            "requires_reassembly": self.requires_reassembly,
            "reassembly_timeout_ms": self.reassembly_timeout_ms,
            "heuristic_rules": [r.to_dict() for r in self.heuristic_rules],
        }

    def to_json_file(self, filepath: str) -> None:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)

    def to_json_string(self) -> str:
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)

    def validate(self) -> List[str]:
        errors = []

        if not self.name:
            errors.append("Protocol name is required")
        if not self.short_name:
            errors.append("Protocol short_name is required")
        if len(self.fields) == 0:
            errors.append("Protocol must have at least one field")

        field_names = set()
        for i, field in enumerate(self.fields):
            if not field.name:
                errors.append(f"Field {i} is missing a name")
            elif field.name in field_names:
                errors.append(f"Duplicate field name: {field.name}")
            else:
                field_names.add(field.name)

            if field.is_variable_length and not field.length_field:
                errors.append(
                    f"Field '{field.name}' is variable length but no length_field specified"
                )

            if field.length_field and field.length_field not in field_names:
                errors.append(
                    f"Field '{field.name}' references unknown length_field: {field.length_field}"
                )

            if field.depends_on_field and field.depends_on_field not in field_names:
                errors.append(
                    f"Field '{field.name}' depends on unknown field: {field.depends_on_field}"
                )

        for hs_field in self.handshake_fields:
            if hs_field not in field_names:
                errors.append(f"Handshake field '{hs_field}' not found in fields")

        return errors

    def __str__(self) -> str:
        return (
            f"ProtocolDescription(name='{self.name}', "
            f"short_name='{self.short_name}', "
            f"fields={len(self.fields)}, "
            f"port_tcp={self.default_port_tcp}, "
            f"port_udp={self.default_port_udp})"
        )

    def __repr__(self) -> str:
        return self.__str__()
