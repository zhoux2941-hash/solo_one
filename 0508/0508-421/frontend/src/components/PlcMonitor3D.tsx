import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePlcStore } from '../store/plcStore';

const PlcMonitor3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const inputLedsRef = useRef<THREE.Mesh[]>([]);
  const outputLedsRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const { ioState } = usePlcStore();

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const chassisGroup = new THREE.Group();

    const mainBodyGeometry = new THREE.BoxGeometry(6, 2, 4);
    const mainBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.3,
    });
    const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    chassisGroup.add(mainBody);

    const inputModuleGeometry = new THREE.BoxGeometry(2.5, 1.5, 1);
    const inputModuleMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.5,
      metalness: 0.4,
    });
    const inputModule = new THREE.Mesh(inputModuleGeometry, inputModuleMaterial);
    inputModule.position.set(-2, 0.25, 2);
    inputModule.castShadow = true;
    chassisGroup.add(inputModule);

    const outputModuleGeometry = new THREE.BoxGeometry(2.5, 1.5, 1);
    const outputModuleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.5,
      metalness: 0.4,
    });
    const outputModule = new THREE.Mesh(outputModuleGeometry, outputModuleMaterial);
    outputModule.position.set(2, 0.25, 2);
    outputModule.castShadow = true;
    chassisGroup.add(outputModule);

    const cpuModuleGeometry = new THREE.BoxGeometry(1, 1.5, 1);
    const cpuModuleMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      roughness: 0.5,
      metalness: 0.4,
    });
    const cpuModule = new THREE.Mesh(cpuModuleGeometry, cpuModuleMaterial);
    cpuModule.position.set(0, 0.25, 2);
    cpuModule.castShadow = true;
    chassisGroup.add(cpuModule);

    const inputLeds: THREE.Mesh[] = [];
    const ledGeometry = new THREE.SphereGeometry(0.15, 16, 16);

    for (let i = 0; i < 8; i++) {
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x333333,
        emissiveIntensity: 0.2,
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(-3 + i * 0.35, 0.75, 2.6);
      inputLeds.push(led);
      chassisGroup.add(led);
    }
    inputLedsRef.current = inputLeds;

    const outputLeds: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x333333,
        emissiveIntensity: 0.2,
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(1 + i * 0.35, 0.75, 2.6);
      outputLeds.push(led);
      chassisGroup.add(led);
    }
    outputLedsRef.current = outputLeds;

    scene.add(chassisGroup);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      inputLedsRef.current.forEach((led, i) => {
        const material = led.material as THREE.MeshStandardMaterial;
        if (ioState.inputs[i]) {
          material.emissive.setHex(0xff0000);
          material.emissiveIntensity = 1.0;
          material.color.setHex(0xff0000);
        } else {
          material.emissive.setHex(0x333333);
          material.emissiveIntensity = 0.2;
          material.color.setHex(0x333333);
        }
      });

      outputLedsRef.current.forEach((led, i) => {
        const material = led.material as THREE.MeshStandardMaterial;
        if (ioState.outputs[i]) {
          material.emissive.setHex(0xff0000);
          material.emissiveIntensity = 1.0;
          material.color.setHex(0xff0000);
        } else {
          material.emissive.setHex(0x333333);
          material.emissiveIntensity = 0.2;
          material.color.setHex(0x333333);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer) {
        renderer.dispose();
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [ioState.inputs, ioState.outputs]);

  return <div ref={mountRef} className="plc-monitor-3d" />;
};

export default PlcMonitor3D;
