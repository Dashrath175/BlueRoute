/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Port } from '../data/ports';
import { RouteOption, Waypoint } from '../data/routes';
import { rawShippingLanes, removedEdgesForDebug } from '../data/routingGraph';
import { weatherZones } from '../data/weather';
import { riskZones } from '../data/risks';
import { trafficCorridors } from '../data/traffic';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-bg-darker">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-glow border-t-transparent"></div>
        <p className="font-mono text-sm text-brand-sky animate-pulse uppercase tracking-wider">Loading Oceanic Telemetry...</p>
      </div>
    </div>
  )
});

const GlobeComponent = Globe as any;

function latLngToVector3(lat: number, lng: number, radius: number = 100): THREE.Vector3 {
  const phi = lat * Math.PI / 180;
  const theta = lng * Math.PI / 180;
  const x = radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.sin(phi);
  const z = -radius * Math.cos(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

function cartesianToLatLng(vec: THREE.Vector3) {
  const r = vec.length();
  const lat = Math.asin(vec.y / r) * (180 / Math.PI);
  const lng = Math.atan2(vec.x, -vec.z) * (180 / Math.PI);
  return { lat, lng };
}

function getUniquePointsForSpline(points: THREE.Vector3[]): THREE.Vector3[] {
  const validPoints = (points || []).filter(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
  const uniquePoints: THREE.Vector3[] = [];
  validPoints.forEach(p => {
    if (uniquePoints.length === 0 || uniquePoints[uniquePoints.length - 1].distanceTo(p) > 0.001) {
      uniquePoints.push(p);
    }
  });
  if (uniquePoints.length < 2) {
    const base = uniquePoints[0] || new THREE.Vector3(100, 0, 0);
    return [base, base.clone().add(new THREE.Vector3(0.001, 0, 0))];
  }
  return uniquePoints;
}

function sanitizeProgress(val: number): number {
  if (val === undefined || val === null || isNaN(val) || typeof val !== 'number') return 0;
  return Math.max(0, Math.min(1, val));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function createFadedNebulaTexture(imageSrc: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Calculate radial falloff factor (1 at center, 0 at outer boundary)
          let factor = 1 - dist / maxRadius;
          factor = Math.max(0, Math.min(1, factor));
          // Apply smoothstep curve for smooth transition
          const smoothFactor = factor * factor * (3 - 2 * factor);

          // Brightness of the original pixel
          const brightness = (r + g + b) / 3 / 255;

          // Set alpha channel.
          // By default, the image has a black background. Brightness is high in the nebulae and 0 in black background.
          // We set alpha to brightness * smoothFactor.
          // This makes the black parts transparent AND makes the edges fade to 0 alpha!
          data[idx + 3] = Math.round(brightness * smoothFactor * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(texture);
    };
    img.onerror = () => {
      const texture = new THREE.Texture();
      resolve(texture as any);
    };
    img.src = imageSrc;
  });
}

interface MaritimeGlobeProps {
  ports: Port[];
  selectedFromPort: Port | null;
  selectedToPort: Port | null;
  generatedRoutes: RouteOption[];
  activeRouteId: string | null;
  showWeather: boolean;
  showPiracy: boolean;
  showTraffic: boolean;
  isSimulating: boolean;
  shipPosition: { lat: number; lng: number } | null;
  onPortSelect: (port: Port) => void;
  simulationIndex: number;
  setSimulationIndex: (idx: number) => void;
  setShipPosition: (pos: { lat: number; lng: number } | null) => void;
  setIsSimulating: (simulating: boolean) => void;
  simSpeed: number;
  liveShips?: any[];

  // Theme Props
  waterColor: string;
  landColor: string;
  textColor: string;
  bgColor: string;
  selectedPresetKey?: string;
}

export default function MaritimeGlobe({
  ports,
  selectedFromPort,
  selectedToPort,
  generatedRoutes,
  activeRouteId,
  showWeather,
  showPiracy,
  showTraffic,
  isSimulating,
  shipPosition,
  onPortSelect,
  simulationIndex,
  setSimulationIndex,
  setShipPosition,
  setIsSimulating,
  simSpeed,
  liveShips,

  // Theme Bindings
  waterColor,
  landColor,
  textColor,
  bgColor,
  selectedPresetKey
}: MaritimeGlobeProps) {
  const [globeReady, setGlobeReady] = useState(false);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [animatedPathProgress, setAnimatedPathProgress] = useState(0.0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowDebug(window.location.search.includes('debug=true'));
    }
  }, []);

  // Animate route drawing when active route selection changes
  useEffect(() => {
    if (!activeRouteId) {
      setAnimatedPathProgress(1.0);
      return;
    }

    setAnimatedPathProgress(0.0);
    const startTime = performance.now();
    const duration = 1200; // 1.2 seconds drawing duration

    let animationFrameId: number;
    const animateDraw = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      // Cubic ease-out curve for smooth deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedPathProgress(easedProgress);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(animateDraw);
      }
    };

    animationFrameId = requestAnimationFrame(animateDraw);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeRouteId]);

  const shipGroupRef = useRef<THREE.Group | null>(null);
  const spaceGroupRef = useRef<THREE.Group | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const activeRoute = generatedRoutes.find(r => r.id === activeRouteId);

  // Helper to color routes by mode (Fastest = Red, Balanced = Blue, Safest = Green)
  const getRouteColor = (routeName: string, isFaint: boolean = false, opacity: number = 1.0) => {
    const name = routeName.toLowerCase();
    if (name.includes('fastest')) {
      return isFaint ? `rgba(220, 38, 38, ${opacity})` : '#dc2626';
    }
    if (name.includes('safest')) {
      return isFaint ? `rgba(22, 163, 74, ${opacity})` : '#16a34a';
    }
    // Balanced / Default
    return isFaint ? `rgba(29, 78, 216, ${opacity})` : '#1d4ed8';
  };

  // Memoize solid light-blue globe material (Water)
  const globeMaterial = React.useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(waterColor),
      shininess: 15,
    });
  }, [waterColor]);

  // Load countries geojson
  useEffect(() => {
    fetch('/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        // Keep all countries including Antarctica
        setCountries(data.features || []);
      })
      .catch(err => console.error('Error loading countries geojson:', err));
  }, []);

  // Memoize filtered country labels with centroid overrides
  const countryLabels = React.useMemo(() => {
    const CENTROID_OVERRIDES: Record<string, { lat: number; lng: number }> = {
      IND: { lat: 21.0, lng: 78.96 },   // India: Central Nagpur
      ATA: { lat: -90.0, lng: 0.0 },    // Antarctica: South Pole
      USA: { lat: 39.82, lng: -98.58 }, // USA
      CAN: { lat: 56.13, lng: -106.34 },// Canada
      RUS: { lat: 61.52, lng: 96.17 },  // Russia
      AUS: { lat: -25.27, lng: 133.77 },// Australia
      CHN: { lat: 35.86, lng: 104.19 }, // China
      BRA: { lat: -14.23, lng: -51.92 },// Brazil
    };

    return countries
      .filter((f: any) => f.properties?.LABELRANK !== undefined && f.properties.LABELRANK <= 4)
      .map((f: any) => {
        const iso = f.properties?.ISO_A3;
        let lat, lng;
        if (iso && CENTROID_OVERRIDES[iso]) {
          lat = CENTROID_OVERRIDES[iso].lat;
          lng = CENTROID_OVERRIDES[iso].lng;
        } else {
          const bbox = f.bbox || [-180, -90, 180, 90];
          lng = (bbox[0] + bbox[2]) / 2;
          lat = (bbox[1] + bbox[3]) / 2;
        }

        const area = Math.abs((f.bbox?.[2] - f.bbox?.[0]) * (f.bbox?.[3] - f.bbox?.[1]) || 1);
        const size = Math.max(0.4, Math.min(1.6, Math.log10(area + 1) * 0.45));

        return {
          lat,
          lng,
          name: f.properties?.NAME || '',
          size,
          isCountry: true
        };
      });
  }, [countries]);

  // Initialize Three.js custom objects
  useEffect(() => {
    if (!globeReady || !globeRef.current) return;

    let checkInterval: NodeJS.Timeout;
    const initThreeObjects = () => {
      const scene = globeRef.current?.scene();
      if (!scene) return false;

      if (shipGroupRef.current) return true; // Already initialized

      // 1. Create custom ship group (Simple Solid Brutalist colors)
      const shipGroup = new THREE.Group();

      // Hull: Box (Bold Royal Blue)
      const hullGeo = new THREE.BoxGeometry(0.7, 0.4, 2.2);
      const hullMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      shipGroup.add(hull);

      // Bow: Cone pointing forward
      const bowGeo = new THREE.ConeGeometry(0.35, 1.0, 4);
      bowGeo.rotateX(Math.PI / 2);
      bowGeo.translate(0, 0, 1.6);
      const bowMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const bow = new THREE.Mesh(bowGeo, bowMat);
      shipGroup.add(bow);

      // Bridge: Box (Slate Navy)
      const bridgeGeo = new THREE.BoxGeometry(0.5, 0.35, 0.7);
      bridgeGeo.translate(0, 0.35, -0.3);
      const bridgeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      shipGroup.add(bridge);

      shipGroup.visible = false;
      scene.add(shipGroup);
      shipGroupRef.current = shipGroup;

      // 2. Create custom space background (Procedural Starfield + Cosmic Nebulae)
      const spaceGroup = new THREE.Group();

      // Create procedural stars
      const starsCount = 5000;
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starsCount * 3);
      const starColors = new Float32Array(starsCount * 3);

      const minStarRadius = 1800;
      const maxStarRadius = 2500;
      for (let i = 0; i < starsCount; i++) {
        const r = minStarRadius + Math.random() * (maxStarRadius - minStarRadius);
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);

        // Color mix: warm whites, cool whites, and rare gold stars
        const color = new THREE.Color();
        const rand = Math.random();
        if (rand < 0.65) {
          // Warm white
          color.setHSL(0.1 + Math.random() * 0.05, 0.15, 0.85 + Math.random() * 0.15);
        } else if (rand < 0.9) {
          // Cool white/blue
          color.setHSL(0.6 + Math.random() * 0.05, 0.25, 0.85 + Math.random() * 0.15);
        } else {
          // Soft orange/gold
          color.setHSL(0.08 + Math.random() * 0.04, 0.6, 0.75 + Math.random() * 0.2);
        }

        starColors[i * 3] = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

      // Circular glowing star texture using Canvas
      const createStarTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 16, 16);
        }
        return new THREE.CanvasTexture(canvas);
      };

      const starMaterial = new THREE.PointsMaterial({
        size: 5.0,
        map: createStarTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const starPoints = new THREE.Points(starGeometry, starMaterial);
      spaceGroup.add(starPoints);
      scene.add(spaceGroup);
      spaceGroupRef.current = spaceGroup;

      // Set initial visibility based on bgColor
      const isLightMode = bgColor.toLowerCase() === '#ffffff' || selectedPresetKey === 'classicLight';
      spaceGroup.visible = !isLightMode;

      // Load cohesive nebula textures asynchronously and process them
      const loadNebulae = async () => {
        try {
          const [tex1, tex2, tex3] = await Promise.all([
            createFadedNebulaTexture('/nebula-cohesive-1.png'),
            createFadedNebulaTexture('/nebula-cohesive-2.png'),
            createFadedNebulaTexture('/nebula-cohesive-3.png')
          ]);

          const mat1 = new THREE.MeshBasicMaterial({
            map: tex1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            opacity: 0.45
          });

          const mat2 = new THREE.MeshBasicMaterial({
            map: tex2,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            opacity: 0.4
          });

          const mat3 = new THREE.MeshBasicMaterial({
            map: tex3,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            opacity: 0.45
          });

          // Large planes at a distance of ~1400.
          // We can use 6 planes in different directions to surround the sphere.
          const nebulaGeometry = new THREE.PlaneGeometry(3500, 3500);

          const planesConfig = [
            { pos: new THREE.Vector3(1200, 400, -800), mat: mat1 },
            { pos: new THREE.Vector3(-1200, -500, 800), mat: mat2 },
            { pos: new THREE.Vector3(-900, 900, -1000), mat: mat3 },
            { pos: new THREE.Vector3(900, -900, -900), mat: mat1 },
            { pos: new THREE.Vector3(300, 1200, 900), mat: mat2 },
            { pos: new THREE.Vector3(-300, -1200, -1000), mat: mat3 }
          ];

          planesConfig.forEach(({ pos, mat }) => {
            const mesh = new THREE.Mesh(nebulaGeometry, mat);
            mesh.position.copy(pos);
            mesh.lookAt(0, 0, 0);
            mesh.rotateZ(Math.random() * Math.PI * 2);
            spaceGroup.add(mesh);
          });
        } catch (err) {
          console.error('Error loading nebulae:', err);
        }
      };

      loadNebulae();

      return true;
    };

    if (!initThreeObjects()) {
      checkInterval = setInterval(() => {
        if (initThreeObjects()) {
          clearInterval(checkInterval);
        }
      }, 50);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      const scene = globeRef.current?.scene();
      if (scene) {
        if (shipGroupRef.current) scene.remove(shipGroupRef.current);
        if (spaceGroupRef.current) scene.remove(spaceGroupRef.current);
      }
      shipGroupRef.current = null;
      spaceGroupRef.current = null;
    };
  }, [globeReady]);

  // Sync custom space background visibility with selected theme
  useEffect(() => {
    if (spaceGroupRef.current) {
      const isLightMode = bgColor.toLowerCase() === '#ffffff' || selectedPresetKey === 'classicLight';
      spaceGroupRef.current.visible = !isLightMode;
    }
  }, [bgColor, selectedPresetKey]);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Position ship when not simulating
  useEffect(() => {
    if (isSimulating || !activeRoute || !shipGroupRef.current) {
      if (!activeRoute && shipGroupRef.current) shipGroupRef.current.visible = false;
      return;
    }

    const points3d = activeRoute.waypoints.map(wp => latLngToVector3(wp.lat, wp.lng, 100));
    const uniquePoints = getUniquePointsForSpline(points3d);
    const curve = new THREE.CatmullRomCurve3(uniquePoints);

    let t = simulationIndex / (activeRoute.waypoints.length - 1);
    t = sanitizeProgress(t);

    const pos = curve.getPointAt(t);
    const alt = 0.015 * Math.sin(t * Math.PI);
    const surfacePos = pos.clone().normalize().multiplyScalar(100 + alt * 100);
    shipGroupRef.current.position.copy(surfacePos);
    shipGroupRef.current.visible = true;

    const tangent = curve.getTangentAt(t);
    const up = surfacePos.clone().normalize();
    let forward = tangent.clone().normalize();
    if (isNaN(forward.x) || isNaN(forward.y) || isNaN(forward.z) || forward.lengthSq() < 0.1) {
      forward.set(0, 1, 0).projectOnPlane(up).normalize();
      if (forward.lengthSq() < 0.1) {
        forward.set(1, 0, 0).projectOnPlane(up).normalize();
      }
    }
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    const orthogForward = new THREE.Vector3().crossVectors(right, up).normalize();
    const matrix = new THREE.Matrix4().makeBasis(right, up, orthogForward);
    shipGroupRef.current.quaternion.setFromRotationMatrix(matrix);

    // Update HUD overlay element directly
    if (hudRef.current) {
      const latLng = cartesianToLatLng(surfacePos);
      hudRef.current.innerHTML = `
        SYSTEM_NAV: GL_3D_RENDERER_ACTIVE<br />
        POV_LAT: ${latLng.lat.toFixed(4)}<br />
        POV_LNG: ${latLng.lng.toFixed(4)}<br />
        ZOOM_FACTOR: ${(globeRef.current?.pointOfView()?.altitude || 2.5).toFixed(2)}x<br />
        PATH_NODES: ${activeRoute.waypoints.length}<br />
        CONTROL_POINTS: ${uniquePoints.length}<br />
        SPLINE_LENGTH: ${activeRoute.distanceNm} NM<br />
        VESSEL_PROGRESS: ${Math.round(t * 100)}%
      `;
    }
  }, [isSimulating, activeRoute, simulationIndex]);

  // requestAnimationFrame loop for continuous spline movement
  useEffect(() => {
    if (!isSimulating || !activeRoute || !shipGroupRef.current) return;

    const points3d = activeRoute.waypoints.map(wp => latLngToVector3(wp.lat, wp.lng, 100));
    const uniquePoints = getUniquePointsForSpline(points3d);
    const curve = new THREE.CatmullRomCurve3(uniquePoints);

    shipGroupRef.current.visible = true;

    const speedRef = { val: simSpeed };
    let currentT = simulationIndex / (activeRoute.waypoints.length - 1);
    currentT = sanitizeProgress(currentT);

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsLastTime = performance.now();
    let currentFps = 60; // Initial estimate
    let lastIndex = -1;
    let lastStateUpdateTime = 0;

    const updateShipVisuals = (progress: number) => {
      if (!shipGroupRef.current) return;
      const cleanProgress = sanitizeProgress(progress);
      const pos = curve.getPointAt(cleanProgress);
      const tangent = curve.getTangentAt(cleanProgress);
      const alt = 0.015 * Math.sin(cleanProgress * Math.PI);
      const surfacePos = pos.clone().normalize().multiplyScalar(100 + alt * 100);

      const up = surfacePos.clone().normalize();
      let forward = tangent.clone().normalize();
      if (isNaN(forward.x) || isNaN(forward.y) || isNaN(forward.z) || forward.lengthSq() < 0.1) {
        forward.set(0, 1, 0).projectOnPlane(up).normalize();
        if (forward.lengthSq() < 0.1) {
          forward.set(1, 0, 0).projectOnPlane(up).normalize();
        }
      }
      const right = new THREE.Vector3().crossVectors(up, forward).normalize();
      const orthogForward = new THREE.Vector3().crossVectors(right, up).normalize();
      const matrix = new THREE.Matrix4().makeBasis(right, up, orthogForward);
      shipGroupRef.current.quaternion.setFromRotationMatrix(matrix);
      shipGroupRef.current.position.copy(surfacePos);
    };

    const animate = () => {
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Calculate FPS
      frameCount++;
      if (now - fpsLastTime >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (now - fpsLastTime));
        frameCount = 0;
        fpsLastTime = now;
      }

      const baseDurationSeconds = 20.0;
      const speed = speedRef.val / baseDurationSeconds;

      currentT += delta * speed;
      currentT = sanitizeProgress(currentT);

      const currentCoord = cartesianToLatLng(curve.getPointAt(currentT));

      // Print debug logs in high-frequency console output
      console.log(`[SIMULATOR DEBUG] Path Nodes: ${activeRoute.waypoints.length} | Spline Control Points: ${uniquePoints.length} | Spline Length: ${activeRoute.distanceNm} NM | FPS: ${currentFps} | Progress: ${Math.round(currentT * 100)}%`);

      // Update HUD element directly in DOM to avoid React re-render lag
      if (hudRef.current) {
        hudRef.current.innerHTML = `
          SYSTEM_NAV: GL_3D_RENDERER_ACTIVE<br />
          POV_LAT: ${currentCoord.lat.toFixed(4)}<br />
          POV_LNG: ${currentCoord.lng.toFixed(4)}<br />
          ZOOM_FACTOR: ${(globeRef.current?.pointOfView()?.altitude || 2.5).toFixed(2)}x<br />
          PATH_NODES: ${activeRoute.waypoints.length}<br />
          CONTROL_POINTS: ${uniquePoints.length}<br />
          SPLINE_LENGTH: ${activeRoute.distanceNm} NM<br />
          SIM_FPS: ${currentFps}<br />
          VESSEL_PROGRESS: ${Math.round(currentT * 100)}%
        `;
      }

      if (currentT >= 1.0) {
        updateShipVisuals(1.0);
        setSimulationIndex(activeRoute.waypoints.length - 1);
        setShipPosition(activeRoute.waypoints[activeRoute.waypoints.length - 1]);
        setIsSimulating(false);
      } else {
        updateShipVisuals(currentT);

        const nearestIndex = Math.floor(currentT * (activeRoute.waypoints.length - 1));
        if (nearestIndex !== lastIndex) {
          lastIndex = nearestIndex;
          const nowMs = performance.now();
          // Throttle state updates to at most once every 150ms to eliminate React re-render lag
          if (nowMs - lastStateUpdateTime > 150) {
            lastStateUpdateTime = nowMs;
            setSimulationIndex(nearestIndex);
            setShipPosition(activeRoute.waypoints[nearestIndex]);
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, activeRoute, simSpeed]);

  // Set initial camera focus or react to port changes
  useEffect(() => {
    if (!globeRef.current) return;

    // Focus on active ship position during simulation
    if (isSimulating && shipPosition) {
      globeRef.current.pointOfView({
        lat: shipPosition.lat,
        lng: shipPosition.lng,
        altitude: 1.15
      }, 500);
      return;
    }

    // Focus on selected ports or routes
    if (selectedFromPort && selectedToPort) {
      const midLat = (selectedFromPort.coordinates.lat + selectedToPort.coordinates.lat) / 2;
      const midLng = (selectedFromPort.coordinates.lng + selectedToPort.coordinates.lng) / 2;
      
      const distance = Math.sqrt(
        Math.pow(selectedFromPort.coordinates.lat - selectedToPort.coordinates.lat, 2) +
        Math.pow(selectedFromPort.coordinates.lng - selectedToPort.coordinates.lng, 2)
      );
      const altitude = Math.max(1.3, Math.min(2.5, distance / 40));

      globeRef.current.pointOfView({
        lat: midLat,
        lng: midLng,
        altitude
      }, 1800);
    } else if (selectedFromPort) {
      globeRef.current.pointOfView({
        lat: selectedFromPort.coordinates.lat,
        lng: selectedFromPort.coordinates.lng,
        altitude: 1.5
      }, 1200);
    } else if (selectedToPort) {
      globeRef.current.pointOfView({
        lat: selectedToPort.coordinates.lat,
        lng: selectedToPort.coordinates.lng,
        altitude: 1.5
      }, 1200);
    }
  }, [selectedFromPort, selectedToPort, isSimulating, shipPosition]);

  // Adjust camera controls on mount
  useEffect(() => {
    if (!globeRef.current) return;
    
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = !selectedFromPort && !selectedToPort && !isSimulating;
      controls.autoRotateSpeed = 0.4;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
    }
  }, [selectedFromPort, selectedToPort, isSimulating]);

  // 1. HTML elements: Port Hubs, Checkpoints, Country Labels + Active Ship + Tactical Overlays
  const htmlElements: any[] = [
    ...ports.map(port => {
      const isSelected = selectedFromPort?.id === port.id || selectedToPort?.id === port.id;
      return {
        lat: port.coordinates.lat,
        lng: port.coordinates.lng,
        isSelected,
        isShip: false,
        isTactical: false,
        text: port.city,
        port: port
      };
    }),
    ...countryLabels
  ];

  if (isSimulating && shipPosition) {
    htmlElements.push({
      lat: shipPosition.lat,
      lng: shipPosition.lng,
      isSelected: false,
      isShip: true,
      isTactical: false,
      text: 'M/V BLUE ROTATION',
      port: null as any
    });
  }

  // 1.05 Add path drawing tip beacon (travels at the end of the drawing line)
  if (activeRoute && !isSimulating && animatedPathProgress < 1.0) {
    const fullCoords = activeRoute.waypoints;
    const currentIdx = Math.max(0, Math.min(fullCoords.length - 1, Math.floor(fullCoords.length * animatedPathProgress) - 1));
    const tipCoord = fullCoords[currentIdx];
    if (tipCoord) {
      const activeColor = getRouteColor(activeRoute.name, false);
      htmlElements.push({
        lat: tipCoord.lat,
        lng: tipCoord.lng,
        isSelected: false,
        isShip: false,
        isTactical: false,
        isPathTip: true,
        text: 'BEACON_LOCK',
        color: activeColor
      });
    }
  }

  // 1.1 Add Tactical Overlay Soft Zones (Weather, Piracy, Traffic)
  if (showWeather) {
    weatherZones.forEach(zone => {
      htmlElements.push({
        lat: zone.coordinates.lat,
        lng: zone.coordinates.lng,
        isSelected: false,
        isShip: false,
        isTactical: true,
        tacticalType: 'weather',
        text: zone.name,
        radiusKm: zone.radiusKm,
        severity: zone.severity
      });
    });
  }

  if (showPiracy) {
    riskZones.forEach(zone => {
      htmlElements.push({
        lat: zone.coordinates.lat,
        lng: zone.coordinates.lng,
        isSelected: false,
        isShip: false,
        isTactical: true,
        tacticalType: 'piracy',
        text: zone.name,
        radiusKm: zone.radiusKm,
        dangerLevel: zone.dangerLevel
      });
    });
  }

  if (showTraffic) {
    trafficCorridors.forEach(corridor => {
      htmlElements.push({
        lat: corridor.coordinates.lat,
        lng: corridor.coordinates.lng,
        isSelected: false,
        isShip: false,
        isTactical: true,
        tacticalType: 'traffic',
        text: corridor.name,
        density: corridor.density
      });
    });

    if (liveShips) {
      liveShips.forEach(ship => {
        htmlElements.push({
          lat: ship.lat,
          lng: ship.lng,
          isSelected: false,
          isShip: false,
          isLiveShip: true,
          text: ship.name,
          shipDetails: ship
        });
      });
    }
  }


  // 2. Paths (Lines): Background Shipping Network (Layer 1 - Very Low Opacity)
  const pathsData: any[] = [];
  rawShippingLanes.forEach(lane => {
    pathsData.push({
      coords: lane.map(p => ({ ...p, alt: 0.001 })), // faint blue background lane at low altitude
      color: 'rgba(29, 78, 216, 0.05)',
      width: 0.6
    });
  });

  // Render removed/invalid edges in debug mode
  if (showDebug && removedEdgesForDebug && removedEdgesForDebug.length > 0) {
    removedEdgesForDebug.forEach(edge => {
      pathsData.push({
        coords: [
          { lat: edge.from.lat, lng: edge.from.lng, alt: 0.005 },
          { lat: edge.to.lat, lng: edge.to.lng, alt: 0.005 }
        ],
        color: 'rgba(239, 68, 68, 0.45)', // red debug lines
        width: 1.0,
        dashLength: 0.02,
        dashGap: 0.02,
        dashAnimateTime: 0
      });
    });
  }

  // 3. Paths for Generated Route Options (Layer 2 - Active and inactive calculated routes)
  if (activeRoute && activeRoute.waypoints.length > 0) {
    const activeColor = getRouteColor(activeRoute.name, false);
    const activeFaintColor = getRouteColor(activeRoute.name, true, 0.4);

    if (isSimulating) {
      // Split active route into travelled and remaining parts
      const travelledWaypoints = activeRoute.waypoints.slice(0, simulationIndex + 1);
      const remainingWaypoints = activeRoute.waypoints.slice(simulationIndex);

      if (travelledWaypoints.length >= 2) {
        pathsData.push({
          coords: travelledWaypoints.map((p, idx) => {
            const alt = 0.015 * Math.sin((idx / (activeRoute.waypoints.length - 1)) * Math.PI);
            return { ...p, alt };
          }),
          color: activeColor, // Bold Brutalist Mode Color for active route
          width: 3.5, // bold travelled path
          dashLength: 0.0,
          dashGap: 0.0,
          dashAnimateTime: 0
        });
      }

      if (remainingWaypoints.length >= 2) {
        pathsData.push({
          coords: remainingWaypoints.map((p, idx) => {
            const absoluteIdx = simulationIndex + idx;
            const alt = 0.015 * Math.sin((absoluteIdx / (activeRoute.waypoints.length - 1)) * Math.PI);
            return { ...p, alt };
          }),
          color: activeFaintColor, // semi-transparent remaining path
          width: 2.0,
          dashLength: 0.04,
          dashGap: 0.02,
          dashAnimateTime: 1200 // moving dash effect for remaining path
        });
      }
    } else {
      // Just show the selected active route as a solid static line, sliced by progress
      const fullCoords = activeRoute.waypoints.map((p, idx) => {
        const alt = 0.015 * Math.sin((idx / (activeRoute.waypoints.length - 1)) * Math.PI);
        return { ...p, alt };
      });
      const sliceEnd = Math.max(2, Math.floor(fullCoords.length * animatedPathProgress));
      const slicedCoords = fullCoords.slice(0, sliceEnd);

      pathsData.push({
        coords: slicedCoords,
        color: activeColor, // Dynamic color
        width: 3.0,
        dashLength: 0.0,
        dashGap: 0.0,
        dashAnimateTime: 0
      });
    }

    // Show other generated routes as faint comparison lines
    generatedRoutes.forEach(route => {
      if (route.id !== activeRouteId) {
        pathsData.push({
          coords: route.waypoints.map((p, idx) => {
            const alt = 0.015 * Math.sin((idx / (route.waypoints.length - 1)) * Math.PI);
            return { ...p, alt };
          }),
          color: getRouteColor(route.name, true, 0.25), // semi-transparent mode color
          width: 1.5,
          dashLength: 0.02,
          dashGap: 0.02,
          dashAnimateTime: 0
        });
      }
    });
  }

  return (
    <div ref={containerRef} className="relative h-full w-full cursor-grab active:cursor-grabbing">
      {/* Background Radar Grid Sweep Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 border border-slate-900/10">
        {/* Top-left high-tech HUD grid lines */}
        <div ref={hudRef} className="absolute top-4 left-4 font-mono text-[9px] text-slate-500 tracking-wider">
          SYSTEM_NAV: GL_3D_RENDERER_ACTIVE<br />
          POV_LAT: {selectedFromPort ? selectedFromPort.coordinates.lat.toFixed(4) : 'Auto'}<br />
          POV_LNG: {selectedFromPort ? selectedFromPort.coordinates.lng.toFixed(4) : 'Auto'}<br />
          ZOOM_FACTOR: {(globeRef.current?.pointOfView()?.altitude || 2.5).toFixed(2)}x
        </div>

        {/* Center Grid sweep screen mask for command aesthetics */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: bgColor.toLowerCase() === '#ffffff'
              ? 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(248, 250, 252, 0.8) 85%)'
              : selectedPresetKey === 'midnight'
                ? 'radial-gradient(ellipse at center, rgba(7, 10, 19, 0) 0%, rgba(7, 10, 19, 0.6) 85%)'
                : (() => {
                    const rgb = hexToRgb(bgColor) || { r: 7, g: 10, b: 19 };
                    return `radial-gradient(ellipse at center, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85) 85%)`;
                  })()
          }}
        ></div>
        
        {/* High-tech sweep line */}
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-900/5"></div>
        <div className="absolute left-0 top-1/2 w-full h-[1px] bg-slate-900/5"></div>
      </div>

      {/* 3D Globe Component */}
      <GlobeComponent
        ref={(el: any) => { globeRef.current = el; if (el && !globeReady) setGlobeReady(true); }}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(255, 255, 255, 0)" // fully transparent
        backgroundImageUrl={undefined}
        globeMaterial={globeMaterial}
        showAtmosphere={false}
        showGraticules={true}
        
        // Polygons (Countries - Solid Grey with White Borders)
        polygonsData={countries}
        polygonAltitude={0.005}
        polygonCapColor={(d: any) => {
          const iso = d.properties?.ISO_A3;
          if (iso === 'ATA' || iso === 'GRL') {
            return '#ffffff'; // Antarctica & Greenland always remain white ice sheets
          }
          return landColor;
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
        polygonStrokeColor={() => '#000000'} // black borders
        polygonStrokeWidth={0.5}
        
        // HTML Markers (Ports + Ship)
        htmlElementsData={htmlElements}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlElement={(d: any) => {
          if (d.isCountry) {
            const el = document.createElement('div');
            el.className = 'select-none pointer-events-none text-center font-serif italic';
            el.style.fontFamily = 'Georgia, serif';
            el.style.fontStyle = 'italic';
            el.style.color = textColor;
            el.style.letterSpacing = '0.08em';
            el.style.whiteSpace = 'nowrap';
            el.style.fontSize = '12px';
            el.style.fontWeight = '500';
            el.innerText = d.name;

            const size = d.size || 1.0;
            const rotation = d.name.length > 8 ? -15 : 0;
            el.style.transform = `scale(${size}) rotate(${rotation}deg)`;

            const isLightColor = (colorStr: string) => {
              let cleaned = colorStr.replace('#', '').trim();
              if (cleaned.length === 3) {
                cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
              }
              if (cleaned.length !== 6) return true;
              const r = parseInt(cleaned.substring(0, 2), 16) || 0;
              const g = parseInt(cleaned.substring(2, 4), 16) || 0;
              const b = parseInt(cleaned.substring(4, 6), 16) || 0;
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              return brightness > 128;
            };
            const shadowColor = isLightColor(textColor) ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)';
            el.style.textShadow = `
              -1px -1px 0 ${shadowColor},  
               1px -1px 0 ${shadowColor},
              -1px  1px 0 ${shadowColor},
               1px  1px 0 ${shadowColor},
              -2px  0px 0 ${shadowColor},
               2px  0px 0 ${shadowColor},
               0px -2px 0 ${shadowColor},
               0px  2px 0 ${shadowColor}
            `;

            return el;
          }

          if (d.isPathTip) {
            const el = document.createElement('div');
            el.className = 'relative flex items-center justify-center select-none pointer-events-none';
            
            const pulse = document.createElement('div');
            pulse.className = 'absolute w-6 h-6 rounded-full animate-ping border-2';
            pulse.style.borderColor = d.color;
            pulse.style.backgroundColor = `${d.color}22`;
            pulse.style.animationDuration = '1s';
            
            const core = document.createElement('div');
            core.className = 'w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]';
            core.style.backgroundColor = '#ffffff';
            core.style.border = `2px solid ${d.color}`;
            
            el.appendChild(pulse);
            el.appendChild(core);
            return el;
          }

          const el = document.createElement('div');
          
          if (d.isTactical) {
            // Render as a soft, fog-type circle!
            el.className = 'flex flex-col items-center justify-center select-none pointer-events-none';
            
            const circle = document.createElement('div');
            
            // Map the radiusKm or density to a reasonable CSS size (e.g. 50px to 120px)
            let sizePx = 60;
            if (d.tacticalType === 'weather') {
              // Weather zones are large (Blue soft fog)
              sizePx = Math.round((d.radiusKm || 800) / 8);
              circle.className = 'rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.45)_0%,rgba(37,99,235,0)_70%)] blur-[2px]';
            } else if (d.tacticalType === 'piracy') {
              // Piracy zones are medium (Red soft fog)
              sizePx = Math.round((d.radiusKm || 600) / 6);
              circle.className = 'rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.5)_0%,rgba(220,38,38,0)_70%)] blur-[2px]';
            } else if (d.tacticalType === 'traffic') {
              // Traffic zones are smaller (Orange/Amber soft fog)
              sizePx = Math.round((d.density || 0.8) * 80);
              circle.className = 'rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.5)_0%,rgba(234,88,12,0)_70%)] blur-[2px]';
            }
            
            circle.style.width = `${sizePx}px`;
            circle.style.height = `${sizePx}px`;
            el.appendChild(circle);

            // Add a very small, clean tactical label underneath
            const label = document.createElement('div');
            label.style.marginTop = '4px';
            label.style.padding = '1px 4px';
            label.style.fontSize = '8px';
            label.style.fontFamily = 'monospace';
            label.style.fontWeight = 'bold';
            label.style.border = '1px solid var(--panel-border)';
            label.style.backgroundColor = 'var(--panel-bg)';
            label.style.color = 'var(--text-main)';
            label.style.textTransform = 'uppercase';
            label.style.whiteSpace = 'nowrap';
            label.style.opacity = '0.9';
            label.style.transform = 'scale(0.75)';
            label.innerText = d.text;
            el.appendChild(label);
            
            return el;
          }

          if (d.isLiveShip) {
            el.className = 'flex flex-col items-center select-none font-mono';
            
            const pointer = document.createElement('div');
            pointer.className = 'w-3 h-3 bg-emerald-500 border border-slate-900 shadow-[1px_1px_0px_#0f172a]';
            pointer.style.transform = `rotate(${d.shipDetails.heading}deg)`;
            pointer.style.clipPath = 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)';
            el.appendChild(pointer);

            const label = document.createElement('div');
            label.style.marginTop = '2px';
            label.style.padding = '1px 2px';
            label.style.fontSize = '7.5px';
            label.style.fontFamily = 'monospace';
            label.style.fontWeight = 'bold';
            label.style.border = '1px solid var(--panel-border)';
            label.style.backgroundColor = 'var(--panel-bg)';
            label.style.color = 'var(--text-main)';
            label.style.textTransform = 'uppercase';
            label.style.whiteSpace = 'nowrap';
            label.style.opacity = '0.9';
            label.style.transform = 'scale(0.75)';
            label.innerText = `${d.text} (${d.shipDetails.speed} kts)`;
            el.appendChild(label);

            el.title = `MMSI: ${d.shipDetails.mmsi}\nHeading: ${d.shipDetails.heading}°\nSpeed: ${d.shipDetails.speed} kts\nDestination: ${d.shipDetails.destination}\nStatus: ${d.shipDetails.status}`;
            
            return el;
          }

          el.className = 'flex flex-col items-center select-none font-mono';
          
          if (d.isShip) {
            // Ship Label: Bold Blue Box with white text
            const label = document.createElement('div');
            label.className = 'px-1.5 py-0.5 text-[9px] font-extrabold border-2 border-slate-900 bg-brand-glow text-white shadow-[2px_2px_0px_#0f172a] uppercase whitespace-nowrap';
            label.innerText = d.text;
            el.appendChild(label);
          } else {
            // Dot marker
            const dot = document.createElement('div');
            if (d.isSelected) {
              // Selected ports: pure white dots with thick deep-blue borders
              dot.className = 'w-3.5 h-3.5 rounded-full bg-white border-[3px] border-brand-sky shadow-[1.5px_1.5px_0px_#0f172a]';
            } else if (d.port.type === 'hub') {
              // Standard ports: clean solid blue pointers (#2563eb)
              dot.className = 'w-2.5 h-2.5 rounded-full bg-brand-glow border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]';
            } else {
              // Checkpoints: navy pointers (#1e3a8a)
              dot.className = 'w-1.5 h-1.5 rounded-full bg-[#1e3a8a] border border-slate-900';
            }
            el.appendChild(dot);

            // Label (only for hubs or selected ports to keep it clean)
            if (d.isSelected || d.port.type === 'hub') {
              const label = document.createElement('div');
              label.className = 'mt-1 px-1 py-0.5 text-[8.5px] font-bold border-2 border-slate-900 bg-white text-slate-900 shadow-[1px_1px_0px_#0f172a] uppercase whitespace-nowrap';
              label.innerText = d.text;
              el.appendChild(label);
            }
          }

          // Add click listener
          if (!d.isShip) {
            el.style.cursor = 'pointer';
            el.onclick = (e) => {
              e.stopPropagation();
              onPortSelect(d.port);
            };
          }
          
          return el;
        }}
        
        // Paths (Sea Lanes + Generated Routes)
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p: any) => p.lat}
        pathPointLng={(p: any) => p.lng}
        pathPointAlt={(p: any) => p.alt !== undefined ? p.alt : 0.001}
        pathColor={(d: any) => d.color}
        pathStroke={(d: any) => d.width}
        pathDashLength={(d: any) => d.dashLength}
        pathDashGap={(d: any) => d.dashGap}
        pathDashAnimateTime={(d: any) => d.dashAnimateTime}
      />
    </div>
  );
}
