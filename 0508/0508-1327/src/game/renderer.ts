import { LAYOUT, COLORS, TIMING } from '@/constants/config';
import { GameState, Player, Pose } from '@/types/game';
import { getBoardYAtX } from './physics';

const { CANVAS_WIDTH, CANVAS_HEIGHT, BOARD_CENTER_X, BOARD_LENGTH, BOARD_THICKNESS, STONE_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, GROUND_Y } = LAYOUT;

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  render(state: GameState): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawGround();
    this.drawStone();
    this.drawBoard(state.boardAngle, state.boardShake);
    this.drawPlayer(state.player, state.currentTurn === 'player');
    this.drawPlayer(state.ai, state.currentTurn === 'ai');

    if (state.flashEffect > 0) {
      this.drawFlash(state.flashEffect);
    }

    if (state.phase === 'waiting' || state.phase === 'pressing') {
      this.drawTimingIndicator(state);
    }

    if (state.message) {
      this.drawMessage(state.message);
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, COLORS.SKY_TOP);
    gradient.addColorStop(1, COLORS.SKY_BOTTOM);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.drawCloud(100, 80, 60);
    this.drawCloud(300, 120, 50);
    this.drawCloud(550, 60, 70);
    this.drawCloud(680, 130, 45);
  }

  private drawCloud(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawGround(): void {
    const gradient = this.ctx.createLinearGradient(0, GROUND_Y, 0, this.height);
    gradient.addColorStop(0, '#8BC34A');
    gradient.addColorStop(0.3, '#689F38');
    gradient.addColorStop(1, '#558B2F');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, GROUND_Y, this.width, this.height - GROUND_Y);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < this.width; i += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, GROUND_Y + 5);
      this.ctx.lineTo(i + 15, GROUND_Y + 15);
      this.ctx.stroke();
    }
  }

  private drawStone(): void {
    const stoneX = BOARD_CENTER_X;
    const stoneY = GROUND_Y - STONE_HEIGHT;
    const stoneWidth = 80;
    const stoneHeight = STONE_HEIGHT;

    this.ctx.fillStyle = COLORS.STONE;
    this.ctx.beginPath();
    this.ctx.moveTo(stoneX - stoneWidth / 2, stoneY + stoneHeight);
    this.ctx.lineTo(stoneX - stoneWidth / 2 + 10, stoneY + 10);
    this.ctx.quadraticCurveTo(stoneX, stoneY - 5, stoneX + stoneWidth / 2 - 10, stoneY + 10);
    this.ctx.lineTo(stoneX + stoneWidth / 2, stoneY + stoneHeight);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.STONE_DARK;
    this.ctx.beginPath();
    this.ctx.ellipse(stoneX - 15, stoneY + 25, 8, 5, 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(stoneX + 12, stoneY + 40, 6, 4, -0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(stoneX - 20, stoneY + 20);
    this.ctx.lineTo(stoneX + 10, stoneY + 30);
    this.ctx.stroke();
  }

  private drawBoard(angle: number, shake: number): void {
    const centerX = BOARD_CENTER_X;
    const centerY = GROUND_Y - STONE_HEIGHT;
    const halfLength = BOARD_LENGTH / 2;
    const radians = (angle * Math.PI) / 180;
    const shakeOffset = shake * (Math.random() - 0.5);

    this.ctx.save();
    this.ctx.translate(centerX, centerY + shakeOffset);
    this.ctx.rotate(radians);

    const gradient = this.ctx.createLinearGradient(-halfLength, -BOARD_THICKNESS / 2, -halfLength, BOARD_THICKNESS / 2);
    gradient.addColorStop(0, COLORS.WOOD_LIGHT);
    gradient.addColorStop(0.5, COLORS.WOOD_DARK);
    gradient.addColorStop(1, COLORS.WOOD_DARK);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-halfLength, -BOARD_THICKNESS / 2, BOARD_LENGTH, BOARD_THICKNESS);

    this.ctx.strokeStyle = COLORS.WOOD_GRAIN;
    this.ctx.lineWidth = 1;
    for (let i = -halfLength + 20; i < halfLength - 20; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, -BOARD_THICKNESS / 2 + 3);
      this.ctx.quadraticCurveTo(i + 10, 0, i, BOARD_THICKNESS / 2 - 3);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = COLORS.TRADITIONAL_PATTERN;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-halfLength, -BOARD_THICKNESS / 2, BOARD_LENGTH, BOARD_THICKNESS);

    this.ctx.fillStyle = COLORS.CLOTH_TRIM;
    for (let i = -halfLength + 30; i < halfLength - 30; i += BOARD_LENGTH / 3) {
      this.ctx.beginPath();
      this.ctx.arc(i, 0, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawPlayer(player: Player, isActive: boolean): void {
    const { x, y, pose, rotation, isAirborne, id } = player;
    const color = id === 'player' ? COLORS.PLAYER_RED : COLORS.PLAYER_BLUE;

    this.ctx.save();
    this.ctx.translate(x, y + PLAYER_HEIGHT / 2);
    this.ctx.rotate((rotation * Math.PI) / 180);

    if (isActive && isAirborne) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
    }

    this.drawCharacter(pose, color, isAirborne);

    this.ctx.restore();

    if (isActive && !isAirborne) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawCharacter(pose: Pose, color: string, isAirborne: boolean): void {
    const halfH = PLAYER_HEIGHT / 2;
    const halfW = PLAYER_WIDTH / 2;

    this.ctx.fillStyle = COLORS.PLAYER_SKIN;
    this.ctx.beginPath();
    this.ctx.arc(0, -halfH + 12, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.PLAYER_HAIR;
    this.ctx.beginPath();
    this.ctx.arc(0, -halfH + 8, 12, Math.PI, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(-4, -halfH + 12, 2, 0, Math.PI * 2);
    this.ctx.arc(4, -halfH + 12, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(-halfW + 5, -halfH + 25);
    this.ctx.lineTo(halfW - 5, -halfH + 25);
    this.ctx.lineTo(halfW - 8, 0);
    this.ctx.lineTo(-halfW + 8, 0);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = COLORS.CLOTH_TRIM;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-halfW + 5, -halfH + 25, PLAYER_WIDTH - 10, 5);

    this.ctx.strokeStyle = COLORS.CLOTH_TRIM;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -halfH + 30);
    this.ctx.lineTo(0, 0);
    this.ctx.stroke();

    this.drawPose(pose, color, halfW, halfH, isAirborne);
  }

  private drawPose(pose: Pose, color: string, halfW: number, halfH: number, isAirborne: boolean): void {
    this.ctx.strokeStyle = COLORS.PLAYER_SKIN;
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';

    switch (pose) {
      case 'standing':
        this.ctx.beginPath();
        this.ctx.moveTo(-halfW + 5, -halfH + 35);
        this.ctx.lineTo(-halfW - 10, -halfH + 55);
        this.ctx.moveTo(halfW - 5, -halfH + 35);
        this.ctx.lineTo(halfW + 10, -halfH + 55);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.fillRect(-halfW + 8, 0, 12, halfH - 5);
        this.ctx.fillRect(halfW - 20, 0, 12, halfH - 5);
        break;

      case 'split':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -halfH + 35);
        this.ctx.lineTo(-halfW - 15, -halfH + 45);
        this.ctx.moveTo(0, -halfH + 35);
        this.ctx.lineTo(halfW + 15, -halfH + 45);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.save();
        this.ctx.translate(-halfW + 10, 5);
        this.ctx.rotate(-0.8);
        this.ctx.fillRect(0, 0, 12, halfH);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(halfW - 10, 5);
        this.ctx.rotate(0.8);
        this.ctx.fillRect(-12, 0, 12, halfH);
        this.ctx.restore();
        break;

      case 'layout':
        this.ctx.beginPath();
        this.ctx.moveTo(-halfW + 5, -halfH + 35);
        this.ctx.lineTo(-halfW - 15, -halfH + 20);
        this.ctx.moveTo(halfW - 5, -halfH + 35);
        this.ctx.lineTo(halfW + 15, -halfH + 20);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.fillRect(-halfW - 5, 0, 12, halfH - 10);
        this.ctx.fillRect(halfW - 7, 0, 12, halfH - 10);
        break;

      case 'pike':
        this.ctx.beginPath();
        this.ctx.moveTo(-halfW + 5, -halfH + 35);
        this.ctx.lineTo(-halfW - 5, -halfH + 50);
        this.ctx.moveTo(halfW - 5, -halfH + 35);
        this.ctx.lineTo(halfW + 5, -halfH + 50);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.save();
        this.ctx.translate(-halfW + 10, -5);
        this.ctx.rotate(-1.2);
        this.ctx.fillRect(0, 0, 12, halfH - 5);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(halfW - 10, -5);
        this.ctx.rotate(1.2);
        this.ctx.fillRect(-12, 0, 12, halfH - 5);
        this.ctx.restore();
        break;

      case 'twist':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -halfH + 35);
        this.ctx.lineTo(-halfW - 10, -halfH + 40);
        this.ctx.moveTo(0, -halfH + 35);
        this.ctx.lineTo(halfW + 10, -halfH + 40);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.fillRect(-15, 0, 12, halfH - 5);
        this.ctx.fillRect(3, 0, 12, halfH - 5);
        break;

      case 'jump':
      default:
        this.ctx.beginPath();
        this.ctx.moveTo(-halfW + 5, -halfH + 35);
        this.ctx.lineTo(-halfW - 8, -halfH + 60);
        this.ctx.moveTo(halfW - 5, -halfH + 35);
        this.ctx.lineTo(halfW + 8, -halfH + 60);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.fillRect(-halfW + 10, 5, 10, halfH - 10);
        this.ctx.fillRect(halfW - 20, 5, 10, halfH - 10);
        break;
    }
  }

  private drawTimingIndicator(state: GameState): void {
    const barWidth = 200;
    const barHeight = 12;
    const barX = (this.width - barWidth) / 2;
    const barY = this.height - 50;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const bgGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    bgGradient.addColorStop(0, '#333');
    bgGradient.addColorStop(1, '#555');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const windowStart = state.pressStartTime;
    const windowEnd = state.pressStartTime + TIMING.WAITING_DURATION;
    const perfectStart = state.perfectWindow.start - windowStart;
    const perfectEnd = state.perfectWindow.end - windowStart;
    const windowDuration = windowEnd - windowStart;

    const perfectX = barX + (perfectStart / windowDuration) * barWidth;
    const perfectWidth = ((perfectEnd - perfectStart) / windowDuration) * barWidth;

    this.ctx.fillStyle = COLORS.PERFECT;
    this.ctx.fillRect(perfectX, barY, perfectWidth, barHeight);

    const currentTime = Date.now();
    const progress = Math.min(1, (currentTime - windowStart) / windowDuration);
    const indicatorX = barX + progress * barWidth;

    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(indicatorX, barY + barHeight / 2, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('时机指示', this.width / 2, barY - 8);
  }

  private drawFlash(intensity: number): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawMessage(message: string): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, this.height / 2 - 40, this.width, 80);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.width / 2, this.height / 2 + 10);
  }
}
