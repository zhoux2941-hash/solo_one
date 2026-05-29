export class HeatmapGenerator {
    static DEFAULT_GRID_SIZE = 8;
    static MIN_BANDWIDTH = 15;
    static MAX_BANDWIDTH = 50;
    static TARGET_KERNEL_COUNT = 10;

    static generateHeatmapData(shots) {
        if (shots.length === 0) return [];

        const gridSize = HeatmapGenerator.DEFAULT_GRID_SIZE;
        const width = 600;
        const height = 450;
        const grid = [];

        const bandwidth = HeatmapGenerator.calculateAdaptiveBandwidth(shots);

        const madeShots = shots.filter(s => s.made);
        const missedShots = shots.filter(s => !s.made);

        for (let y = 0; y < height; y += gridSize) {
            for (let x = 0; x < width; x += gridSize) {
                const centerX = x + gridSize / 2;
                const centerY = y + gridSize / 2;

                const madeDensity = HeatmapGenerator.calculateKDE(madeShots, centerX, centerY, bandwidth);
                const missedDensity = HeatmapGenerator.calculateKDE(missedShots, centerX, centerY, bandwidth);
                const totalDensity = madeDensity + missedDensity;

                if (totalDensity > 0) {
                    const accuracy = madeDensity / totalDensity;
                    grid.push({
                        x: x,
                        y: y,
                        width: gridSize,
                        height: gridSize,
                        accuracy: accuracy,
                        density: totalDensity,
                        count: HeatmapGenerator.getCellShotCount(shots, x, y, gridSize)
                    });
                }
            }
        }

        HeatmapGenerator.normalizeDensity(grid);

        return grid;
    }

    static calculateAdaptiveBandwidth(shots) {
        if (shots.length < 2) return HeatmapGenerator.DEFAULT_BANDWIDTH;

        const n = shots.length;
        const width = 600;
        const height = 450;

        const scottsFactor = Math.pow(n, -1/6);
        const sx = 1;
        const sy = height / width;

        let bandwidth = 1.059 * Math.min(sx, sy) * scottsFactor * Math.sqrt(width * height / n);

        bandwidth = bandwidth * HeatmapGenerator.TARGET_KERNEL_COUNT / Math.sqrt(n);

        return Math.max(HeatmapGenerator.MIN_BANDWIDTH, Math.min(HeatmapGenerator.MAX_BANDWIDTH, bandwidth));
    }

    static DEFAULT_BANDWIDTH = 25;

    static calculateKDE(points, x, y, bandwidth) {
        if (points.length === 0) return 0;

        let density = 0;
        const bandwidthSq = bandwidth * bandwidth;
        const normalization = 1 / (Math.sqrt(2 * Math.PI) * bandwidth);

        for (const point of points) {
            const dx = point.x - x;
            const dy = point.y - y;
            const distanceSq = dx * dx + dy * dy;

            const exponent = -distanceSq / (2 * bandwidthSq);
            density += Math.exp(exponent) * normalization;
        }

        return density / points.length;
    }

    static getCellShotCount(shots, x, y, gridSize) {
        return shots.filter(shot =>
            shot.x >= x && shot.x < x + gridSize &&
            shot.y >= y && shot.y < y + gridSize
        ).length;
    }

    static normalizeDensity(grid) {
        if (grid.length === 0) return;

        const maxDensity = Math.max(...grid.map(cell => cell.density));
        if (maxDensity > 0) {
            for (const cell of grid) {
                cell.density = cell.density / maxDensity;
            }
        }
    }

    static getHeatmapColor(accuracy) {
        if (accuracy >= 0.7) {
            return `rgb(219, 68, 55)`;
        } else if (accuracy >= 0.4) {
            return `rgb(251, 188, 5)`;
        } else {
            return `rgb(66, 133, 244)`;
        }
    }

    static drawHeatmap(ctx, heatmapData, opacity = 0.6) {
        ctx.save();
        ctx.globalAlpha = opacity;

        for (const cell of heatmapData) {
            const baseColor = HeatmapGenerator.getHeatmapColor(cell.accuracy);
            const alpha = 0.3 + (cell.density * 0.7);
            ctx.fillStyle = HeatmapGenerator.hexToRgba(baseColor, alpha);
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        }

        ctx.restore();
    }

    static hexToRgba(hexOrRgb, alpha) {
        if (hexOrRgb.startsWith('rgb')) {
            const match = hexOrRgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
            }
        }
        return hexOrRgb;
    }
}