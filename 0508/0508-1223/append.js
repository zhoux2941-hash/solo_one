const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const part = `

  useEffect(() => {
    if (isPlaying && !animationState.isAnimating && currentStepIndex < solutionSteps.length) {
      animationQueueRef.current = [solutionSteps[currentStepIndex]];
      processAnimationQueue();
    }
  }, [isPlaying, animationState.isAnimating, currentStepIndex, solutionSteps, processAnimationQueue]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleManualMove = useCallback((from, to) => {
    if (animationState.isAnimating) return;
    executeMoveImmediately({ from, to, disk: 0, description: '移动从 ' + from + ' -> ' + to }, false);
  }, [animationState.isAnimating, executeMoveImmediately]);

  const speedOptions = [
    { value: 'slow', label: '慢' },
    { value: 'medium', label: '中' },
    { value: 'fast', label: '快' }
  ];

  const getEfficiencyColor = () => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 70) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getEfficiencyBg = () => {
    if (efficiency >= 90) return 'from-green-500 to-emerald-400';
    if (efficiency >= 70) return 'from-yellow-500 to-amber-400';
    return 'from-rose-500 to-red-400';
  };

  const animatingDisk = animationState.currentStep
    ? rods[animationState.currentStep.from]?.[rods[animationState.currentStep.from].length - 1] || null
    : null;

  const activeRodIds = getRodIds(rodMode);
  const threePegOptimal = calculateOptimalSteps3(diskCount);
  const fourPegOptimal = frameStewartSteps(diskCount);
`;
fs.writeFileSync('src/App.tsx', content + part, 'utf8');
console.log('Done. New size:', fs.statSync('src/App.tsx').size);
