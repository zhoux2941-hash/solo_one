export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }
    
    update() {
        this.forward = this.keys.has('KeyW');
        this.backward = this.keys.has('KeyS');
        this.left = this.keys.has('KeyA');
        this.right = this.keys.has('KeyD');
        this.up = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
        this.down = this.keys.has('ControlLeft') || this.keys.has('ControlRight');
    }
}
