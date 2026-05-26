import { Router } from 'express';
import {
  createStudent,
  getStudentByStudentId,
} from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { studentId, name } = req.body as {
    studentId?: string;
    name?: string;
  };
  if (!studentId || !name) {
    res.status(400).json({ success: false, error: '学号和姓名不能为空' });
    return;
  }
  let student = getStudentByStudentId(studentId);
  if (!student) {
    student = createStudent({
      studentId,
      name,
      college: req.body.college ?? '',
    });
  } else {
    student.name = name;
  }
  res.json({ success: true, token: `stu-${student.id}`, student });
});

export default router;
