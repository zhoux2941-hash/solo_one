import * as THREE from 'three';

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.obstacleMeshes = [];
    }
    
    addSphere(position, radius) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            metalness: 0.5,
            roughness: 0.3,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        this.obstacleMeshes.push(mesh);
        this.obstacles.push({
            type: 1,
            position: position.clone(),
            radius: radius,
            size: new THREE.Vector3()
        });
        
        return mesh;
    }
    
    addBox(position, size) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: 0x44ff44,
            metalness: 0.3,
            roughness: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        this.obstacleMeshes.push(mesh);
        this.obstacles.push({
            type: 2,
            position: position.clone(),
            size: size.clone(),
            radius: 0
        });
        
        return mesh;
    }
    
    addCustomMesh(mesh, position, scale) {
        const clonedMesh = mesh.clone();
        clonedMesh.position.copy(position);
        if (scale) clonedMesh.scale.copy(scale);
        clonedMesh.material = new THREE.MeshStandardMaterial({
            color: 0xffff44,
            metalness: 0.4,
            roughness: 0.4,
            transparent: true,
            opacity: 0.7
        });
        this.scene.add(clonedMesh);
        
        this.obstacleMeshes.push(clonedMesh);
        this.obstacles.push({
            type: 3,
            mesh: clonedMesh,
            position: position.clone(),
            size: new THREE.Vector3(1, 1, 1),
            radius: 0
        });
        
        return clonedMesh;
    }
    
    collideParticle(position, velocity) {
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 1) {
                this.collideSphere(position, velocity, obstacle);
            } else if (obstacle.type === 2) {
                this.collideBox(position, velocity, obstacle);
            } else if (obstacle.type === 3) {
                this.collideMesh(position, velocity, obstacle);
            }
        }
    }
    
    collideSphere(position, velocity, obstacle) {
        const toCenter = position.clone().sub(obstacle.position);
        const dist = toCenter.length();
        
        if (dist < obstacle.radius + 0.05) {
            const normal = toCenter.normalize();
            position.copy(obstacle.position.clone().add(normal.multiplyScalar(obstacle.radius + 0.05)));
            
            const velDotNormal = velocity.dot(normal);
            if (velDotNormal < 0) {
                velocity.add(normal.multiplyScalar(-1.5 * velDotNormal));
                velocity.multiplyScalar(0.7);
            }
        }
    }
    
    collideBox(position, velocity, obstacle) {
        const halfSize = obstacle.size.clone().multiplyScalar(0.5);
        const minBounds = obstacle.position.clone().sub(halfSize);
        const maxBounds = obstacle.position.clone().add(halfSize);
        
        const padding = 0.05;
        minBounds.subScalar(padding);
        maxBounds.addScalar(padding);
        
        if (position.x > minBounds.x && position.x < maxBounds.x &&
            position.y > minBounds.y && position.y < maxBounds.y &&
            position.z > minBounds.z && position.z < maxBounds.z) {
            
            const toCenter = position.clone().sub(obstacle.position);
            const penetration = new THREE.Vector3(
                halfSize.x + padding - Math.abs(toCenter.x),
                halfSize.y + padding - Math.abs(toCenter.y),
                halfSize.z + padding - Math.abs(toCenter.z)
            );
            
            let normal = new THREE.Vector3();
            
            if (penetration.x < penetration.y && penetration.x < penetration.z) {
                normal.x = Math.sign(toCenter.x);
                position.x = obstacle.position.x + normal.x * (halfSize.x + padding);
            } else if (penetration.y < penetration.z) {
                normal.y = Math.sign(toCenter.y);
                position.y = obstacle.position.y + normal.y * (halfSize.y + padding);
            } else {
                normal.z = Math.sign(toCenter.z);
                position.z = obstacle.position.z + normal.z * (halfSize.z + padding);
            }
            
            const velDotNormal = velocity.dot(normal);
            if (velDotNormal < 0) {
                velocity.add(normal.multiplyScalar(-1.5 * velDotNormal));
                velocity.multiplyScalar(0.7);
            }
        }
    }
    
    collideMesh(position, velocity, obstacle) {
        const mesh = obstacle.mesh;
        const sphere = new THREE.Sphere(mesh.position, 1);
        
        if (mesh.geometry.boundingSphere) {
            sphere.radius = mesh.geometry.boundingSphere.radius * Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z);
        }
        
        const dist = position.distanceTo(sphere.center);
        if (dist < sphere.radius + 0.05) {
            const normal = position.clone().sub(sphere.center).normalize();
            position.copy(sphere.center.clone().add(normal.multiplyScalar(sphere.radius + 0.05)));
            
            const velDotNormal = velocity.dot(normal);
            if (velDotNormal < 0) {
                velocity.add(normal.multiplyScalar(-1.5 * velDotNormal));
                velocity.multiplyScalar(0.7);
            }
        }
    }
    
    getObstacleData() {
        return this.obstacles;
    }
    
    clear() {
        for (const mesh of this.obstacleMeshes) {
            this.scene.remove(mesh);
        }
        this.obstacleMeshes = [];
        this.obstacles = [];
    }
}
