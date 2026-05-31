import type { GitCommit, WeeklyStats, AuthorStats, HeatmapData, FilterOptions, AuthorWeeklyStats } from '../types';
import { getWeekStart, getWeekEnd, formatWeekLabel, getWeekday, getHour, isDateInRange } from './dateUtils';

export function filterCommits(commits: GitCommit[], filters: FilterOptions): GitCommit[] {
  return commits.filter(commit => {
    if (filters.authors.length > 0 && !filters.authors.includes(commit.author)) {
      return false;
    }
    
    if (!isDateInRange(commit.date, filters.startDate, filters.endDate)) {
      return false;
    }
    
    return true;
  });
}

export function calculateWeeklyStats(commits: GitCommit[]): WeeklyStats[] {
  if (commits.length === 0) return [];
  
  const weekMap = new Map<string, WeeklyStats>();
  
  const earliestDate = new Date(Math.min(...commits.map(c => c.date.getTime())));
  const latestDate = new Date(Math.max(...commits.map(c => c.date.getTime())));
  
  let currentWeekStart = getWeekStart(earliestDate);
  const lastWeekStart = getWeekStart(latestDate);
  
  while (currentWeekStart <= lastWeekStart) {
    const weekKey = currentWeekStart.toISOString();
    weekMap.set(weekKey, {
      weekStart: new Date(currentWeekStart),
      weekEnd: getWeekEnd(currentWeekStart),
      weekLabel: formatWeekLabel(currentWeekStart),
      commits: 0,
      insertions: 0,
      deletions: 0,
      byAuthor: {},
    });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  for (const commit of commits) {
    const weekStart = getWeekStart(commit.date);
    const weekKey = weekStart.toISOString();
    const weekStats = weekMap.get(weekKey);
    
    if (weekStats) {
      weekStats.commits++;
      weekStats.insertions += commit.insertions;
      weekStats.deletions += commit.deletions;
      
      if (!weekStats.byAuthor[commit.author]) {
        weekStats.byAuthor[commit.author] = {
          commits: 0,
          insertions: 0,
          deletions: 0,
        };
      }
      
      const authorStats = weekStats.byAuthor[commit.author] as AuthorWeeklyStats;
      authorStats.commits++;
      authorStats.insertions += commit.insertions;
      authorStats.deletions += commit.deletions;
    }
  }
  
  return Array.from(weekMap.values()).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
}

export function calculateAuthorStats(commits: GitCommit[]): AuthorStats[] {
  if (commits.length === 0) return [];
  
  const authorMap = new Map<string, AuthorStats>();
  
  for (const commit of commits) {
    let stats = authorMap.get(commit.author);
    
    if (!stats) {
      stats = {
        name: commit.author,
        totalCommits: 0,
        totalInsertions: 0,
        totalDeletions: 0,
        firstCommit: new Date(commit.date),
        lastCommit: new Date(commit.date),
      };
      authorMap.set(commit.author, stats);
    }
    
    stats.totalCommits++;
    stats.totalInsertions += commit.insertions;
    stats.totalDeletions += commit.deletions;
    
    if (commit.date < stats.firstCommit) {
      stats.firstCommit = new Date(commit.date);
    }
    if (commit.date > stats.lastCommit) {
      stats.lastCommit = new Date(commit.date);
    }
  }
  
  return Array.from(authorMap.values()).sort((a, b) => b.totalCommits - a.totalCommits);
}

export function generateHeatmapData(commits: GitCommit[]): HeatmapData[][] {
  const data: HeatmapData[][] = Array.from({ length: 7 }, () => 
    Array.from({ length: 24 }, (_, hour) => ({
      hour,
      weekday: 0,
      count: 0,
    }))
  );
  
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      data[weekday][hour] = {
        hour,
        weekday,
        count: 0,
      };
    }
  }
  
  for (const commit of commits) {
    const weekday = getWeekday(commit.date);
    const hour = getHour(commit.date);
    
    if (weekday >= 0 && weekday < 7 && hour >= 0 && hour < 24) {
      data[weekday][hour].count++;
    }
  }
  
  return data;
}

export function getAllAuthors(commits: GitCommit[]): string[] {
  const authors = new Set(commits.map(c => c.author));
  return Array.from(authors).sort();
}

export function getDateRange(commits: GitCommit[]): { min: Date | null; max: Date | null } {
  if (commits.length === 0) {
    return { min: null, max: null };
  }
  
  const dates = commits.map(c => c.date.getTime());
  return {
    min: new Date(Math.min(...dates)),
    max: new Date(Math.max(...dates)),
  };
}

export function getTotalStats(commits: GitCommit[]) {
  const totalCommits = commits.length;
  const totalInsertions = commits.reduce((sum, c) => sum + c.insertions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const totalFiles = commits.reduce((sum, c) => sum + c.filesChanged, 0);
  const authors = new Set(commits.map(c => c.author));
  
  return {
    totalCommits,
    totalInsertions,
    totalDeletions,
    totalFiles,
    totalAuthors: authors.size,
    netLines: totalInsertions - totalDeletions,
  };
}

export function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  const trend = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(trend)), isPositive: trend >= 0 };
}
