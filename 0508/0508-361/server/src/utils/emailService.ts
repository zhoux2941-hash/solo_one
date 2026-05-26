import { Paper } from '../entities/Paper';
import { User } from '../entities/User';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  paperId?: number;
}

export const emailLogs: EmailLog[] = [];

const generateId = () => Math.random().toString(36).substring(2, 15);

const getDecisionText = (decision: string | null): string => {
  switch (decision) {
    case 'accept': return '录用';
    case 'minor_revision': return '小修后录用';
    case 'major_revision': return '大修后再审';
    case 'reject': return '拒稿';
    default: return '待决定';
  }
};

export const sendAcceptanceEmail = (
  paper: Paper,
  author: User
): EmailLog => {
  const decision = getDecisionText(paper.finalDecision);
  
  const subject = `论文"${paper.title}"审稿结果通知`;
  const body = `
尊敬的 ${author.name} 老师/同学：

您好！

您提交的论文"${paper.title}"（论文编号：${paper.id}）已经完成审稿流程。

最终决定：${decision}

${paper.decisionSummary ? `评语汇总：\n${paper.decisionSummary}\n` : ''}

感谢您对本会议的支持！如有疑问，请联系会议主席。

此致
敬礼

学术会议组委会
${new Date().toLocaleDateString('zh-CN')}
  `.trim();

  const log: EmailLog = {
    id: generateId(),
    to: author.email,
    subject,
    body,
    timestamp: new Date(),
    paperId: paper.id
  };

  emailLogs.push(log);
  
  console.log(`[模拟邮件] 已发送到: ${author.email}`);
  console.log(`[模拟邮件] 主题: ${subject}`);
  console.log(`[模拟邮件] 内容摘要: ${body.substring(0, 100)}...`);

  return log;
};

export const sendBulkAcceptanceEmails = (
  papers: Paper[],
  authors: Map<number, User>
): { success: EmailLog[]; failed: number[] } => {
  const success: EmailLog[] = [];
  const failed: number[] = [];

  for (const paper of papers) {
    const author = authors.get(paper.authorId);
    if (author && paper.finalDecision) {
      const log = sendAcceptanceEmail(paper, author);
      success.push(log);
    } else {
      failed.push(paper.id);
    }
  }

  return { success, failed };
};

export const getEmailLogs = (paperId?: number): EmailLog[] => {
  if (paperId) {
    return emailLogs.filter(log => log.paperId === paperId);
  }
  return [...emailLogs];
};
