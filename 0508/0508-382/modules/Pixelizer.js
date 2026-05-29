export class Pixelizer {
    applyPixelation(pixelData, width, height, basePixelSize, blockMode, blockMargin, selection, gradientOptions) {
        const data = pixelData.data;
        
        const startX = selection ? Math.max(0, Math.floor(selection.x)) : 0;
        const startY = selection ? Math.max(0, Math.floor(selection.y)) : 0;
        const endX = selection ? Math.min(width, Math.ceil(selection.x + selection.width)) : width;
        const endY = selection ? Math.min(height, Math.ceil(selection.y + selection.height)) : height;

        const useGradient = gradientOptions && gradientOptions.enabled;
        const centerX = useGradient ? 
            (selection ? selection.x + selection.width / 2 : width / 2) : 0;
        const centerY = useGradient ? 
            (selection ? selection.y + selection.height / 2 : height / 2) : 0;
        const gradientRadius = useGradient ? 
            (selection ? Math.max(selection.width, selection.height) * gradientOptions.radius : 
             Math.max(width, height) * gradientOptions.radius) : 0;
        const gradientIntensity = useGradient ? gradientOptions.intensity : 1;

        const integral = this.buildIntegralImage(data, width, height);

        for (let y = startY; y < endY; y += basePixelSize + blockMargin) {
            for (let x = startX; x < endX; x += basePixelSize + blockMargin) {
                let pixelSize = basePixelSize;
                
                if (useGradient) {
                    const distToCenter = Math.sqrt(
                        Math.pow(x + pixelSize / 2 - centerX, 2) + 
                        Math.pow(y + pixelSize / 2 - centerY, 2)
                    );
                    const gradientFactor = this.calculateGradientFactor(distToCenter, gradientRadius, gradientIntensity);
                    pixelSize = Math.max(2, Math.round(basePixelSize * gradientFactor));
                }

                const blockEndX = Math.min(x + pixelSize, width);
                const blockEndY = Math.min(y + pixelSize, height);
                
                const avgColor = this.getAverageColorFromIntegral(
                    integral,
                    width,
                    x,
                    y,
                    blockEndX,
                    blockEndY
                );

                if (blockMode === 'rect') {
                    this.drawRectBlock(data, width, x, y, pixelSize, avgColor);
                } else {
                    this.drawCircleBlock(data, width, x, y, pixelSize, avgColor);
                }
            }
        }
    }

    calculateGradientFactor(distance, radius, intensity) {
        if (distance <= 0) return 1;
        
        const normalizedDistance = Math.min(distance / radius, 1);
        
        const factor = 1 + (intensity - 1) * Math.pow(normalizedDistance, 2);
        
        return Math.min(factor, intensity);
    }

    buildIntegralImage(data, width, height) {
        const integralR = new Uint32Array((height + 1) * (width + 1));
        const integralG = new Uint32Array((height + 1) * (width + 1));
        const integralB = new Uint32Array((height + 1) * (width + 1));

        for (let y = 0; y < height; y++) {
            let rowSumR = 0;
            let rowSumG = 0;
            let rowSumB = 0;
            
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                rowSumR += r;
                rowSumG += g;
                rowSumB += b;

                const prevRow = (y * (width + 1)) + x + 1;
                const currRow = ((y + 1) * (width + 1)) + x + 1;
                
                integralR[currRow] = integralR[prevRow] + rowSumR;
                integralG[currRow] = integralG[prevRow] + rowSumG;
                integralB[currRow] = integralB[prevRow] + rowSumB;
            }
        }

        return {
            r: integralR,
            g: integralG,
            b: integralB,
            width: width + 1,
            height: height + 1
        };
    }

    getAverageColorFromIntegral(integral, width, x1, y1, x2, y2) {
        const iw = integral.width;
        
        const a = (y1 * iw) + x1;
        const b = (y1 * iw) + x2;
        const c = (y2 * iw) + x1;
        const d = (y2 * iw) + x2;

        const sumR = integral.r[d] + integral.r[a] - integral.r[b] - integral.r[c];
        const sumG = integral.g[d] + integral.g[a] - integral.g[b] - integral.g[c];
        const sumB = integral.b[d] + integral.b[a] - integral.b[b] - integral.b[c];

        const area = (x2 - x1) * (y2 - y1);
        
        if (area <= 0) {
            return { r: 0, g: 0, b: 0 };
        }

        return {
            r: Math.round(sumR / area),
            g: Math.round(sumG / area),
            b: Math.round(sumB / area)
        };
    }

    drawRectBlock(data, width, x, y, size, color) {
        const height = data.length / (width * 4);
        const endX = Math.min(x + size, width);
        const endY = Math.min(y + size, height);

        for (let dy = y; dy < endY; dy++) {
            const rowStart = dy * width * 4;
            for (let dx = x; dx < endX; dx++) {
                const index = rowStart + dx * 4;
                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
            }
        }
    }

    drawCircleBlock(data, width, x, y, size, color) {
        const height = data.length / (width * 4);
        const startX = Math.max(0, Math.floor(x));
        const startY = Math.max(0, Math.floor(y));
        const endX = Math.min(width, Math.ceil(x + size));
        const endY = Math.min(height, Math.ceil(y + size));

        if (endX <= startX || endY <= startY) {
            return;
        }

        const blockWidth = endX - startX;
        const blockHeight = endY - startY;

        if (!this.tempCanvas) {
            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d');
        }

        this.tempCanvas.width = blockWidth;
        this.tempCanvas.height = blockHeight;

        this.tempCtx.clearRect(0, 0, blockWidth, blockHeight);

        this.tempCtx.save();
        this.tempCtx.beginPath();
        this.tempCtx.arc(
            blockWidth / 2,
            blockHeight / 2,
            Math.min(blockWidth, blockHeight) / 2,
            0,
            Math.PI * 2
        );
        this.tempCtx.clip();

        this.tempCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.tempCtx.fillRect(0, 0, blockWidth, blockHeight);
        this.tempCtx.restore();

        const tempImageData = this.tempCtx.getImageData(0, 0, blockWidth, blockHeight);
        const tempData = tempImageData.data;

        for (let dy = 0; dy < blockHeight; dy++) {
            const srcRowStart = dy * blockWidth * 4;
            const dstRowStart = (startY + dy) * width * 4;
            
            for (let dx = 0; dx < blockWidth; dx++) {
                const srcIndex = srcRowStart + dx * 4;
                const dstIndex = dstRowStart + (startX + dx) * 4;
                
                const alpha = tempData[srcIndex + 3];
                if (alpha > 0) {
                    const alphaFactor = alpha / 255;
                    data[dstIndex] = Math.round(data[dstIndex] * (1 - alphaFactor) + color.r * alphaFactor);
                    data[dstIndex + 1] = Math.round(data[dstIndex + 1] * (1 - alphaFactor) + color.g * alphaFactor);
                    data[dstIndex + 2] = Math.round(data[dstIndex + 2] * (1 - alphaFactor) + color.b * alphaFactor);
                }
            }
        }
    }
}