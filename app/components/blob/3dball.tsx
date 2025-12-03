"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { useAudioStore } from "../../store/audio";

interface Props {
  width: number;
  height: number;
}

export default function ThreeAudioVisualizer({width,height}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playing=useAudioStore((state)=>state.isPlaying)
  const file = useAudioStore((state) => state.file);
  const audioContext = useAudioStore((state) => state.audioContext);
const source = useAudioStore((state)=>state.source);
  useEffect(() => {
    if (!containerRef.current || !file || !audioContext) return;


    // === Scene & Camera ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // === Postprocessing ===
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height));
    bloomPass.threshold = 0.5;
    bloomPass.strength = 0.5;
    bloomPass.radius = 0.8;
    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // === Shader mesh ===
    const uniforms = {
      u_time: { value: 0 },
      u_frequency: { value: 0 },
      u_red: { value: 1 },
      u_green: { value: 1 },
      u_blue: { value: 1 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float u_red;
        uniform float u_green;
        uniform float u_blue;
        uniform float u_frequency;
        varying vec3 vNormal;
        void main() {
          gl_FragColor = vec4(vNormal * vec3(u_red, u_green, u_blue) * (1.0 + u_frequency / 256.0), 1.0);
        }
      `,
    //   wireframe: true,
    });
    const geometry = new THREE.IcosahedronGeometry(4, 50);
    const basePositions = geometry.attributes.position.array.slice(); // copy original vertices
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // === Audio Analyser ===
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;

    source?.connect(analyser);
    analyser.connect(audioContext.destination);

    const clock = new THREE.Clock();
    // let mouseX = 0;
    // let mouseY = 0;

    // document.addEventListener("mousemove", (e) => {
    //   const halfX = width / 2;
    //   const halfY = height / 2;
    //   mouseX = (e.clientX - halfX) / 100;
    //   mouseY = (e.clientY - halfY) / 100;
    // });

    const animate = () => {
    // camera.position.x += (mouseX - camera.position.x) * 0.05;
    // camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    uniforms.u_time.value = clock.getElapsedTime();

    // === Wave deformation across clusters with phase ===
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    const positions = (mesh.geometry as THREE.IcosahedronGeometry).attributes.position;
    const vertex = new THREE.Vector3();
    const clusterSize = 5; // number of vertices per "wave"
    const time = clock.getElapsedTime();

    for (let i = 0; i < positions.count; i += clusterSize) {
        // Compute a wave based on time and cluster index
        const wave = Math.sin(time * 5 + i / clusterSize) * 0.2;
        const audioAmplitude = (dataArray[i % dataArray.length] / 128 - 1) * 0.3;
        const scale = 1 + wave + audioAmplitude;
        
        for (let j = 0; j < clusterSize && i + j < positions.count; j++) {
            const idx = i + j;
            const ix = idx * 3;
            const iy = ix + 1;
            const iz = ix + 2;

            positions.array[ix] = basePositions[ix] * scale;
            positions.array[iy] = basePositions[iy] * scale;
            positions.array[iz] = basePositions[iz] * scale;
        }
    }

    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    composer.render();
    requestAnimationFrame(animate);
};
    animate();
    // === Auto-play on click ===
    const handleClick = async () => {
      if (audioContext.state === "suspended") await audioContext.resume();
    //   if (audioEl.paused) await audioEl.play();
    };
    window.addEventListener("click", handleClick);
    renderer.shadowMap.enabled = false; // enable shadows
    renderer.setClearColor(0x000000, 0)
    return () => {
      renderer.dispose();
      composer.dispose();
      window.removeEventListener("click", handleClick);
    };
  }, [file, audioContext, width, height]);

  return <div ref={containerRef} className=" w-full flex justify-center" />; // 100x100 Tailwind
}
