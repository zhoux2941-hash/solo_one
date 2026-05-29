import { Pixelizer } from './modules/Pixelizer.js';
import { HistoryManager } from './modules/HistoryManager.js';
import { SelectionManager } from './modules/SelectionManager.js';
import { UI } from './modules/UI.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.pixelizer = new Pixelizer();
        this.historyManager = new HistoryManager();
        this.selectionManager = new SelectionManager(this.canvas);
        this.ui = new UI(this);
        this.init();
    }

    init() {
        this.ui.setupEventListeners();
        this.selectionManager.onSelectionChange = (selection) => {
            this.currentSelection = selection;
        };
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.resizeCanvas(img.width, img.height);
                this.ctx.drawImage(img, 0, 0);
                this.historyManager.clear();
                this.historyManager.push(this.getCanvasState());
                this.ui.updateImageInfo(img.width, img.height, file.name);
                this.ui.enableButtons(true);
                this.selectionManager.clearSelection();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resizeCanvas(width, height) {
        const maxWidth = 800;
        const maxHeight = 600;
        let displayWidth = width;
        let displayHeight = height;

        if (width > maxWidth) {
            displayHeight = (maxWidth / width) * height;
            displayWidth = maxWidth;
        }
        if (displayHeight > maxHeight) {
            displayWidth = (maxHeight / displayHeight) * displayWidth;
            displayHeight = maxHeight;
        }

        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.selectionManager.resize(displayWidth, displayHeight);

        this.scaleX = width / displayWidth;
        this.scaleY = height / displayHeight;
    }

    getCanvasState() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    restoreCanvasState(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }

    processImage() {
        if (!this.originalImage) return;

        const pixelSize = this.ui.getPixelSize();
        const blockMode = this.ui.getBlockMode();
        const blockMargin = this.ui.getBlockMargin();
        const useSelection = this.ui.isSelectionEnabled();
        const selection = useSelection ? this.currentSelection : null;
        
        const gradientOptions = {
            enabled: this.ui.isGradientEnabled(),
            radius: this.ui.getGradientRadius(),
            intensity: this.ui.getGradientIntensity()
        };

        this.historyManager.push(this.getCanvasState());

        const pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.pixelizer.applyPixelation(
            pixelData,
            this.canvas.width,
            this.canvas.height,
            pixelSize,
            blockMode,
            blockMargin,
            selection,
            gradientOptions
        );

        this.ctx.putImageData(pixelData, 0, 0);
        this.ui.updateUndoRedoButtons(this.historyManager);
        this.selectionManager.clearSelection();
    }

    undo() {
        const previousState = this.historyManager.undo();
        if (previousState) {
            this.restoreCanvasState(previousState);
            this.ui.updateUndoRedoButtons(this.historyManager);
        }
    }

    redo() {
        const nextState = this.historyManager.redo();
        if (nextState) {
            this.restoreCanvasState(nextState);
            this.ui.updateUndoRedoButtons(this.historyManager);
        }
    }

    reset() {
        if (!this.originalImage) return;
        this.historyManager.clear();
        this.ctx.drawImage(this.originalImage, 0, 0);
        this.historyManager.push(this.getCanvasState());
        this.ui.updateUndoRedoButtons(this.historyManager);
        this.selectionManager.clearSelection();
    }

    downloadImage(format) {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpg' ? 0.95 : undefined;
        const dataUrl = this.canvas.toDataURL(mimeType, quality);
        const link = document.createElement('a');
        link.download = `pixelized_${Date.now()}.${format}`;
        link.href = dataUrl;
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});