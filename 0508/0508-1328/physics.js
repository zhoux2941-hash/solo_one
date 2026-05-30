class TerrainProfile {
    static SEGMENT_COUNT = 8;

    constructor(trackLength) {
        this.trackLength = trackLength;
        this.segments = this._generate();
    }

    _generate() {
        const segments = [];
        const segLen = this.trackLength / TerrainProfile.SEGMENT_COUNT;

        for (let i = 0; i < TerrainProfile.SEGMENT_COUNT; i++) {
            const roll = Math.random();
            let type;
            if (roll < 0.33) type = 'up';
            else if (roll < 0.66) type = 'down';
            else type = 'flat';

            let heightChange = 0;
            if (type === 'up') heightChange = 30 + Math.random() * 40;
            else if (type === 'down') heightChange = -(30 + Math.random() * 40);

            segments.push({
                type,
                start: i * segLen,
                end: (i + 1) * segLen,
                heightChange
            });
        }
        return segments;
    }

    getTypeAt(x) {
        for (const seg of this.segments) {
            if (x >= seg.start && x < seg.end) return seg.type;
        }
        return 'flat';
    }

    getHeightAt(x, baseY) {
        let acc = 0;
        for (const seg of this.segments) {
            if (x >= seg.start && x < seg.end) {
                const p = (x - seg.start) / (seg.end - seg.start);
                return baseY - (acc + seg.heightChange * p);
            }
            acc += seg.heightChange;
        }
        return baseY - acc;
    }
}

class TerrainPhysics {
    constructor(terrainType) {
        this.terrainType = terrainType;
    }

    accelerate(currentSpeed, inputForce) {
        return currentSpeed;
    }

    decelerate(currentSpeed) {
        return currentSpeed;
    }

    clampSpeed(speed, min, max) {
        return Math.max(min, Math.min(max, speed));
    }

    getMaxSpeedModifier() {
        return 1;
    }
}

class FlatPhysics extends TerrainPhysics {
    constructor() {
        super('flat');
        this.accel = 0.8;
        this.decel = 0.05;
    }

    accelerate(currentSpeed, inputForce) {
        return currentSpeed + this.accel * inputForce;
    }

    decelerate(currentSpeed) {
        return currentSpeed - this.decel;
    }
}

class UphillPhysics extends TerrainPhysics {
    constructor() {
        super('up');
        this.accel = 0.8;
        this.upslopeAccelPenalty = 0.3;
        this.gravityDecel = 0.08;
        this.decel = 0.05;
        this.maxSpeedMod = 0.8;
    }

    accelerate(currentSpeed, inputForce) {
        return currentSpeed + this.accel * inputForce * this.upslopeAccelPenalty;
    }

    decelerate(currentSpeed) {
        return currentSpeed - this.decel - this.gravityDecel;
    }

    getMaxSpeedModifier() {
        return this.maxSpeedMod;
    }
}

class DownhillPhysics extends TerrainPhysics {
    constructor() {
        super('down');
        this.accel = 0.8;
        this.gravityAccel = 0.15;
        this.decel = 0.03;
        this.maxSpeedMod = 1.2;
    }

    accelerate(currentSpeed, inputForce) {
        return currentSpeed + this.accel * inputForce + this.gravityAccel;
    }

    decelerate(currentSpeed) {
        return currentSpeed - this.decel;
    }

    getMaxSpeedModifier() {
        return this.maxSpeedMod;
    }
}

const PHYSICS_REGISTRY = {
    flat: new FlatPhysics(),
    up: new UphillPhysics(),
    down: new DownhillPhysics()
};

class PhysicsEngine {
    constructor(config) {
        this.minSpeed = config.minSpeed || 1;
        this.maxSpeed = config.maxSpeed || 15;
        this.worldScale = config.worldScale || 50;
        this.animScale = config.animScale || 8;
    }

    getPhysics(terrainType) {
        return PHYSICS_REGISTRY[terrainType] || PHYSICS_REGISTRY['flat'];
    }

    updateRunner(runner, dt, inputForce, terrainType) {
        const physics = this.getPhysics(terrainType);
        const localMax = this.maxSpeed * physics.getMaxSpeedModifier();

        let newSpeed;
        if (inputForce > 0) {
            newSpeed = physics.accelerate(runner.speed, inputForce);
        } else {
            newSpeed = physics.decelerate(runner.speed);
        }

        runner.speed = physics.clampSpeed(newSpeed, this.minSpeed, localMax);

        runner.x += runner.speed * dt * this.worldScale;
        runner.legPhase += runner.speed * dt * this.animScale;

        return runner;
    }

    updateAIRunner(runner, dt, skill, terrainType, now, variationSeed) {
        const physics = this.getPhysics(terrainType);
        const localMax = this.maxSpeed * physics.getMaxSpeedModifier();
        const variation = Math.sin(now / 200 + variationSeed) * 0.1;
        const baseSpeed = localMax * skill;

        runner.speed = physics.clampSpeed(
            baseSpeed * (0.9 + variation),
            this.minSpeed,
            localMax
        );

        runner.x += runner.speed * dt * this.worldScale;
        runner.legPhase += runner.speed * dt * this.animScale;

        return runner;
    }
}
