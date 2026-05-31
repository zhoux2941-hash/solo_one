import type { GitCommit } from '../types';

export function validateFormat(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  const lines = text.trim().split('\n');
  let hasCommitLine = false;
  let hasNumstatLine = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') continue;
    
    const commitMatch = trimmedLine.match(/^[0-9a-f]{40}\|/);
    if (commitMatch) {
      hasCommitLine = true;
      continue;
    }
    
    const numstatMatch = trimmedLine.match(/^(\d+|-)\s+(\d+|-)\s+.+/);
    if (numstatMatch) {
      hasNumstatLine = true;
      continue;
    }
  }
  
  return hasCommitLine && hasNumstatLine;
}

export function parseGitLog(text: string): GitCommit[] {
  const commits: GitCommit[] = [];
  
  if (!text || text.trim().length === 0) {
    return commits;
  }
  
  const blocks = text.split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) continue;
    
    const commitLine = lines[0];
    const commitMatch = commitLine.match(/^([0-9a-f]{40})\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)$/);
    
    if (!commitMatch) continue;
    
    const [, id, author, email, dateStr, message] = commitMatch;
    
    const date = parseGitDate(dateStr.trim());
    if (!date) continue;
    
    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const numstatLine = lines[i].trim();
      const numstatMatch = numstatLine.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      
      if (numstatMatch) {
        filesChanged++;
        const [, ins, del] = numstatMatch;
        insertions += ins === '-' ? 0 : parseInt(ins, 10);
        deletions += del === '-' ? 0 : parseInt(del, 10);
      }
    }
    
    commits.push({
      id,
      author: author.trim(),
      email: email.trim(),
      date,
      message: message.trim(),
      filesChanged,
      insertions,
      deletions,
    });
  }
  
  return cleanData(commits);
}

function parseGitDate(dateStr: string): Date | null {
  const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(?:\s+[+-]\d{4})?$/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}T${isoMatch[2]}`);
    if (!isNaN(date.getTime())) return date;
  }
  
  const rfcMatch = dateStr.match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  if (rfcMatch) {
    const months: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const [, day, month, year, time] = rfcMatch;
    const date = new Date(parseInt(year), months[month] || 0, parseInt(day));
    const [hours, minutes, seconds] = time.split(':').map(Number);
    date.setHours(hours, minutes, seconds);
    if (!isNaN(date.getTime())) return date;
  }
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

export function cleanData(commits: GitCommit[]): GitCommit[] {
  const seen = new Set<string>();
  const cleaned: GitCommit[] = [];
  
  for (const commit of commits) {
    if (seen.has(commit.id)) continue;
    seen.add(commit.id);
    
    if (!commit.author || commit.author === '') {
      commit.author = 'Unknown';
    }
    
    cleaned.push(commit);
  }
  
  cleaned.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return cleaned;
}

export function generateSampleData(): GitCommit[] {
  const authors = ['张三', '李四', '王五', '赵六', '钱七'];
  const messages = [
    '修复登录页面的bug',
    '添加用户管理功能',
    '优化数据库查询性能',
    '更新依赖库版本',
    '完善单元测试',
    '重构代码结构',
    '添加API文档',
    '修复内存泄漏问题',
    '实现文件上传功能',
    '优化前端渲染性能',
  ];
  
  const commits: GitCommit[] = [];
  const now = new Date();
  
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const hoursAgo = Math.floor(Math.random() * 24);
    const commitDate = new Date(now);
    commitDate.setDate(commitDate.getDate() - daysAgo);
    commitDate.setHours(hoursAgo, Math.floor(Math.random() * 60), 0, 0);
    
    const author = authors[Math.floor(Math.random() * authors.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const filesChanged = Math.floor(Math.random() * 10) + 1;
    const insertions = Math.floor(Math.random() * 200) + 1;
    const deletions = Math.floor(Math.random() * 100);
    
    commits.push({
      id: `${Date.now()}-${i}`,
      author,
      email: `${author.toLowerCase().replace(/\s/g, '')}@example.com`,
      date: commitDate,
      message,
      filesChanged,
      insertions,
      deletions,
    });
  }
  
  return cleanData(commits);
}
