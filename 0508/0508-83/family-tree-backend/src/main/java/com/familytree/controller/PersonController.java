package com.familytree.controller;

import com.familytree.dto.PersonDTO;
import com.familytree.entity.Person;
import com.familytree.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/family-spaces/{familySpaceId}/persons")
@CrossOrigin
public class PersonController {
    @Autowired
    private PersonService personService;

    @GetMapping
    public ResponseEntity<?> getAllPersons(@PathVariable Long familySpaceId) {
        try {
            List<Person> persons = personService.getAllPersons(familySpaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", persons);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPerson(@PathVariable Long familySpaceId, @PathVariable Long id) {
        try {
            Person person = personService.getPersonWithRelationship(familySpaceId, id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", person);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping
    public ResponseEntity<?> createPerson(@PathVariable Long familySpaceId, @Validated @RequestBody PersonDTO dto) {
        try {
            Person person = personService.createPerson(familySpaceId, dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "添加成功");
            result.put("data", person);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerson(@PathVariable Long familySpaceId, @PathVariable Long id, 
                                           @Validated @RequestBody PersonDTO dto) {
        try {
            Person person = personService.updatePerson(familySpaceId, id, dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "更新成功");
            result.put("data", person);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePerson(@PathVariable Long familySpaceId, @PathVariable Long id,
                                          @RequestParam(required = false) Long newParentId) {
        try {
            personService.deletePerson(familySpaceId, id, newParentId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "删除成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
