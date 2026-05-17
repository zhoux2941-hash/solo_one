package com.healthcare.service;

import com.healthcare.entity.Elder;
import com.healthcare.entity.MealRecipe;
import com.healthcare.repository.ElderRepository;
import com.healthcare.repository.MealRecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MealRecipeService {
    @Autowired
    private MealRecipeRepository mealRecipeRepository;

    @Autowired
    private ElderRepository elderRepository;

    public MealRecipe save(MealRecipe mealRecipe) {
        if (mealRecipe.getId() == null) {
            if (mealRecipeRepository.existsByRecipeCode(mealRecipe.getRecipeCode())) {
                throw new RuntimeException("食谱编码已存在");
            }
        } else {
            if (mealRecipeRepository.existsByRecipeCodeAndIdNot(mealRecipe.getRecipeCode(), mealRecipe.getId())) {
                throw new RuntimeException("食谱编码已存在");
            }
        }
        return mealRecipeRepository.save(mealRecipe);
    }

    public void delete(Long id) {
        mealRecipeRepository.deleteById(id);
    }

    public MealRecipe findById(Long id) {
        Optional<MealRecipe> opt = mealRecipeRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<MealRecipe> findPage(int page, int size, String recipeName, String mealType) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<MealRecipe> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(recipeName)) {
                predicates.add(cb.like(root.get("recipeName"), "%" + recipeName + "%"));
            }
            if (StringUtils.hasText(mealType)) {
                predicates.add(cb.equal(root.get("mealType"), mealType));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return mealRecipeRepository.findAll(spec, pageable);
    }

    public List<MealRecipe> findAll() {
        return mealRecipeRepository.findByStatusOrderByIdAsc(1);
    }

    public List<MealRecipe> findByMealType(String mealType) {
        return mealRecipeRepository.findByMealTypeAndStatusOrderByIdAsc(mealType, 1);
    }

    public List<MealRecipe> findSuitableRecipes(Long elderId, String mealType) {
        Optional<Elder> elderOpt = elderRepository.findById(elderId);
        if (!elderOpt.isPresent()) {
            throw new RuntimeException("长者信息不存在");
        }

        Elder elder = elderOpt.get();
        List<MealRecipe> allRecipes = findByMealType(mealType);
        List<MealRecipe> suitableRecipes = new ArrayList<>();

        String dietaryRestrictions = elder.getDietaryRestrictions();
        String chronicDiseases = elder.getChronicDiseases();

        for (MealRecipe recipe : allRecipes) {
            boolean isSuitable = true;

            if (dietaryRestrictions != null && !dietaryRestrictions.isEmpty()) {
                String notSuitableFor = recipe.getNotSuitableFor();
                if (notSuitableFor != null && !notSuitableFor.isEmpty()) {
                    String[] restrictions = dietaryRestrictions.split("[,，、]");
                    for (String restriction : restrictions) {
                        if (notSuitableFor.contains(restriction.trim())) {
                            isSuitable = false;
                            break;
                        }
                    }
                }
            }

            if (isSuitable && chronicDiseases != null && !chronicDiseases.isEmpty()) {
                String notSuitableFor = recipe.getNotSuitableFor();
                if (notSuitableFor != null && !notSuitableFor.isEmpty()) {
                    String[] diseases = chronicDiseases.split("[,，、]");
                    for (String disease : diseases) {
                        if (notSuitableFor.contains(disease.trim())) {
                            isSuitable = false;
                            break;
                        }
                    }
                }
            }

            if (isSuitable) {
                suitableRecipes.add(recipe);
            }
        }

        return suitableRecipes;
    }

    public boolean isRecipeSuitable(Long elderId, Long recipeId) {
        Optional<Elder> elderOpt = elderRepository.findById(elderId);
        if (!elderOpt.isPresent()) {
            return false;
        }

        Optional<MealRecipe> recipeOpt = mealRecipeRepository.findById(recipeId);
        if (!recipeOpt.isPresent()) {
            return false;
        }

        Elder elder = elderOpt.get();
        MealRecipe recipe = recipeOpt.get();

        String dietaryRestrictions = elder.getDietaryRestrictions();
        String chronicDiseases = elder.getChronicDiseases();
        String notSuitableFor = recipe.getNotSuitableFor();

        if (notSuitableFor == null || notSuitableFor.isEmpty()) {
            return true;
        }

        if (dietaryRestrictions != null && !dietaryRestrictions.isEmpty()) {
            String[] restrictions = dietaryRestrictions.split("[,，、]");
            for (String restriction : restrictions) {
                if (notSuitableFor.contains(restriction.trim())) {
                    return false;
                }
            }
        }

        if (chronicDiseases != null && !chronicDiseases.isEmpty()) {
            String[] diseases = chronicDiseases.split("[,，、]");
            for (String disease : diseases) {
                if (notSuitableFor.contains(disease.trim())) {
                    return false;
                }
            }
        }

        return true;
    }
}
