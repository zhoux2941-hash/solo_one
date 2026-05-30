import React, { useMemo } from 'react';
import { ContainerShape, MultiLevelState } from '../types';
import { COLORS, COMPENSATION_POT_CONFIG } from '../utils/constants';
import { getContainerStrategy } from '../strategies/ContainerStrategy';
import WaterDrop from './WaterDrop';

interface ContainerViewProps {
  shape: ContainerShape;
  containerSize: number;
  initialWaterHeight: number;
  currentWaterHeight: number;
  isRunning: boolean;
  useMultiLevel: boolean;
  multiLevelState: MultiLevelState | null;
}

const SVG_WIDTH = 400;
const SVG_HEIGHT = 600;
const MAIN_CONTAINER_TOP = 220;
const MAIN_CONTAINER_BOTTOM = 560;
const CONTAINER_CENTER_X = SVG_WIDTH / 2;
const POT_HEIGHT = COMPENSATION_POT_CONFIG.potHeight * 2.5;
const POT_VERTICAL_GAP = COMPENSATION_POT_CONFIG.verticalGap * 2;

export const ContainerView: React.FC<ContainerViewProps> = ({
  shape,
  containerSize,
  initialWaterHeight,
  currentWaterHeight,
  isRunning,
  useMultiLevel,
  multiLevelState,
}) => {
  const containerHeight = MAIN_CONTAINER_BOTTOM - MAIN_CONTAINER_TOP;
  const scale = containerHeight / initialWaterHeight;
  const waterLevelY = MAIN_CONTAINER_BOTTOM - currentWaterHeight * scale;
  const maxWidth = Math.min(containerSize * 6, 180);

  const potWidth = Math.min(maxWidth * 0.85, 120);
  const potHalfWidth = potWidth / 2;

  const strategy = useMemo(() => getContainerStrategy(shape), [shape]);

  const potPositions = useMemo(() => {
    if (!useMultiLevel || !multiLevelState) return [];

    const positions = [];
    const potCount = multiLevelState.pots.length;

    for (let i = 0; i < potCount; i++) {
      const potTop = 20 + i * (POT_HEIGHT + POT_VERTICAL_GAP);
      const potBottom = potTop + POT_HEIGHT;
      positions.push({
        potTop,
        potBottom,
        potCenterY: (potTop + potBottom) / 2,
        pot: multiLevelState.pots[i],
      });
    }

    return positions;
  }, [useMultiLevel, multiLevelState]);

  const geometry = useMemo(() => {
    return strategy.getSvgGeometry({
      centerX: CONTAINER_CENTER_X,
      containerTop: MAIN_CONTAINER_TOP,
      containerBottom: MAIN_CONTAINER_BOTTOM,
      maxWidth,
      waterLevelY,
      containerHeight,
    });
  }, [strategy, maxWidth, waterLevelY, containerHeight]);

  const scales = useMemo(() => {
    const marks = [];
    const numMarks = 6;
    for (let i = 0; i <= numMarks; i++) {
      const height = (initialWaterHeight / numMarks) * i;
      const y = MAIN_CONTAINER_BOTTOM - height * scale;
      marks.push({ height, y });
    }
    return marks;
  }, [initialWaterHeight, scale]);

  const waterGradientId = `waterGradient-${shape}`;
  const glassGradientId = `glassGradient-${shape}`;
  const potGradientIds = useMemo(
    () => potPositions.map((_, i) => `potGradient-${i}`),
    [potPositions]
  );
  const potWaterGradientIds = useMemo(
    () => potPositions.map((_, i) => `potWaterGradient-${i}`),
    [potPositions]
  );

  const renderCompensationPots = () => {
    if (!useMultiLevel || !multiLevelState) return null;

    return potPositions.map((pos, index) => {
      const { potTop, potBottom, pot } = pos;
      const potLeft = CONTAINER_CENTER_X - potHalfWidth;
      const potRight = CONTAINER_CENTER_X + potHalfWidth;
      const waterHeightRatio = pot.waterHeight / pot.maxHeight;
      const waterTopY = potBottom - (potBottom - potTop - 10) * waterHeightRatio;
      const overflowY = potTop + (potBottom - potTop) * (pot.overflowHeight / pot.maxHeight);
      const potColor = [COLORS.compensationPot1, COLORS.compensationPot2, COLORS.compensationPot3][index] || COLORS.compensationPot1;

      return (
        <g key={index}>
          <defs>
            <linearGradient id={potGradientIds[index]} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(245, 240, 230, 0.4)" />
              <stop offset="50%" stopColor="rgba(245, 240, 230, 0.15)" />
              <stop offset="100%" stopColor="rgba(245, 240, 230, 0.4)" />
            </linearGradient>
            <linearGradient id={potWaterGradientIds[index]} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={potColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor={potColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={potColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d={`
              M ${potLeft} ${potTop}
              L ${potLeft - 5} ${potTop - 5}
              L ${potRight + 5} ${potTop - 5}
              L ${potRight} ${potTop}
              L ${potRight} ${potBottom}
              L ${potLeft} ${potBottom}
              Z
            `}
            fill={`url(#${potGradientIds[index]})`}
            stroke={COLORS.border}
            strokeWidth="2"
          />

          {pot.waterHeight > 0.1 && (
            <>
              <path
                d={`
                  M ${potLeft + 3} ${waterTopY}
                  L ${potLeft + 3} ${potBottom - 3}
                  L ${potRight - 3} ${potBottom - 3}
                  L ${potRight - 3} ${waterTopY}
                  Q ${CONTAINER_CENTER_X} ${waterTopY - 2} ${potLeft + 3} ${waterTopY}
                `}
                fill={`url(#${potWaterGradientIds[index]})`}
                className="transition-all duration-300 ease-out"
              />
              <ellipse
                cx={CONTAINER_CENTER_X}
                cy={waterTopY}
                rx={potHalfWidth - 5}
                ry={3}
                fill="rgba(255, 255, 255, 0.5)"
                className="transition-all duration-300 ease-out"
              />
            </>
          )}

          <line
            x1={potLeft}
            y1={overflowY}
            x2={potRight}
            y2={overflowY}
            stroke={COLORS.overflow}
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.7"
          />

          <rect
            x={CONTAINER_CENTER_X - 6}
            y={potBottom - 4}
            width={12}
            height={5}
            rx={2}
            fill={COLORS.primary}
          />

          <text
            x={CONTAINER_CENTER_X}
            y={potTop - 10}
            textAnchor="middle"
            fill={COLORS.primary}
            fontSize="14"
            fontFamily="serif"
            fontWeight="bold"
          >
            {pot.name}
          </text>

          <text
            x={potRight + 8}
            y={potBottom - 15}
            fill={COLORS.textLight}
            fontSize="11"
            fontFamily="serif"
          >
            {pot.waterHeight.toFixed(1)}cm
          </text>

          {pot.isOverflowing && isRunning && (
            <>
              <path
                d={`
                  M ${potRight} ${overflowY}
                  Q ${potRight + 20} ${overflowY + 10} ${potRight + 25} ${overflowY + 30}
                `}
                fill="none"
                stroke={COLORS.overflow}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
              >
                <animate
                  attributeName="d"
                  values={`
                    M ${potRight} ${overflowY} Q ${potRight + 20} ${overflowY + 10} ${potRight + 25} ${overflowY + 30};
                    M ${potRight} ${overflowY} Q ${potRight + 25} ${overflowY + 15} ${potRight + 30} ${overflowY + 35};
                    M ${potRight} ${overflowY} Q ${potRight + 20} ${overflowY + 10} ${potRight + 25} ${overflowY + 30}
                  `}
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </path>
              <circle
                cx={potRight + 5}
                cy={overflowY + 5}
                r={3}
                fill={COLORS.overflow}
                opacity="0.6"
              >
                <animate
                  attributeName="cy"
                  values={`${overflowY + 5};${overflowY + 35}`}
                  dur="0.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {isRunning && index < potPositions.length - 1 && (
            <>
              <line
                x1={CONTAINER_CENTER_X}
                y1={potBottom + 2}
                x2={CONTAINER_CENTER_X}
                y2={potPositions[index + 1].potTop - 2}
                stroke={COLORS.water}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.8"
              />
              <circle
                cx={CONTAINER_CENTER_X}
                cy={potBottom + 10}
                r={4}
                fill={COLORS.water}
                opacity="0.7"
              >
                <animate
                  attributeName="cy"
                  values={`${potBottom + 5};${potPositions[index + 1].potTop - 5}`}
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </g>
      );
    });
  };

  const renderMainContainerInput = () => {
    if (!useMultiLevel || !multiLevelState || potPositions.length === 0) return null;

    const lastPotBottom = potPositions[potPositions.length - 1].potBottom;
    const inputTop = lastPotBottom + 5;
    const inputBottom = MAIN_CONTAINER_TOP - 5;

    return (
      <g>
        <line
          x1={CONTAINER_CENTER_X}
          y1={inputTop}
          x2={CONTAINER_CENTER_X}
          y2={inputBottom}
          stroke={COLORS.water}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.8"
        />
        {isRunning && (
          <circle
            cx={CONTAINER_CENTER_X}
            cy={inputTop + 10}
            r={5}
            fill={COLORS.water}
            opacity="0.7"
          >
            <animate
              attributeName="cy"
              values={`${inputTop + 5};${inputBottom - 5}`}
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>
    );
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={SVG_WIDTH}
        height={useMultiLevel ? SVG_HEIGHT : 450}
        viewBox={`0 0 ${SVG_WIDTH} ${useMultiLevel ? SVG_HEIGHT : 450}`}
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={waterGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.waterDark} />
            <stop offset="30%" stopColor={COLORS.water} />
            <stop offset="70%" stopColor={COLORS.waterLight} />
            <stop offset="100%" stopColor={COLORS.water} />
          </linearGradient>
          <linearGradient id={glassGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 240, 230, 0.3)" />
            <stop offset="50%" stopColor="rgba(245, 240, 230, 0.1)" />
            <stop offset="100%" stopColor="rgba(245, 240, 230, 0.3)" />
          </linearGradient>
        </defs>

        {useMultiLevel && (
          <>
            {renderCompensationPots()}
            {renderMainContainerInput()}
          </>
        )}

        <g transform={useMultiLevel ? 'translate(0, 0)' : 'translate(0, -180)'}>
          <path
            d={geometry.containerPath}
            fill={`url(#${glassGradientId})`}
            stroke={COLORS.border}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {currentWaterHeight > 0.1 && (
            <path
              d={geometry.waterPath}
              fill={`url(#${waterGradientId})`}
              opacity="0.85"
              className="transition-all duration-300 ease-out"
            />
          )}

          {currentWaterHeight > 0.1 && (
            <ellipse
              cx={CONTAINER_CENTER_X}
              cy={Math.max(waterLevelY, MAIN_CONTAINER_TOP)}
              rx={geometry.waterSurfaceRx}
              ry={geometry.waterSurfaceRy}
              fill="rgba(255, 255, 255, 0.4)"
              className="transition-all duration-300 ease-out"
            />
          )}

          <rect
            x={CONTAINER_CENTER_X - 8}
            y={geometry.apertureY - 3}
            width={16}
            height={6}
            rx={3}
            fill={COLORS.primary}
          />

          <text
            x={CONTAINER_CENTER_X}
            y={MAIN_CONTAINER_TOP - 20}
            textAnchor="middle"
            fill={COLORS.primary}
            fontSize="16"
            fontFamily="serif"
            fontWeight="bold"
          >
            受水壶
          </text>

          {scales.map((mark, index) => (
            <g key={index}>
              <line
                x1={CONTAINER_CENTER_X + maxWidth / 2 + 5}
                y1={mark.y}
                x2={CONTAINER_CENTER_X + maxWidth / 2 + 15}
                y2={mark.y}
                stroke={COLORS.gold}
                strokeWidth={index % 2 === 0 ? 2 : 1}
              />
              <text
                x={CONTAINER_CENTER_X + maxWidth / 2 + 20}
                y={mark.y + 4}
                fill={COLORS.gold}
                fontSize="12"
                fontFamily="serif"
              >
                {mark.height.toFixed(0)}cm
              </text>
            </g>
          ))}

          <WaterDrop
            isDropping={isRunning && currentWaterHeight > 0.1}
            apertureX={CONTAINER_CENTER_X}
            apertureY={geometry.apertureY + 8}
            dropInterval={150}
          />

          {isRunning && currentWaterHeight > 0.1 && (
            <circle
              cx={CONTAINER_CENTER_X}
              cy={geometry.apertureY + 15}
              r={3}
              fill={COLORS.water}
              opacity="0.6"
            >
              <animate
                attributeName="cy"
                values={`${geometry.apertureY + 15};${geometry.apertureY + 60}`}
                dur="0.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      </svg>

      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(26, 58, 74, 0.9)',
          border: `2px solid ${COLORS.gold}`,
        }}
      >
        <span className="text-sm font-bold" style={{ color: COLORS.gold }}>
          当前水位: {currentWaterHeight.toFixed(1)} cm
          {useMultiLevel && multiLevelState && (
            <span className="ml-3" style={{ color: COLORS.compensationPot1 }}>
              恒压头: {multiLevelState.constantPressureHead.toFixed(1)} cm
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ContainerView;
