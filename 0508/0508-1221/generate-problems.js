const fs = require('fs');
const path = require('path');

const content = `import { Problem } from '@/types';

const createProblems = (): Problem[] => {
  const problems: Problem[] = [];
  let id = 1;

  const cornerBeginner: Partial<Problem>[] = [
    {
      title: '直三', category: 'corner', difficulty: 'beginner', description: '黑先活棋，找到做眼要点',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'white' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'black' },
        { x: 3, y: 1, color: 'black' }, { x: 3, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 1, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 1, y: 2 }],
      refAnswer: [{ x: 1, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '曲三', category: 'corner', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'white' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'black' },
        { x: 3, y: 1, color: 'black' },
        { x: 3, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 2 }],
      refAnswer: [{ x: 2, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '方四', category: 'corner', difficulty: 'beginner', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 3, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'black' }, { x: 3, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'white' },
        { x: 1, y: 1, color: 'white' }, { x: 2, y: 1, color: 'white' },
        { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' },
      ],
      correctMoves: [{ x: 1, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 1, y: 1 }],
      refAnswer: [{ x: 1, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '刀五', category: 'corner', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'white' },
        { x: 0, y: 4, color: 'white' }, { x: 1, y: 4, color: 'black' }, { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'black' }, { x: 4, y: 4, color: 'black' },
        { x: 4, y: 1, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 4, y: 3, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 3 }],
      refAnswer: [{ x: 2, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '花五', category: 'corner', difficulty: 'beginner', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' }, { x: 4, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 4, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'black' }, { x: 4, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'black' }, { x: 4, y: 3, color: 'white' },
        { x: 0, y: 4, color: 'black' }, { x: 1, y: 4, color: 'black' }, { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'black' }, { x: 4, y: 4, color: 'white' },
        { x: 1, y: 1, color: 'white' }, { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' },
        { x: 1, y: 3, color: 'white' }, { x: 2, y: 3, color: 'white' }, { x: 3, y: 3, color: 'white' },
      ],
      correctMoves: [{ x: 2, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 2 }],
      refAnswer: [{ x: 2, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '板六', category: 'corner', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' }, { x: 5, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'white' }, { x: 1, y: 2, color: 'black' }, { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' },
        { x: 5, y: 1, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 1 }],
      refAnswer: [{ x: 2, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const cornerIntermediate: Partial<Problem>[] = [
    {
      title: '大猪嘴', category: 'corner', difficulty: 'intermediate', description: '黑先杀白（扳点立）',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 3, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'black' }, { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' }, { x: 3, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'white' },
        { x: 0, y: 4, color: 'black' }, { x: 1, y: 4, color: 'black' }, { x: 2, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 1 }],
      refAnswer: [{ x: 2, y: 1, color: 'black', order: 1 }, { x: 1, y: 1, color: 'white', order: 2 }],
      playerColor: 'black',
    },
    {
      title: '小猪嘴', category: 'corner', difficulty: 'intermediate', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'black' }, { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'white' },
        { x: 0, y: 4, color: 'black' }, { x: 1, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 1, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 1, y: 1 }],
      refAnswer: [{ x: 1, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '紧气劫', category: 'corner', difficulty: 'intermediate', description: '黑先做劫',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' }, { x: 3, y: 1, color: 'black' },
        { x: 0, y: 2, color: 'white' }, { x: 1, y: 2, color: 'black' }, { x: 2, y: 2, color: 'black' },
        { x: 0, y: 3, color: 'white' }, { x: 1, y: 3, color: 'black' },
        { x: 0, y: 4, color: 'white' }, { x: 1, y: 4, color: 'white' },
      ],
      correctMoves: [{ x: 2, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 1 }],
      refAnswer: [{ x: 2, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '万年劫', category: 'corner', difficulty: 'intermediate', description: '黑先，结果如何？',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' }, { x: 4, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 1, y: 1, color: 'white' }, { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' }, { x: 4, y: 1, color: 'black' },
        { x: 0, y: 2, color: 'black' }, { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' }, { x: 4, y: 2, color: 'black' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'black' }, { x: 4, y: 3, color: 'black' },
      ],
      correctMoves: [{ x: 3, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 3, y: 2 }],
      refAnswer: [{ x: 3, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const cornerAdvanced: Partial<Problem>[] = [
    {
      title: '金柜角', category: 'corner', difficulty: 'advanced', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'white' }, { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'white' }, { x: 3, y: 1, color: 'black' },
        { x: 0, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'white' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'black' },
        { x: 1, y: 1, color: 'black' }, { x: 2, y: 1, color: 'black' },
      ],
      correctMoves: [{ x: 1, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 1, y: 2 }],
      refAnswer: [{ x: 1, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '斗笠四', category: 'corner', difficulty: 'advanced', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'black' }, { x: 3, y: 0, color: 'black' }, { x: 4, y: 0, color: 'black' },
        { x: 0, y: 1, color: 'black' }, { x: 2, y: 1, color: 'white' }, { x: 4, y: 1, color: 'black' },
        { x: 0, y: 2, color: 'black' }, { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'white' }, { x: 3, y: 2, color: 'white' }, { x: 4, y: 2, color: 'black' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'white' }, { x: 3, y: 3, color: 'white' },
        { x: 0, y: 4, color: 'black' }, { x: 1, y: 4, color: 'black' }, { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'black' }, { x: 4, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 3 }],
      refAnswer: [{ x: 2, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '高级对杀', category: 'corner', difficulty: 'advanced', description: '黑先，对杀获胜',
      boardSize: 9,
      initialStones: [
        { x: 0, y: 0, color: 'black' }, { x: 1, y: 0, color: 'black' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' },
        { x: 0, y: 1, color: 'black' }, { x: 1, y: 1, color: 'white' }, { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' },
        { x: 0, y: 2, color: 'black' }, { x: 1, y: 2, color: 'white' },
        { x: 0, y: 3, color: 'black' }, { x: 1, y: 3, color: 'black' }, { x: 2, y: 3, color: 'black' },
      ],
      correctMoves: [{ x: 0, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 0, y: 1 }],
      refAnswer: [{ x: 0, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const edgeBeginner: Partial<Problem>[] = [
    {
      title: '边部直三', category: 'edge', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' }, { x: 5, y: 0, color: 'white' }, { x: 6, y: 0, color: 'white' },
        { x: 2, y: 1, color: 'white' }, { x: 6, y: 1, color: 'black' },
        { x: 2, y: 2, color: 'white' }, { x: 6, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'white' }, { x: 3, y: 3, color: 'black' }, { x: 4, y: 3, color: 'black' }, { x: 5, y: 3, color: 'black' }, { x: 6, y: 3, color: 'black' },
        { x: 3, y: 1, color: 'black' }, { x: 5, y: 1, color: 'black' },
        { x: 3, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 2 }],
      refAnswer: [{ x: 4, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '边部板六', category: 'edge', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 1, y: 0, color: 'white' }, { x: 2, y: 0, color: 'white' }, { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' }, { x: 5, y: 0, color: 'white' }, { x: 6, y: 0, color: 'white' }, { x: 7, y: 0, color: 'white' },
        { x: 1, y: 1, color: 'white' }, { x: 7, y: 1, color: 'white' },
        { x: 1, y: 2, color: 'white' }, { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' }, { x: 7, y: 2, color: 'white' },
        { x: 2, y: 1, color: 'black' }, { x: 3, y: 1, color: 'black' }, { x: 5, y: 1, color: 'black' }, { x: 6, y: 1, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 1 }],
      refAnswer: [{ x: 4, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '二线扳', category: 'edge', difficulty: 'beginner', description: '黑先救出黑子',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 0, color: 'white' }, { x: 4, y: 0, color: 'white' }, { x: 5, y: 0, color: 'white' },
        { x: 3, y: 1, color: 'white' }, { x: 4, y: 1, color: 'black' }, { x: 5, y: 1, color: 'black' }, { x: 6, y: 1, color: 'black' },
        { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'white' },
      ],
      correctMoves: [{ x: 6, y: 0, color: 'black', order: 1 }],
      hintPoints: [{ x: 6, y: 0 }],
      refAnswer: [{ x: 6, y: 0, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '立二拆三', category: 'edge', difficulty: 'beginner', description: '黑先防守',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' },
        { x: 2, y: 2, color: 'white' },
        { x: 4, y: 3, color: 'black' }, { x: 5, y: 3, color: 'black' }, { x: 6, y: 3, color: 'black' },
        { x: 4, y: 4, color: 'black' },
        { x: 4, y: 5, color: 'black' },
      ],
      correctMoves: [{ x: 3, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 3, y: 3 }],
      refAnswer: [{ x: 3, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const edgeIntermediate: Partial<Problem>[] = [
    {
      title: '边部对杀', category: 'edge', difficulty: 'intermediate', description: '黑先对杀',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 1, color: 'black' }, { x: 3, y: 1, color: 'black' },
        { x: 2, y: 2, color: 'white' }, { x: 3, y: 2, color: 'white' }, { x: 4, y: 2, color: 'white' },
        { x: 2, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' },
        { x: 2, y: 4, color: 'white' }, { x: 3, y: 4, color: 'white' }, { x: 4, y: 4, color: 'white' }, { x: 5, y: 4, color: 'white' },
        { x: 1, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 1, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 1, y: 3 }],
      refAnswer: [{ x: 1, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '渡', category: 'edge', difficulty: 'intermediate', description: '黑先渡过联络',
      boardSize: 9,
      initialStones: [
        { x: 1, y: 2, color: 'black' }, { x: 2, y: 2, color: 'black' },
        { x: 3, y: 2, color: 'white' },
        { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' },
        { x: 3, y: 1, color: 'white' }, { x: 3, y: 3, color: 'white' },
        { x: 2, y: 1, color: 'white' }, { x: 4, y: 1, color: 'white' },
      ],
      correctMoves: [{ x: 2, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 3 }],
      refAnswer: [{ x: 2, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '门吃', category: 'edge', difficulty: 'intermediate', description: '黑先吃白子',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 2, color: 'white' }, { x: 3, y: 2, color: 'white' },
        { x: 4, y: 1, color: 'white' },
        { x: 2, y: 1, color: 'black' },
        { x: 2, y: 3, color: 'black' },
        { x: 4, y: 3, color: 'black' },
        { x: 5, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 3, y: 1, color: 'black', order: 1 }],
      hintPoints: [{ x: 3, y: 1 }],
      refAnswer: [{ x: 3, y: 1, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '抱吃', category: 'edge', difficulty: 'intermediate', description: '黑先吃白子',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 2, color: 'white' },
        { x: 2, y: 3, color: 'white' },
        { x: 3, y: 1, color: 'black' },
        { x: 4, y: 2, color: 'black' },
        { x: 4, y: 3, color: 'black' },
        { x: 2, y: 1, color: 'black' },
      ],
      correctMoves: [{ x: 2, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 2, y: 2 }],
      refAnswer: [{ x: 2, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const edgeAdvanced: Partial<Problem>[] = [
    {
      title: '复杂对杀', category: 'edge', difficulty: 'advanced', description: '黑先对杀胜',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' }, { x: 4, y: 1, color: 'white' },
        { x: 2, y: 2, color: 'white' }, { x: 5, y: 2, color: 'white' },
        { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'black' }, { x: 4, y: 3, color: 'black' }, { x: 5, y: 3, color: 'black' },
        { x: 1, y: 2, color: 'black' }, { x: 1, y: 1, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 2 }],
      refAnswer: [{ x: 4, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '边部劫争', category: 'edge', difficulty: 'advanced', description: '黑先做劫',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 1, color: 'white' }, { x: 3, y: 1, color: 'white' }, { x: 4, y: 1, color: 'white' }, { x: 5, y: 1, color: 'white' },
        { x: 2, y: 2, color: 'white' }, { x: 5, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'white' }, { x: 3, y: 3, color: 'black' }, { x: 4, y: 3, color: 'black' },
        { x: 2, y: 4, color: 'white' }, { x: 3, y: 4, color: 'white' },
      ],
      correctMoves: [{ x: 4, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 2 }],
      refAnswer: [{ x: 4, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const centerBeginner: Partial<Problem>[] = [
    {
      title: '中央直四', category: 'center', difficulty: 'beginner', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 3, y: 3, color: 'black' }, { x: 6, y: 3, color: 'black' },
        { x: 3, y: 4, color: 'black' }, { x: 6, y: 4, color: 'black' },
        { x: 3, y: 5, color: 'black' }, { x: 4, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' }, { x: 6, y: 5, color: 'black' },
        { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' },
        { x: 5, y: 4, color: 'white' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '中央方四', category: 'center', difficulty: 'beginner', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 3, y: 3, color: 'black' }, { x: 6, y: 3, color: 'black' },
        { x: 3, y: 4, color: 'black' }, { x: 6, y: 4, color: 'black' },
        { x: 3, y: 5, color: 'black' }, { x: 4, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' }, { x: 6, y: 5, color: 'black' },
        { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' },
        { x: 4, y: 4, color: 'white' },
      ],
      correctMoves: [{ x: 5, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 5, y: 4 }],
      refAnswer: [{ x: 5, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '中央曲四', category: 'center', difficulty: 'beginner', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 2, color: 'white' }, { x: 4, y: 2, color: 'white' }, { x: 5, y: 2, color: 'white' }, { x: 6, y: 2, color: 'white' },
        { x: 3, y: 3, color: 'white' }, { x: 6, y: 3, color: 'white' },
        { x: 3, y: 4, color: 'white' }, { x: 6, y: 4, color: 'white' },
        { x: 3, y: 5, color: 'white' }, { x: 4, y: 5, color: 'white' }, { x: 5, y: 5, color: 'white' }, { x: 6, y: 5, color: 'white' },
        { x: 4, y: 3, color: 'black' }, { x: 5, y: 3, color: 'black' },
        { x: 4, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 5, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 5, y: 4 }],
      refAnswer: [{ x: 5, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '双打吃', category: 'center', difficulty: 'beginner', description: '黑先双打吃白子',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' },
        { x: 4, y: 4, color: 'white' }, { x: 5, y: 4, color: 'white' },
        { x: 3, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 6, y: 4, color: 'black' },
        { x: 3, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 2, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 2 }],
      refAnswer: [{ x: 4, y: 2, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '征子', category: 'center', difficulty: 'beginner', description: '黑先征吃白子',
      boardSize: 9,
      initialStones: [
        { x: 4, y: 3, color: 'white' },
        { x: 3, y: 4, color: 'white' },
        { x: 3, y: 3, color: 'black' }, { x: 4, y: 4, color: 'black' },
        { x: 5, y: 3, color: 'black' },
        { x: 2, y: 2, color: 'black' },
      ],
      correctMoves: [{ x: 5, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 5, y: 4 }],
      refAnswer: [{ x: 5, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '枷吃', category: 'center', difficulty: 'beginner', description: '黑先枷吃白子',
      boardSize: 9,
      initialStones: [
        { x: 4, y: 3, color: 'white' },
        { x: 3, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' },
        { x: 2, y: 4, color: 'black' }, { x: 6, y: 4, color: 'black' },
        { x: 3, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const centerIntermediate: Partial<Problem>[] = [
    {
      title: '中央刀五', category: 'center', difficulty: 'intermediate', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'black' },
        { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'white' }, { x: 6, y: 4, color: 'black' },
        { x: 2, y: 5, color: 'black' }, { x: 3, y: 5, color: 'white' }, { x: 6, y: 5, color: 'black' },
        { x: 2, y: 6, color: 'black' }, { x: 3, y: 6, color: 'black' }, { x: 4, y: 6, color: 'black' }, { x: 5, y: 6, color: 'black' }, { x: 6, y: 6, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '中央花五', category: 'center', difficulty: 'intermediate', description: '黑先杀白',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'black' },
        { x: 2, y: 4, color: 'black' }, { x: 4, y: 4, color: 'white' }, { x: 6, y: 4, color: 'black' },
        { x: 2, y: 5, color: 'black' }, { x: 3, y: 5, color: 'white' }, { x: 4, y: 5, color: 'white' }, { x: 5, y: 5, color: 'white' }, { x: 6, y: 5, color: 'black' },
        { x: 2, y: 6, color: 'black' }, { x: 3, y: 6, color: 'black' }, { x: 4, y: 6, color: 'black' }, { x: 5, y: 6, color: 'black' }, { x: 6, y: 6, color: 'black' },
      ],
      correctMoves: [{ x: 5, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 5, y: 4 }],
      refAnswer: [{ x: 5, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '中央板六', category: 'center', difficulty: 'intermediate', description: '黑先活棋',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 3, color: 'white' }, { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'white' }, { x: 7, y: 3, color: 'white' },
        { x: 2, y: 4, color: 'white' }, { x: 7, y: 4, color: 'white' },
        { x: 2, y: 5, color: 'white' }, { x: 3, y: 5, color: 'white' }, { x: 4, y: 5, color: 'white' }, { x: 5, y: 5, color: 'white' }, { x: 6, y: 5, color: 'white' }, { x: 7, y: 5, color: 'white' },
        { x: 3, y: 4, color: 'black' }, { x: 5, y: 4, color: 'black' }, { x: 6, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '倒扑', category: 'center', difficulty: 'intermediate', description: '黑先倒扑吃白',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' },
        { x: 3, y: 4, color: 'white' },
        { x: 5, y: 3, color: 'black' }, { x: 5, y: 4, color: 'black' },
        { x: 4, y: 5, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 2, y: 4, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '接不归', category: 'center', difficulty: 'intermediate', description: '黑先使白接不归',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' },
        { x: 3, y: 4, color: 'white' }, { x: 6, y: 4, color: 'white' },
        { x: 2, y: 4, color: 'black' },
        { x: 2, y: 5, color: 'black' }, { x: 3, y: 5, color: 'black' }, { x: 4, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' },
        { x: 7, y: 3, color: 'black' },
      ],
      correctMoves: [{ x: 5, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 5, y: 4 }],
      refAnswer: [{ x: 5, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const centerAdvanced: Partial<Problem>[] = [
    {
      title: '中央聚杀', category: 'center', difficulty: 'advanced', description: '黑先聚杀白棋',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'black' },
        { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'white' }, { x: 5, y: 4, color: 'white' }, { x: 6, y: 4, color: 'black' },
        { x: 2, y: 5, color: 'black' }, { x: 3, y: 5, color: 'white' }, { x: 4, y: 5, color: 'white' }, { x: 5, y: 5, color: 'white' }, { x: 6, y: 5, color: 'black' },
        { x: 2, y: 6, color: 'black' }, { x: 3, y: 6, color: 'black' }, { x: 4, y: 6, color: 'black' }, { x: 5, y: 6, color: 'black' }, { x: 6, y: 6, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '复杂劫争', category: 'center', difficulty: 'advanced', description: '黑先，最佳结果是？',
      boardSize: 9,
      initialStones: [
        { x: 2, y: 2, color: 'black' }, { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' }, { x: 5, y: 2, color: 'black' }, { x: 6, y: 2, color: 'black' },
        { x: 2, y: 3, color: 'black' }, { x: 3, y: 3, color: 'white' }, { x: 4, y: 3, color: 'white' }, { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'white' },
        { x: 2, y: 4, color: 'black' }, { x: 3, y: 4, color: 'white' }, { x: 6, y: 4, color: 'white' },
        { x: 2, y: 5, color: 'black' }, { x: 3, y: 5, color: 'black' }, { x: 4, y: 5, color: 'black' }, { x: 5, y: 5, color: 'white' }, { x: 6, y: 5, color: 'black' },
      ],
      correctMoves: [{ x: 4, y: 4, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 4 }],
      refAnswer: [{ x: 4, y: 4, color: 'black', order: 1 }],
      playerColor: 'black',
    },
    {
      title: '中央对杀', category: 'center', difficulty: 'advanced', description: '黑先对杀胜',
      boardSize: 9,
      initialStones: [
        { x: 3, y: 2, color: 'black' }, { x: 4, y: 2, color: 'black' },
        { x: 3, y: 3, color: 'black' },
        { x: 3, y: 4, color: 'black' },
        { x: 5, y: 3, color: 'white' }, { x: 6, y: 3, color: 'white' },
        { x: 4, y: 4, color: 'white' }, { x: 5, y: 4, color: 'white' }, { x: 6, y: 4, color: 'white' },
        { x: 3, y: 5, color: 'white' }, { x: 4, y: 5, color: 'white' }, { x: 5, y: 5, color: 'white' },
        { x: 2, y: 4, color: 'white' },
      ],
      correctMoves: [{ x: 4, y: 3, color: 'black', order: 1 }],
      hintPoints: [{ x: 4, y: 3 }],
      refAnswer: [{ x: 4, y: 3, color: 'black', order: 1 }],
      playerColor: 'black',
    },
  ];

  const allProblems = [
    ...cornerBeginner,
    ...cornerIntermediate,
    ...cornerAdvanced,
    ...edgeBeginner,
    ...edgeIntermediate,
    ...edgeAdvanced,
    ...centerBeginner,
    ...centerIntermediate,
    ...centerAdvanced,
  ];

  allProblems.forEach((p) => {
    const occupied = new Set<string>();
    (p.initialStones || []).forEach(s => occupied.add(\`\\\${s.x},\\\${s.y}\`));

    (p.correctMoves || []).forEach(m => {
      if (occupied.has(\`\\\${m.x},\\\${m.y}\`)) {
        console.error(\`Problem "\\\${p.title}": correctMove at (\\\${m.x},\\\${m.y}) overlaps with initialStone!\`);
      }
    });

    (p.hintPoints || []).forEach(h => {
      if (occupied.has(\`\\\${h.x},\\\${h.y}\`)) {
        console.error(\`Problem "\\\${p.title}": hintPoint at (\\\${h.x},\\\${h.y}) overlaps with initialStone!\`);
      }
    });

    problems.push({
      id: \`p\\\${String(id).padStart(2, '0')}\`,
      title: p.title || '',
      category: p.category || 'corner',
      difficulty: p.difficulty || 'beginner',
      boardSize: p.boardSize || 9,
      description: p.description || '',
      initialStones: p.initialStones || [],
      correctMoves: p.correctMoves || [],
      hintPoints: p.hintPoints || [],
      refAnswer: p.refAnswer || [],
      playerColor: p.playerColor || 'black',
    });
    id++;
  });

  return problems;
};

export const problems: Problem[] = createProblems();
`;

const outputPath = path.join(__dirname, 'src', 'data', 'problems.ts');
fs.writeFileSync(outputPath, content, 'utf8');
console.log('Generated problems.ts successfully!');
console.log('Output path:', outputPath);
