import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';
import { ABTest } from '../../shared/index.js';

class ABTestRepository {
  create(name: string, algorithmA: string, algorithmB: string, createdBy: string): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO ab_test (id, name, algorithm_a, algorithm_b, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, algorithmA, algorithmB, createdBy);
    return id;
  }

  getById(id: string): ABTest | null {
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        algorithm_a as algorithmA,
        algorithm_b as algorithmB,
        start_time as startTime,
        end_time as endTime,
        status,
        created_by as createdBy,
        created_at as createdAt
      FROM ab_test 
      WHERE id = ?
    `);
    const result = stmt.get(id) as ABTest | null;
    return result || null;
  }

  getAll(): ABTest[] {
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        algorithm_a as algorithmA,
        algorithm_b as algorithmB,
        start_time as startTime,
        end_time as endTime,
        status,
        created_by as createdBy,
        created_at as createdAt
      FROM ab_test 
      ORDER BY created_at DESC
    `);
    return stmt.all() as ABTest[];
  }

  getRunningTest(): ABTest | null {
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        algorithm_a as algorithmA,
        algorithm_b as algorithmB,
        start_time as startTime,
        end_time as endTime,
        status,
        created_by as createdBy,
        created_at as createdAt
      FROM ab_test 
      WHERE status = 'running'
      ORDER BY start_time DESC
      LIMIT 1
    `);
    const result = stmt.get() as ABTest | null;
    return result || null;
  }

  getRunningTestCount(): number {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM ab_test WHERE status = 'running'");
    const result = stmt.get() as { count: number };
    return result.count;
  }

  startTest(id: string): boolean {
    const stmt = db.prepare(`
      UPDATE ab_test 
      SET status = 'running', start_time = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'draft'
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  stopTest(id: string): boolean {
    const stmt = db.prepare(`
      UPDATE ab_test 
      SET status = 'completed', end_time = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'running'
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  assignDepartment(testId: string, department: string, group: 'A' | 'B'): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ab_test_assignment (id, ab_test_id, department, group_assignment)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, testId, department, group);
    return id;
  }

  getAssignment(testId: string, department: string): 'A' | 'B' | null {
    const stmt = db.prepare(`
      SELECT group_assignment 
      FROM ab_test_assignment 
      WHERE ab_test_id = ? AND department = ?
    `);
    const result = stmt.get(testId, department) as { group_assignment: 'A' | 'B' } | null;
    return result ? result.group_assignment : null;
  }

  getAssignments(testId: string): { department: string; group_assignment: 'A' | 'B' }[] {
    const stmt = db.prepare(`
      SELECT department, group_assignment 
      FROM ab_test_assignment 
      WHERE ab_test_id = ?
    `);
    return stmt.all(testId) as { department: string; group_assignment: 'A' | 'B' }[];
  }
}

export default new ABTestRepository();
