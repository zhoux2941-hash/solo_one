package com.healthcare.config;

import com.healthcare.entity.CareItem;
import com.healthcare.entity.CareLevel;
import com.healthcare.entity.DietaryRestriction;
import com.healthcare.entity.MealRecipe;
import com.healthcare.entity.Staff;
import com.healthcare.repository.CareItemRepository;
import com.healthcare.repository.CareLevelRepository;
import com.healthcare.repository.DietaryRestrictionRepository;
import com.healthcare.repository.MealRecipeRepository;
import com.healthcare.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CareLevelRepository careLevelRepository;

    @Autowired
    private CareItemRepository careItemRepository;

    @Autowired
    private DietaryRestrictionRepository dietaryRestrictionRepository;

    @Autowired
    private MealRecipeRepository mealRecipeRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Override
    public void run(String... args) throws Exception {
        initCareLevels();
        initCareItems();
        initDietaryRestrictions();
        initMealRecipes();
        initStaff();
    }

    private void initCareLevels() {
        if (careLevelRepository.count() == 0) {
            String[][] levels = {
                {"LEVEL1", "自理级", "生活完全自理，无需护理协助", "1000"},
                {"LEVEL2", "介助级", "部分生活需要协助，如洗漱、穿衣等", "2000"},
                {"LEVEL3", "介护级", "大部分生活需要护理，包括移动、如厕等", "3500"},
                {"LEVEL4", "特护级", "全天候护理，包括医疗护理和生活照料", "5000"}
            };

            for (int i = 0; i < levels.length; i++) {
                CareLevel level = new CareLevel();
                level.setLevelCode(levels[i][0]);
                level.setLevelName(levels[i][1]);
                level.setDescription(levels[i][2]);
                level.setBaseFee(new BigDecimal(levels[i][3]));
                level.setSortOrder(i + 1);
                level.setStatus(1);
                careLevelRepository.save(level);
            }
            System.out.println("护理等级数据初始化完成");
        }
    }

    private void initCareItems() {
        if (careItemRepository.count() == 0) {
            String[][] items = {
                {"CARE001", "晨间护理", "协助洗漱、穿衣、整理床单位", "生活护理", "每日一次", "50", "30"},
                {"CARE002", "晚间护理", "协助洗漱、洗脚、整理床单位", "生活护理", "每日一次", "50", "30"},
                {"CARE003", "饮食照料", "协助进食、喂饭、饮水", "生活护理", "每日三次", "30", "20"},
                {"CARE004", "排泄照料", "协助如厕、更换尿垫、清洁护理", "生活护理", "按需", "40", "15"},
                {"CARE005", "体位转换", "协助翻身、移动、坐起", "生活护理", "每2小时一次", "30", "10"},
                {"CARE006", "血压测量", "定期测量血压并记录", "医疗护理", "每日一次", "20", "5"},
                {"CARE007", "血糖监测", "定期测量血糖并记录", "医疗护理", "按需", "30", "5"},
                {"CARE008", "用药照料", "提醒、协助按时服药", "医疗护理", "每日三次", "20", "10"},
                {"CARE009", "康复锻炼", "协助进行肢体活动、康复训练", "康复护理", "每日一次", "100", "60"},
                {"CARE010", "心理关怀", "陪伴聊天、心理疏导", "心理护理", "每日一次", "80", "30"}
            };

            for (String[] item : items) {
                CareItem careItem = new CareItem();
                careItem.setItemCode(item[0]);
                careItem.setItemName(item[1]);
                careItem.setDescription(item[2]);
                careItem.setCategory(item[3]);
                careItem.setDefaultFrequency(item[4]);
                careItem.setUnitPrice(new BigDecimal(item[5]));
                careItem.setEstimatedDuration(Integer.parseInt(item[6]));
                careItem.setStatus(1);
                careItemRepository.save(careItem);
            }
            System.out.println("护理项目数据初始化完成");
        }
    }

    private void initDietaryRestrictions() {
        if (dietaryRestrictionRepository.count() == 0) {
            String[][] restrictions = {
                {"DIET001", "低盐饮食", "适用于高血压、心脏病患者", "慢性病", "食盐、腌制品、咸菜"},
                {"DIET002", "低脂饮食", "适用于高血脂、肥胖症患者", "慢性病", "肥肉、油炸食品、动物内脏"},
                {"DIET003", "糖尿病饮食", "适用于糖尿病患者", "慢性病", "糖果、甜食、高糖水果"},
                {"DIET004", "低嘌呤饮食", "适用于痛风患者", "慢性病", "海鲜、动物内脏、肉汤"},
                {"DIET005", "流质饮食", "适用于术后、吞咽困难患者", "特殊需求", "固体食物、难消化食物"},
                {"DIET006", "素食", "素食主义者", "个人偏好", "所有肉类、动物制品"},
                {"DIET007", "清真饮食", "穆斯林饮食要求", "宗教信仰", "猪肉、非清真肉类"}
            };

            for (String[] restriction : restrictions) {
                DietaryRestriction dr = new DietaryRestriction();
                dr.setRestrictionCode(restriction[0]);
                dr.setRestrictionName(restriction[1]);
                dr.setDescription(restriction[2]);
                dr.setRestrictionType(restriction[3]);
                dr.setForbiddenIngredients(restriction[4]);
                dr.setStatus(1);
                dietaryRestrictionRepository.save(dr);
            }
            System.out.println("饮食禁忌数据初始化完成");
        }
    }

    private void initMealRecipes() {
        if (mealRecipeRepository.count() == 0) {
            String[][] recipes = {
                {"BREAKFAST001", "小米粥配馒头", "早餐", "小米、面粉", "熬粥蒸馒头", "300", "清淡易消化", "", "糖尿病"},
                {"BREAKFAST002", "牛奶配面包", "早餐", "牛奶、面包", "加热牛奶", "250", "营养丰富", "", "乳糖不耐受"},
                {"BREAKFAST003", "鸡蛋羹", "早餐", "鸡蛋、水", "蒸制", "150", "高蛋白易消化", "", ""},
                {"LUNCH001", "清蒸鱼配米饭", "午餐", "鱼、大米、青菜", "清蒸、炒制", "450", "高蛋白低脂肪", "高血压、高血脂", "痛风"},
                {"LUNCH002", "瘦肉炒青菜配饭", "午餐", "瘦肉、青菜、大米", "炒制", "400", "均衡营养", "", ""},
                {"LUNCH003", "南瓜饭配蔬菜汤", "午餐", "南瓜、大米、蔬菜", "蒸煮", "350", "低糖高纤维", "糖尿病", ""},
                {"DINNER001", "小米绿豆粥配小菜", "晚餐", "小米、绿豆、咸菜", "熬粥", "250", "清淡去火", "", ""},
                {"DINNER002", "蔬菜面条", "晚餐", "面条、蔬菜", "煮制", "300", "易消化", "", ""},
                {"DINNER003", "豆腐脑配花卷", "晚餐", "黄豆、面粉", "制作豆腐脑、蒸花卷", "280", "高蛋白易消化", "", "痛风"}
            };

            for (String[] recipe : recipes) {
                MealRecipe mr = new MealRecipe();
                mr.setRecipeCode(recipe[0]);
                mr.setRecipeName(recipe[1]);
                mr.setMealType(recipe[2]);
                mr.setIngredients(recipe[3]);
                mr.setCookingMethod(recipe[4]);
                mr.setCalories(new BigDecimal(recipe[5]));
                mr.setNutritionalInfo(recipe[6]);
                mr.setSuitableFor(recipe[7]);
                mr.setNotSuitableFor(recipe[8]);
                mr.setStatus(1);
                mealRecipeRepository.save(mr);
            }
            System.out.println("食谱数据初始化完成");
        }
    }

    private void initStaff() {
        if (staffRepository.count() == 0) {
            String[][] staffs = {
                {"N001", "张护士", "女", "护士", "护士长", "护理部", "A组", "在岗", "13800138001"},
                {"N002", "李护理", "女", "护理员", "高级护理员", "护理部", "A组", "在岗", "13800138002"},
                {"N003", "王护理", "男", "护理员", "中级护理员", "护理部", "B组", "在岗", "13800138003"},
                {"N004", "赵护理", "女", "护理员", "初级护理员", "护理部", "B组", "在岗", "13800138004"},
                {"N005", "刘医生", "男", "医生", "主治医师", "医疗部", "A组", "在岗", "13800138005"},
                {"N006", "陈护士", "女", "护士", "护士", "护理部", "C组", "在岗", "13800138006"},
                {"N007", "杨护理", "男", "护理员", "高级护理员", "护理部", "C组", "休假", "13800138007"},
                {"N008", "黄护理", "女", "护理员", "中级护理员", "护理部", "A组", "在岗", "13800138008"}
            };

            for (String[] staff : staffs) {
                Staff s = new Staff();
                s.setStaffNo(staff[0]);
                s.setName(staff[1]);
                s.setGender(staff[2]);
                s.setStaffType(staff[3]);
                s.setPosition(staff[4]);
                s.setDepartment(staff[5]);
                s.setDutyGroup(staff[6]);
                s.setWorkStatus(staff[7]);
                s.setPhone(staff[8]);
                s.setStatus(1);
                s.setCreateTime(LocalDateTime.now());
                s.setUpdateTime(LocalDateTime.now());
                staffRepository.save(s);
            }
            System.out.println("医护人员数据初始化完成");
        }
    }
}
