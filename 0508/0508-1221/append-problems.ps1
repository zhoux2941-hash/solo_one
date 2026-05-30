
$additional = @'

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
'@

$file = "e:\solor\0508-1221\src\data\problems.ts"
$content = Get-Content $file -Raw
$content = $content -replace "    },\s*\n\s*\]\s*;\s*\n\s*const cornerIntermediate", "$additional`n  ];`n`n  const cornerIntermediate"
Set-Content $file -Value $content -Encoding UTF8
Write-Host "Done"
