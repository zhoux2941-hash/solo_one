const db = require('./database/db');

const petNames = [
  '豆豆', '多多', '小白', '小黑', '旺财', '来福', '咪咪', '喵喵', '布丁', '奶茶',
  '可乐', '雪碧', '咖啡', '糖糖', '果果', '花花', '毛毛', '球球', '笨笨', '呆呆',
  '乐乐', '欢欢', '笑笑', '闹闹', '皮皮', '妞妞', '仔仔', '崽崽', '丫丫', '萌萌',
  '圆圆', '方方', '胖胖', '瘦瘦', '高高', '矮矮', '长长', '短短', '软软', '硬硬',
  '亮亮', '暗暗', '红红', '黄黄', '蓝蓝', '绿绿', '紫紫', '灰灰', '棕棕', '白白'
];

const ownerNames = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '陈明', '刘华', '黄强', '杨丽', '朱军', '赵敏', '林涛', '徐静',
  '何伟', '高芳', '罗勇', '梁红', '宋涛', '郑洁', '谢辉', '韩雪',
  '唐亮', '冯婷', '于鹏', '董杰', '曹敏', '彭飞', '曾宇', '田甜'
];

const breeds = ['金毛', '拉布拉多', '泰迪', '比熊', '柯基', '哈士奇', '阿拉斯加', '萨摩耶', '布偶', '英短', '美短', '橘猫', '狸花', '暹罗', '波斯'];

const diagnoses = [
  '犬细小病毒感染', '犬瘟热', '猫瘟热', '猫传染性腹膜炎', '急性胃肠炎',
  '皮肤病', '泌尿系统感染', '呼吸道感染', '骨折', '软组织损伤',
  '中耳炎', '结膜炎', '牙龈炎', '消化不良', '寄生虫感染',
  '过敏反应', '心脏病', '肾病', '肝病', '糖尿病'
];

const complaints = [
  '呕吐腹泻三天', '食欲下降精神差', '咳嗽流鼻涕', '皮肤瘙痒脱毛',
  '尿频尿急尿痛', '跛行不敢着地', '频繁抓耳朵', '眼睛发红分泌物多',
  '口臭牙龈红肿', '体重下降明显', '喝水多尿多', '抽搐癫痫发作',
  '呼吸困难', '腹胀不排便', '鼻涕带血', '持续发热',
  '走路不稳', '叫声异常', '拒绝进食', '精神沉郁'
];

const treatments = [
  '1. 静脉输液治疗\n2. 抗生素消炎\n3. 对症支持治疗\n4. 留院观察',
  '1. 口服药物治疗\n2. 外用药膏涂抹\n3. 药浴每周2次\n4. 一周后复查',
  '1. 手术治疗\n2. 术后消炎止痛\n3. 限制活动4周\n4. 定期换药',
  '1. 紧急导尿\n2. 输液利尿\n3. 抗生素预防感染\n4. 处方粮长期饲喂',
  '1. 皮下注射治疗\n2. 口服益生菌调理\n3. 禁食禁水24小时\n4. 清淡饮食'
];

const prescriptions = [
  '头孢氨苄 30mg/kg PO bid 14天\n奥美拉唑 20mg PO qd 7天\n益生菌 1# PO bid 14天',
  '阿莫西林克拉维酸钾 62.5mg PO bid 10天\n碘伏 外用 bid 7天\n伊丽莎白圈 持续佩戴',
  '美洛昔康 0.1mg/kg PO qd 7天\n头孢唑林 25mg/kg IV q8h 5天\n液体钙 1# PO bid 30天',
  '金钱草颗粒 5g PO bid 14天\n呋塞米 2mg/kg PO qd 3天\n处方粮 长期饲喂',
  '扑尔敏 4mg PO bid 7天\n地塞米松 0.5mg/kg PO qd 3天逐渐减量\n药浴香波 每周2次'
];

