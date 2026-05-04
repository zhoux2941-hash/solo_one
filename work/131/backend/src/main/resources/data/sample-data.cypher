// 医疗知识图谱示例数据
// 此脚本用于初始化Neo4j数据库中的医疗知识图谱数据

// 清除现有数据（谨慎使用）
// MATCH (n) DETACH DELETE n;

// 创建症状节点
CREATE (s1:Symptom {name: '头痛', description: '头部疼痛的症状', severity: '中等'}),
       (s2:Symptom {name: '发热', description: '体温升高超过正常范围', severity: '高'}),
       (s3:Symptom {name: '咳嗽', description: '呼吸道刺激引起的反射动作', severity: '中等'}),
       (s4:Symptom {name: '腹痛', description: '腹部区域的疼痛感', severity: '高'}),
       (s5:Symptom {name: '呕吐', description: '胃内容物经口排出', severity: '中等'}),
       (s6:Symptom {name: '乏力', description: '全身无力、疲劳感', severity: '低'}),
       (s7:Symptom {name: '失眠', description: '难以入睡或保持睡眠', severity: '中等'}),
       (s8:Symptom {name: '皮疹', description: '皮肤出现的异常变化', severity: '中等'}),
       (s9:Symptom {name: '关节痛', description: '关节部位的疼痛感', severity: '中等'}),
       (s10:Symptom {name: '呼吸困难', description: '呼吸感到困难或费力', severity: '高'}),
       (s11:Symptom {name: '流鼻涕', description: '鼻腔分泌物增多', severity: '低'}),
       (s12:Symptom {name: '喉咙痛', description: '咽喉部位的疼痛感', severity: '中等'}),
       (s13:Symptom {name: '腹泻', description: '排便次数增多且粪便稀薄', severity: '中等'}),
       (s14:Symptom {name: '恶心', description: '胃部不适，有呕吐感', severity: '中等'}),
       (s15:Symptom {name: '胸闷', description: '胸部感到压迫或不适', severity: '高'});

// 创建疾病节点
CREATE (d1:Disease {name: '感冒', description: '由病毒引起的上呼吸道感染', category: '呼吸系统疾病'}),
       (d2:Disease {name: '流感', description: '由流感病毒引起的急性呼吸道感染', category: '呼吸系统疾病'}),
       (d3:Disease {name: '肺炎', description: '肺部组织的炎症', category: '呼吸系统疾病'}),
       (d4:Disease {name: '胃炎', description: '胃黏膜的炎症', category: '消化系统疾病'}),
       (d5:Disease {name: '急性肠胃炎', description: '胃肠道的急性炎症', category: '消化系统疾病'}),
       (d6:Disease {name: '偏头痛', description: '反复发作的搏动性头痛', category: '神经系统疾病'}),
       (d7:Disease {name: '高血压', description: '血压持续升高的疾病', category: '心血管疾病'}),
       (d8:Disease {name: '糖尿病', description: '血糖代谢紊乱的疾病', category: '内分泌疾病'}),
       (d9:Disease {name: '过敏性鼻炎', description: '对过敏原产生的鼻腔炎症', category: '免疫系统疾病'}),
       (d10:Disease {name: '湿疹', description: '皮肤炎症性疾病', category: '皮肤疾病'}),
       (d11:Disease {name: '哮喘', description: '慢性气道炎症性疾病', category: '呼吸系统疾病'}),
       (d12:Disease {name: '胃溃疡', description: '胃黏膜形成的溃疡', category: '消化系统疾病'}),
       (d13:Disease {name: '抑郁症', description: '情绪障碍性疾病', category: '精神疾病'}),
       (d14:Disease {name: '关节炎', description: '关节炎症性疾病', category: '骨骼肌肉疾病'}),
       (d15:Disease {name: '冠心病', description: '冠状动脉粥样硬化性心脏病', category: '心血管疾病'});

