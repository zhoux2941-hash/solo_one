interface ScorePopupProps {
  score: number;
  position: { x: number; y: number };
}

export function ScorePopup({ score, position }: ScorePopupProps) {
  const getScoreColor = (score: number) => {
    switch (score) {
      case 5: return 'text-zhuang-green';
      case 10: return 'text-zhuang-blue';
      case 20: return 'text-zhuang-red';
      default: return 'text-white';
    }
  };

  return (
    <div
      className={`absolute pointer-events-none font-display text-4xl font-bold animate-scorePopup ${getScoreColor(score)}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        textShadow: '0 0 10px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      +{score}
    </div>
  );
}
