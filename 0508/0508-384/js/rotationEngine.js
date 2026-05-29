class RotationEngine {
    constructor(cubeGroup) {
        this.cubeGroup = cubeGroup;
        this.isAnimating = false;
        this.rotationQueue = [];
        this.size = 0.92;
        this.gap = 0.04;
        this.layerVectors = {
            'U': { axis: 'y', layer: 1, direction: 1 },
            'U\'': { axis: 'y', layer: 1, direction: -1 },
            'D': { axis: 'y', layer: -1, direction: -1 },
            'D\'': { axis: 'y', layer: -1, direction: 1 },
            'L': { axis: 'x', layer: -1, direction: -1 },
            'L\'': { axis: 'x', layer: -1, direction: 1 },
            'R': { axis: 'x', layer: 1, direction: 1 },
            'R\'': { axis: 'x', layer: 1, direction: -1 },
            'F': { axis: 'z', layer: 1, direction: 1 },
            'F\'': { axis: 'z', layer: 1, direction: -1 },
            'B': { axis: 'z', layer: -1, direction: -1 },
            'B\'': { axis: 'z', layer: -1, direction: 1 }
        };
    }
    
    rotate(move, callback) {
        if (this.isAnimating) {
            this.rotationQueue.push({ move, callback });
            return;
        }
        
        const params = this.layerVectors[move];
        if (!params) return;
        
        this.isAnimating = true;
        const cubesToRotate = this.cubeGroup.children.filter(cube => {
            return cube.userData[params.axis] === params.layer;
        });
        
        const targetRotation = params.direction * Math.PI / 2;
        let currentRotation = 0;
        const rotationSpeed = 0.15;
        const startPositions = cubesToRotate.map(cube => ({
            x: cube.position.x,
            y: cube.position.y,
            z: cube.position.z
        }));
        
        const animateRotation = () => {
            if (Math.abs(currentRotation - targetRotation) < 0.01) {
                currentRotation = targetRotation;
                this.isAnimating = false;
                
                cubesToRotate.forEach((cube, i) => {
                    cube.rotation.set(0, 0, 0);
                    
                    const q = new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(params.axis === 'x' ? 1 : 0, 
                                         params.axis === 'y' ? 1 : 0, 
                                         params.axis === 'z' ? 1 : 0),
                        targetRotation
                    );
                    
                    const pos = new THREE.Vector3(startPositions[i].x, startPositions[i].y, startPositions[i].z);
                    const center = new THREE.Vector3(
                        params.axis === 'x' ? params.layer * (this.size + this.gap) : 0,
                        params.axis === 'y' ? params.layer * (this.size + this.gap) : 0,
                        params.axis === 'z' ? params.layer * (this.size + this.gap) : 0
                    );
                    
                    pos.sub(center);
                    pos.applyQuaternion(q);
                    pos.add(center);
                    
                    cube.position.copy(pos);
                    
                    this.updateUserData(cube, params.axis, params.direction);
                });
                
                if (callback) callback();
                
                if (this.rotationQueue.length > 0) {
                    const next = this.rotationQueue.shift();
                    this.rotate(next.move, next.callback);
                }
                return;
            }
            
            currentRotation += rotationSpeed * params.direction;
            if (Math.abs(currentRotation) > Math.abs(targetRotation)) {
                currentRotation = targetRotation;
            }
            
            const q = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(params.axis === 'x' ? 1 : 0, 
                                 params.axis === 'y' ? 1 : 0, 
                                 params.axis === 'z' ? 1 : 0),
                currentRotation
            );
            
            cubesToRotate.forEach((cube, i) => {
                const pos = new THREE.Vector3(startPositions[i].x, startPositions[i].y, startPositions[i].z);
                const center = new THREE.Vector3(
                    params.axis === 'x' ? params.layer * (this.size + this.gap) : 0,
                    params.axis === 'y' ? params.layer * (this.size + this.gap) : 0,
                    params.axis === 'z' ? params.layer * (this.size + this.gap) : 0
                );
                
                pos.sub(center);
                pos.applyQuaternion(q);
                pos.add(center);
                
                cube.position.copy(pos);
            });
            
            requestAnimationFrame(animateRotation);
        };
        
        animateRotation();
    }
    
    updateUserData(cube, axis, direction) {
        const { x, y, z } = cube.userData;
        const scale = this.size + this.gap;
        
        if (axis === 'y') {
            const newX = -z * scale;
            const newZ = x * scale;
            cube.userData.x = Math.round(newX / scale);
            cube.userData.z = Math.round(newZ / scale);
        } else if (axis === 'x') {
            const newY = -z * scale;
            const newZ = y * scale;
            cube.userData.y = Math.round(newY / scale);
            cube.userData.z = Math.round(newZ / scale);
        } else if (axis === 'z') {
            const newX = -y * scale;
            const newY = x * scale;
            cube.userData.x = Math.round(newX / scale);
            cube.userData.y = Math.round(newY / scale);
        }
    }
    
    isBusy() {
        return this.isAnimating;
    }
}

export { RotationEngine };