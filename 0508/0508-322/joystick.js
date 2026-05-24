class Joystick {
    constructor(containerId, stickId, onChangeCallback) {
        this.container = document.getElementById(containerId);
        this.stick = document.getElementById(stickId);
        this.onChange = onChangeCallback;
        this.isDragging = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.maxDistance = 0;
        this.valueX = 0;
        this.valueY = 0;

        this.init();
    }

    init() {
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());

        this.stick.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());

        this.stick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e.touches[0]);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.drag(e.touches[0]);
            }
        }, { passive: false });
        document.addEventListener('touchend', () => this.endDrag());
    }

    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
        this.radius = rect.width / 2;
        this.maxDistance = this.radius - 35;
    }

    startDrag(e) {
        this.isDragging = true;
        this.stick.style.transition = 'none';
    }

    drag(e) {
        if (!this.isDragging) return;

        const rect = this.container.getBoundingClientRect();
        let x = (e.clientX || e.pageX) - rect.left - this.centerX;
        let y = (e.clientY || e.pageY) - rect.top - this.centerY;

        const distance = Math.sqrt(x * x + y * y);
        if (distance > this.maxDistance) {
            const ratio = this.maxDistance / distance;
            x *= ratio;
            y *= ratio;
        }

        this.stick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

        this.valueX = Math.round((x / this.maxDistance) * 100);
        this.valueY = Math.round((-y / this.maxDistance) * 100);

        if (this.onChange) {
            this.onChange(this.valueX, this.valueY);
        }
    }

    endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.stick.style.transition = 'transform 0.2s ease-out';
        this.stick.style.transform = 'translate(-50%, -50%)';
        this.valueX = 0;
        this.valueY = 0;
        if (this.onChange) {
            this.onChange(0, 0);
        }
    }

    getValues() {
        return { x: this.valueX, y: this.valueY };
    }
}