// 创建药物节点
CREATE (dr1:Drug {name: '阿司匹林', description: '非甾体抗炎药，用于止痛和退烧', category: '解热镇痛药', sideEffects: ['胃肠道不适', '过敏反应', '出血风险']}),
       (dr2:Drug {name: '布洛芬', description: '非甾体抗炎药，用于缓解疼痛和炎症', category: '解热镇痛药', sideEffects: ['胃部不适', '头晕', '皮疹']}),
       (dr3:Drug {name: '对乙酰氨基酚', description: '常用的解热镇痛药', category: '解热镇痛药', sideEffects: ['肝损伤（过量）', '过敏反应']}),
       (dr4:Drug {name: '阿莫西林', description: '广谱青霉素类抗生素', category: '抗生素', sideEffects: ['腹泻', '皮疹', '过敏反应']}),
       (dr5:Drug {name: '头孢克洛', description: '第二代头孢菌素类抗生素', category: '抗生素', sideEffects: ['胃肠道反应', '过敏反应', '伪膜性肠炎']}),
       (dr6:Drug {name: '奥美拉唑', description: '质子泵抑制剂，用于治疗胃酸过多', category: '消化系统药物', sideEffects: ['头痛', '腹泻', '恶心']}),
       (dr7:Drug {name: '氯雷他定', description: '第二代抗组胺药，用于抗过敏', category: '抗过敏药', sideEffects: ['头痛', '嗜睡', '口干']}),
       (dr8:Drug {name: '二甲双胍', description: '一线口服降糖药', category: '降糖药', sideEffects: ['胃肠道反应', '乳酸酸中毒（罕见）', '维生素B12缺乏']}),
       (dr9:Drug {name: '硝苯地平', description: '钙通道阻滞剂，用于降血压', category: '降压药', sideEffects: ['面部潮红', '头痛', '下肢水肿']}),
       (dr10:Drug {name: '布地奈德', description: '糖皮质激素吸入剂，用于哮喘', category: '呼吸系统药物', sideEffects: ['声音嘶哑', '口腔念珠菌感染', '咳嗽']}),
       (dr11:Drug {name: '曲安奈德', description: '糖皮质激素，用于皮肤炎症', category: '皮肤药物', sideEffects: ['皮肤萎缩', '毛细血管扩张', '色素沉着']}),
       (dr12:Drug {name: '多潘立酮', description: '促胃动力药', category: '消化系统药物', sideEffects: ['口干', '头痛', '泌乳素升高']}),
       (dr13:Drug {name: '舒马普坦', description: '5-HT1受体激动剂，用于偏头痛', category: '神经系统药物', sideEffects: ['头晕', '面部潮红', '胸部不适']}),
       (dr14:Drug {name: '氟西汀', description: '选择性5-羟色胺再摄取抑制剂，抗抑郁药', category: '精神药物', sideEffects: ['恶心', '失眠', '性功能障碍']}),
       (dr15:Drug {name: '阿司匹林肠溶片', description: '抗血小板聚集药物，用于心血管疾病预防', category: '心血管药物', sideEffects: ['胃肠道出血', '过敏反应', '出血风险']});

// 创建疾病-症状关系（HAS_SYMPTOM）
MATCH (d:Disease {name: '感冒'}), (s:Symptom)
WHERE s.name IN ['头痛', '发热', '咳嗽', '流鼻涕', '喉咙痛', '乏力']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '流感'}), (s:Symptom)
WHERE s.name IN ['发热', '头痛', '乏力', '咳嗽', '肌肉酸痛', '寒战']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '肺炎'}), (s:Symptom)
WHERE s.name IN ['发热', '咳嗽', '呼吸困难', '胸痛', '乏力', '咳痰']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '胃炎'}), (s:Symptom)
WHERE s.name IN ['腹痛', '恶心', '呕吐', '腹胀', '食欲不振']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '急性肠胃炎'}), (s:Symptom)
WHERE s.name IN ['腹痛', '腹泻', '呕吐', '发热', '恶心', '乏力']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '偏头痛'}), (s:Symptom)
WHERE s.name IN ['头痛', '恶心', '呕吐', '对光敏感', '对声音敏感']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '高血压'}), (s:Symptom)
WHERE s.name IN ['头痛', '头晕', '胸闷', '乏力', '失眠']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '糖尿病'}), (s:Symptom)
WHERE s.name IN ['多饮', '多尿', '多食', '体重下降', '乏力', '视力模糊']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '过敏性鼻炎'}), (s:Symptom)
WHERE s.name IN ['流鼻涕', '打喷嚏', '鼻塞', '鼻痒', '眼睛痒']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '湿疹'}), (s:Symptom)
WHERE s.name IN ['皮疹', '皮肤瘙痒', '皮肤干燥', '红斑', '渗出']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '哮喘'}), (s:Symptom)
WHERE s.name IN ['呼吸困难', '咳嗽', '胸闷', '喘息', '呼吸急促']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '胃溃疡'}), (s:Symptom)
WHERE s.name IN ['腹痛', '恶心', '呕吐', '黑便', '食欲不振', '体重下降']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '抑郁症'}), (s:Symptom)
WHERE s.name IN ['情绪低落', '失眠', '乏力', '食欲不振', '注意力下降', '自杀念头']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '关节炎'}), (s:Symptom)
WHERE s.name IN ['关节痛', '关节肿胀', '关节僵硬', '活动受限', '发热']
CREATE (d)-[:HAS_SYMPTOM]->(s);

