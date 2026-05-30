import { FaceTemplate } from '../types';

export const faceTemplates: FaceTemplate[] = [
  {
    id: 'square',
    name: '方脸',
    svg: `<svg viewBox="0 0 300 400">
      <path d="M70,50 L230,50 L250,120 L250,280 L230,350 L70,350 L50,280 L50,120 Z" fill="none" stroke="#000" stroke-width="2"/>
      <path d="M90,150 L210,150" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="110" cy="130" rx="25" ry="15" fill="none" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="190" cy="130" rx="25" ry="15" fill="none" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="150" cy="240" rx="30" ry="35" fill="none" stroke="#000" stroke-width="1.5"/>
      <path d="M130,300 L170,300" stroke="#000" stroke-width="2"/>
      <path d="M110,80 L150,50 L190,80" stroke="#000" stroke-width="2"/>
      <path d="M90,90 L110,70" stroke="#000" stroke-width="1.5"/>
      <path d="M190,70 L210,90" stroke="#000" stroke-width="1.5"/>
      <circle cx="110" cy="130" r="5" fill="#000"/>
      <circle cx="190" cy="130" r="5" fill="#000"/>
      <path d="M100,180 L150,200 L200,180" stroke="#000" stroke-width="1.5"/>
      <path d="M100,180 L150,200 L200,180" stroke="#000" stroke-width="1.5"/>
    </svg>`,
    regions: [
      { id: 'forehead', name: '额头', path: 'M70,50 L230,50 L250,120 L250,150 L50,150 L50,120 Z' },
      { id: 'leftCheek', name: '左脸颊', path: 'M50,150 L50,280 L70,350 L150,350 L150,150 Z' },
      { id: 'rightCheek', name: '右脸颊', path: 'M150,150 L150,350 L230,350 L250,280 L250,150 Z' },
      { id: 'nose', name: '鼻子', path: 'M130,200 L150,180 L170,200 L160,240 L140,240 Z' },
      { id: 'mouth', name: '嘴巴', path: 'M130,290 L170,290 L165,305 L135,305 Z' },
      { id: 'leftEye', name: '左眼', path: 'M85,115 L135,115 L135,145 L85,145 Z' },
      { id: 'rightEye', name: '右眼', path: 'M165,115 L215,115 L215,145 L165,145 Z' },
      { id: 'eyebrows', name: '眉毛', path: 'M90,90 L150,75 L210,90' },
    ],
  },
  {
    id: 'round',
    name: '圆脸',
    svg: `<svg viewBox="0 0 300 400">
      <ellipse cx="150" cy="200" rx="100" ry="130" fill="none" stroke="#000" stroke-width="2"/>
      <ellipse cx="110" cy="160" rx="25" ry="15" fill="none" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="190" cy="160" rx="25" ry="15" fill="none" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="150" cy="240" rx="25" ry="30" fill="none" stroke="#000" stroke-width="1.5"/>
      <path d="M130,300 Q150,310 L170,300" stroke="#000" stroke-width="2"/>
      <path d="M100,100 Q150,70 L200,100" stroke="#000" stroke-width="2"/>
      <circle cx="110" cy="160" r="5" fill="#000"/>
      <circle cx="190" cy="160" r="5" fill="#000"/>
      <path d="M90,200 L150,220 L210,200" stroke="#000" stroke-width="1.5"/>
    </svg>`,
    regions: [
      { id: 'forehead', name: '额头', path: 'M50,120 Q150,70 L250,120 Q250,170 L150,170 Q50,170 Z' },
      { id: 'leftCheek', name: '左脸颊', path: 'M50,170 Q50,280 L150,330 Q150,170 Z' },
      { id: 'rightCheek', name: '右脸颊', path: 'M150,170 Q250,170 L250,280 Q150,330 Z' },
      { id: 'nose', name: '鼻子', path: 'M135,210 L150,200 L165,210 L160,250 L140,250 Z' },
      { id: 'mouth', name: '嘴巴', path: 'M130,290 L170,290 L160,310 L140,310 Z' },
      { id: 'leftEye', name: '左眼', path: 'M85,145 L135,145 L135,175 L85,175 Z' },
      { id: 'rightEye', name: '右眼', path: 'M165,145 L215,145 L215,175 L165,175 Z' },
      { id: 'eyebrows', name: '眉毛', path: 'M90,100 Q150,80 L210,100' },
    ],
  },
  {
    id: 'sharp',
    name: '尖脸',
    svg: `<svg viewBox="0 0 300 400">
      <path d="M150,50 L230,100 L250,200 L220,300 L150,380 L80,300 L50,200 L70,100 Z" fill="none" stroke="#000" stroke-width="2"/>
      <ellipse cx="110" cy="150" rx="22" ry="12" fill="none" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="190" cy="150" rx="22" ry="12" fill="none" stroke="#000" stroke-width="1.5"/>
      <path d="M135,200 L150,180 L165,200 L160,250 L140,250 Z" fill="none" stroke="#000" stroke-width="1.5"/>
      <path d="M130,280 L170,280" stroke="#000" stroke-width="2"/>
      <path d="M100,90 L150,60 L200,90" stroke="#000" stroke-width="2"/>
      <circle cx="110" cy="150" r="4" fill="#000"/>
      <circle cx="190" cy="150" r="4" fill="#000"/>
      <path d="M90,100 L110,85" stroke="#000" stroke-width="1.5"/>
      <path d="M190,85 L210,100" stroke="#000" stroke-width="1.5"/>
      <path d="M100,180 L150,200 L200,180" stroke="#000" stroke-width="1.5"/>
    </svg>`,
    regions: [
      { id: 'forehead', name: '额头', path: 'M70,100 L150,50 L230,100 L250,160 L50,160 Z' },
      { id: 'leftCheek', name: '左脸颊', path: 'M50,160 L50,200 L80,300 L150,380 L150,160 Z' },
      { id: 'rightCheek', name: '右脸颊', path: 'M150,160 L150,380 L220,300 L250,200 L250,160 Z' },
      { id: 'nose', name: '鼻子', path: 'M135,200 L150,185 L165,200 L160,250 L140,250 Z' },
      { id: 'mouth', name: '嘴巴', path: 'M130,275 L170,275 L160,290 L140,290 Z' },
      { id: 'leftEye', name: '左眼', path: 'M88,138 L132,138 L132,162 L88,162 Z' },
      { id: 'rightEye', name: '右眼', path: 'M168,138 L212,138 L212,162 L168,162 Z' },
      { id: 'eyebrows', name: '眉毛', path: 'M90,95 L150,70 L210,95' },
    ],
  },
];
