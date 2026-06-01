import db from '../db/init.js';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../../shared/index.js';

class AdminUserRepository {
  findByUsername(username: string): AdminUser | null {
    const stmt = db.prepare(`
      SELECT username, password_hash as passwordHash 
      FROM admin_user 
      WHERE username = ?
    `);
    const result = stmt.get(username) as AdminUser | null;
    return result || null;
  }

  verifyPassword(username: string, password: string): boolean {
    const user = this.findByUsername(username);
    if (!user) return false;
    return bcrypt.compareSync(password, user.passwordHash);
  }
}

export default new AdminUserRepository();
