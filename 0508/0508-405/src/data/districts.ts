import { District } from '../types';

export const districts: District[] = [
  {
    id: 'district-center',
    name: '中心区',
    color: '#E8F5E9',
    boundary: 'M400,250 L500,200 L600,250 L600,400 L500,450 L400,400 Z',
  },
  {
    id: 'district-east',
    name: '东城区',
    color: '#E3F2FD',
    boundary: 'M600,250 L750,180 L800,250 L800,400 L750,480 L600,400 L600,250 Z',
  },
  {
    id: 'district-west',
    name: '西城区',
    color: '#FFF3E0',
    boundary: 'M200,250 L300,200 L400,250 L400,400 L300,450 L200,400 Z',
  },
  {
    id: 'district-south',
    name: '南城区',
    color: '#F3E5F5',
    boundary: 'M300,450 L400,400 L500,450 L600,400 L700,480 L650,580 L350,580 Z',
  },
  {
    id: 'district-north',
    name: '北城区',
    color: '#E0F7FA',
    boundary: 'M300,80 L400,50 L500,80 L600,50 L700,100 L650,200 L500,200 L350,200 Z',
  },
  {
    id: 'district-development',
    name: '开发区',
    color: '#FFFDE7',
    boundary: 'M700,100 L850,50 L900,150 L900,350 L800,400 L800,250 L750,180 L700,100 Z',
  },
];
