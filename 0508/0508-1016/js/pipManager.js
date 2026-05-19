class PipManager {
    constructor(container, videoElement, switcher) {
        this.container = container;
        this.videoElement = videoElement;
        this.switcher = switcher;
        this.pipSource = null;
        this.isEnabled = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.onPipSourceChanged = null;
        this.onPipToggled = null;
        
        this.initDrag();
    }

    enable(source) {
        if (!source || !source.stream) return;

        this.pipSource = source;
        this.videoElement.srcObject = source.stream;
        this.container.classList.remove('hidden');
        this.isEnabled = true;

        if (this.onPipToggled) {
            this.onPipToggled(true);
        }
        if (this.onPipSourceChanged) {
            this.onPipSourceChanged(source);
        }
    }

    disable() {
        this.videoElement.srcObject = null;
        this.container.classList.add('hidden');
        this.pipSource = null;
        this.isEnabled = false;

        if (this.onPipToggled) {
            this.onPipToggled(false);
        }
        if (this.onPipSourceChanged) {
            this.onPipSourceChanged(null);
        }
    }

    toggle(source) {
        if (this.isEnabled) {
            this.disable();
        } else if (source) {
            this.enable(source);
        }
    }

    setSource(source) {
        if (!source || !source.stream) return;

        this.pipSource = source;
        this.videoElement.srcObject = source.stream;

        if (this.onPipSourceChanged) {
            this.onPipSourceChanged(source);
        }
    }

    swapWithMain() {
        if (!this.pipSource || !this.switcher) return;

        const currentMain = this.switcher.getCurrentSource();
        if (!currentMain) return;

        this.switcher.setSource(this.pipSource);
        this.setSource(currentMain);
    }

    initDrag() {
        this.container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.pip-controls')) return;
            
            this.isDragging = true;
            const rect = this.container.getBoundingClientRect();
            const wrapperRect = this.container.parentElement.getBoundingClientRect();
            
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const wrapperRect = this.container.parentElement.getBoundingClientRect();
            let newX = e.clientX - wrapperRect.left - this.dragOffset.x;
            let newY = e.clientY - wrapperRect.top - this.dragOffset.y;

            const maxX = wrapperRect.width - this.container.offsetWidth - 20;
            const maxY = wrapperRect.height - this.container.offsetHeight - 20;

            newX = Math.max(20, Math.min(newX, maxX));
            newY = Math.max(20, Math.min(newY, maxY));

            this.container.style.left = newX + 'px';
            this.container.style.top = newY + 'px';
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    getPipSource() {
        return this.pipSource;
    }

    getIsEnabled() {
        return this.isEnabled;
    }
}

window.PipManager = PipManager;
