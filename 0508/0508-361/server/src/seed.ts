import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { User } from './entities/User';

export const seedDatabase = async () => {
  const userRepository = AppDataSource.getRepository(User);

  const existingChair = await userRepository.findOneBy({ email: 'chair@conference.com' });
  if (existingChair) {
    console.log('数据库已初始化，跳过种子数据');
    return;
  }

  const hashedChairPassword = await bcrypt.hash('chair123', 10);
  const chair = userRepository.create({
    email: 'chair@conference.com',
    password: hashedChairPassword,
    name: '张主席',
    role: 'chair',
    affiliation: '清华大学'
  });
  await userRepository.save(chair);

  const hashedReviewer1Password = await bcrypt.hash('reviewer123', 10);
  const reviewer1 = userRepository.create({
    email: 'reviewer1@conference.com',
    password: hashedReviewer1Password,
    name: '李教授',
    role: 'reviewer',
    affiliation: '北京大学',
    researchKeywords: ['机器学习', '深度学习', '计算机视觉', '神经网络', '图像识别']
  });
  await userRepository.save(reviewer1);

  const hashedReviewer2Password = await bcrypt.hash('reviewer123', 10);
  const reviewer2 = userRepository.create({
    email: 'reviewer2@conference.com',
    password: hashedReviewer2Password,
    name: '王研究员',
    role: 'reviewer',
    affiliation: '中科院计算所',
    researchKeywords: ['自然语言处理', '机器学习', '文本挖掘', '情感分析', '语言模型']
  });
  await userRepository.save(reviewer2);

  const hashedReviewer3Password = await bcrypt.hash('reviewer123', 10);
  const reviewer3 = userRepository.create({
    email: 'reviewer3@conference.com',
    password: hashedReviewer3Password,
    name: '陈博士',
    role: 'reviewer',
    affiliation: '浙江大学',
    researchKeywords: ['数据挖掘', '机器学习', '推荐系统', '知识图谱', '图神经网络']
  });
  await userRepository.save(reviewer3);

  const hashedAuthor1Password = await bcrypt.hash('author123', 10);
  const author1 = userRepository.create({
    email: 'author1@conference.com',
    password: hashedAuthor1Password,
    name: '赵同学',
    role: 'author',
    affiliation: '上海交通大学'
  });
  await userRepository.save(author1);

  const hashedAuthor2Password = await bcrypt.hash('author123', 10);
  const author2 = userRepository.create({
    email: 'author2@conference.com',
    password: hashedAuthor2Password,
    name: '钱同学',
    role: 'author',
    affiliation: '复旦大学'
  });
  await userRepository.save(author2);

  console.log('种子数据创建完成!');
  console.log('主席账号: chair@conference.com / chair123');
  console.log('审稿人账号: reviewer1@conference.com / reviewer123');
  console.log('审稿人账号: reviewer2@conference.com / reviewer123');
  console.log('审稿人账号: reviewer3@conference.com / reviewer123');
  console.log('作者账号: author1@conference.com / author123');
  console.log('作者账号: author2@conference.com / author123');
};
