"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useAudioStore } from "../../store/audio";

type DistortMaterial = THREE.MeshStandardMaterial & { distort: number; speed: number; emissiveIntensity: number };

function Blob({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<DistortMaterial | null>(null);
  const tRef = useRef(0);
  const freqRef = useRef<Uint8Array | null>(null);
  const dJitterRef = useRef(0);
  const sJitterRef = useRef(0);

  useFrame((state) => {
    if (!analyser) return;
    const len = analyser.frequencyBinCount;
    if (!freqRef.current || freqRef.current.length !== len) {
      freqRef.current = new Uint8Array(len);
    }
    const buf = freqRef.current!;
    if (!isPlaying) {
      if (materialRef.current) materialRef.current.speed = 0;
      return;
    }
    analyser.getByteFrequencyData(buf);

    let sum = 0;
    for (let i = 0; i < len; i++) sum += buf[i];
    const volume = sum / (len * 255);

    const lowEnd = Math.floor(len * 0.15);
    const midEnd = Math.floor(len * 0.6);
    let lowSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < lowEnd; i++) lowSum += buf[i];
    for (let i = lowEnd; i < midEnd; i++) midSum += buf[i];
    for (let i = midEnd; i < len; i++) highSum += buf[i];
    const bands = {
      low: (lowSum / (lowEnd * 255)) || 0,
      mid: (midSum / ((midEnd - lowEnd) * 255)) || 0,
      high: (highSum / ((len - midEnd) * 255)) || 0,
    };

    const t = state.clock.elapsedTime;
    tRef.current += 0.012 + bands.high * 0.024;
    const sBase = 1 + Math.sqrt(Math.max(volume, 0)) * 0.28 + Math.pow(Math.max(bands.low, 0), 1.5) * 0.35;
    const sPulse = 0.06 * Math.sin(t * 0.9 + volume * 4);
    const s = Math.max(0.7, sBase + sPulse);

    const dTarget = 0.35 + Math.pow(Math.max(bands.mid, 0), 1.35) * 1.3 + bands.low * 0.35 + 0.28 * Math.sin(t * 0.71 + bands.high * 2.2);
    dJitterRef.current += (dTarget - dJitterRef.current) * 0.08;
    const sTarget = 1.0 + Math.pow(Math.max(bands.high, 0), 1.25) * 3.2 + bands.mid * 1.2 + 0.24 * Math.sin(t * 0.43 + bands.low * 3.2);
    sJitterRef.current += (sTarget - sJitterRef.current) * 0.07;

    if (meshRef.current) {
      meshRef.current.rotation.x = tRef.current * 0.6 + 0.2 * Math.sin(t * 0.7 + bands.mid * 2.0);
      meshRef.current.rotation.y = tRef.current * 0.4 + 0.15 * Math.sin(t * 0.5 + bands.high * 2.5);
      meshRef.current.rotation.z = 0.12 * Math.sin(t * 0.33 + bands.low * 3.0);
      meshRef.current.scale.setScalar(s);
    }
    if (materialRef.current) {
      materialRef.current.distort = Math.min(2.5, Math.max(0.15, dJitterRef.current));
      materialRef.current.speed = Math.min(7, Math.max(0.7, sJitterRef.current));
      materialRef.current.emissiveIntensity = 0.2 + volume * 0.22 + bands.high * 0.22 + 0.1 * Math.sin(t * 1.3);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.1, 128]} />
      <MeshDistortMaterial
        ref={materialRef}
        color={0x00fff0}
        emissive={0x00fff0}
        roughness={0.25}
        metalness={0.3}
        distort={0.25}
        speed={1}
      />
    </mesh>
  );
}

function Stars({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const max = 2000;
  const positionsRef = useRef<Float32Array>(new Float32Array(max * 3));
  const velocitiesRef = useRef<Float32Array>(new Float32Array(max));
  const activeRef = useRef(0);
  const spawnAccRef = useRef(0);
  const freqRef = useRef<Uint8Array | null>(null);

  const spawn = (speed: number) => {
    const active = activeRef.current;
    if (active >= max) return;
    const pos = positionsRef.current;
    const vel = velocitiesRef.current;
    const i = active;
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 2] = -120 - Math.random() * 180;
    vel[i] = speed * (0.8 + Math.random() * 0.4);
    activeRef.current = active + 1;
    if (pointsRef.current) pointsRef.current.geometry.setDrawRange(0, activeRef.current);
  };

  useFrame((state) => {
    if (!analyser || !pointsRef.current) return;
    const dt = Math.min(state.clock.getDelta(), 0.05);
    const len = analyser.frequencyBinCount;
    if (!freqRef.current || freqRef.current.length !== len) freqRef.current = new Uint8Array(len);
    const arr = freqRef.current!;

    if (!isPlaying) return;
    analyser.getByteFrequencyData(arr);

    let sum = 0, weighted = 0;
    for (let i = 0; i < len; i++) { const v = arr[i]; sum += v; weighted += v * i; }
    const amp = sum / (len * 255);
    const centroidBin = sum > 0 ? weighted / sum : 0;
    const centroidNorm = centroidBin / len;

    const baseSpeed = 50;
    const starSpeed = baseSpeed + centroidNorm * 220;
    const baseSpawn = 30;
    const spawnRate = baseSpawn + centroidNorm * 140;

    spawnAccRef.current += dt * spawnRate;
    while (spawnAccRef.current >= 1) { spawn(starSpeed); spawnAccRef.current -= 1; }

    const pos = positionsRef.current; const vel = velocitiesRef.current;
    let count = activeRef.current;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 2] += vel[i] * dt;
      if (pos[i * 3 + 2] > 30) {
        const last = count - 1;
        pos[i * 3] = pos[last * 3];
        pos[i * 3 + 1] = pos[last * 3 + 1];
        pos[i * 3 + 2] = pos[last * 3 + 2];
        vel[i] = vel[last];
        count--; i--;
      }
    }
    activeRef.current = count;
    if (geometryRef.current) {
      (geometryRef.current.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      geometryRef.current.setDrawRange(0, activeRef.current);
    }

    if (materialRef.current) materialRef.current.opacity = Math.min(1, 0.6 + amp * 0.5);
  });

  useEffect(() => {
    if (!geometryRef.current) return;
    geometryRef.current.setAttribute("position", new THREE.BufferAttribute(positionsRef.current, 3));
    geometryRef.current.setDrawRange(0, 0);
  }, []);

  useEffect(() => {
    if (!pointsRef.current || !geometryRef.current) return;
    const initial = 600;
    for (let i = 0; i < initial; i++) spawn(80);
    geometryRef.current.setDrawRange(0, activeRef.current);
  }, []);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial ref={materialRef} color={0xffffff} size={0.18} sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function ThreeAudioVisualizer() {
  const analyser = useAudioStore((state) => state.analyser);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
        <Stars analyser={analyser} isPlaying={isPlaying} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.9} position={[3, 5, 4]} />
        <Blob analyser={analyser} isPlaying={isPlaying} />
      </Canvas>
    </div>
  );
}
