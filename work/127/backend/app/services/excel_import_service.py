import pandas as pd
from typing import Dict, List, Any, Tuple
from io import BytesIO
import logging

from app.models.schemas import (
    SupplyNodeCreate, DependencyCreate,
    NodeType, ExcelImportResult
)

logger = logging.getLogger(__name__)


class ExcelImportService:
    @staticmethod
    def parse_excel_file(file_content: bytes) -> Tuple[
        List[SupplyNodeCreate],
        List[DependencyCreate],
        List[str]
    ]:
        errors = []
        nodes = []
        dependencies = []
        
        try:
            excel_file = BytesIO(file_content)
            xls = pd.ExcelFile(excel_file)
            
            if "Nodes" in xls.sheet_names:
                nodes_df = pd.read_excel(xls, sheet_name="Nodes")
                parsed_nodes, node_errors = ExcelImportService._parse_nodes_sheet(nodes_df)
                nodes.extend(parsed_nodes)
                errors.extend(node_errors)
            else:
                errors.append("Warning: 'Nodes' sheet not found, checking for 'Suppliers' or other sheets...")
            
            if "Dependencies" in xls.sheet_names:
                deps_df = pd.read_excel(xls, sheet_name="Dependencies")
                parsed_deps, dep_errors = ExcelImportService._parse_dependencies_sheet(deps_df)
                dependencies.extend(parsed_deps)
                errors.extend(dep_errors)
            else:
                errors.append("Warning: 'Dependencies' sheet not found.")
            
            if not nodes and not dependencies:
                for sheet_name in xls.sheet_names:
                    if sheet_name not in ["Nodes", "Dependencies"]:
                        df = pd.read_excel(xls, sheet_name=sheet_name)
                        parsed_nodes, node_errors = ExcelImportService._try_parse_as_nodes(df)
                        if parsed_nodes:
                            nodes.extend(parsed_nodes)
                            errors.extend(node_errors)
                            errors.append(f"Note: Parsed nodes from sheet '{sheet_name}'")
                            break
        
        except Exception as e:
            logger.error(f"Error parsing Excel file: {e}")
            errors.append(f"Failed to parse Excel file: {str(e)}")
        
        return nodes, dependencies, errors
    
    @staticmethod
    def _parse_nodes_sheet(df: pd.DataFrame) -> Tuple[List[SupplyNodeCreate], List[str]]:
        errors = []
        nodes = []
        
        df.columns = [str(col).strip().lower() for col in df.columns]
        
        required_columns = ["name", "type"]
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            errors.append(f"Missing required columns in Nodes sheet: {', '.join(missing)}")
            return nodes, errors
        
        for idx, row in df.iterrows():
            try:
                name = str(row.get("name", "")).strip()
                if not name:
                    errors.append(f"Row {idx+2}: Node name cannot be empty")
                    continue
                
                node_type_str = str(row.get("type", "")).strip().lower()
                try:
                    node_type = NodeType(node_type_str)
                except ValueError:
                    valid_types = [t.value for t in NodeType]
                    errors.append(f"Row {idx+2}: Invalid type '{node_type_str}'. Valid types: {', '.join(valid_types)}")
                    node_type = NodeType.SUPPLIER
                
                risk_score = float(row.get("risk_score", 0.0) or 0.0)
                risk_score = max(0.0, min(1.0, risk_score))
                
                description = str(row.get("description", "")) if pd.notna(row.get("description")) else None
                latitude = float(row["latitude"]) if pd.notna(row.get("latitude")) else None
                longitude = float(row["longitude"]) if pd.notna(row.get("longitude")) else None
                
                attributes = {}
                for col in df.columns:
                    if col not in ["name", "type", "description", "risk_score", "latitude", "longitude", "id"]:
                        if pd.notna(row.get(col)):
                            attributes[col] = row[col]
                
                nodes.append(SupplyNodeCreate(
                    name=name,
                    node_type=node_type,
                    description=description,
                    risk_score=risk_score,
                    latitude=latitude,
                    longitude=longitude,
                    attributes=attributes
                ))
                
            except Exception as e:
                errors.append(f"Row {idx+2}: Error parsing node - {str(e)}")
        
        return nodes, errors
    
    @staticmethod
    def _try_parse_as_nodes(df: pd.DataFrame) -> Tuple[List[SupplyNodeCreate], List[str]]:
        df.columns = [str(col).strip().lower() for col in df.columns]
        
        if "name" in df.columns:
            return ExcelImportService._parse_nodes_sheet(df)
        
        if len(df.columns) >= 1:
            first_col = df.columns[0]
            if df[first_col].dtype == object:
                new_df = pd.DataFrame()
                new_df["name"] = df[first_col]
                new_df["type"] = "supplier"
                return ExcelImportService._parse_nodes_sheet(new_df)
        
        return [], ["Could not identify node data in this sheet"]
    
    @staticmethod
    def _parse_dependencies_sheet(df: pd.DataFrame) -> Tuple[List[DependencyCreate], List[str]]:
        errors = []
        dependencies = []
        
        df.columns = [str(col).strip().lower() for col in df.columns]
        
        source_col_variants = ["source", "source_node", "from", "supplier", "parent"]
        target_col_variants = ["target", "target_node", "to", "dependent", "child", "customer"]
        
        source_col = next((col for col in df.columns if col in source_col_variants), None)
        target_col = next((col for col in df.columns if col in target_col_variants), None)
        
        if not source_col or not target_col:
            errors.append("Dependencies sheet must have 'source' and 'target' columns")
            return dependencies, errors
        
        for idx, row in df.iterrows():
            try:
                source_name = str(row.get(source_col, "")).strip()
                target_name = str(row.get(target_col, "")).strip()
                
                if not source_name or not target_name:
                    errors.append(f"Row {idx+2}: Source or target cannot be empty")
                    continue
                
                strength = float(row.get("strength", 0.5) or row.get("dependency_strength", 0.5) or 0.5)
                strength = max(0.0, min(1.0, strength))
                
                prop_prob = float(row.get("propagation_probability", 0.3) or row.get("prop_prob", 0.3) or 0.3)
                prop_prob = max(0.0, min(1.0, prop_prob))
                
                lead_time = int(row["lead_time_days"]) if pd.notna(row.get("lead_time_days")) else None
                volume_pct = float(row["volume_percentage"]) if pd.notna(row.get("volume_percentage")) else None
                
                dependencies.append(DependencyCreate(
                    source_node_id=source_name,
                    target_node_id=target_name,
                    dependency_strength=strength,
                    propagation_probability=prop_prob,
                    lead_time_days=lead_time,
                    volume_percentage=volume_pct
                ))
                
            except Exception as e:
                errors.append(f"Row {idx+2}: Error parsing dependency - {str(e)}")
        
        return dependencies, errors
    
    @staticmethod
    def generate_excel_template() -> bytes:
        nodes_data = {
            "name": ["Supplier A", "Factory B", "Warehouse C"],
            "type": ["supplier", "manufacturer", "warehouse"],
            "description": ["Raw material supplier", "Assembly plant", "Regional distribution center"],
            "risk_score": [0.1, 0.2, 0.05],
            "latitude": [34.05, 40.71, 37.77],
            "longitude": [-118.24, -74.01, -122.42],
            "capacity_units": [10000, 5000, 20000],
            "lead_time_days": [7, 3, 2]
        }
        
        dependencies_data = {
            "source": ["Supplier A", "Factory B"],
            "target": ["Factory B", "Warehouse C"],
            "dependency_strength": [0.8, 0.9],
            "propagation_probability": [0.5, 0.6],
            "volume_percentage": [1.0, 1.0]
        }
        
        nodes_df = pd.DataFrame(nodes_data)
        deps_df = pd.DataFrame(dependencies_data)
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            nodes_df.to_excel(writer, sheet_name='Nodes', index=False)
            deps_df.to_excel(writer, sheet_name='Dependencies', index=False)
        
        output.seek(0)
        return output.getvalue()
