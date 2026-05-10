package com.familytree.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.familytree.entity.Person;
import com.familytree.entity.Relationship;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.RelationshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class TreeCacheService {
    private static final String TREE_CACHE_PREFIX = "family_tree:";
    private static final long CACHE_EXPIRE_HOURS = 24;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private RelationshipRepository relationshipRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public Map<String, Object> getTreeStructure(Long familySpaceId) {
        String cacheKey = TREE_CACHE_PREFIX + familySpaceId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> tree = (Map<String, Object>) cached;
                return tree;
            } catch (Exception e) {
                // 缓存解析失败，重新构建
            }
        }

        Map<String, Object> tree = buildTreeStructure(familySpaceId);
        redisTemplate.opsForValue().set(cacheKey, tree, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        return tree;
    }

    public void invalidateTreeCache(Long familySpaceId) {
        String cacheKey = TREE_CACHE_PREFIX + familySpaceId;
        redisTemplate.delete(cacheKey);
    }

    private Map<String, Object> buildTreeStructure(Long familySpaceId) {
        List<Person> persons = personRepository.findByFamilySpaceId(familySpaceId);
        List<Relationship> relationships = relationshipRepository.findByFamilySpace(
            new com.familytree.entity.FamilySpace() {{ setId(familySpaceId); }}
        );

        Map<Long, TreeNode> personMap = new HashMap<>();
        Set<Long> childrenIds = new HashSet<>();

        for (Person p : persons) {
            TreeNode node = new TreeNode();
            node.id = p.getId();
            node.name = p.getName();
            node.gender = p.getGender();
            node.birthYear = p.getBirthYear();
            node.deathYear = p.getDeathYear();
            node.biography = p.getBiography();
            node.avatar = p.getAvatar();
            node.children = new ArrayList<>();
            personMap.put(p.getId(), node);
        }

        Map<Long, Long> spouseMap = new HashMap<>();
        for (Relationship rel : relationships) {
            if (rel.getSpouse() != null) {
                spouseMap.put(rel.getPerson().getId(), rel.getSpouse().getId());
            }
        }

        for (Relationship rel : relationships) {
            Long childId = rel.getPerson().getId();
            if (rel.getFather() != null) {
                Long fatherId = rel.getFather().getId();
                TreeNode fatherNode = personMap.get(fatherId);
                if (fatherNode != null && fatherNode.children.stream().noneMatch(c -> c.id.equals(childId))) {
                    Child child = new Child();
                    child.id = childId;
                    TreeNode childNode = personMap.get(childId);
                    if (childNode != null) {
                        child.name = childNode.name;
                    }
                    fatherNode.children.add(child);
                }
                childrenIds.add(childId);
            }
            if (rel.getMother() != null) {
                Long motherId = rel.getMother().getId();
                TreeNode motherNode = personMap.get(motherId);
                if (motherNode != null && motherNode.children.stream().noneMatch(c -> c.id.equals(childId))) {
                    Child child = new Child();
                    child.id = childId;
                    TreeNode childNode = personMap.get(childId);
                    if (childNode != null) {
                        child.name = childNode.name;
                    }
                    motherNode.children.add(child);
                }
                childrenIds.add(childId);
            }
        }

        List<Map<String, Object>> roots = new ArrayList<>();
        for (Person p : persons) {
            if (!childrenIds.contains(p.getId())) {
                Map<String, Object> rootData = new HashMap<>();
                TreeNode node = personMap.get(p.getId());
                if (node != null) {
                    rootData.put("id", node.id);
                    rootData.put("name", node.name);
                    rootData.put("gender", node.gender);
                    rootData.put("birthYear", node.birthYear);
                    rootData.put("deathYear", node.deathYear);
                    rootData.put("biography", node.biography);
                    rootData.put("avatar", node.avatar);
                    rootData.put("spouseId", spouseMap.get(node.id));
                    rootData.put("children", buildEChartsChildren(node, personMap, spouseMap, new HashSet<>()));
                    roots.add(rootData);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("persons", persons);
        result.put("roots", roots);
        result.put("totalCount", persons.size());
        return result;
    }

    private List<Map<String, Object>> buildEChartsChildren(TreeNode node, Map<Long, TreeNode> personMap,
                                                           Map<Long, Long> spouseMap, Set<Long> visited) {
        if (node == null || node.children == null) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Child child : node.children) {
            if (visited.contains(child.id)) {
                continue;
            }
            visited.add(child.id);
            
            TreeNode childNode = personMap.get(child.id);
            if (childNode == null) {
                continue;
            }

            Map<String, Object> childData = new HashMap<>();
            childData.put("id", childNode.id);
            childData.put("name", childNode.name);
            childData.put("gender", childNode.gender);
            childData.put("birthYear", childNode.birthYear);
            childData.put("deathYear", childNode.deathYear);
            childData.put("biography", childNode.biography);
            childData.put("avatar", childNode.avatar);
            childData.put("spouseId", spouseMap.get(childNode.id));
            childData.put("children", buildEChartsChildren(childNode, personMap, spouseMap, visited));
            result.add(childData);
        }
        return result;
    }

    private static class TreeNode {
        Long id;
        String name;
        String gender;
        Integer birthYear;
        Integer deathYear;
        String biography;
        String avatar;
        List<Child> children;
    }

    private static class Child {
        Long id;
        String name;
    }
}
