package com.medical.knowledgegraph.service;

import com.medical.knowledgegraph.dto.EdgeData;
import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.dto.NodeData;
import com.medical.knowledgegraph.repository.GraphQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GraphService {

    private final GraphQueryRepository graphQueryRepository;
    private static final int MAX_NODES_PER_EXPAND = 100;
    private static final Set<String> EXCLUDED_RELATIONSHIP_TYPES = new HashSet<>();

    static {
        EXCLUDED_RELATIONSHIP_TYPES.add("INDICATES");
        EXCLUDED_RELATIONSHIP_TYPES.add("TREATS");
    }

    @Autowired
    public GraphService(GraphQueryRepository graphQueryRepository) {
        this.graphQueryRepository = graphQueryRepository;
    }

    public GraphResult expandNode(String label, String name) {
        GraphResult graphResult = new GraphResult();
        
        Map<String, Object> node = graphQueryRepository.getNodeById(label, name);
        if (node == null) {
            return graphResult;
        }
        
        String nodeId = label.toLowerCase() + "_" + node.get("id");
        
        Map<String, Object> nodeData = new HashMap<>(node);
        nodeData.remove("id");
        nodeData.remove("labels");
        nodeData.remove("name");
        
        NodeData mainNode = new NodeData(
            nodeId,
            (String) node.get("name"),
            label,
            (String) node.getOrDefault("description", ""),
            nodeData
        );
        graphResult.addNode(mainNode);
        
        List<Map<String, Object>> relatedNodes = graphQueryRepository.getRelatedNodes(label, name);
        
        Set<String> addedNodeIds = new HashSet<>();
        Set<String> addedEdgeIds = new HashSet<>();
        Set<String> processedRelTypes = new HashSet<>();
        int nodeCount = 0;
        
        for (Map<String, Object> relatedNode : relatedNodes) {
            if (nodeCount >= MAX_NODES_PER_EXPAND) {
                System.out.println("已达到单次展开节点上限(" + MAX_NODES_PER_EXPAND + ")，停止添加更多节点");
                break;
            }
            
            List<String> labels = (List<String>) relatedNode.get("labels");
            String relatedLabel = labels.isEmpty() ? "Unknown" : labels.get(0);
            String relatedId = relatedLabel.toLowerCase() + "_" + relatedNode.get("id");
            String relType = (String) relatedNode.get("relationshipType");
            String direction = (String) relatedNode.get("relationshipDirection");
            
            if (shouldSkipRelationship(relType, direction, processedRelTypes)) {
                continue;
            }
            
            if (!addedNodeIds.contains(relatedId)) {
                Map<String, Object> relNodeData = new HashMap<>(relatedNode);
                relNodeData.remove("id");
                relNodeData.remove("labels");
                relNodeData.remove("name");
                relNodeData.remove("relationshipType");
                relNodeData.remove("relationshipDirection");
                
                NodeData relNode = new NodeData(
                    relatedId,
                    (String) relatedNode.get("name"),
                    relatedLabel,
                    (String) relatedNode.getOrDefault("description", ""),
                    relNodeData
                );
                graphResult.addNode(relNode);
                addedNodeIds.add(relatedId);
                nodeCount++;
            }
            
            String edgeId;
            String sourceId;
            String targetId;
            String edgeLabel;
            
            if ("OUTGOING".equals(direction)) {
                sourceId = nodeId;
                targetId = relatedId;
                edgeId = nodeId + "_" + relType.toLowerCase() + "_" + relatedId;
                edgeLabel = getRelationshipLabel(relType, true);
            } else {
                sourceId = relatedId;
                targetId = nodeId;
                edgeId = relatedId + "_" + relType.toLowerCase() + "_" + nodeId;
                edgeLabel = getRelationshipLabel(relType, false);
            }
            
            if (!addedEdgeIds.contains(edgeId)) {
                EdgeData edge = new EdgeData(
                    edgeId,
                    sourceId,
                    targetId,
                    edgeLabel,
                    relType
                );
                graphResult.addEdge(edge);
                addedEdgeIds.add(edgeId);
            }
        }
        
        return graphResult;
    }

    private boolean shouldSkipRelationship(String relType, String direction, Set<String> processedRelTypes) {
        if (EXCLUDED_RELATIONSHIP_TYPES.contains(relType)) {
            return true;
        }
        
        String relKey = relType + "_" + direction;
        if (processedRelTypes.contains(relKey)) {
            return true;
        }
        processedRelTypes.add(relKey);
        
        return false;
    }

    public GraphResult getPath(String startLabel, String startName, String endLabel, String endName) {
        GraphResult graphResult = new GraphResult();
        
        List<Map<String, Object>> path = graphQueryRepository.findPathBetweenNodes(
            startLabel, startName, endLabel, endName
        );
        
        if (path.isEmpty()) {
            return graphResult;
        }
        
        Map<String, NodeData> nodeMap = new HashMap<>();
        
        for (int i = 0; i < path.size(); i++) {
            Map<String, Object> nodeData = path.get(i);
            List<String> labels = (List<String>) nodeData.get("labels");
            String label = labels.isEmpty() ? "Unknown" : labels.get(0);
            String nodeId = label.toLowerCase() + "_" + nodeData.get("id");
            
            if (!nodeMap.containsKey(nodeId)) {
                Map<String, Object> data = new HashMap<>(nodeData);
                data.remove("id");
                data.remove("labels");
                data.remove("name");
                data.remove("nextRelationship");
                
                NodeData node = new NodeData(
                    nodeId,
                    (String) nodeData.get("name"),
                    label,
                    (String) nodeData.getOrDefault("description", ""),
                    data
                );
                graphResult.addNode(node);
                nodeMap.put(nodeId, node);
            }
            
            if (i < path.size() - 1) {
                Map<String, Object> nextNodeData = path.get(i + 1);
                List<String> nextLabels = (List<String>) nextNodeData.get("labels");
                String nextLabel = nextLabels.isEmpty() ? "Unknown" : nextLabels.get(0);
                String nextNodeId = nextLabel.toLowerCase() + "_" + nextNodeData.get("id");
                
                String nextRelType = (String) nodeData.get("nextRelationship");
                String edgeId = nodeId + "_" + nextRelType.toLowerCase() + "_" + nextNodeId;
                
                EdgeData edge = new EdgeData(
                    edgeId,
                    nodeId,
                    nextNodeId,
                    getRelationshipLabel(nextRelType, true),
                    nextRelType
                );
                graphResult.addEdge(edge);
            }
        }
        
        return graphResult;
    }

    private String getRelationshipLabel(String relType, boolean outgoing) {
        return switch (relType) {
            case "HAS_SYMPTOM" -> outgoing ? "有症状" : "是症状";
            case "INDICATES" -> outgoing ? "暗示" : "被暗示";
            case "TREATED_BY" -> outgoing ? "可被治疗" : "治疗";
            case "TREATS" -> outgoing ? "治疗" : "被治疗";
            case "HAS_SIDE_EFFECT" -> outgoing ? "有副作用" : "是副作用";
            default -> relType;
        };
    }
}