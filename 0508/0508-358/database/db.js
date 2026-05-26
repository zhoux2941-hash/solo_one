const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'pet_clinic.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 2147483648');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  const examCount = db.prepare('SELECT COUNT(*) as cnt FROM exam_items').get().cnt;
  if (examCount === 0) {
    const insertExam = db.prepare('INSERT INTO exam_items (name, price) VALUES (?, ?)');
    const exams = [
      ['血常规', 80],
      ['CRP', 120],
      ['X光', 150],
      ['B超', 200]
    ];
    const tx = db.transaction((items) => {
      for (const item of items) insertExam.run(...item);
    });
    tx(exams);
    console.log('初始化检查项完成');
  }

  const templateCount = db.prepare('SELECT COUNT(*) as cnt FROM templates').get().cnt;
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO templates (name, pet_type, symptoms, exam_checklist, treatment_plan, diagnosis, prescription)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const templates = [
      [
        '犬细小病毒', '犬',
        '呕吐、腹泻、便血、精神沉郁、食欲废绝、发热',
        '["血常规","CRP"]',
        '1. 禁食禁水 48小时\n2. 静脉输液补充电解质和营养\n3. 抗病毒治疗：干扰素、单抗\n4. 对症治疗：止吐、止血、止泻\n5. 抗生素预防继发感染',
        '犬细小病毒感染（CPV）',
        '0.9% NaCl 500ml IV\n5% GS 250ml IV\nVitamin C 2g IV\n利巴韦林 0.2g IV\n头孢曲松钠 1g IV\n胃复安 10mg IM\n止血敏 0.5g IM\n干扰素 300万IU SC\n细小单抗 5ml SC'
      ],
      [
        '犬瘟热', '犬',
        '双相热、咳嗽、流涕、眼分泌物增多、脚垫增厚、神经症状',
        '["血常规","CRP","X光"]',
        '1. 隔离护理，保持环境清洁\n2. 抗病毒治疗：单抗、干扰素\n3. 控制继发感染：广谱抗生素\n4. 对症支持：止咳、退烧、营养支持\n5. 神经症状时使用镇静剂',
        '犬瘟热病毒感染（CDV）',
        '犬瘟热单抗 5-10ml IV/IM qd\n干扰素 500万IU SC qd\n头孢噻呋钠 0.5-1g IV bid\n氨溴索 15mg IV bid\n清开灵 10ml PO bid\n维生素B族 2ml IM qd'
      ],
      [
        '猫瘟热', '猫',
        '高热、呕吐、腹泻、脱水、白细胞显著减少、精神差',
        '["血常规","CRP"]',
        '1. 禁食禁水\n2. 液体疗法纠正脱水和电解质紊乱\n3. 抗病毒：干扰素、猫瘟单抗\n4. 抗生素控制细菌感染\n5. 对症支持：止吐、止血、止泻',
        '猫泛白细胞减少症（FPV）',
        '乳酸林格液 250ml IV\n5% GS 100ml IV\n猫瘟单抗 2ml SC qd\n干扰素 200万IU SC qd\n头孢哌酮 0.5g IV bid\n胃复安 5mg IM bid\n止血敏 0.25g IM bid'
      ],
      [
        '猫传染性腹膜炎', '猫',
        '持续发热、腹水/胸水、体重下降、精神萎靡、黄疸',
        '["血常规","CRP","B超"]',
        '1. 支持疗法：补充营养、纠正脱水\n2. 抗病毒：GS-441524\n3. 免疫抑制剂：泼尼松龙\n4. 对症处理：穿刺排液、保肝',
        '猫传染性腹膜炎（FIP）',
        'GS-441524 4-8mg/kg SC q24h 持续12周\n泼尼松龙 2-4mg/kg PO q24h 逐渐减量\n护肝片 1# PO bid\n维生素B族 2ml SC q3d'
      ],
      [
        '犬皮肤病', '犬',
        '瘙痒、脱毛、红斑、皮屑、结痂、异味',
        '["血常规","CRP"]',
        '1. 药浴：抗菌止痒香波每周2-3次\n2. 体外驱虫\n3. 止痒：抗组胺药或糖皮质激素\n4. 抗生素控制继发感染\n5. 低过敏处方粮',
        '细菌性皮肤病/过敏性皮炎',
        '头孢氨苄 30mg/kg PO bid 14天\n扑尔敏 4mg PO bid\n药浴香波 每周2-3次\n外驱虫药 每月一次'
      ],
      [
        '猫泌尿系统综合征', '猫',
        '尿频、尿痛、尿闭、血尿、排尿困难、频繁舔舐尿道口',
        '["血常规","CRP","B超"]',
        '1. 紧急导尿解除尿闭\n2. 输液治疗，促进排尿\n3. 酸化尿液，溶解结晶\n4. 抗生素预防感染\n5. 处方粮长期管理',
        '猫下泌尿道疾病（FLUTD）',
        '生理盐水 200ml IV\n阿莫西林克拉维酸钾 62.5mg PO bid\n金钱草颗粒 5g PO bid\n泌尿道处方粮 长期饲喂\n增加饮水量'
      ],
      [
        '犬胃肠炎', '犬',
        '呕吐、腹泻、腹痛、食欲下降、精神不振',
        '["血常规","CRP"]',
        '1. 禁食24小时，禁水12小时\n2. 补液纠正脱水和电解质紊乱\n3. 止吐、止泻、保护胃肠黏膜\n4. 益生菌调理肠道\n5. 逐渐恢复饮食（易消化食物）',
        '急性胃肠炎',
        '生理盐水 500ml IV\n5% GS 250ml IV\n奥美拉唑 20mg IV qd\n胃复安 10mg IM bid\n蒙脱石散 3g PO bid\n益生菌 1# PO bid'
      ],
      [
        '犬骨折', '犬',
        '患肢不能负重、疼痛、肿胀、畸形、活动异常',
        '["X光"]',
        '1. 镇静/麻醉\n2. 骨折复位\n3. 内固定或外固定\n4. 镇痛消炎\n5. 限制活动，术后护理',
        '四肢骨折（闭合性）',
        '术前：阿托品 0.04mg/kg SC\n术中：异氟烷麻醉维持\n术后：美洛昔康 0.1mg/kg SC qd\n头孢唑林 25mg/kg IV q8h\n术后护理：限制活动4-6周'
      ]
    ];
    const tx = db.transaction((items) => {
      for (const item of items) insertTemplate.run(...item);
    });
    tx(templates);
    console.log('初始化病历模板完成');
  }

  const medicineCount = db.prepare('SELECT COUNT(*) as cnt FROM medicines').get().cnt;
  if (medicineCount === 0) {
    const insertMedicine = db.prepare(`
      INSERT INTO medicines (name, specification, unit, price, stock, min_stock, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const medicines = [
      ['阿莫西林克拉维酸钾片', '0.375g*10片', '盒', 68.00, 150, 30, '抗生素', '广谱抗生素，用于细菌感染'],
      ['头孢氨苄胶囊', '0.25g*24粒', '盒', 45.00, 200, 50, '抗生素', '第一代头孢菌素，用于皮肤软组织感染'],
      ['头孢曲松钠注射液', '1g/支', '支', 85.00, 80, 20, '抗生素', '第三代头孢菌素，静脉注射用'],
      ['头孢噻呋钠注射液', '0.5g/支', '支', 120.00, 60, 15, '抗生素', '动物专用头孢，用于呼吸道感染'],
      ['甲硝唑片', '0.2g*100片', '瓶', 35.00, 100, 30, '抗寄生虫', '用于厌氧菌和原虫感染'],
      ['左氧氟沙星片', '0.5g*6片', '盒', 55.00, 120, 30, '抗生素', '喹诺酮类抗菌药'],
      ['阿奇霉素片', '0.25g*6片', '盒', 78.00, 100, 25, '抗生素', '大环内酯类抗生素'],
      ['干扰素α注射液', '300万IU/支', '支', 180.00, 50, 10, '抗病毒', '用于病毒感染辅助治疗'],
      ['利巴韦林注射液', '0.1g/支', '支', 25.00, 150, 40, '抗病毒', '广谱抗病毒药物'],
      ['犬细小单抗', '5ml/支', '支', 280.00, 30, 5, '生物制品', '犬细小病毒单克隆抗体'],
      ['犬瘟热单抗', '5ml/支', '支', 320.00, 25, 5, '生物制品', '犬瘟热病毒单克隆抗体'],
      ['猫瘟单抗', '2ml/支', '支', 250.00, 35, 5, '生物制品', '猫泛白细胞减少症单抗'],
      ['奥美拉唑肠溶胶囊', '20mg*14粒', '盒', 42.00, 80, 20, '消化系统', '质子泵抑制剂，用于胃酸过多'],
      ['胃复安注射液', '10mg/支', '支', 15.00, 200, 50, '消化系统', '止吐药'],
      ['蒙脱石散', '3g*10袋', '盒', 32.00, 150, 40, '消化系统', '止泻药，保护肠黏膜'],
      ['益生菌粉', '5g*10袋', '盒', 68.00, 100, 30, '消化系统', '调节肠道菌群'],
      ['美洛昔康片', '7.5mg*10片', '盒', 85.00, 80, 20, '解热镇痛', '非甾体抗炎药，用于疼痛和炎症'],
      ['布洛芬混悬液', '100ml/瓶', '瓶', 38.00, 100, 30, '解热镇痛', '退烧药'],
      ['氯雷他定片', '10mg*6片', '盒', 28.00, 120, 30, '抗过敏', '抗组胺药，用于过敏反应'],
      ['地塞米松片', '0.75mg*100片', '瓶', 18.00, 200, 50, '激素类', '糖皮质激素，抗炎抗过敏'],
      ['扑尔敏片', '4mg*100片', '瓶', 12.00, 250, 60, '抗过敏', '抗组胺药'],
      ['碘伏消毒液', '100ml/瓶', '瓶', 15.00, 300, 80, '外用', '皮肤伤口消毒'],
      ['红霉素眼膏', '2g/支', '支', 18.00, 150, 40, '外用', '眼部感染治疗'],
      ['滴耳液', '10ml/瓶', '瓶', 45.00, 80, 20, '外用', '耳道清洁消炎'],
      ['滴眼液', '8ml/瓶', '瓶', 38.00, 100, 30, '外用', '眼部清洁消炎'],
      ['云南白药粉', '4g/瓶', '瓶', 25.00, 200, 50, '外用', '止血药'],
      ['维生素B族注射液', '2ml/支', '支', 12.00, 200, 50, '营养补充', '补充B族维生素'],
      ['维生素C注射液', '1g/支', '支', 8.00, 300, 80, '营养补充', '补充维生素C'],
      ['葡萄糖注射液', '500ml/瓶', '瓶', 25.00, 100, 30, '输液', '5%葡萄糖注射液'],
      ['生理盐水', '500ml/瓶', '瓶', 15.00, 200, 50, '输液', '0.9%氯化钠注射液'],
      ['乳酸林格液', '500ml/瓶', '瓶', 28.00, 150, 40, '输液', '补液电解质'],
      ['止血敏注射液', '0.5g/支', '支', 22.00, 100, 30, '止血', '止血药'],
      ['麻杏石甘口服液', '100ml/瓶', '瓶', 58.00, 60, 15, '中药', '止咳平喘，用于呼吸道感染'],
      ['清开灵口服液', '10ml*6支', '盒', 45.00, 80, 20, '中药', '清热解毒'],
      ['金钱草颗粒', '10g*10袋', '盒', 38.00, 100, 30, '中药', '利尿排石，用于泌尿系统']
    ];
    const tx = db.transaction((items) => {
      for (const item of items) insertMedicine.run(...item);
    });
    tx(medicines);
    console.log('初始化药品库存完成');
  }

  console.log('数据库初始化完成');
}

initDatabase();

module.exports = db;