const examIds = [1, 2, 3, 4];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExams() {
  const count = Math.floor(Math.random() * 4) + 1;
  const shuffled = [...examIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function seedData(count = 10000) {
  console.log(`开始生成 ${count} 条测试数据...`);

  const insertRecord = db.prepare(`
    INSERT INTO medical_records (
      pet_name, owner_name, owner_phone, pet_type, breed, age, gender,
      weight, temperature, chief_complaint, clinical_findings, diagnosis,
      prescription, treatment_plan, doctor_name, total_fee, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExam = db.prepare(`
    INSERT INTO record_exams (record_id, exam_item_id, exam_name, exam_price, result)
    VALUES (?, ?, ?, ?, ?)
  `);

  const examPrices = { 1: 80, 2: 120, 3: 150, 4: 200 };
  const examNames = { 1: '血常规', 2: 'CRP', 3: 'X光', 4: 'B超' };
  const results = ['正常', '未见明显异常', '指标略有偏高', '需要进一步检查', '轻微炎症'];

  const startDate = new Date('2023-01-01');
  const endDate = new Date('2026-05-26');
  const batchSize = 1000;

  let inserted = 0;

  for (let batch = 0; batch < count; batch += batchSize) {
    const batchCount = Math.min(batchSize, count - batch);

    const tx = db.transaction(() => {
      for (let i = 0; i < batchCount; i++) {
        const petType = Math.random() > 0.4 ? '犬' : '猫';
        const date = randomDate(startDate, endDate).toISOString();
        const selectedExams = pickRandomExams();
        const totalFee = selectedExams.reduce((sum, id) => sum + examPrices[id], 0);

        const recordId = insertRecord.run(
          pickRandom(petNames),
          pickRandom(ownerNames),
          `13${Math.floor(Math.random() * 900000000 + 100000000)}`,
          petType,
          pickRandom(breeds),
          `${Math.floor(Math.random() * 15) + 1}岁`,
          Math.random() > 0.5 ? '公' : '母',
          parseFloat((Math.random() * 30 + 2).toFixed(1)),
          parseFloat((Math.random() * 2 + 38).toFixed(1)),
          pickRandom(complaints),
          pickRandom(complaints),
          pickRandom(diagnoses),
          pickRandom(prescriptions),
          pickRandom(treatments),
          `李${['医生', '大夫', '医师'][Math.floor(Math.random() * 3)]}`,
          totalFee,
          date
        ).lastInsertRowid;

        for (const examId of selectedExams) {
          insertExam.run(
            recordId, examId, examNames[examId], examPrices[examId], pickRandom(results)
          );
        }
      }
    });

    tx();
    inserted += batchCount;
    console.log(`已插入 ${inserted}/${count} 条...`);
  }

  console.log(`✅ 成功插入 ${count} 条测试数据`);

  const start = Date.now();
  const records = db.prepare('SELECT * FROM medical_records ORDER BY created_at DESC LIMIT 10000').all();
  const duration = Date.now() - start;

  console.log(`\n📊 性能测试结果:`);
  console.log(`   总记录数: ${records.length}`);
  console.log(`   查询耗时: ${duration}ms`);
  console.log(`   平均每条: ${(duration / records.length).toFixed(4)}ms`);
  console.log(`   ${duration < 1000 ? '✅ 满足查询<1秒要求' : '❌ 不满足要求'}`);
}

const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM medical_records').get().cnt;
console.log(`当前已有 ${existingCount} 条病历记录`);

if (existingCount < 1000) {
  seedData(10000);
} else {
  console.log('数据量已足够，跳过数据生成');
  const start = Date.now();
  const records = db.prepare('SELECT * FROM medical_records ORDER BY created_at DESC LIMIT 10000').all();
  const duration = Date.now() - start;
  console.log(`查询 ${records.length} 条记录耗时: ${duration}ms`);
  console.log(`${duration < 1000 ? '✅ 满足查询<1秒要求' : '❌ 不满足要求'}`);
}

db.close();
