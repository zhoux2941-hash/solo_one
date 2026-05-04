from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from neo4j import AsyncSession
from io import BytesIO

from app.database.neo4j_client import get_db_session
from app.models.schemas import ExcelImportResult, SupplyNodeCreate, DependencyCreate
from app.services.excel_import_service import ExcelImportService
from app.services.supply_chain_service import SupplyChainService

router = APIRouter(prefix="/import-export", tags=["import_export"])


@router.post("/networks/{network_id}/import", response_model=ExcelImportResult)
async def import_from_excel(
    network_id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Please upload an Excel file (.xlsx or .xls)"
            )
        
        file_content = await file.read()
        
        nodes, dependencies, errors = ExcelImportService.parse_excel_file(file_content)
        
        existing_nodes = await SupplyChainService.list_nodes(session, network_id)
        name_to_id = {node.name: node.id for node in existing_nodes}
        
        nodes_created = 0
        nodes_updated = 0
        deps_created = 0
        deps_skipped = 0
        
        for node_data in nodes:
            if node_data.name in name_to_id:
                nodes_updated += 1
            else:
                created_node = await SupplyChainService.create_node(
                    session, network_id, node_data
                )
                name_to_id[node_data.name] = created_node.id
                nodes_created += 1
        
        for dep_data in dependencies:
            source_name = dep_data.source_node_id
            target_name = dep_data.target_node_id
            
            if source_name in name_to_id and target_name in name_to_id:
                source_id = name_to_id[source_name]
                target_id = name_to_id[target_name]
                
                new_dep = DependencyCreate(
                    source_node_id=source_id,
                    target_node_id=target_id,
                    dependency_strength=dep_data.dependency_strength,
                    propagation_probability=dep_data.propagation_probability,
                    lead_time_days=dep_data.lead_time_days,
                    volume_percentage=dep_data.volume_percentage
                )
                
                await SupplyChainService.create_dependency(
                    session, network_id, new_dep
                )
                deps_created += 1
            else:
                missing = []
                if source_name not in name_to_id:
                    missing.append(f"source '{source_name}'")
                if target_name not in name_to_id:
                    missing.append(f"target '{target_name}'")
                errors.append(f"Skipped dependency: {', '.join(missing)} not found")
                deps_skipped += 1
        
        if deps_skipped > 0:
            errors.append(f"Note: {deps_skipped} dependencies were skipped due to missing nodes")
        
        return ExcelImportResult(
            nodes_created=nodes_created,
            nodes_updated=nodes_updated,
            dependencies_created=deps_created,
            dependencies_updated=0,
            errors=errors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/template/download")
async def download_template():
    try:
        excel_data = ExcelImportService.generate_excel_template()
        
        return StreamingResponse(
            BytesIO(excel_data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=supply_chain_template.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/networks/{network_id}/export", response_model=Dict[str, Any])
async def export_network(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes = await SupplyChainService.list_nodes(session, network_id)
        dependencies = await SupplyChainService.list_dependencies(session, network_id)
        
        return {
            "network": network,
            "nodes": nodes,
            "dependencies": dependencies
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
