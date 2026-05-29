export class HistoryManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }

    push(state) {
        const clonedState = this.cloneImageData(state);
        
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push(clonedState);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.currentIndex = this.history.length - 1;
    }

    undo() {
        if (this.currentIndex <= 0) {
            return null;
        }
        
        this.currentIndex--;
        return this.cloneImageData(this.history[this.currentIndex]);
    }

    redo() {
        if (this.currentIndex >= this.history.length - 1) {
            return null;
        }
        
        this.currentIndex++;
        return this.cloneImageData(this.history[this.currentIndex]);
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }

    cloneImageData(imageData) {
        const newData = new ImageData(imageData.width, imageData.height);
        newData.data.set(imageData.data);
        return newData;
    }
}