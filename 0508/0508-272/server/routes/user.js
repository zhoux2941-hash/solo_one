const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '请输入用户名和密码' 
      });
    }

    const user = await req.db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名或密码错误' 
      });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名或密码错误' 
      });
    }

    await req.db.run(
      `INSERT INTO operation_logs (user_id, username, action, module, details)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, username, '登录', '用户管理', '用户登录系统']
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await req.db.run(
      `INSERT INTO operation_logs (user_id, action, module, details)
       VALUES (?, ?, ?, ?)`,
      [userId || null, '登出', '用户管理', '用户登出系统']
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const users = await req.db.all(
      'SELECT id, username, real_name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { username, password, realName, role = 'operator', operatorId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '请输入用户名和密码' 
      });
    }

    const existing = await req.db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名已存在' 
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = await req.db.run(
      `INSERT INTO users (username, password, real_name, role)
       VALUES (?, ?, ?, ?)`,
      [username, hash, realName || '', role]
    );

    await req.db.run(
      `INSERT INTO operation_logs (user_id, action, module, details)
       VALUES (?, ?, ?, ?)`,
      [operatorId || null, '创建用户', '用户管理', `创建用户: ${username}`]
    );

    res.json({
      success: true,
      data: {
        id: result.lastID,
        username,
        realName,
        role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { realName, role, password } = req.body;
    const { id } = req.params;

    const updates = [];
    const params = [];

    if (realName !== undefined) {
      updates.push('real_name = ?');
      params.push(realName);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      updates.push('password = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '没有需要更新的字段' 
      });
    }

    params.push(id);

    await req.db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id == 1) {
      return res.status(400).json({ 
        success: false, 
        error: '不能删除系统管理员' 
      });
    }

    await req.db.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
