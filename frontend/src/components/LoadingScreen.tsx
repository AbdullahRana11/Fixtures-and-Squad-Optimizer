import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef<any>();
  const count = 50000;
  const speedMult = 1.7;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; 
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true }), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.3, 0.3, 0.3), []);

  const PARAMS = useMemo(() => ({"scale":52,"speed":0.55,"sigma10":10,"arms":4,"halo":1.25,"thickness":0.1}), []);
  const addControl = (id: string, l: string, min: number, max: number, val: number) => {
      // @ts-ignore
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = () => {};
  const annotate = () => {};

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    // @ts-ignore
    if(material.uniforms && material.uniforms.uTime) {
         // @ts-ignore
         material.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        const scale = addControl("scale", "Galaxy Scale", 20, 140, 52);
        const speed = addControl("speed", "Rotation Speed", 0.05, 2.0, 0.55);
        const sigma10 = addControl("sigma10", "Sigma10 Lock", 8, 12, 10);
        const arms = addControl("arms", "Spiral Arms", 2, 6, 4);
        const halo = addControl("halo", "Halo Radius", 0.5, 2.5, 1.25);
        const thickness = addControl("thickness", "Disk Thickness", 0.02, 0.35, 0.10);
        
        const pi = 3.141592653589793;
        const tau = 6.283185307179586;
        const alpha = 0.0072973525692838015;
        const V0 = 4.1887902047863905;
        const g1 = 0.6180339887498948;
        const g2 = 0.7548776662466927;
        const g3 = 0.5698402909980532;
        const eps = 1e-6;
        
        const s2 = sigma10 * sigma10;
        const s4 = s2 * s2;
        const s8 = s4 * s4;
        const s16 = s8 * s8;
        
        const a2 = alpha * alpha;
        const a4 = a2 * a2;
        const a8 = a4 * a4;
        
        const omegaRaw = 1.0 / (3.0 * pi * a8 * V0 * s16);
        const omegaM = omegaRaw / (1.0 + omegaRaw);
        const omegaL = 1.0 / (1.0 + omegaRaw);
        
        const bulgeFrac = 0.08 + 0.18 * omegaM;
        const diskFrac = 0.58 + 0.18 * omegaM;
        const cut1 = bulgeFrac;
        const cut2 = bulgeFrac + diskFrac;
        
        const n = count > 1 ? i / (count - 1) : 0.0;
        const t = time * speed;
        
        const q1 = i * g1;
        const q2 = i * g2;
        const q3 = i * g3;
        
        const u1 = q1 - Math.floor(q1);
        const u2 = q2 - Math.floor(q2);
        const u3 = q3 - Math.floor(q3);
        
        let x = 0.0;
        let y = 0.0;
        let z = 0.0;
        let hue = 0.6;
        let sat = 0.6;
        let lum = 0.4;
        
        if (n < cut1) {
        const mu = 1.0 - 2.0 * u2;
        const st = Math.sqrt(Math.max(0.0, 1.0 - mu * mu));
        const rr = scale * 0.34 * Math.pow(u1 + eps, 0.42) * (1.0 + 0.10 * Math.sin(t + tau * u3));
        const ang = tau * u3 + t * (0.45 + 0.25 * omegaM);
        
        x = rr * st * Math.cos(ang);
        y = rr * mu * 0.86;
        z = rr * st * Math.sin(ang);
        
        hue = 0.09 + 0.03 * Math.sin(ang);
        sat = 0.55;
        lum = 0.58 + 0.18 * (1.0 - rr / (scale * 0.34 + eps));
        } else if (n < cut2) {
        const rN = Math.sqrt(u1 + eps);
        const pitch = 2.0 + 2.8 * omegaL;
        const spin = t * (0.10 + 0.55 * omegaM) / (0.16 + rN);
        const base = tau * u2;
        const armWave = Math.sin(arms * base - pitch * Math.log(1.0 + 3.5 * rN) + t * 0.35);
        const squeeze = 1.0 - 0.34 * Math.pow(Math.abs(armWave), 0.72);
        const rr = scale * (0.10 + 1.08 * rN) * squeeze;
        const ang = base + 0.34 * armWave + spin;
        const flare = 0.20 + 0.80 * (1.0 - rN);
        
        x = rr * Math.cos(ang);
        y = scale * thickness * (u3 - 0.5) * flare + scale * 0.025 * armWave;
        z = rr * Math.sin(ang);
        
        hue = 0.58 + 0.08 * (1.0 - rN) + 0.03 * armWave;
        sat = 0.72;
        lum = 0.34 + 0.24 * flare + 0.10 * (1.0 - Math.abs(armWave));
        } else {
        const mu = 1.0 - 2.0 * u2;
        const st = Math.sqrt(Math.max(0.0, 1.0 - mu * mu));
        const rr = scale * (0.92 + halo * 1.65 * Math.pow(u1 + eps, 0.58));
        const ang = tau * u3 - t * (0.08 + 0.12 * omegaM) / (0.30 + u1);
        const warp = 1.0 + 0.06 * Math.sin(ang * 3.0 + t + tau * u1);
        
        x = rr * warp * st * Math.cos(ang);
        y = rr * mu * (0.96 - 0.20 * omegaM);
        z = rr * warp * st * Math.sin(ang);
        
        hue = 0.64 + 0.08 * u1;
        sat = 0.34 + 0.14 * omegaL;
        lum = 0.18 + 0.18 * (1.0 - u1);
        }
        
        target.set(
        Number.isFinite(x) ? x : 0.0,
        Number.isFinite(y) ? y : 0.0,
        Number.isFinite(z) ? z : 0.0
        );
        
        color.setHSL(
        hue - Math.floor(hue),
        sat > 1.0 ? 1.0 : sat,
        lum > 1.0 ? 1.0 : lum
        );
        
        if (i === 0) {
        setInfo();
        annotate();
        }
        
        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export const LoadingScreen: React.FC<{ onLaunch?: () => void; isFallback?: boolean }> = ({ onLaunch, isFallback }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Drafting your tournament...');

  useEffect(() => {
    const statuses = [
      'Drafting your tournament...',
      'Crunching the numbers...',
      'Analyzing team data...',
      'Optimizing schedules...',
      'Finalizing setup...'
    ];
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = Math.min(100, p + Math.floor(Math.random() * 8) + 2);
        setStatus(statuses[Math.floor((next / 100) * (statuses.length - 1))]);
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#000000] flex flex-col items-center justify-center overflow-hidden">
      
      {/* 3D Galaxy Background */}
      <div className="absolute inset-0 z-0 opacity-70">
        <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
          <fog attach="fog" args={['#000000', 0.01]} />
          <ParticleSwarm />
          <OrbitControls autoRotate={true} />
          {/* @ts-ignore */}
          <Effects disableGamma>
              {/* @ts-ignore */}
              <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
          </Effects>
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        
        {progress === 100 && !isFallback && onLaunch ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            onClick={onLaunch}
            className="mt-12 px-10 py-5 bg-orange-950/40 hover:bg-orange-900/60 text-orange-400 font-clash text-xl font-bold rounded-xl tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(234,88,12,0.2)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] border border-orange-500/40"
          >
            Launch System
          </motion.button>
        ) : (
          <>
            {/* Simple spinning indicator */}
            <div className="relative w-24 h-24 mb-12 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-zinc-800"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="text-2xl font-bold font-clash text-white">{progress}%</div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-4 w-full">
              <h2 className="text-xl font-clash text-white/90">{progress === 100 ? 'System Ready' : status}</h2>
              
              {/* Clean Progress Bar */}
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
