import * as THREE from 'three';

export class ForceField {
    constructor() {
        this.type = 'none';
        this.windForce = new THREE.Vector3();
        this.vortexCenter = new THREE.Vector3();
        this.vortexStrength = 0;
        this.vortexRadius = 0;
    }
    
    setWind(direction) {
        this.type = 'wind';
        this.windForce.copy(direction);
    }
    
    setVortex(center, strength, radius) {
        this.type = 'vortex';
        this.vortexCenter.copy(center);
        this.vortexStrength = strength;
        this.vortexRadius = radius;
    }
    
    clear() {
        this.type = 'none';
        this.windForce.set(0, 0, 0);
    }
    
    getForce(position) {
        const force = new THREE.Vector3();
        
        if (this.type === 'wind') {
            force.copy(this.windForce);
        } else if (this.type === 'vortex') {
            const toCenter = position.clone().sub(this.vortexCenter);
            const dist = toCenter.length();
            
            if (dist < this.vortexRadius) {
                const tangent = new THREE.Vector3(-toCenter.z, 0, toCenter.x).normalize();
                const inward = toCenter.normalize().multiplyScalar(-1);
                
                const falloff = 1 - (dist / this.vortexRadius);
                force.add(tangent.multiplyScalar(this.vortexStrength * falloff));
                force.add(inward.multiplyScalar(this.vortexStrength * 0.3 * falloff));
            }
        }
        
        return force;
    }
    
    getShaderData() {
        if (this.type === 'wind') {
            return new Float32Array([this.windForce.x, this.windForce.y, this.windForce.z, 1]);
        } else if (this.type === 'vortex') {
            return new Float32Array([this.vortexStrength, this.vortexStrength * 0.3, 0, 2]);
        }
        return new Float32Array([0, 0, 0, 0]);
    }
    
    getPositionData() {
        return new Float32Array([
            this.vortexCenter.x,
            this.vortexCenter.y,
            this.vortexCenter.z,
            this.vortexRadius
        ]);
    }
}
