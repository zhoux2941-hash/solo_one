#!/usr/bin/env python3
"""Tests for protocol description module"""

import pytest
import json
import tempfile
import os
from pathlib import Path

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from python.protocol_description import (
    ProtocolDescription,
    FieldDescription,
    HeuristicRule,
    FieldType,
    ByteOrder,
    HeuristicRuleType
)


class TestFieldDescription:
    """Test FieldDescription class"""

    def test_field_description_creation(self):
        """Test creating a field description"""
        field = FieldDescription(
            name="test_field",
            display_name="Test Field",
            type=FieldType.UINT16,
            byte_order=ByteOrder.BIG_ENDIAN,
            offset=0,
            length=2
        )
        assert field.name == "test_field"
        assert field.display_name == "Test Field"
        assert field.type == FieldType.UINT16
        assert field.byte_order == ByteOrder.BIG_ENDIAN
        assert field.offset == 0
        assert field.length == 2

    def test_field_description_to_dict(self):
        """Test converting field description to dict"""
        field = FieldDescription(
            name="version",
            display_name="Version",
            type=FieldType.UINT8,
            byte_order=ByteOrder.BIG_ENDIAN,
            offset=0,
            length=1,
            valid_values=[1, 2, 3]
        )
        d = field.to_dict()
        assert d["name"] == "version"
        assert d["type"] == "uint8"
        assert d["valid_values"] == [1, 2, 3]

    def test_field_description_from_dict(self):
        """Test creating field description from dict"""
        d = {
            "name": "length",
            "display_name": "Payload Length",
            "type": "uint16",
            "byte_order": "big_endian",
            "offset": 2,
            "length": 2
        }
        field = FieldDescription.from_dict(d)
        assert field.name == "length"
        assert field.type == FieldType.UINT16
        assert field.byte_order == ByteOrder.BIG_ENDIAN


class TestHeuristicRule:
    """Test HeuristicRule class"""

    def test_fixed_bytes_rule(self):
        """Test fixed bytes heuristic rule"""
        rule = HeuristicRule(
            type=HeuristicRuleType.FIXED_BYTES,
            name="Magic Number",
            offset=0,
            expected_bytes=[0xAB, 0xCD],
            weight=3.0
        )
        assert rule.type == HeuristicRuleType.FIXED_BYTES
        assert rule.name == "Magic Number"
        assert rule.expected_bytes == [0xAB, 0xCD]

    def test_port_range_rule(self):
        """Test port range heuristic rule"""
        rule = HeuristicRule(
            type=HeuristicRuleType.PORT_RANGE,
            name="Modbus Port",
            port_min=502,
            port_max=502,
            weight=2.0
        )
        assert rule.port_min == 502
        assert rule.port_max == 502

    def test_heuristic_rule_to_dict(self):
        """Test converting rule to dict"""
        rule = HeuristicRule(
            type=HeuristicRuleType.ENTROPY_RANGE,
            name="Entropy Check",
            offset=10,
            entropy_min=7.0,
            entropy_max=8.0,
            weight=1.0
        )
        d = rule.to_dict()
        assert d["type"] == "entropy_range"
        assert d["entropy_min"] == 7.0
        assert d["entropy_max"] == 8.0


class TestProtocolDescription:
    """Test ProtocolDescription class"""

    def test_protocol_description_creation(self):
        """Test creating a protocol description"""
        fields = [
            FieldDescription(
                name="version",
                type=FieldType.UINT8,
                offset=0,
                length=1
            ),
            FieldDescription(
                name="length",
                type=FieldType.UINT16,
                offset=2,
                length=2
            )
        ]
        protocol = ProtocolDescription(
            name="test_protocol",
            display_name="Test Protocol",
            short_name="testproto",
            default_port_tcp=1234,
            fields=fields
        )
        assert protocol.name == "test_protocol"
        assert len(protocol.fields) == 2

    def test_protocol_validation(self):
        """Test protocol description validation"""
        fields = [
            FieldDescription(
                name="version",
                type=FieldType.UINT8,
                offset=0,
                length=1
            ),
            FieldDescription(
                name="length",
                type=FieldType.UINT16,
                offset=2,
                length=2,
                depends_on_field="nonexistent_field"
            )
        ]
        protocol = ProtocolDescription(
            name="test_protocol",
            display_name="Test Protocol",
            short_name="testproto",
            default_port_tcp=1234,
            fields=fields
        )
        errors = protocol.validate()
        assert len(errors) > 0
        assert any("depends_on_field" in e for e in errors)

    def test_json_serialization_roundtrip(self):
        """Test JSON serialization roundtrip"""
        fields = [
            FieldDescription(
                name="magic",
                display_name="Magic Number",
                type=FieldType.UINT16,
                byte_order=ByteOrder.BIG_ENDIAN,
                offset=0,
                length=2,
                fixed_value=[0xAB, 0xCD]
            ),
            FieldDescription(
                name="payload",
                display_name="Payload",
                type=FieldType.VARIABLE,
                is_variable_length=True,
                length_field="magic"
            )
        ]
        protocol = ProtocolDescription(
            name="test_protocol",
            display_name="Test Protocol",
            short_name="testproto",
            default_port_tcp=1234,
            requires_reassembly=True,
            fields=fields
        )

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            tmp_path = f.name

        try:
            protocol.to_json_file(tmp_path)
            loaded = ProtocolDescription.from_json_file(tmp_path)
            assert loaded.name == protocol.name
            assert len(loaded.fields) == len(protocol.fields)
            assert loaded.fields[0].name == "magic"
        finally:
            os.unlink(tmp_path)

    def test_validate_missing_length_field(self):
        """Test validation catches missing length_field reference"""
        fields = [
            FieldDescription(
                name="payload",
                type=FieldType.VARIABLE,
                is_variable_length=True,
                length_field="length"  # length field doesn't exist
            )
        ]
        protocol = ProtocolDescription(
            name="test_protocol",
            display_name="Test Protocol",
            short_name="testproto",
            default_port_tcp=1234,
            fields=fields
        )
        errors = protocol.validate()
        assert len(errors) > 0
        assert any("length_field" in e for e in errors)

    def test_validate_duplicate_field_names(self):
        """Test validation catches duplicate field names"""
        fields = [
            FieldDescription(name="field1", type=FieldType.UINT8, offset=0, length=1),
            FieldDescription(name="field1", type=FieldType.UINT8, offset=1, length=1)
        ]
        protocol = ProtocolDescription(
            name="test_protocol",
            display_name="Test Protocol",
            short_name="testproto",
            default_port_tcp=1234,
            fields=fields
        )
        errors = protocol.validate()
        assert len(errors) > 0
        assert any("duplicate" in e.lower() for e in errors)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
