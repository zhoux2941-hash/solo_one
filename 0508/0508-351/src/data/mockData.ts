import { WorkPoint, Schedule, Team, Handover } from '../types';

export const mockWorkPoints: WorkPoint[] = [
  { id: 'wp1', name: 'A站', line: '1号线', position: 1, status: 'normal' },
  { id: 'wp2', name: 'B站', line: '1号线', position: 2, status: 'normal' },
  { id: 'wp3', name: 'C站', line: '1号线', position: 3, status: 'maintenance' },
  { id: 'wp4', name: 'D站', line: '1号线', position: 4, status: 'normal' },
  { id: 'wp5', name: 'E站', line: '1号线', position: 5, status: 'normal' },
  { id: 'wp6', name: 'F站', line: '2号线', position: 1, status: 'normal' },
  { id: 'wp7', name: 'G站', line: '2号线', position: 2, status: 'offline' },
  { id: 'wp8', name: 'H站', line: '2号线', position: 3, status: 'normal' },
];

const today = new Date();
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    workpointId: 'wp1',
    type: 'power-off',
    startTime: new Date(startOfDay.getTime() + 8 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 10 * 60 * 60 * 1000),
    teamId: 't1',
    status: 'pending',
    title: '1号线A站断电窗口',
    description: '例行断电检修'
  },
  {
    id: 's2',
    workpointId: 'wp1',
    type: 'sensor-replace',
    startTime: new Date(startOfDay.getTime() + 8.5 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 9.5 * 60 * 60 * 1000),
    teamId: 't1',
    status: 'pending',
    title: 'A站传感器更换',
    description: '更换温度传感器'
  },
  {
    id: 's3',
    workpointId: 'wp1',
    type: 'team-entry',
    startTime: new Date(startOfDay.getTime() + 8 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 10 * 60 * 60 * 1000),
    teamId: 't1',
    status: 'pending',
    title: '检修一班进场',
    description: '检修一班人员进场作业'
  },
  {
    id: 's4',
    workpointId: 'wp2',
    type: 'power-off',
    startTime: new Date(startOfDay.getTime() + 14 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 16 * 60 * 60 * 1000),
    teamId: 't2',
    status: 'pending',
    title: '1号线B站断电窗口',
    description: '例行断电检修'
  },
  {
    id: 's5',
    workpointId: 'wp2',
    type: 'sensor-replace',
    startTime: new Date(startOfDay.getTime() + 14.5 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 15.5 * 60 * 60 * 1000),
    teamId: 't2',
    status: 'pending',
    title: 'B站传感器更换',
    description: '更换速度传感器'
  },
  {
    id: 's6',
    workpointId: 'wp3',
    type: 'power-off',
    startTime: new Date(startOfDay.getTime() + 10 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 12 * 60 * 60 * 1000),
    teamId: 't1',
    status: 'in-progress',
    title: '1号线C站断电窗口',
    description: '紧急维修断电'
  },
  {
    id: 's7',
    workpointId: 'wp3',
    type: 'recovery',
    startTime: new Date(startOfDay.getTime() + 11.5 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 12 * 60 * 60 * 1000),
    teamId: 't1',
    status: 'pending',
    title: 'C站旧件回收',
    description: '回收更换下来的传感器'
  },
  {
    id: 's8',
    workpointId: 'wp4',
    type: 'power-off',
    startTime: new Date(startOfDay.getTime() + 20 * 60 * 60 * 1000),
    endTime: new Date(startOfDay.getTime() + 22 * 60 * 60 * 1000),
    teamId: 't2',
    status: 'pending',
    title: '1号线D站断电窗口',
    description: '夜间检修窗口'
  }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: '检修一班',
    leader: '张工',
    members: ['张三', '李四', '王五'],
    shift: 'day'
  },
  {
    id: 't2',
    name: '检修二班',
    leader: '李工',
    members: ['赵六', '钱七', '孙八'],
    shift: 'night'
  }
];

export const mockHandovers: Handover[] = [
  {
    id: 'h1',
    shiftDate: today,
    fromTeam: 't1',
    toTeam: 't2',
    content: '白班工作已完成，夜班继续处理C站剩余工作',
    tasks: [
      { id: 'task1', title: '完成C站传感器更换', status: 'completed', priority: 'high' },
      { id: 'task2', title: '回收旧件', status: 'pending', priority: 'medium' },
      { id: 'task3', title: '检查D站设备', status: 'pending', priority: 'low' }
    ],
    status: 'submitted',
    createdAt: new Date(startOfDay.getTime() + 18 * 60 * 60 * 1000)
  }
];
