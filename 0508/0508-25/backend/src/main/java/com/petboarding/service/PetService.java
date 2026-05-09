package com.petboarding.service;

import com.petboarding.entity.Pet;
import com.petboarding.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class PetService {
    
    private final PetRepository petRepository;
    
    public Pet createPet(Pet pet) {
        return petRepository.save(pet);
    }
    
    public Pet updatePet(Long petId, Pet petDetails) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));
        
        if (petDetails.getName() != null) pet.setName(petDetails.getName());
        if (petDetails.getType() != null) pet.setType(petDetails.getType());
        if (petDetails.getSize() != null) pet.setSize(petDetails.getSize());
        if (petDetails.getBreed() != null) pet.setBreed(petDetails.getBreed());
        if (petDetails.getAge() != null) pet.setAge(petDetails.getAge());
        if (petDetails.getSpecialNeeds() != null) pet.setSpecialNeeds(petDetails.getSpecialNeeds());
        
        return petRepository.save(pet);
    }
    
    public void deletePet(Long petId) {
        petRepository.deleteById(petId);
    }
    
    public Optional<Pet> getPetById(Long petId) {
        return petRepository.findById(petId);
    }
    
    public List<Pet> getPetsByOwner(Long ownerId) {
        return petRepository.findByOwnerId(ownerId);
    }
    
    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }
}
