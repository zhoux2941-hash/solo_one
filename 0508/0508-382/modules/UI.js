export class UI {
    constructor(app) {
        this.app = app;
        this.uploadInput = document.getElementById('upload');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.pixelSizeSlider = document.getElementById('pixelSize');
        this.pixelSizeValue = document.getElementById('pixelSizeValue');
        this.blockModeSelect = document.getElementById('blockMode');
        this.blockMarginSlider = document.getElementById('blockMargin');
        this.blockMarginValue = document.getElementById('blockMarginValue');
        this.enableSelectionCheckbox = document.getElementById('enableSelection');
        this.enableGradientCheckbox = document.getElementById('enableGradient');
        this.gradientRadiusSlider = document.getElementById('gradientRadius');
        this.gradientRadiusValue = document.getElementById('gradientRadiusValue');
        this.gradientIntensitySlider = document.getElementById('gradientIntensity');
        this.gradientIntensityValue = document.getElementById('gradientIntensityValue');
        this.processBtn = document.getElementById('processBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadPngBtn = document.getElementById('downloadPngBtn');
        this.downloadJpgBtn = document.getElementById('downloadJpgBtn');
        this.imageInfo = document.getElementById('imageInfo');
    }

    setupEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.uploadInput.click());
        this.uploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        this.pixelSizeSlider.addEventListener('input', (e) => {
            this.pixelSizeValue.textContent = e.target.value;
        });
        
        this.blockMarginSlider.addEventListener('input', (e) => {
            this.blockMarginValue.textContent = e.target.value;
        });
        
        this.gradientRadiusSlider.addEventListener('input', (e) => {
            this.gradientRadiusValue.textContent = e.target.value + '%';
        });
        
        this.gradientIntensitySlider.addEventListener('input', (e) => {
            this.gradientIntensityValue.textContent = e.target.value + 'x';
        });
        
        this.processBtn.addEventListener('click', () => this.app.processImage());
        this.undoBtn.addEventListener('click', () => this.app.undo());
        this.redoBtn.addEventListener('click', () => this.app.redo());
        this.resetBtn.addEventListener('click', () => this.app.reset());
        this.downloadPngBtn.addEventListener('click', () => this.app.downloadImage('png'));
        this.downloadJpgBtn.addEventListener('click', () => this.app.downloadImage('jpg'));
        
        this.enableSelectionCheckbox.addEventListener('change', (e) => {
            this.app.selectionManager.clearSelection();
        });
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.app.loadImage(file);
        }
    }

    getPixelSize() {
        return parseInt(this.pixelSizeSlider.value);
    }

    getBlockMode() {
        return this.blockModeSelect.value;
    }

    getBlockMargin() {
        return parseInt(this.blockMarginSlider.value);
    }

    isSelectionEnabled() {
        return this.enableSelectionCheckbox.checked;
    }

    isGradientEnabled() {
        return this.enableGradientCheckbox.checked;
    }

    getGradientRadius() {
        return parseInt(this.gradientRadiusSlider.value) / 100;
    }

    getGradientIntensity() {
        return parseInt(this.gradientIntensitySlider.value);
    }

    enableButtons(enabled) {
        this.processBtn.disabled = !enabled;
        this.resetBtn.disabled = !enabled;
        this.downloadPngBtn.disabled = !enabled;
        this.downloadJpgBtn.disabled = !enabled;
    }

    updateUndoRedoButtons(historyManager) {
        this.undoBtn.disabled = !historyManager.canUndo();
        this.redoBtn.disabled = !historyManager.canRedo();
    }

    updateImageInfo(width, height, name) {
        this.imageInfo.textContent = `${name} - ${width} × ${height}`;
    }
}