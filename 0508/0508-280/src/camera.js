export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.mode = 'fly';
        this.position = [0, 50, 100];
        this.rotation = [0, 0];
        this.fov = Math.PI / 3;
        this.near = 0.1;
        this.far = 10000;
        this.aspect = canvas.width / canvas.height;
        this.moveSpeed = 50;
        this.lookSpeed = 0.002;
        
        this.followTarget = [0, 0, 0];
        this.followDistance = 150;
        this.followHeight = 50;
        
        this.viewMatrix = new Float32Array(16);
        this.projMatrix = new Float32Array(16);
        this.viewProjMatrix = new Float32Array(16);
        
        this.isPointerLocked = false;
        
        canvas.addEventListener('click', () => {
            canvas.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && this.mode === 'fly') {
                this.rotation[0] -= e.movementY * this.lookSpeed;
                this.rotation[1] -= e.movementX * this.lookSpeed;
                this.rotation[0] = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.rotation[0]));
            }
        });
    }
    
    setMode(mode) {
        this.mode = mode;
    }
    
    getMode() {
        return this.mode;
    }
    
    updateAspect(aspect) {
        this.aspect = aspect;
    }
    
    update(input, deltaTime) {
        if (this.mode === 'fly') {
            this.updateFlyMode(input, deltaTime);
        } else {
            this.updateFollowMode(deltaTime);
        }
        
        this.updateMatrices();
    }
    
    updateFlyMode(input, deltaTime) {
        const forward = [
            Math.sin(this.rotation[1]) * Math.cos(this.rotation[0]),
            Math.sin(this.rotation[0]),
            -Math.cos(this.rotation[1]) * Math.cos(this.rotation[0])
        ];
        
        const right = [
            Math.cos(this.rotation[1]),
            0,
            Math.sin(this.rotation[1])
        ];
        
        const up = [0, 1, 0];
        
        const speed = this.moveSpeed * deltaTime;
        const moveDir = [0, 0, 0];
        
        if (input.forward) {
            moveDir[0] += forward[0];
            moveDir[1] += forward[1];
            moveDir[2] += forward[2];
        }
        if (input.backward) {
            moveDir[0] -= forward[0];
            moveDir[1] -= forward[1];
            moveDir[2] -= forward[2];
        }
        if (input.left) {
            moveDir[0] -= right[0];
            moveDir[2] -= right[2];
        }
        if (input.right) {
            moveDir[0] += right[0];
            moveDir[2] += right[2];
        }
        if (input.up) {
            moveDir[1] += 1;
        }
        if (input.down) {
            moveDir[1] -= 1;
        }
        
        const len = Math.sqrt(moveDir[0]**2 + moveDir[1]**2 + moveDir[2]**2);
        if (len > 0) {
            this.position[0] += (moveDir[0] / len) * speed;
            this.position[1] += (moveDir[1] / len) * speed;
            this.position[2] += (moveDir[2] / len) * speed;
        }
    }
    
    updateFollowMode(deltaTime) {
        const time = performance.now() / 1000;
        const orbitSpeed = 0.2;
        const angle = time * orbitSpeed;
        
        const targetX = this.followTarget[0] + Math.cos(angle) * this.followDistance;
        const targetZ = this.followTarget[2] + Math.sin(angle) * this.followDistance;
        const targetY = this.followTarget[1] + this.followHeight;
        
        const smooth = 0.05;
        this.position[0] += (targetX - this.position[0]) * smooth;
        this.position[1] += (targetY - this.position[1]) * smooth;
        this.position[2] += (targetZ - this.position[2]) * smooth;
        
        const dx = this.followTarget[0] - this.position[0];
        const dy = this.followTarget[1] - this.position[1];
        const dz = this.followTarget[2] - this.position[2];
        
        this.rotation[0] = Math.atan2(dy, Math.sqrt(dx**2 + dz**2));
        this.rotation[1] = -Math.atan2(dx, -dz);
    }
    
    updateMatrices() {
        this.lookAt(this.position, this.getLookTarget(), [0, 1, 0]);
        this.perspective(this.fov, this.aspect, this.near, this.far);
        this.multiplyMatrices(this.viewProjMatrix, this.projMatrix, this.viewMatrix);
    }
    
    getLookTarget() {
        return [
            this.position[0] + Math.sin(this.rotation[1]) * Math.cos(this.rotation[0]),
            this.position[1] + Math.sin(this.rotation[0]),
            this.position[2] - Math.cos(this.rotation[1]) * Math.cos(this.rotation[0])
        ];
    }
    
    lookAt(eye, target, up) {
        const z = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
        const x = this.normalize(this.cross(up, z));
        const y = this.cross(z, x);
        
        this.viewMatrix[0] = x[0]; this.viewMatrix[1] = y[0]; this.viewMatrix[2] = z[0]; this.viewMatrix[3] = 0;
        this.viewMatrix[4] = x[1]; this.viewMatrix[5] = y[1]; this.viewMatrix[6] = z[1]; this.viewMatrix[7] = 0;
        this.viewMatrix[8] = x[2]; this.viewMatrix[9] = y[2]; this.viewMatrix[10] = z[2]; this.viewMatrix[11] = 0;
        this.viewMatrix[12] = -this.dot(x, eye);
        this.viewMatrix[13] = -this.dot(y, eye);
        this.viewMatrix[14] = -this.dot(z, eye);
        this.viewMatrix[15] = 1;
    }
    
    perspective(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        
        this.projMatrix[0] = f / aspect; this.projMatrix[1] = 0; this.projMatrix[2] = 0; this.projMatrix[3] = 0;
        this.projMatrix[4] = 0; this.projMatrix[5] = f; this.projMatrix[6] = 0; this.projMatrix[7] = 0;
        this.projMatrix[8] = 0; this.projMatrix[9] = 0; this.projMatrix[10] = (far + near) * nf; this.projMatrix[11] = -1;
        this.projMatrix[12] = 0; this.projMatrix[13] = 0; this.projMatrix[14] = 2 * far * near * nf; this.projMatrix[15] = 0;
    }
    
    multiplyMatrices(out, a, b) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    out[i * 4 + j] += a[k * 4 + j] * b[i * 4 + k];
                }
            }
        }
    }
    
    normalize(v) {
        const len = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
        return [v[0]/len, v[1]/len, v[2]/len];
    }
    
    cross(a, b) {
        return [
            a[1]*b[2] - a[2]*b[1],
            a[2]*b[0] - a[0]*b[2],
            a[0]*b[1] - a[1]*b[0]
        ];
    }
    
    dot(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }
    
    getViewProjMatrix() {
        return this.viewProjMatrix;
    }
    
    getPosition() {
        return this.position;
    }
}
