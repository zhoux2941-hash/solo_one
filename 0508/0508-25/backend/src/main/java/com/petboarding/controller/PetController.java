package com.petboarding.controller;

import com.petboarding.entity.Pet;
import com.petboarding.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {
    
    private final PetService petService;
    
    @GetMapping
    public ResponseEntity<List<Pet>> getAllPets() {
        return ResponseEntity.ok(petService.getAllPets());
    }
    
    @GetMapping("/{petId}")
    public ResponseEntity<Pet> getPetById(@PathVariable Long petId) {
        return petService.getPetById(petId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Pet>> getPetsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(petService.getPetsByOwner(ownerId));
    }
    
    @PostMapping
    public ResponseEntity<Pet> createPet(@RequestBody Pet pet) {
        Pet created = petService.createPet(pet);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{petId}")
    public ResponseEntity<Pet> updatePet(@PathVariable Long petId, @RequestBody Pet pet) {
        Pet updated = petService.updatePet(petId, pet);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(@PathVariable Long petId) {
        petService.deletePet(petId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/types")
    public ResponseEntity<Map<String, String>> getPetTypes() {
        return ResponseEntity.ok(Map.of(
                "DOG", "狗",
                "CAT", "猫"
        ));
    }
    
    @GetMapping("/sizes")
    public ResponseEntity<Map<String, String>> getPetSizes() {
        return ResponseEntity.ok(Map.of(
                "SMALL", "小型",
                "MEDIUM", "中型",
                "LARGE", "大型"
        ));
    }
}
