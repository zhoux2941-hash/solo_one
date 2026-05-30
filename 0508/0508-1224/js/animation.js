const TreeAnimation = {
    sequence: [], currentIndex: 0, isPlaying: false, isPaused: false,
    speed: 5, timer: null, renderer: null, onStep: null,

    init: function(renderer, onStepCallback) {
        this.renderer = renderer;
        this.onStep = onStepCallback;
    },

    setSequence: function(sequence) {
        this.stop();
        this.sequence = sequence;
        this.currentIndex = 0;
    },

    setSpeed: function(speed) { this.speed = speed; },
    getDelay: function() { return Math.max(50, 1000 - (this.speed - 1) * 100); },

    play: function() {
        if (this.isPlaying && !this.isPaused) return;
        this.isPlaying = true;
        this.isPaused = false;
        this.animateStep();
    },

    animateStep: function() {
        if (!this.isPlaying || this.isPaused) return;
        if (this.currentIndex >= this.sequence.length) {
            this.stop();
            return;
        }
        const step = this.sequence[this.currentIndex];
        this.executeStep(step);
        this.currentIndex++;
        if (this.onStep) this.onStep(this.currentIndex, this.sequence.length);
        this.timer = setTimeout(() => this.animateStep(), this.getDelay());
    },

    executeStep: function(step) {
        const node = step.node;
        if (step.type === 'visit') {
            this.renderer.highlightNode(node.id);
            if (node.parentId !== null) {
                this.renderer.showLink(node.parentId, node.id);
            }
        } else if (step.type === 'calculate') {
            this.renderer.markCalculated(node.id);
        }
    },

    pause: function() {
        this.isPaused = true;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    },

    stop: function() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    },

    reset: function() { this.stop(); this.renderer.reset(); }
};
                this.renderer.showLink(node.parentId, node.id);
            }
        } else if (step.type === 'calculate') {
            this.renderer.markCalculated(node.id);
        }
    },

    pause: function() {
        this.isPaused = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    stop: function() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    reset: function() {
        this.stop();
        this.renderer.reset();
    }
};