MATCH (d:Disease {name: '冠心病'}), (s:Symptom)
WHERE s.name IN ['胸闷', '胸痛', '呼吸困难', '乏力', '心悸', '出汗']
CREATE (d)-[:HAS_SYMPTOM]->(s);

// 创建症状-疾病关系（INDICATES）
MATCH (s:Symptom), (d:Disease)
WHERE (d)-[:HAS_SYMPTOM]->(s)
CREATE (s)-[:INDICATES]->(d);

// 创建疾病-药物关系（TREATED_BY）
MATCH (d:Disease {name: '感冒'}), (dr:Drug)
WHERE dr.name IN ['对乙酰氨基酚', '布洛芬', '氯雷他定']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '流感'}), (dr:Drug)
WHERE dr.name IN ['对乙酰氨基酚', '布洛芬', '奥司他韦']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '肺炎'}), (dr:Drug)
WHERE dr.name IN ['阿莫西林', '头孢克洛', '对乙酰氨基酚', '布洛芬']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '胃炎'}), (dr:Drug)
WHERE dr.name IN ['奥美拉唑', '多潘立酮', '铝碳酸镁']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '急性肠胃炎'}), (dr:Drug)
WHERE dr.name IN ['奥美拉唑', '蒙脱石散', '口服补液盐']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '偏头痛'}), (dr:Drug)
WHERE dr.name IN ['舒马普坦', '布洛芬', '对乙酰氨基酚']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '高血压'}), (dr:Drug)
WHERE dr.name IN ['硝苯地平', '阿司匹林肠溶片', '缬沙坦']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '糖尿病'}), (dr:Drug)
WHERE dr.name IN ['二甲双胍', '格列美脲', '胰岛素']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '过敏性鼻炎'}), (dr:Drug)
WHERE dr.name IN ['氯雷他定', '布地奈德鼻喷剂', '西替利嗪']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '湿疹'}), (dr:Drug)
WHERE dr.name IN ['曲安奈德', '氯雷他定', '氢化可的松']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '哮喘'}), (dr:Drug)
WHERE dr.name IN ['布地奈德', '沙丁胺醇', '孟鲁司特']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '胃溃疡'}), (dr:Drug)
WHERE dr.name IN ['奥美拉唑', '泮托拉唑', '枸橼酸铋钾']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '抑郁症'}), (dr:Drug)
WHERE dr.name IN ['氟西汀', '帕罗西汀', '舍曲林']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '关节炎'}), (dr:Drug)
WHERE dr.name IN ['布洛芬', '萘普生', '甲氨蝶呤']
CREATE (d)-[:TREATED_BY]->(dr);

MATCH (d:Disease {name: '冠心病'}), (dr:Drug)
WHERE dr.name IN ['阿司匹林肠溶片', '氯吡格雷', '阿托伐他汀', '硝苯地平']
CREATE (d)-[:TREATED_BY]->(dr);

// 创建药物-疾病关系（TREATS）
MATCH (dr:Drug), (d:Disease)
WHERE (d)-[:TREATED_BY]->(dr)
CREATE (dr)-[:TREATS]->(d);

// 验证数据
MATCH (n) RETURN count(n) as totalNodes;
MATCH ()-[r]->() RETURN count(r) as totalRelationships;