package com.medical.knowledgegraph.config;

import com.medical.knowledgegraph.entity.Disease;
import com.medical.knowledgegraph.entity.Drug;
import com.medical.knowledgegraph.entity.Symptom;
import com.medical.knowledgegraph.repository.DiseaseRepository;
import com.medical.knowledgegraph.repository.DrugRepository;
import com.medical.knowledgegraph.repository.SymptomRepository;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final Driver driver;
    private final DiseaseRepository diseaseRepository;
    private final DrugRepository drugRepository;
    private final SymptomRepository symptomRepository;

    @Autowired
    public DataInitializer(Driver driver, 
                          DiseaseRepository diseaseRepository,
                          DrugRepository drugRepository,
                          SymptomRepository symptomRepository) {
        this.driver = driver;
        this.diseaseRepository = diseaseRepository;
        this.drugRepository = drugRepository;
        this.symptomRepository = symptomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!isDataInitialized()) {
            System.out.println("初始化医疗知识图谱示例数据...");
            initializeSampleData();
            System.out.println("数据初始化完成！");
        } else {
            System.out.println("数据已存在，跳过初始化。");
        }
    }

    private boolean isDataInitialized() {
        try (Session session = driver.session()) {
            long count = session.run("MATCH (n) RETURN count(n) as count")
                .single()
                .get("count")
                .asLong();
            return count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void initializeSampleData() {
        try {
            createSymptoms();
            createDiseases();
            createDrugs();
            createRelationships();
        } catch (Exception e) {
            System.err.println("数据初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createSymptoms() {
        Map<String, String[]> symptoms = new LinkedHashMap<>();
        symptoms.put("头痛", new String[]{"头部疼痛的症状", "中等"});
        symptoms.put("发热", new String[]{"体温升高超过正常范围", "高"});
        symptoms.put("咳嗽", new String[]{"呼吸道刺激引起的反射动作", "中等"});
        symptoms.put("腹痛", new String[]{"腹部区域的疼痛感", "高"});
        symptoms.put("呕吐", new String[]{"胃内容物经口排出", "中等"});
        symptoms.put("乏力", new String[]{"全身无力、疲劳感", "低"});
        symptoms.put("失眠", new String[]{"难以入睡或保持睡眠", "中等"});
        symptoms.put("皮疹", new String[]{"皮肤出现的异常变化", "中等"});
        symptoms.put("关节痛", new String[]{"关节部位的疼痛感", "中等"});
        symptoms.put("呼吸困难", new String[]{"呼吸感到困难或费力", "高"});
        symptoms.put("流鼻涕", new String[]{"鼻腔分泌物增多", "低"});
        symptoms.put("喉咙痛", new String[]{"咽喉部位的疼痛感", "中等"});
        symptoms.put("腹泻", new String[]{"排便次数增多且粪便稀薄", "中等"});
        symptoms.put("恶心", new String[]{"胃部不适，有呕吐感", "中等"});
        symptoms.put("胸闷", new String[]{"胸部感到压迫或不适", "高"});

        for (Map.Entry<String, String[]> entry : symptoms.entrySet()) {
            Symptom symptom = new Symptom(entry.getKey(), entry.getValue()[0], entry.getValue()[1]);
            symptomRepository.save(symptom);
        }
    }

    private void createDiseases() {
        Map<String, String[]> diseases = new LinkedHashMap<>();
        diseases.put("感冒", new String[]{"由病毒引起的上呼吸道感染", "呼吸系统疾病"});
        diseases.put("流感", new String[]{"由流感病毒引起的急性呼吸道感染", "呼吸系统疾病"});
        diseases.put("肺炎", new String[]{"肺部组织的炎症", "呼吸系统疾病"});
        diseases.put("胃炎", new String[]{"胃黏膜的炎症", "消化系统疾病"});
        diseases.put("急性肠胃炎", new String[]{"胃肠道的急性炎症", "消化系统疾病"});
        diseases.put("偏头痛", new String[]{"反复发作的搏动性头痛", "神经系统疾病"});
        diseases.put("高血压", new String[]{"血压持续升高的疾病", "心血管疾病"});
        diseases.put("糖尿病", new String[]{"血糖代谢紊乱的疾病", "内分泌疾病"});
        diseases.put("过敏性鼻炎", new String[]{"对过敏原产生的鼻腔炎症", "免疫系统疾病"});
        diseases.put("湿疹", new String[]{"皮肤炎症性疾病", "皮肤疾病"});
        diseases.put("哮喘", new String[]{"慢性气道炎症性疾病", "呼吸系统疾病"});
        diseases.put("胃溃疡", new String[]{"胃黏膜形成的溃疡", "消化系统疾病"});
        diseases.put("抑郁症", new String[]{"情绪障碍性疾病", "精神疾病"});
        diseases.put("关节炎", new String[]{"关节炎症性疾病", "骨骼肌肉疾病"});
        diseases.put("冠心病", new String[]{"冠状动脉粥样硬化性心脏病", "心血管疾病"});

        for (Map.Entry<String, String[]> entry : diseases.entrySet()) {
            Disease disease = new Disease(entry.getKey(), entry.getValue()[0], entry.getValue()[1]);
            diseaseRepository.save(disease);
        }
    }

    private void createDrugs() {
        Map<String, Object[]> drugs = new LinkedHashMap<>();
        drugs.put("阿司匹林", new Object[]{
            "非甾体抗炎药，用于止痛和退烧", 
            "解热镇痛药", 
            new HashSet<>(Arrays.asList("胃肠道不适", "过敏反应", "出血风险"))
        });
        drugs.put("布洛芬", new Object[]{
            "非甾体抗炎药，用于缓解疼痛和炎症", 
            "解热镇痛药", 
            new HashSet<>(Arrays.asList("胃部不适", "头晕", "皮疹"))
        });
        drugs.put("对乙酰氨基酚", new Object[]{
            "常用的解热镇痛药", 
            "解热镇痛药", 
            new HashSet<>(Arrays.asList("肝损伤（过量）", "过敏反应"))
        });
        drugs.put("阿莫西林", new Object[]{
            "广谱青霉素类抗生素", 
            "抗生素", 
            new HashSet<>(Arrays.asList("腹泻", "皮疹", "过敏反应"))
        });
        drugs.put("头孢克洛", new Object[]{
            "第二代头孢菌素类抗生素", 
            "抗生素", 
            new HashSet<>(Arrays.asList("胃肠道反应", "过敏反应", "伪膜性肠炎"))
        });
        drugs.put("奥美拉唑", new Object[]{
            "质子泵抑制剂，用于治疗胃酸过多", 
            "消化系统药物", 
            new HashSet<>(Arrays.asList("头痛", "腹泻", "恶心"))
        });
        drugs.put("氯雷他定", new Object[]{
            "第二代抗组胺药，用于抗过敏", 
            "抗过敏药", 
            new HashSet<>(Arrays.asList("头痛", "嗜睡", "口干"))
        });
        drugs.put("二甲双胍", new Object[]{
            "一线口服降糖药", 
            "降糖药", 
            new HashSet<>(Arrays.asList("胃肠道反应", "乳酸酸中毒（罕见）", "维生素B12缺乏"))
        });
        drugs.put("硝苯地平", new Object[]{
            "钙通道阻滞剂，用于降血压", 
            "降压药", 
            new HashSet<>(Arrays.asList("面部潮红", "头痛", "下肢水肿"))
        });
        drugs.put("布地奈德", new Object[]{
            "糖皮质激素吸入剂，用于哮喘", 
            "呼吸系统药物", 
            new HashSet<>(Arrays.asList("声音嘶哑", "口腔念珠菌感染", "咳嗽"))
        });

        for (Map.Entry<String, Object[]> entry : drugs.entrySet()) {
            Drug drug = new Drug(
                entry.getKey(), 
                (String) entry.getValue()[0], 
                (String) entry.getValue()[1],
                (Set<String>) entry.getValue()[2]
            );
            drugRepository.save(drug);
        }
    }

    private void createRelationships() {
        try (Session session = driver.session()) {
            String cypher = """
                // 感冒的症状
                MATCH (d:Disease {name: '感冒'}), (s:Symptom)
                WHERE s.name IN ['头痛', '发热', '咳嗽', '流鼻涕', '喉咙痛', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 流感的症状
                MATCH (d:Disease {name: '流感'}), (s:Symptom)
                WHERE s.name IN ['发热', '头痛', '乏力', '咳嗽']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 肺炎的症状
                MATCH (d:Disease {name: '肺炎'}), (s:Symptom)
                WHERE s.name IN ['发热', '咳嗽', '呼吸困难', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 胃炎的症状
                MATCH (d:Disease {name: '胃炎'}), (s:Symptom)
                WHERE s.name IN ['腹痛', '恶心', '呕吐', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 急性肠胃炎的症状
                MATCH (d:Disease {name: '急性肠胃炎'}), (s:Symptom)
                WHERE s.name IN ['腹痛', '腹泻', '呕吐', '发热', '恶心', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 偏头痛的症状
                MATCH (d:Disease {name: '偏头痛'}), (s:Symptom)
                WHERE s.name IN ['头痛', '恶心', '呕吐', '失眠']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 高血压的症状
                MATCH (d:Disease {name: '高血压'}), (s:Symptom)
                WHERE s.name IN ['头痛', '头晕', '胸闷', '乏力', '失眠']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 糖尿病的症状
                MATCH (d:Disease {name: '糖尿病'}), (s:Symptom)
                WHERE s.name IN ['乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 过敏性鼻炎的症状
                MATCH (d:Disease {name: '过敏性鼻炎'}), (s:Symptom)
                WHERE s.name IN ['流鼻涕', '喉咙痛']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 湿疹的症状
                MATCH (d:Disease {name: '湿疹'}), (s:Symptom)
                WHERE s.name IN ['皮疹']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 哮喘的症状
                MATCH (d:Disease {name: '哮喘'}), (s:Symptom)
                WHERE s.name IN ['呼吸困难', '咳嗽', '胸闷']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 胃溃疡的症状
                MATCH (d:Disease {name: '胃溃疡'}), (s:Symptom)
                WHERE s.name IN ['腹痛', '恶心', '呕吐', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 抑郁症的症状
                MATCH (d:Disease {name: '抑郁症'}), (s:Symptom)
                WHERE s.name IN ['失眠', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 关节炎的症状
                MATCH (d:Disease {name: '关节炎'}), (s:Symptom)
                WHERE s.name IN ['关节痛', '发热', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 冠心病的症状
                MATCH (d:Disease {name: '冠心病'}), (s:Symptom)
                WHERE s.name IN ['胸闷', '呼吸困难', '乏力']
                CREATE (d)-[:HAS_SYMPTOM]->(s), (s)-[:INDICATES]->(d);
                
                // 疾病-药物关系
                MATCH (d:Disease {name: '感冒'}), (dr:Drug)
                WHERE dr.name IN ['对乙酰氨基酚', '布洛芬', '氯雷他定']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '流感'}), (dr:Drug)
                WHERE dr.name IN ['对乙酰氨基酚', '布洛芬']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '肺炎'}), (dr:Drug)
                WHERE dr.name IN ['阿莫西林', '头孢克洛', '对乙酰氨基酚', '布洛芬']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '胃炎'}), (dr:Drug)
                WHERE dr.name IN ['奥美拉唑']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '急性肠胃炎'}), (dr:Drug)
                WHERE dr.name IN ['奥美拉唑']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '偏头痛'}), (dr:Drug)
                WHERE dr.name IN ['布洛芬', '对乙酰氨基酚']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '高血压'}), (dr:Drug)
                WHERE dr.name IN ['硝苯地平', '阿司匹林']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '糖尿病'}), (dr:Drug)
                WHERE dr.name IN ['二甲双胍']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '过敏性鼻炎'}), (dr:Drug)
                WHERE dr.name IN ['氯雷他定']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '湿疹'}), (dr:Drug)
                WHERE dr.name IN ['氯雷他定']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '哮喘'}), (dr:Drug)
                WHERE dr.name IN ['布地奈德']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '胃溃疡'}), (dr:Drug)
                WHERE dr.name IN ['奥美拉唑']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '抑郁症'}), (dr:Drug)
                WHERE dr.name IN []
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '关节炎'}), (dr:Drug)
                WHERE dr.name IN ['布洛芬', '阿司匹林']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                
                MATCH (d:Disease {name: '冠心病'}), (dr:Drug)
                WHERE dr.name IN ['阿司匹林', '硝苯地平']
                CREATE (d)-[:TREATED_BY]->(dr), (dr)-[:TREATS]->(d);
                """;
            
            session.run(cypher);
        }
    }
}