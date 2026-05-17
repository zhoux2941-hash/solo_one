package com.healthcare.service;

import com.healthcare.entity.Elder;
import com.healthcare.entity.MealPlan;
import com.healthcare.entity.MealRecipe;
import com.healthcare.repository.ElderRepository;
import com.healthcare.repository.MealPlanRepository;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class MealPlanService {
    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private ElderRepository elderRepository;

    @Autowired
    private MealRecipeRepository mealRecipeRepository;

    @Autowired
    private MealRecipeService mealRecipeService;

    public MealPlan save(MealPlan mealPlan) {
        if (mealPlan.getId() == null) {
            if (mealPlan.getPlanNo() == null) {
                mealPlan.setPlanNo(generatePlanNo());
            }
            if (mealPlanRepository.existsByPlanNo(mealPlan.getPlanNo())) {
                throw new RuntimeException("用餐计划编号已存在");
            }
        } else {
            if (mealPlanRepository.existsByPlanNoAndIdNot(mealPlan.getPlanNo(), mealPlan.getId())) {
                throw new RuntimeException("用餐计划编号已存在");
            }
        }
        return mealPlanRepository.save(mealPlan);
    }

    private String generatePlanNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String dateStr = LocalDate.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(10000);
        return "MP" + dateStr + String.format("%04d", randomNum);
    }

    public void delete(Long id) {
        mealPlanRepository.deleteById(id);
    }

    public MealPlan findById(Long id) {
        Optional<MealPlan> opt = mealPlanRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<MealPlan> findPage(int page, int size, Long elderId, LocalDate startDate, LocalDate endDate, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "planDate"));
        Specification<MealPlan> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (elderId != null) {
                predicates.add(cb.equal(root.get("elderId"), elderId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("planDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("planDate"), endDate));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return mealPlanRepository.findAll(spec, pageable);
    }

    public List<MealPlan> autoGeneratePlans(Long elderId, LocalDate startDate, LocalDate endDate) {
        Optional<Elder> elderOpt = elderRepository.findById(elderId);
        if (!elderOpt.isPresent()) {
            throw new RuntimeException("长者信息不存在");
        }

        List<MealRecipe> breakfastRecipes = mealRecipeService.findSuitableRecipes(elderId, "早餐");
        List<MealRecipe> lunchRecipes = mealRecipeService.findSuitableRecipes(elderId, "午餐");
        List<MealRecipe> dinnerRecipes = mealRecipeService.findSuitableRecipes(elderId, "晚餐");

        List<MealPlan> plans = new ArrayList<>();
        LocalDate current = startDate;
        Random random = new Random();

        while (!current.isAfter(endDate)) {
            MealPlan plan = new MealPlan();
            plan.setPlanNo(generatePlanNo());
            plan.setElderId(elderId);
            plan.setPlanDate(current);
            plan.setStatus("待确认");

            if (!breakfastRecipes.isEmpty()) {
                plan.setBreakfastRecipeId(breakfastRecipes.get(random.nextInt(breakfastRecipes.size())).getId());
            }
            if (!lunchRecipes.isEmpty()) {
                plan.setLunchRecipeId(lunchRecipes.get(random.nextInt(lunchRecipes.size())).getId());
            }
            if (!dinnerRecipes.isEmpty()) {
                plan.setDinnerRecipeId(dinnerRecipes.get(random.nextInt(dinnerRecipes.size())).getId());
            }

            plans.add(mealPlanRepository.save(plan));
            current = current.plusDays(1);
        }

        return plans;
    }

    public List<MealPlan> batchGeneratePlans(LocalDate startDate, LocalDate endDate, String careLevel) {
        List<Elder> elders = elderRepository.findAll();
        List<MealPlan> allPlans = new ArrayList<>();

        for (Elder elder : elders) {
            if (!"在住".equals(elder.getLivingStatus())) {
                continue;
            }
            if (careLevel != null && !careLevel.equals(elder.getCareLevel())) {
                continue;
            }

            List<MealPlan> plans = autoGeneratePlans(elder.getId(), startDate, endDate);
            allPlans.addAll(plans);
        }

        return allPlans;
    }

    public boolean validateMealPlan(Long elderId, Long breakfastRecipeId, Long lunchRecipeId, Long dinnerRecipeId) {
        List<String> errors = new ArrayList<>();

        if (breakfastRecipeId != null && !mealRecipeService.isRecipeSuitable(elderId, breakfastRecipeId)) {
            errors.add("早餐食谱不适合该长者");
        }
        if (lunchRecipeId != null && !mealRecipeService.isRecipeSuitable(elderId, lunchRecipeId)) {
            errors.add("午餐食谱不适合该长者");
        }
        if (dinnerRecipeId != null && !mealRecipeService.isRecipeSuitable(elderId, dinnerRecipeId)) {
            errors.add("晚餐食谱不适合该长者");
        }

        return errors.isEmpty();
    }
}
