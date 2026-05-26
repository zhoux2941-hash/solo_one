import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { authenticate, generateToken } from '../middleware/auth';
import { AuthRequest, RegisterDto, LoginDto } from '../types';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, affiliation, researchKeywords }: RegisterDto = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ email });

    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'author',
      affiliation,
      researchKeywords: researchKeywords || null
    });

    await userRepository.save(user);

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        affiliation: user.affiliation,
        researchKeywords: user.researchKeywords
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '请填写邮箱和密码' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        affiliation: user.affiliation,
        researchKeywords: user.researchKeywords
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未认证' });
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    affiliation: req.user.affiliation,
    researchKeywords: req.user.researchKeywords
  });
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const { name, affiliation, researchKeywords } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    if (name !== undefined) req.user.name = name;
    if (affiliation !== undefined) req.user.affiliation = affiliation;
    if (researchKeywords !== undefined) req.user.researchKeywords = researchKeywords;

    await userRepository.save(req.user);

    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      affiliation: req.user.affiliation,
      researchKeywords: req.user.researchKeywords
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({ message: '更新资料失败' });
  }
});

export default router;
