import { FeatureWord, TestEmail } from '../types/classifier';

export const presetFeatureWords: FeatureWord[] = [
  { word: 'free', spamProb: 0.045, hamProb: 0.008 },
  { word: 'money', spamProb: 0.038, hamProb: 0.006 },
  { word: 'win', spamProb: 0.032, hamProb: 0.005 },
  { word: 'click', spamProb: 0.028, hamProb: 0.004 },
  { word: 'now', spamProb: 0.025, hamProb: 0.012 },
  { word: 'offer', spamProb: 0.024, hamProb: 0.007 },
  { word: 'discount', spamProb: 0.022, hamProb: 0.003 },
  { word: 'urgent', spamProb: 0.021, hamProb: 0.002 },
  { word: 'cash', spamProb: 0.020, hamProb: 0.004 },
  { word: 'prize', spamProb: 0.019, hamProb: 0.001 },
  { word: 'claim', spamProb: 0.018, hamProb: 0.002 },
  { word: 'winner', spamProb: 0.017, hamProb: 0.001 },
  { word: 'guaranteed', spamProb: 0.016, hamProb: 0.002 },
  { word: 'limited', spamProb: 0.015, hamProb: 0.006 },
  { word: 'exclusive', spamProb: 0.014, hamProb: 0.004 },
  { word: 'deal', spamProb: 0.014, hamProb: 0.005 },
  { word: 'save', spamProb: 0.013, hamProb: 0.007 },
  { word: 'credit', spamProb: 0.013, hamProb: 0.008 },
  { word: 'loan', spamProb: 0.012, hamProb: 0.003 },
  { word: 'insurance', spamProb: 0.012, hamProb: 0.004 },
  { word: 'investment', spamProb: 0.011, hamProb: 0.005 },
  { word: 'risk', spamProb: 0.011, hamProb: 0.006 },
  { word: 'opportunity', spamProb: 0.010, hamProb: 0.005 },
  { word: 'earn', spamProb: 0.010, hamProb: 0.004 },
  { word: 'income', spamProb: 0.009, hamProb: 0.003 },
  { word: 'profit', spamProb: 0.009, hamProb: 0.004 },
  { word: 'subscribe', spamProb: 0.009, hamProb: 0.005 },
  { word: 'unsubscribe', spamProb: 0.008, hamProb: 0.002 },
  { word: 'remove', spamProb: 0.008, hamProb: 0.004 },
  { word: 'stop', spamProb: 0.008, hamProb: 0.006 },
  { word: 'please', spamProb: 0.007, hamProb: 0.015 },
  { word: 'contact', spamProb: 0.007, hamProb: 0.010 },
  { word: 'reply', spamProb: 0.007, hamProb: 0.009 },
  { word: 'email', spamProb: 0.007, hamProb: 0.012 },
  { word: 'mail', spamProb: 0.006, hamProb: 0.008 },
  { word: 'message', spamProb: 0.006, hamProb: 0.011 },
  { word: 'account', spamProb: 0.006, hamProb: 0.014 },
  { word: 'password', spamProb: 0.006, hamProb: 0.005 },
  { word: 'login', spamProb: 0.006, hamProb: 0.004 },
  { word: 'verify', spamProb: 0.006, hamProb: 0.003 },
  { word: 'confirm', spamProb: 0.005, hamProb: 0.006 },
  { word: 'security', spamProb: 0.005, hamProb: 0.007 },
  { word: 'bank', spamProb: 0.005, hamProb: 0.006 },
  { word: 'transfer', spamProb: 0.005, hamProb: 0.003 },
  { word: 'payment', spamProb: 0.005, hamProb: 0.008 },
  { word: 'bill', spamProb: 0.005, hamProb: 0.007 },
  { word: 'invoice', spamProb: 0.004, hamProb: 0.005 },
  { word: 'order', spamProb: 0.004, hamProb: 0.009 },
  { word: 'shipping', spamProb: 0.004, hamProb: 0.005 },
  { word: 'delivery', spamProb: 0.004, hamProb: 0.006 },
  { word: 'tracking', spamProb: 0.004, hamProb: 0.004 },
  { word: 'package', spamProb: 0.004, hamProb: 0.005 },
  { word: 'dear', spamProb: 0.004, hamProb: 0.018 },
  { word: 'hello', spamProb: 0.004, hamProb: 0.015 },
  { word: 'hi', spamProb: 0.004, hamProb: 0.012 },
  { word: 'thanks', spamProb: 0.004, hamProb: 0.016 },
  { word: 'thank', spamProb: 0.004, hamProb: 0.014 },
  { word: 'best', spamProb: 0.004, hamProb: 0.013 },
  { word: 'regards', spamProb: 0.003, hamProb: 0.011 },
  { word: 'sincerely', spamProb: 0.003, hamProb: 0.008 },
  { word: 'meeting', spamProb: 0.003, hamProb: 0.012 },
  { word: 'schedule', spamProb: 0.003, hamProb: 0.008 },
  { word: 'calendar', spamProb: 0.003, hamProb: 0.006 },
  { word: 'appointment', spamProb: 0.003, hamProb: 0.005 },
  { word: 'time', spamProb: 0.003, hamProb: 0.014 },
  { word: 'today', spamProb: 0.003, hamProb: 0.011 },
  { word: 'tomorrow', spamProb: 0.003, hamProb: 0.008 },
  { word: 'week', spamProb: 0.003, hamProb: 0.010 },
  { word: 'month', spamProb: 0.003, hamProb: 0.007 },
  { word: 'project', spamProb: 0.003, hamProb: 0.010 },
  { word: 'work', spamProb: 0.003, hamProb: 0.015 },
  { word: 'team', spamProb: 0.003, hamProb: 0.012 },
  { word: 'group', spamProb: 0.003, hamProb: 0.008 },
  { word: 'report', spamProb: 0.003, hamProb: 0.009 },
  { word: 'document', spamProb: 0.003, hamProb: 0.007 },
  { word: 'file', spamProb: 0.003, hamProb: 0.008 },
  { word: 'attach', spamProb: 0.003, hamProb: 0.006 },
  { word: 'attachment', spamProb: 0.003, hamProb: 0.005 },
  { word: 'link', spamProb: 0.003, hamProb: 0.007 },
  { word: 'website', spamProb: 0.003, hamProb: 0.006 },
  { word: 'site', spamProb: 0.003, hamProb: 0.005 },
  { word: 'page', spamProb: 0.003, hamProb: 0.006 },
  { word: 'information', spamProb: 0.003, hamProb: 0.009 },
  { word: 'data', spamProb: 0.003, hamProb: 0.008 },
  { word: 'update', spamProb: 0.003, hamProb: 0.010 },
  { word: 'news', spamProb: 0.003, hamProb: 0.007 },
  { word: 'event', spamProb: 0.003, hamProb: 0.006 },
  { word: 'invite', spamProb: 0.003, hamProb: 0.005 },
  { word: 'invitation', spamProb: 0.003, hamProb: 0.004 },
  { word: 'rsvp', spamProb: 0.002, hamProb: 0.003 },
  { word: 'question', spamProb: 0.002, hamProb: 0.008 },
  { word: 'help', spamProb: 0.002, hamProb: 0.009 },
  { word: 'support', spamProb: 0.002, hamProb: 0.007 },
  { word: 'issue', spamProb: 0.002, hamProb: 0.006 },
  { word: 'problem', spamProb: 0.002, hamProb: 0.005 },
  { word: 'error', spamProb: 0.002, hamProb: 0.004 },
  { word: 'bug', spamProb: 0.002, hamProb: 0.003 },
  { word: 'fix', spamProb: 0.002, hamProb: 0.004 },
  { word: 'feature', spamProb: 0.002, hamProb: 0.005 },
  { word: 'request', spamProb: 0.002, hamProb: 0.008 },
  { word: 'feedback', spamProb: 0.002, hamProb: 0.006 },
];

