import { OceanRenderer } from './ocean-renderer.js';
import { Camera } from './camera.js';
import { InputHandler } from './input.js';

async function init() {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (!navigator.gpu) {
        alert('您的浏览器不支持 WebGPU。请使用 Chrome 113+ 或 Edge 113+ 版本。');
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied'
    });

    const camera = new Camera(canvas);
    const input = new InputHandler(canvas);
    const ocean = new OceanRenderer(device, format);

    await ocean.init();

    const params = {
        windSpeed: 15,
        windDirection: 45,
        waveScale: 1,
        foamIntensity: 1
    };

    setupControls(params, ocean, camera);

    let lastTime = performance.now();

    function render(time) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        input.update();
        camera.update(input, deltaTime);

        ocean.update(deltaTime, params);
        ocean.render(context, camera, time / 1000);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.updateAspect(canvas.width / canvas.height);
    });
}

function setupControls(params, ocean, camera) {
    const controls = [
        { id: 'windSpeed', param: 'windSpeed', unit: ' m/s' },
        { id: 'windDirection', param: 'windDirection', unit: '°' },
        { id: 'waveScale', param: 'waveScale', unit: 'x' },
        { id: 'foamIntensity', param: 'foamIntensity', unit: '' }
    ];

    controls.forEach(({ id, param, unit }) => {
        const input = document.getElementById(id);
        const display = document.getElementById(id + 'Value');
        
        input.addEventListener('input', (e) => {
            params[param] = parseFloat(e.target.value);
            display.textContent = params[param].toFixed(1) + unit;
            ocean.updateSpectrum(params);
        });
    });

    const cameraMode = document.getElementById('cameraMode');
    cameraMode.addEventListener('change', (e) => {
        camera.setMode(e.target.value);
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const modes = ['fly', 'follow'];
            const current = camera.getMode();
            const next = modes[(modes.indexOf(current) + 1) % modes.length];
            camera.setMode(next);
            cameraMode.value = next;
        }
    });
}

init();
