const { EventEmitter } = require('events');
const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class FingerprintManager extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.platform = os.platform();
    this.currentCaptureSession = null;
    this.forceSimulationMode = true;
    this.registeredFingerprints = new Map();
    this.loadRegisteredFingerprints();
  }

  loadRegisteredFingerprints() {
    try {
      const templates = this.db.prepare('SELECT * FROM fingerprint_templates').all();
      templates.forEach(t => {
        this.registeredFingerprints.set(t.id, {
          userId: t.user_id,
          templateHash: t.template_hash,
          fingerName: t.finger_name,
          templateData: t.template_data
        });
      });
    } catch (e) {
      console.warn('加载已注册指纹失败:', e.message);
    }
  }

  async captureFingerprint(options = {}) {
    const { 
      userId, 
      fingerName = '右手拇指', 
      timeout = 30000,
      useSystemBiometrics = false,
      cancellation = null
    } = options;

    if (cancellation && cancellation.cancelled) {
      throw new Error('CANCELLED');
    }

    this.emit('capture-started', { userId, fingerName });

    try {
      let result;

      if (useSystemBiometrics && !this.forceSimulationMode) {
        if (this.platform === 'win32') {
          result = await this.tryWindowsHello(timeout, cancellation);
        } else if (this.platform === 'darwin') {
          result = await this.tryTouchID(timeout, cancellation);
        } else {
          result = await this.captureWithSimulation(timeout, userId, cancellation);
        }
      } else {
        result = await this.captureWithSimulation(timeout, userId, cancellation);
      }

      this.emit('capture-progress', { progress: 100, qualityScore: result.qualityScore });

      const templateHash = crypto.createHash('sha256').update(result.fingerprintData).digest('hex');
      
      let templateId = result.existingTemplateId;
      
      if (!templateId) {
        const existing = this.db.prepare('SELECT id FROM fingerprint_templates WHERE template_hash = ?')
          .get(templateHash);
        templateId = existing ? existing.id : null;
      }

      if (!templateId && userId) {
        const insertStmt = this.db.prepare(`
          INSERT INTO fingerprint_templates (user_id, template_hash, template_data, finger_name, quality_score)
          VALUES (?, ?, ?, ?, ?)
        `);
        const info = insertStmt.run(userId, templateHash, result.fingerprintData, fingerName, result.qualityScore);
        templateId = info.lastInsertRowid;
        
        this.registeredFingerprints.set(templateId, {
          userId,
          templateHash,
          fingerName,
          templateData: result.fingerprintData
        });
      }

      this.emit('capture-completed', { 
        templateId, 
        userId: userId || result.userId, 
        qualityScore: result.qualityScore,
        method: result.method
      });

      return {
        success: true,
        templateId,
        qualityScore: result.qualityScore,
        fingerprintData: result.fingerprintData.toString('base64'),
        method: result.method,
        userId: userId || result.userId
      };

    } catch (error) {
      console.error('指纹采集错误:', error);
      this.emit('capture-error', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async tryWindowsHello(timeout, cancellation = null) {
    if (cancellation && cancellation.cancelled) {
      throw new Error('CANCELLED');
    }
    
    try {
      const psScript = `
        try {
          $null = [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType=WindowsRuntime]
          $task = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync("指纹支付验证")
          $task.Wait(5000) | Out-Null
          $result = $task.GetResults()
          if ($result -eq 'Verified') {
            Write-Output "VERIFIED"
          } else {
            Write-Output "FAILED"
          }
        } catch {
          Write-Output "NOT_AVAILABLE"
        }
      `;

      if (cancellation && cancellation.cancelled) {
        throw new Error('CANCELLED');
      }

      const { stdout } = await execAsync(
        `powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`,
        { timeout: Math.min(timeout, 8000) }
      );

      if (cancellation && cancellation.cancelled) {
        throw new Error('CANCELLED');
      }

      if (stdout.includes('VERIFIED')) {
        console.log('Windows Hello 验证成功');
        const fingerprintData = crypto.randomBytes(512);
        return {
          fingerprintData,
          qualityScore: 95,
          method: 'windows_hello'
        };
      }

      console.log('Windows Hello 验证失败或不可用，使用模拟模式');
      return await this.captureWithSimulation(timeout, null, cancellation);

    } catch (e) {
      if (e.message === 'CANCELLED') {
        throw e;
      }
      console.log('Windows Hello 调用异常，使用模拟模式:', e.message);
      return await this.captureWithSimulation(timeout, null, cancellation);
    }
  }

  async tryTouchID(timeout, cancellation = null) {
    if (cancellation && cancellation.cancelled) {
      throw new Error('CANCELLED');
    }
    
    try {
      const script = `
        do shell script "security authorize -u 2>&1 || true"
      `;

      if (cancellation && cancellation.cancelled) {
        throw new Error('CANCELLED');
      }

      const { stdout } = await execAsync(
        `osascript -e '${script.replace(/'/g, "'\\''")}'`,
        { timeout: Math.min(timeout, 8000) }
      );

      if (cancellation && cancellation.cancelled) {
        throw new Error('CANCELLED');
      }

      if (stdout.includes('authorized') || stdout.includes('允许')) {
        console.log('Touch ID 验证成功');
        const fingerprintData = crypto.randomBytes(512);
        return {
          fingerprintData,
          qualityScore: 95,
          method: 'touch_id'
        };
      }

      console.log('Touch ID 验证失败，使用模拟模式');
      return await this.captureWithSimulation(timeout, null, cancellation);

    } catch (e) {
      if (e.message === 'CANCELLED') {
        throw e;
      }
      console.log('Touch ID 调用异常，使用模拟模式:', e.message);
      return await this.captureWithSimulation(timeout, null, cancellation);
    }
  }

  async captureWithSimulation(timeout, preferredUserId = null, cancellation = null) {
    return new Promise((resolve, reject) => {
      let cancelled = false;
      
      const checkCancellation = () => {
        if (cancellation && cancellation.cancelled) {
          cancelled = true;
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          reject(new Error('CANCELLED'));
          return true;
        }
        return false;
      };

      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          reject(new Error('指纹采集超时'));
        }
      }, timeout);

      const progressSteps = [15, 35, 55, 75, 90];
      let stepIndex = 0;

      const progressInterval = setInterval(() => {
        if (checkCancellation()) return;
        
        if (stepIndex < progressSteps.length) {
          this.emit('capture-progress', { 
            progress: progressSteps[stepIndex],
            qualityScore: null 
          });
          stepIndex++;
        } else {
          clearInterval(progressInterval);
        }
      }, 250);

      setTimeout(() => {
        if (checkCancellation()) return;
        
        clearTimeout(timeoutId);
        clearInterval(progressInterval);

        if (checkCancellation()) return;

        if (this.registeredFingerprints.size > 0) {
          const templates = Array.from(this.registeredFingerprints.entries());
          
          if (preferredUserId) {
            const found = templates.find(([id, t]) => t.userId === preferredUserId);
            if (found) {
              [existingTemplateId] = found;
              userId = preferredUserId;
              fingerprintData = Buffer.from(found[1].templateData);
            }
          }

          if (!existingTemplateId) {
            const randomIndex = Math.floor(Math.random() * templates.length);
            [existingTemplateId] = templates[randomIndex];
            userId = templates[randomIndex][1].userId;
            fingerprintData = Buffer.from(templates[randomIndex][1].templateData);
          }
        }

        if (!fingerprintData) {
          fingerprintData = crypto.randomBytes(512);
          userId = userId || 1;
        }

        const qualityScore = 85 + Math.floor(Math.random() * 15);

        resolve({
          fingerprintData,
          qualityScore,
          userId,
          existingTemplateId,
          method: 'simulation'
        });
      }, 1800);
    });
  }

  async selectAndCapture(userId) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const templates = this.db.prepare(
      'SELECT * FROM fingerprint_templates WHERE user_id = ?'
    ).all(userId);

    if (templates.length === 0) {
      return this.captureFingerprint({ userId, useSystemBiometrics: false });
    }

    return this.captureFingerprint({ userId, useSystemBiometrics: false });
  }

  async verifyFingerprint(templateId, fingerprintData) {
    try {
      const templateStmt = this.db.prepare(`
        SELECT ft.*, u.username, u.full_name
        FROM fingerprint_templates ft
        JOIN users u ON ft.user_id = u.id
        WHERE ft.id = ?
      `);
      const template = templateStmt.get(templateId);

      if (!template) {
        return { success: false, error: '指纹模板不存在' };
      }

      const inputBuffer = Buffer.from(fingerprintData, 'base64');
      const templateBuffer = Buffer.from(template.template_data);

      const inputHash = crypto.createHash('sha256').update(inputBuffer).digest('hex');

      if (inputHash === template.template_hash) {
        this.emit('verification-success', { 
          templateId, 
          userId: template.user_id,
          username: template.username,
          matchScore: 1.0 
        });

        return {
          success: true,
          match: true,
          matchScore: 1.0,
          user: {
            id: template.user_id,
            username: template.username,
            fullName: template.full_name
          }
        };
      }

      const matchScore = this.calculateMatchScore(templateBuffer, inputBuffer);
      const matchThreshold = 0.70;

      if (matchScore >= matchThreshold) {
        this.emit('verification-success', { 
          templateId, 
          userId: template.user_id,
          username: template.username,
          matchScore 
        });

        return {
          success: true,
          match: true,
          matchScore,
          user: {
            id: template.user_id,
            username: template.username,
            fullName: template.full_name
          }
        };
      } else {
        this.emit('verification-failed', { templateId, matchScore });

        return {
          success: false,
          match: false,
          matchScore,
          error: '指纹不匹配'
        };
      }

    } catch (error) {
      console.error('指纹验证错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  calculateMatchScore(template1, template2) {
    const minLen = Math.min(template1.length, template2.length);
    let matches = 0;

    for (let i = 0; i < minLen; i++) {
      const diff = Math.abs(template1[i] - template2[i]);
      if (diff < 40) matches++;
    }

    return matches / minLen;
  }

  findMatchingTemplate(fingerprintData) {
    const templates = this.db.prepare('SELECT * FROM fingerprint_templates').all();
    const inputBuffer = Buffer.from(fingerprintData, 'base64');
    const inputHash = crypto.createHash('sha256').update(inputBuffer).digest('hex');

    for (const template of templates) {
      const templateBuffer = Buffer.from(template.template_data);
      const templateHash = crypto.createHash('sha256').update(templateBuffer).digest('hex');
      
      if (template.template_hash === inputHash || templateHash === inputHash) {
        const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(template.user_id);
        this.emit('verification-success', {
          templateId: template.id,
          userId: template.user_id,
          username: user.username,
          matchScore: 1.0
        });

        return {
          success: true,
          match: true,
          matchScore: 1.0,
          templateId: template.id,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name
          }
        };
      }
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const template of templates) {
      const score = this.calculateMatchScore(
        Buffer.from(template.template_data),
        inputBuffer
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    const matchThreshold = 0.70;
    if (bestMatch && bestScore >= matchThreshold) {
      const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(bestMatch.user_id);
      
      this.emit('verification-success', {
        templateId: bestMatch.id,
        userId: bestMatch.user_id,
        username: user.username,
        matchScore: bestScore
      });

      return {
        success: true,
        match: true,
        matchScore: bestScore,
        templateId: bestMatch.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name
        }
      };
    }

    return {
      success: false,
      match: false,
      matchScore: bestScore,
      error: '未找到匹配的指纹'
    };
  }

  listTemplates() {
    const stmt = this.db.prepare(`
      SELECT ft.*, u.username, u.full_name
      FROM fingerprint_templates ft
      JOIN users u ON ft.user_id = u.id
      ORDER BY ft.created_at DESC
    `);
    return stmt.all().map(t => ({
      ...t,
      template_data: undefined,
      templateDataPreview: t.template_hash.substring(0, 16) + '...'
    }));
  }

  getTemplateCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM fingerprint_templates');
    return stmt.get().count;
  }

  deleteTemplate(templateId) {
    const stmt = this.db.prepare('DELETE FROM fingerprint_templates WHERE id = ?');
    const info = stmt.run(templateId);
    if (info.changes > 0) {
      this.registeredFingerprints.delete(templateId);
      return true;
    }
    return false;
  }

  getTemplateForUser(userId) {
    const stmt = this.db.prepare('SELECT * FROM fingerprint_templates WHERE user_id = ? LIMIT 1');
    return stmt.get(userId);
  }

  verifyFingerprintForUser(userId, fingerprintData) {
    const template = this.getTemplateForUser(userId);
    if (!template) {
      return { success: false, error: '该用户没有注册指纹' };
    }
    return this.verifyFingerprint(template.id, fingerprintData);
  }

  listUsersWithFingerprints() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT u.id, u.username, u.full_name, u.balance,
             COUNT(ft.id) as fingerprint_count
      FROM users u
      LEFT JOIN fingerprint_templates ft ON u.id = ft.user_id
      GROUP BY u.id
      ORDER BY u.id
    `);
    return stmt.all();
  }

  setSimulationMode(enabled) {
    this.forceSimulationMode = enabled;
    console.log(`指纹采集模式: ${enabled ? '模拟模式' : '尝试系统生物识别'}`);
  }
}

module.exports = FingerprintManager;
