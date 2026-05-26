const chineseFirstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
const chineseLastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀英', '华', '平'];
const englishFirstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'James', 'Emma', 'Robert', 'Olivia', 'William'];
const englishLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'qq.com', '163.com', 'icloud.com'];
const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '苏州', '天津'];
const streets = ['中山路', '人民路', '建设路', '解放路', '文化路', '科技路', '和平路', '友谊路', '长安街', '南京路'];
const words = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'own', 'say', 'she'];
const prefixes = ['产品', '用户', '系统', '数据', '智能', '高效', '专业', '优质', '全新', '经典'];
const suffixes = ['介绍', '说明', '指南', '教程', '分享', '经验', '技巧', '方法', '方案', '策略'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateName(): string {
  if (Math.random() > 0.5) {
    return randomItem(chineseFirstNames) + randomItem(chineseLastNames) + (Math.random() > 0.7 ? randomItem(chineseLastNames) : '');
  }
  return randomItem(englishFirstNames) + ' ' + randomItem(englishLastNames);
}

export function generateEmail(): string {
  const username = Math.random().toString(36).substring(2, 12);
  return `${username}@${randomItem(domains)}`;
}

export function generatePhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  return randomItem(prefixes) + Math.random().toString().slice(2, 10);
}

export function generateAddress(): string {
  return randomItem(cities) + '市' + randomItem(streets) + randomInt(1, 999) + '号';
}

export function generateWord(): string {
  return randomItem(words);
}

export function generateSentence(): string {
  const length = randomInt(5, 15);
  const sentence: string[] = [];
  for (let i = 0; i < length; i++) {
    sentence.push(randomItem(words));
  }
  return sentence.join(' ').charAt(0).toUpperCase() + sentence.join(' ').slice(1) + '.';
}

export function generateChineseSentence(): string {
  const length = randomInt(8, 20);
  const chars = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见明问力理尔点文几定本公特做外孩相西果走将月十实向声车全信重三机工物气每并别真打太新比才便夫再书部水像眼少家经';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result + '。';
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateUrl(): string {
  const protocols = ['https://', 'http://'];
  const base = randomItem(protocols) + 'www.';
  const name = Math.random().toString(36).substring(2, 12);
  const tlds = ['.com', '.org', '.net', '.io', '.cn', '.dev'];
  return base + name + randomItem(tlds);
}

export function generateDate(): string {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

export function generateRandomString(minLength: number = 5, maxLength: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = randomInt(minLength, maxLength);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result;
}

export function generateChineseTitle(): string {
  return randomItem(prefixes) + randomItem(suffixes);
}
