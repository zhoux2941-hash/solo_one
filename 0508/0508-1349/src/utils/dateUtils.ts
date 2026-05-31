export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
};

export const formatFullDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};

export const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayString();
};

export const addDays = (dateStr: string, days: number): string => {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export const generateTaskId = (dateStr: string, index: number): string => {
  return `${dateStr}_${index}`;
};

export const getWeekRange = (dateStr: string): { start: string; end: string; dates: string[] } => {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;

  const startDate = new Date(date);
  startDate.setDate(diff);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(formatDate(d));
  }

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
    dates,
  };
};

export const getWeekdayShort = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
};

export const getDayOfMonth = (dateStr: string): number => {
  return parseDate(dateStr).getDate();
};
