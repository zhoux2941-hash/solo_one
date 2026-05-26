import { Router } from 'express';
import { admins, clubs } from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  const admin = admins.find(
    (a) => a.username === username && a.password === password,
  );
  if (!admin) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }
  const club = clubs.find((c) => c.id === admin.clubId);
  res.json({
    success: true,
    token: `admin-${admin.id}`,
    admin: { id: admin.id, username: admin.username },
    club,
  });
});

export default router;