export const presetSpamDocCount = 500;
export const presetHamDocCount = 500;

export const testEmails: TestEmail[] = [
  {
    text: 'Congratulations! You have won a free iPhone. Click here to claim your prize now! This is an exclusive limited time offer.',
    label: 'spam'
  },
  {
    text: 'Urgent: Your account has been compromised. Please click this link to verify your password and secure your account.',
    label: 'spam'
  },
  {
    text: 'Earn $5000 per week working from home! Guaranteed income with no experience needed. Start today and become rich fast!',
    label: 'spam'
  },
  {
    text: 'FREE FREE FREE! Get your free money now! Just reply with your bank details to receive your cash prize immediately.',
    label: 'spam'
  },
  {
    text: 'Special discount offer! 90% off on all products. Limited stock available. Buy now and save big on your purchase.',
    label: 'spam'
  },
  {
    text: 'You are our lucky winner! Claim your free vacation package. Click to confirm your prize before it expires.',
    label: 'spam'
  },
  {
    text: 'Low interest loan available! Get approved instantly with no credit check. Apply now for your personal loan today.',
    label: 'spam'
  },
  {
    text: 'Make money fast with our investment opportunity! Guaranteed 500% profit in just one month. Don\'t miss this chance!',
    label: 'spam'
  },
  {
    text: 'Hi, I need to transfer $25 million to your account. Please send me your bank information to receive this money.',
    label: 'spam'
  },
  {
    text: 'Your PayPal account will be suspended. Click to verify your information and prevent account closure immediately.',
    label: 'spam'
  },
  {
    text: 'Dear Team, please find attached the project report for review. Let me know if you have any questions or need clarification.',
    label: 'ham'
  },
  {
    text: 'Hello, could we schedule a meeting for tomorrow at 2 PM? I\'d like to discuss the new feature implementation plan.',
    label: 'ham'
  },
  {
    text: 'Thank you for your email. I appreciate your help with this issue. Best regards, John Smith from the support team.',
    label: 'ham'
  },
  {
    text: 'Please see the attached document for the updated schedule. The meeting has been moved to next week due to conflicts.',
    label: 'ham'
  },
  {
    text: 'Hi everyone, just a quick reminder about our team building event this Friday. Please RSVP by tomorrow if you\'re attending.',
    label: 'ham'
  },
  {
    text: 'I\'ve updated the project timeline based on our discussion. Please review and let me know if you need any adjustments.',
    label: 'ham'
  },
  {
    text: 'Thanks for your help with the presentation today! It went really well and the client was very impressed with our work.',
    label: 'ham'
  },
  {
    text: 'Could you please share the login credentials for the testing environment? I need to verify the bug fix before deployment.',
    label: 'ham'
  },
  {
    text: 'Please find attached the invoice for last month\'s services. Let me know if you have any questions regarding the payment.',
    label: 'ham'
  },
  {
    text: 'Hello, I wanted to follow up on my previous email about the job application. Have you had a chance to review my resume?',
    label: 'ham'
  },
  {
    text: 'Get your free trial now! Limited time offer with exclusive discount. Subscribe today and save 50% on your first month.',
    label: 'spam'
  },
  {
    text: 'Stop receiving these emails by clicking unsubscribe below. This is not spam, but a legitimate business opportunity for you.',
    label: 'spam'
  },
  {
    text: 'Act now! This amazing deal won\'t last. Buy now and receive free shipping plus a bonus gift with your purchase order.',
    label: 'spam'
  },
  {
    text: 'Your package is waiting for delivery. Click the tracking link to confirm your address and schedule delivery time today.',
    label: 'spam'
  },
  {
    text: 'We noticed suspicious activity on your account. Please click to verify your identity and secure your information now.',
    label: 'spam'
  },
  {
    text: 'Hey Sarah, thanks for the invitation to your birthday party! I\'ll definitely be there. Let me know if I can bring anything.',
    label: 'ham'
  },
  {
    text: 'The quarterly report is almost ready. I\'ll send it to you by end of day tomorrow for your review and feedback.',
    label: 'ham'
  },
  {
    text: 'Can you help me with the data analysis for this project? I\'m stuck on the calculations and need your expertise.',
    label: 'ham'
  },
  {
    text: 'Good morning! I hope you had a great weekend. Let\'s catch up at the coffee machine later to discuss our plans.',
    label: 'ham'
  },
  {
    text: 'Your appointment has been confirmed for next Tuesday at 10 AM. Please arrive 15 minutes early to complete paperwork.',
    label: 'ham'
  },
  {
    text: 'Amazing investment opportunity! Double your money in 30 days with zero risk. Guaranteed returns with our secret system.',
    label: 'spam'
  },
  {
    text: 'Free gift card for you! Just complete this short survey and receive your $100 gift card instantly. No purchase necessary.',
    label: 'spam'
  },
  {
    text: 'Claim your free Bitcoin now! Just enter your wallet address and we\'ll send you 1 BTC absolutely free. Don\'t wait!',
    label: 'spam'
  },
  {
    text: 'Urgent notice: Your insurance policy is about to expire. Contact us immediately for exclusive renewal discounts and offers.',
    label: 'spam'
  },
  {
    text: 'Last chance! This offer ends tonight. Don\'t miss out on the biggest sale of the year. Shop now before it\'s too late!',
    label: 'spam'
  },
  {
    text: 'The design files are ready for your review. Please check the attachments and let me know which version you prefer.',
    label: 'ham'
  },
  {
    text: 'I\'m attaching the meeting minutes from yesterday\'s call. Please review and let me know if I missed anything important.',
    label: 'ham'
  },
  {
    text: 'Congratulations on your promotion! Well deserved. Let\'s celebrate with lunch this week - my treat!',
    label: 'ham'
  },
  {
    text: 'Could you please send me the contact information for the client? I need to follow up on their order status today.',
    label: 'ham'
  },
  {
    text: 'The server maintenance has been completed successfully. All systems are now running normally without any issues.',
    label: 'ham'
  },
];
