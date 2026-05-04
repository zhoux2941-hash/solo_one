package com.medical.knowledgegraph.repository;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class GraphQueryRepository {

    private final Driver driver;

    @Autowired
    public GraphQueryRepository(Driver driver) {
        this.driver = driver;
    }

    public Map<String, Object> getNodeById(String label, String name) {
        try (Session session = driver.session()) {
            String cypher = "MATCH (n:" + label + ") WHERE n.name = $name RETURN n";
            Result result = session.run(cypher, Map.of("name", name));
            if (result.hasNext()) {
                Record record = result.next();
                Node node = record.get("n").asNode();
                return nodeToMap(node);
            }
            return null;
        }
    }

    public List<Map<String, Object>> getRelatedNodes(String label, String name) {
        List<Map<String, Object>> relatedNodes = new ArrayList<>();
        
        try (Session session = driver.session()) {
            String cypher = "MATCH (n:" + label + " {name: $name})-[r]-(m) " +
                           "RETURN m, type(r) as relType, r, " +
                           "CASE WHEN startNode(r) = n THEN 'OUTGOING' ELSE 'INCOMING' END as direction";
            
            Result result = session.run(cypher, Map.of("name", name));
            
            while (result.hasNext()) {
                Record record = result.next();
                Node node = record.get("m").asNode();
                String relType = record.get("relType").asString();
                String direction = record.get("direction").asString();
                
                Map<String, Object> nodeMap = nodeToMap(node);
                nodeMap.put("relationshipType", relType);
                nodeMap.put("relationshipDirection", direction);
                relatedNodes.add(nodeMap);
            }
        }
        
        return relatedNodes;
    }

    public List<Map<String, Object>> findPathBetweenNodes(String startLabel, String startName, 
                                                           String endLabel, String endName) {
        List<Map<String, Object>> pathResult = new ArrayList<>();
        
        try (Session session = driver.session()) {
            String cypher = "MATCH path = shortestPath((start:" + startLabel + " {name: $startName})-[*]-(end:" + endLabel + " {name: $endName})) " +
                           "RETURN nodes(path) as nodes, relationships(path) as relationships";
            
            Result result = session.run(cypher, Map.of("startName", startName, "endName", endName));
            
            if (result.hasNext()) {
                Record record = result.next();
                List<Node> nodes = record.get("nodes").asList(v -> v.asNode());
                List<Relationship> relationships = record.get("relationships").asList(v -> v.asRelationship());
                
                for (int i = 0; i < nodes.size(); i++) {
                    Node node = nodes.get(i);
                    Map<String, Object> nodeMap = nodeToMap(node);
                    
                    if (i < relationships.size()) {
                        Relationship rel = relationships.get(i);
                        nodeMap.put("nextRelationship", rel.type());
                    }
                    
                    pathResult.add(nodeMap);
                }
            }
        }
        
        return pathResult;
    }

    public List<Map<String, Object>> executeCypherQuery(String cypher, Map<String, Object> params) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try (Session session = driver.session()) {
            Result result = session.run(cypher, params);
            
            while (result.hasNext()) {
                Record record = result.next();
                Map<String, Object> recordMap = new HashMap<>();
                
                record.keys().forEach(key -> {
                    Object value = record.get(key);
                    if (value instanceof Node) {
                        recordMap.put(key, nodeToMap((Node) value));
                    } else if (value instanceof Relationship) {
                        recordMap.put(key, relationshipToMap((Relationship) value));
                    } else {
                        recordMap.put(key, value.asObject());
                    }
                });
                
                results.add(recordMap);
            }
        }
        
        return results;
    }

    private Map<String, Object> nodeToMap(Node node) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", node.id());
        map.put("labels", new ArrayList<>(node.labels()));
        
        node.asMap().forEach((key, value) -> {
            map.put(key, value);
        });
        
        return map;
    }

    private Map<String, Object> relationshipToMap(Relationship rel) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", rel.id());
        map.put("type", rel.type());
        map.put("startNodeId", rel.startNodeId());
        map.put("endNodeId", rel.endNodeId());
        
        rel.asMap().forEach((key, value) -> {
            map.put(key, value);
        });
        
        return map;
    }
}