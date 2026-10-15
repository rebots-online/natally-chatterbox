import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { bindTorusTouch, getTorusZoomDistance } from '../services/torusGestures';
import { NatalChartResult, ZODIAC_SIGNS } from '../services/ephemeris';

interface Astrolabe3DProps {
  chart: NatalChartResult;
  isSpinning: boolean;
  resetTrigger: number;
  selectedComponents?: string[];
  highlightedComponents?: string[];
  onToggleComponent?: (id: string, isMulti: boolean) => void;
  selectedPlanetName?: string | null;
  onSelectPlanet?: (name: string | null) => void;
}

export const Astrolabe3D: React.FC<Astrolabe3DProps> = ({
  chart,
  isSpinning,
  resetTrigger,
  selectedComponents = [],
  highlightedComponents = [],
  onToggleComponent,
  selectedPlanetName,
  onSelectPlanet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wheelGroupRef = useRef<THREE.Group | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const isSpinningRef = useRef(isSpinning);

  // Active selection list (combines selectedComponents and selectedPlanetName)
  const activeSelections = useMemo(() => Array.from(
    new Set([
      ...selectedComponents,
      ...(selectedPlanetName ? [selectedPlanetName] : []),
      ...highlightedComponents,
      ...chart.natalBodies.filter(body => highlightedComponents.includes(`House ${body.house}`)).map(body => body.name),
      ...chart.aspectChords.filter(aspect => highlightedComponents.includes(aspect.name)).flatMap(aspect => [aspect.from, aspect.to]),
    ])
  ), [chart, selectedComponents.join('\0'), selectedPlanetName, highlightedComponents.join('\0')]);
  const activeSelectionsRef = useRef(activeSelections);
  activeSelectionsRef.current = activeSelections;
  const toggleComponentRef = useRef(onToggleComponent);
  toggleComponentRef.current = onToggleComponent;
  const selectPlanetRef = useRef(onSelectPlanet);
  selectPlanetRef.current = onSelectPlanet;

  // Realistic Momentum Physics Variables
  const velocityYRef = useRef(0.00022);
  const velocityXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const prevPointerYRef = useRef(0);
  const lastDeltaXRef = useRef(0);
  const lastDeltaYRef = useRef(0);
  const lastMoveTimeRef = useRef(0);

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  useEffect(() => {
    if (resetTrigger > 0 && wheelGroupRef.current && cameraRef.current) {
      wheelGroupRef.current.rotation.set(0.38, 0, -0.02);
      cameraRef.current.position.set(0, 5.8, 5.2);
      cameraRef.current.lookAt(0, -0.15, 0);
      velocityYRef.current = 0.00022;
      velocityXRef.current = 0;
    }
  }, [resetTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth || 1200;
    const height = container.clientHeight || window.innerHeight || 800;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 5.8, 5.2);
    camera.lookAt(0, -0.15, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    // Pinch belongs to the torus, not the page: without touch-action:none
    // Android Chrome hijacks the pinch for whole-screen zoom.
    renderer.domElement.style.touchAction = 'none';
    rendererRef.current = renderer;

    let tooltipEl = document.getElementById('astrolabe-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'astrolabe-tooltip';
      tooltipEl.style.position = 'fixed';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.zIndex = '9999';
      tooltipEl.style.transition = 'opacity 0.15s ease, transform 0.1s ease';
      tooltipEl.style.opacity = '0';
      tooltipEl.style.transform = 'translate(-50%, -115%)';
      tooltipEl.style.backgroundColor = 'rgba(20, 13, 33, 0.94)';
      tooltipEl.style.backdropFilter = 'blur(16px)';
      tooltipEl.style.border = '1px solid rgba(212, 175, 55, 0.7)';
      tooltipEl.style.boxShadow =
        '0 16px 36px -5px rgba(0, 0, 0, 0.8), 0 0 24px rgba(212, 175, 55, 0.35)';
      tooltipEl.style.borderRadius = '12px';
      tooltipEl.style.padding = '12px 16px';
      tooltipEl.style.color = '#f5eedc';
      tooltipEl.style.fontFamily = '"IBM Plex Mono", monospace';
      tooltipEl.style.fontSize = '12px';
      tooltipEl.style.maxWidth = '320px';
      tooltipEl.style.lineHeight = '1.45';
      document.body.appendChild(tooltipEl);
    }

    // Warm specular multi-point lighting
    const ambientLight = new THREE.AmbientLight(0xfff3d6, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffe6a3, 3.4);
    keyLight.position.set(6, 10, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9fc0ff, 2.0);
    fillLight.position.set(-6, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf2a38c, 2.2);
    rimLight.position.set(0, -7, 5);
    scene.add(rimLight);

    const glintPoint1 = new THREE.PointLight(0xffe38f, 2.8, 30);
    glintPoint1.position.set(2, 6, 4);
    scene.add(glintPoint1);

    const glintPoint2 = new THREE.PointLight(0x67e8f9, 1.6, 25);
    glintPoint2.position.set(-4, 3, 2);
    scene.add(glintPoint2);

    const wheelGroup = new THREE.Group();
    wheelGroup.rotation.x = 0.38;
    wheelGroup.rotation.z = -0.02;
    scene.add(wheelGroup);
    wheelGroupRef.current = wheelGroup;

    // Google Stitch Thick Doughnut Torus System
    const R_TORUS_TRACK = 2.05;
    const R_TORUS_TUBE = 0.38;
    const R_HOUSE_INNER = 1.08;
    const R_CENTER_RETICLE = 0.18;

    const torusGeo = new THREE.TorusGeometry(R_TORUS_TRACK, R_TORUS_TUBE, 48, 160);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f1430,
      emissive: 0x11071c,
      roughness: 0.16,
      metalness: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95,
      ior: 1.55,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.rotation.x = Math.PI / 2;
    torusMesh.position.y = 0;
    wheelGroup.add(torusMesh);

    // Beveled brass rims
    const outerBezelGeo = new THREE.TorusGeometry(R_TORUS_TRACK + R_TORUS_TUBE, 0.032, 24, 160);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xdfb43a,
      roughness: 0.22,
      metalness: 0.92,
    });
    const outerBezel = new THREE.Mesh(outerBezelGeo, brassMat);
    outerBezel.rotation.x = Math.PI / 2;
    outerBezel.position.y = 0.02;
    wheelGroup.add(outerBezel);

    const innerBezelGeo = new THREE.TorusGeometry(R_TORUS_TRACK - R_TORUS_TUBE, 0.032, 24, 160);
    const innerBezel = new THREE.Mesh(innerBezelGeo, brassMat);
    innerBezel.rotation.x = Math.PI / 2;
    innerBezel.position.y = 0.02;
    wheelGroup.add(innerBezel);

    // Inner Sanctuary Floor Disc
    const discGeo = new THREE.CircleGeometry(R_TORUS_TRACK - R_TORUS_TUBE - 0.01, 80);
    const discMat = new THREE.MeshPhysicalMaterial({
      color: 0x140a22,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = Math.PI / 2;
    discMesh.position.y = 0.01;
    wheelGroup.add(discMesh);

    // Concentric Guide Rings
    [R_HOUSE_INNER, 1.48, 0.65].forEach((radius) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.006, radius + 0.006, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.02;
      wheelGroup.add(ringMesh);
    });

    const dynamicGroup = new THREE.Group();
    wheelGroup.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isHovered = false;

    // Momentum interaction handlers
    const startDrag = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      prevPointerXRef.current = clientX;
      prevPointerYRef.current = clientY;
      lastDeltaXRef.current = 0;
      lastDeltaYRef.current = 0;
      lastMoveTimeRef.current = performance.now();
    };

    const updateDrag = (clientX: number, clientY: number) => {
      const now = performance.now();
      if (isDraggingRef.current && wheelGroupRef.current) {
        const dx = clientX - prevPointerXRef.current;
        const dy = clientY - prevPointerYRef.current;
        const dt = Math.max(1, now - lastMoveTimeRef.current);

        wheelGroupRef.current.rotation.y += dx * 0.0065;
        wheelGroupRef.current.rotation.x = Math.max(
          -0.55,
          Math.min(1.15, wheelGroupRef.current.rotation.x + dy * 0.0055)
        );

        const instVelX = (dx / dt) * 16;
        const instVelY = (dy / dt) * 16;
        lastDeltaXRef.current = lastDeltaXRef.current * 0.4 + instVelX * 0.6;
        lastDeltaYRef.current = lastDeltaYRef.current * 0.4 + instVelY * 0.6;

        prevPointerXRef.current = clientX;
        prevPointerYRef.current = clientY;
        lastMoveTimeRef.current = now;
      }
    };

    const endDrag = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        velocityYRef.current = Math.max(-0.06, Math.min(0.06, lastDeltaXRef.current * 0.0035));
        velocityXRef.current = Math.max(-0.04, Math.min(0.04, lastDeltaYRef.current * 0.0025));
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (touchBinding.suppressMouse()) return;
      const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
      if (
        elementUnderPointer &&
        elementUnderPointer !== renderer.domElement &&
        elementUnderPointer !== containerRef.current &&
        !renderer.domElement.contains(elementUnderPointer)
      ) {
        return;
      }
      startDrag(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      if (touchBinding.suppressMouse()) return;
      endDrag();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (touchBinding.suppressMouse()) return;
      if (isDraggingRef.current) {
        updateDrag(event.clientX, event.clientY);
        return;
      }

      // Guard: If cursor is over any modal, card, panel, button, or menu on top of the canvas,
      // hide the astrolabe tooltip immediately and do not process raycasting
      const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
      if (
        elementUnderPointer &&
        elementUnderPointer !== renderer.domElement &&
        elementUnderPointer !== containerRef.current &&
        !renderer.domElement.contains(elementUnderPointer)
      ) {
        isHovered = false;
        renderer.domElement.style.cursor = 'default';
        if (tooltipEl) {
          tooltipEl.style.opacity = '0';
        }
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      updateDrag(event.clientX, event.clientY);

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, false);

      if (intersects.length > 0 && !isDraggingRef.current) {
        const data = intersects[0].object.userData;
        isHovered = true;
        renderer.domElement.style.cursor = 'pointer';

        if (tooltipEl) {
          const isSelected = activeSelectionsRef.current.includes(data.componentId || data.planetName);
          const selectHint = 'Shift/Ctrl-click to toggle multi-selection';

          tooltipEl.innerHTML = `
            <div style="font-size: 9px; letter-spacing: 0.14em; color: ${data.accent}; font-weight: 700; margin-bottom: 3px; text-transform: uppercase;">
              ${data.category} ${isSelected ? '★ SELECTED' : ''}
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; font-family: 'Cinzel', serif;">
              ${data.title}
            </div>
            <div style="font-size: 11px; color: #c4bcd0; line-height: 1.4; margin-bottom: 4px;">
              ${data.detail}
            </div>
            <div style="font-size: 9px; color: #f2ca50; font-family: monospace;">
              ✦ ${selectHint}
            </div>
          `;
          tooltipEl.style.left = `${event.clientX}px`;
          tooltipEl.style.top = `${event.clientY}px`;
          tooltipEl.style.opacity = '1';
        }
      } else {
        isHovered = false;
        renderer.domElement.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        if (tooltipEl) {
          tooltipEl.style.opacity = '0';
        }
      }
    };

    const zoom = (factor: number) => {
      const distance = camera.position.length();
      camera.position.multiplyScalar(getTorusZoomDistance(distance, factor) / distance);
      camera.lookAt(0, -0.15, 0);
    };
    const touchBinding = bindTorusTouch(renderer.domElement, {
      start: (x, y) => {
        isHovered = false;
        if (tooltipEl) tooltipEl.style.opacity = '0';
        startDrag(x, y);
      },
      move: updateDrag,
      end: (allowMomentum) => {
        endDrag();
        if (!allowMomentum) {
          velocityXRef.current = 0;
          velocityYRef.current = 0;
        }
      },
      zoom,
    });

    // Click handler with Shift-Click / Ctrl-Click Multi-Selection
    const onClick = (event: MouseEvent) => {
      if (touchBinding.suppressClick()) return;
      const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
      if (
        elementUnderPointer &&
        elementUnderPointer !== renderer.domElement &&
        elementUnderPointer !== containerRef.current &&
        !renderer.domElement.contains(elementUnderPointer)
      ) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, false);

      if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        const componentId =
          data.componentId || data.planetName || data.houseName || data.aspectName || data.title;

        const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

        if (toggleComponentRef.current && componentId) {
          toggleComponentRef.current(componentId, isMulti);
        } else if (selectPlanetRef.current && data.planetName) {
          selectPlanetRef.current(data.planetName);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? 1.05 : 0.95);
    };

    const onMouseLeave = () => {
      if (touchBinding.suppressMouse()) return;
      isHovered = false;
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'default';
      if (tooltipEl) {
        tooltipEl.style.opacity = '0';
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('mouseleave', onMouseLeave);

    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      if (wheelGroupRef.current) {
        if (!isDraggingRef.current && !isHovered) {
          wheelGroupRef.current.rotation.y += velocityYRef.current;
          wheelGroupRef.current.rotation.x += velocityXRef.current;

          wheelGroupRef.current.rotation.x = Math.max(
            -0.55,
            Math.min(1.15, wheelGroupRef.current.rotation.x)
          );

          const baseSpin = isSpinningRef.current ? 0.00022 : 0;
          velocityYRef.current =
            velocityYRef.current * 0.972 + baseSpin * 0.028;
          velocityXRef.current *= 0.94;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth || 1200;
      const h = container.clientHeight || window.innerHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      touchBinding.dispose();
      domEl.removeEventListener('click', onClick);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (tooltipEl && tooltipEl.parentNode) {
        tooltipEl.parentNode.removeChild(tooltipEl);
      }
    };
  }, []);

  // Update dynamic chart items on the 3D astrolabe
  useEffect(() => {
    const dynamicGroup = dynamicGroupRef.current;
    if (!dynamicGroup) return;

    while (dynamicGroup.children.length > 0) {
      const child = dynamicGroup.children[0];
      dynamicGroup.remove(child);
    }
    interactiveObjectsRef.current = [];

    const R_TORUS_TRACK = 2.05;
    const R_TORUS_TUBE = 0.38;
    const Y_SUPERIMPOSED = R_TORUS_TUBE + 0.02;
    const R_PLANETS_TRACK = 1.50;
    const R_HOUSE_INNER = 1.08;

    const ASC_LON = chart.ascLon;

    function lonToRad(lon: number): number {
      const diff = (lon - ASC_LON + 360) % 360;
      return Math.PI - (diff * Math.PI) / 180;
    }

    function createGlyphSprite(
      text: string,
      subText: string,
      colorHex: string,
      scale = 0.36,
      isHighlighted = false
    ): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 128, 128);

      // 1. Christmas bauble golden metallic hanger crown & loop at top
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(57, 4, 14, 10);
      ctx.beginPath();
      ctx.arc(64, 5, 5, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffe57f';
      ctx.stroke();

      // 2. Bold, rich jewel-toned Christmas bauble spherical disc base
      ctx.beginPath();
      ctx.arc(64, 52, 42, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? '#fef08a' : colorHex;
      ctx.fill();

      // 3. Outer golden metallic ornament rim
      ctx.lineWidth = isHighlighted ? 5 : 3.5;
      ctx.strokeStyle = isHighlighted ? '#ffffff' : '#ffd875';
      ctx.stroke();

      // 4. Spherical radial gloss specular highlight (Christmas bauble glass reflection)
      const grad = ctx.createRadialGradient(48, 38, 4, 64, 52, 42);
      grad.addColorStop(0, 'rgba(255,255,255,0.72)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.22)');
      grad.addColorStop(0.75, 'rgba(0,0,0,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0.58)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 52, 42, 0, Math.PI * 2);
      ctx.fill();

      // 5. High-contrast symbol: Dark glyph surrounded by a crisp thin light border
      ctx.font = 'bold 54px "Cinzel", "Cinzel Decorative", "Times New Roman", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Crisp thin light/white border for immediate visual pop on any background
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(text, 64, 52);

      // Deep bold dark glyph fill for maximum contrast
      ctx.fillStyle = '#080214'; // deep dark cosmic ink
      ctx.fillText(text, 64, 52);

      // Subtext degree text with high-contrast dual outline
      if (subText) {
        ctx.font = 'bold 20px "IBM Plex Mono", monospace';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#05020a';
        ctx.strokeText(subText, 64, 108);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(subText, 64, 108);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(mat);
      const finalScale = isHighlighted ? scale * 1.3 : scale;
      sprite.scale.set(finalScale, finalScale, 1);
      return sprite;
    }

    // 0. GEOCENTRIC CENTER: 🜨 EARTH (TERRA) FOCAL OBSERVER
    // In classic astrolabes and geocentric natal charts, the center is the observer on Earth.
    const R_CENTER_RETICLE = 0.22;
    const earthGeo = new THREE.SphereGeometry(R_CENTER_RETICLE, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x228be6, // Celestial Earth ocean azure
      emissive: 0x0c325c,
      emissiveIntensity: 0.5,
      metalness: 0.85,
      roughness: 0.2,
    });
    const earthSphere = new THREE.Mesh(earthGeo, earthMat);
    earthSphere.position.set(0, 0.05, 0);
    dynamicGroup.add(earthSphere);

    // Gold Equatorial Ring around Earth
    const earthRingGeo = new THREE.TorusGeometry(0.26, 0.012, 16, 48);
    const earthRingMat = new THREE.MeshStandardMaterial({
      color: 0xf2ca50,
      emissive: 0xd4af37,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.15,
    });
    const earthRing = new THREE.Mesh(earthRingGeo, earthRingMat);
    earthRing.rotation.x = Math.PI / 2;
    earthRing.position.set(0, 0.05, 0);
    dynamicGroup.add(earthRing);

    // Floating Billboard Label above Earth Center
    const isEarthSelected = activeSelections.includes('Earth') || activeSelections.includes('Earth (Geocentric Origin)');
    const earthSprite = createGlyphSprite('🜨', 'Earth', '#38bdf8', 0.36, isEarthSelected);
    earthSprite.position.set(0, 0.36, 0);
    dynamicGroup.add(earthSprite);

    // Interactive Hit Sphere for Earth Origin (Tested first)
    const hitEarth = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitEarth.position.set(0, 0.05, 0);
    hitEarth.userData = {
      componentId: 'Earth (Geocentric Origin)',
      planetName: 'Earth',
      title: '🜨 Earth (Terra) · Geocentric Origin',
      category: 'ASTROLABE FOCAL ORIGIN',
      detail: `The observer’s natal vantage point on Earth at ${chart.input.placeName || 'birthplace'}. In geocentric natal astrology, the entire celestial sphere, houses, and planetary spheres revolve around this terrestrial focal point.`,
      accent: '#38bdf8',
    };
    dynamicGroup.add(hitEarth);
    interactiveObjectsRef.current.push(hitEarth);

    // 1. ZODIAC SIGNS (Superimposed on torus)
    ZODIAC_SIGNS.forEach((sign) => {
      const cuspRad = lonToRad(sign.lon);
      const tickGeo = new THREE.CylinderGeometry(0.012, 0.012, R_TORUS_TUBE * 1.8, 8);
      const tickMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(
        Math.cos(cuspRad) * R_TORUS_TRACK,
        Y_SUPERIMPOSED,
        Math.sin(cuspRad) * R_TORUS_TRACK
      );
      tick.rotation.z = Math.PI / 2;
      tick.rotation.y = -cuspRad;
      dynamicGroup.add(tick);

      const centerRad = lonToRad(sign.lon + 15);
      const zx = Math.cos(centerRad) * R_TORUS_TRACK;
      const zz = Math.sin(centerRad) * R_TORUS_TRACK;
      const isSelected = activeSelections.includes(sign.name);

      const zSprite = createGlyphSprite(sign.glyph, '', '#f5d77f', 0.32, isSelected);
      zSprite.position.set(zx, Y_SUPERIMPOSED + 0.1, zz);
      dynamicGroup.add(zSprite);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.position.set(zx, Y_SUPERIMPOSED + 0.08, zz);
      hitMesh.userData = {
        componentId: sign.name,
        title: `${sign.name} (${sign.glyph})`,
        category: 'ZODIAC SIGN',
        detail: `${sign.element} · ${sign.modality} · ${sign.desc}`,
        accent: '#f2ca50',
      };
      dynamicGroup.add(hitMesh);
      interactiveObjectsRef.current.push(hitMesh);
    });

    // 2. HOUSE CUSPS & SPOKES
    chart.houseCusps.forEach((h) => {
      const rad = lonToRad(h.lon);
      const isCardo = h.isCardo;
      const houseId = `House ${h.num}`;
      const isSelected = activeSelections.includes(houseId) || activeSelections.includes(h.label);

      const xInner = Math.cos(rad) * R_HOUSE_INNER;
      const zInner = Math.sin(rad) * R_HOUSE_INNER;
      const xOuter = Math.cos(rad) * (R_TORUS_TRACK - R_TORUS_TUBE);
      const zOuter = Math.sin(rad) * (R_TORUS_TRACK - R_TORUS_TUBE);

      const spokeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xInner, 0.025, zInner),
        new THREE.Vector3(xOuter, 0.025, zOuter),
      ]);
      const spokeMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffdf80 : isCardo ? 0xf2ca50 : 0x7c6999,
        linewidth: isSelected ? 4 : isCardo ? 3 : 1,
        transparent: true,
        opacity: isSelected ? 1.0 : isCardo ? 0.95 : 0.45,
      });
      const spokeLine = new THREE.Line(spokeGeo, spokeMat);
      dynamicGroup.add(spokeLine);

      // Cusp Badge
      const badgeR = R_TORUS_TRACK - R_TORUS_TUBE - 0.12;
      const badgeX = Math.cos(rad) * badgeR;
      const badgeZ = Math.sin(rad) * badgeR;

      const badgeSprite = createGlyphSprite(
        h.label,
        h.formattedDeg.split(' ')[0],
        isSelected ? '#fff' : isCardo ? '#f2ca50' : '#d4af37',
        isSelected ? 0.35 : isCardo ? 0.3 : 0.24,
        isSelected || isCardo
      );
      badgeSprite.position.set(badgeX, 0.08, badgeZ);
      dynamicGroup.add(badgeSprite);

      const hitCusp = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitCusp.position.set(badgeX, 0.08, badgeZ);
      hitCusp.userData = {
        componentId: houseId,
        houseName: houseId,
        title: h.title,
        category: isCardo ? 'CARDINAL ANGLE (CARDO)' : 'HOUSE CUSP',
        detail: `${h.desc} · Cusp at ${h.formattedDeg}`,
        accent: isCardo ? '#f2ca50' : '#d4af37',
      };
      dynamicGroup.add(hitCusp);
      interactiveObjectsRef.current.push(hitCusp);

      // House Number in Sector Center
      const nextH = chart.houseCusps.find((nc) => nc.num === (h.num % 12) + 1);
      const nextLon = nextH ? nextH.lon : (h.lon + 30) % 360;
      const span = (nextLon - h.lon + 360) % 360;
      if (isSelected) {
        const sector = new THREE.Mesh(
          new THREE.RingGeometry(R_HOUSE_INNER + 0.03, R_TORUS_TRACK - R_TORUS_TUBE - 0.04, 48, 1, -rad, span * Math.PI / 180),
          new THREE.MeshBasicMaterial({ color: 0xffdf80, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
        );
        sector.name = houseId;
        sector.rotation.x = -Math.PI / 2;
        sector.position.y = 0.015;
        dynamicGroup.add(sector);
      }
      const midLon = (h.lon + span / 2) % 360;
      const midRad = lonToRad(midLon);

      const hNumR = (R_HOUSE_INNER + R_TORUS_TRACK - R_TORUS_TUBE) / 2;
      const hNumX = Math.cos(midRad) * hNumR;
      const hNumZ = Math.sin(midRad) * hNumR;

      const hCanvas = document.createElement('canvas');
      hCanvas.width = 64;
      hCanvas.height = 64;
      const hCtx = hCanvas.getContext('2d')!;
      hCtx.font = 'bold 36px "IBM Plex Mono", monospace';
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';
      hCtx.fillStyle = isSelected ? 'rgba(242, 202, 80, 0.95)' : 'rgba(212, 175, 55, 0.55)';
      hCtx.fillText(h.num.toString(), 32, 32);

      const hTex = new THREE.CanvasTexture(hCanvas);
      const hMat = new THREE.SpriteMaterial({
        map: hTex,
        transparent: true,
        depthTest: false,
      });
      const hSprite = new THREE.Sprite(hMat);
      hSprite.scale.set(isSelected ? 0.23 : 0.19, isSelected ? 0.23 : 0.19, 1);
      hSprite.position.set(hNumX, 0.04, hNumZ);
      dynamicGroup.add(hSprite);

      const hitSector = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitSector.position.set(hNumX, 0.04, hNumZ);
      hitSector.userData = {
        componentId: houseId,
        houseName: houseId,
        title: `House ${h.num} Sector`,
        category: 'HOUSE DOMAIN',
        detail: h.desc,
        accent: '#d4af37',
      };
      dynamicGroup.add(hitSector);
      interactiveObjectsRef.current.push(hitSector);
    });

    // 3. PLANETARY PLACEMENTS
    const bodyCoordinates: Record<string, { x: number; z: number; rad: number; r: number }> = {};

    chart.natalBodies.forEach((body) => {
      const baseRad = lonToRad(body.lon);
      const adjustedRad = baseRad + (body.clusterAngle || 0);
      const rTrack = R_PLANETS_TRACK - body.tier * 0.13;

      const x = Math.cos(adjustedRad) * rTrack;
      const z = Math.sin(adjustedRad) * rTrack;

      bodyCoordinates[body.name] = { x, z, rad: baseRad, r: rTrack };

      const isSelected = activeSelections.includes(body.name);
      const beadColorInt = parseInt(body.color.replace('#', '0x'), 16);

      // Bold Christmas tree bauble 3D spherical ornament
      const beadRadius = isSelected ? 0.11 : 0.082;
      const beadGeo = new THREE.SphereGeometry(beadRadius, 24, 24);
      const beadMat = new THREE.MeshPhysicalMaterial({
        color: beadColorInt,
        emissive: beadColorInt,
        emissiveIntensity: isSelected ? 0.9 : 0.45,
        roughness: 0.1,
        metalness: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      });
      const bead = new THREE.Mesh(beadGeo, beadMat);
      bead.name = body.name;
      bead.position.set(x, 0.08, z);
      dynamicGroup.add(bead);

      const sprite = createGlyphSprite(body.glyph, body.degText, body.color, 0.4, isSelected);
      sprite.position.set(x, 0.36, z);
      dynamicGroup.add(sprite);

      const hitPlanet = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 10),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitPlanet.position.set(x, 0.32, z);
      hitPlanet.userData = {
        componentId: body.name,
        planetName: body.name,
        title: `${body.glyph} ${body.name} (${body.degText})`,
        category: 'PLANETARY PLACEMENT',
        detail: body.detail,
        accent: body.color,
      };
      dynamicGroup.add(hitPlanet);
      interactiveObjectsRef.current.push(hitPlanet);
    });

    // 4. ASPECT CHORDS
    chart.aspectChords.forEach((asp) => {
      const p1 = bodyCoordinates[asp.from];
      const p2 = bodyCoordinates[asp.to];
      if (p1 && p2) {
        const aspectInnerR = R_HOUSE_INNER;
        const x1 = Math.cos(p1.rad) * aspectInnerR;
        const z1 = Math.sin(p1.rad) * aspectInnerR;
        const x2 = Math.cos(p2.rad) * aspectInnerR;
        const z2 = Math.sin(p2.rad) * aspectInnerR;

        const isSelected =
          highlightedComponents.includes(asp.name) ||
          selectedComponents.includes(asp.name) ||
          selectedComponents.includes(asp.from) ||
          selectedComponents.includes(asp.to) ||
          selectedPlanetName === asp.from || selectedPlanetName === asp.to;

        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1, 0.025, z1),
          new THREE.Vector3(x2, 0.025, z2),
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffdf80 : asp.color,
          transparent: true,
          opacity: activeSelections.length > 0 ? (isSelected ? 1.0 : 0.18) : 0.9,
          linewidth: isSelected ? 4 : 2,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.name = asp.name;
        dynamicGroup.add(line);
        if (isSelected) {
          const glow = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x1, 0.025, z1), new THREE.Vector3(x2, 0.025, z2)), 1, 0.014, 8, false),
            new THREE.MeshBasicMaterial({ color: 0xffdf80, transparent: true, opacity: 0.9 })
          );
          glow.name = asp.name;
          dynamicGroup.add(glow);
        }

        // For chords passing through or near center (such as 180° oppositions),
        // offset the interactive hit sphere away from the Earth center orb
        let targetHitX = (x1 + x2) / 2;
        let targetHitZ = (z1 + z2) / 2;
        if (Math.hypot(targetHitX, targetHitZ) < 0.58) {
          targetHitX = x1 * 0.25 + x2 * 0.75;
          targetHitZ = z1 * 0.25 + z2 * 0.75;
        }

        const hitAspect = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitAspect.position.set(targetHitX, 0.025, targetHitZ);
        hitAspect.userData = {
          componentId: asp.name,
          aspectName: asp.name,
          title: asp.name,
          category: 'GEOMETRIC ASPECT',
          detail: asp.detail,
          accent: asp.colorHex,
        };
        dynamicGroup.add(hitAspect);
        interactiveObjectsRef.current.push(hitAspect);
      }
    });
    return () => {
      dynamicGroup.traverse(object => {
        const renderable = object as THREE.Mesh;
        renderable.geometry?.dispose();
        const materials = renderable.material ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material]) : [];
        materials.forEach(material => {
          (material as THREE.SpriteMaterial).map?.dispose();
          material.dispose();
        });
      });
      dynamicGroup.clear();
    };
  }, [chart, activeSelections]);

  return (
    <div
      ref={containerRef}
      id="threejs-container-ANIMATION_71"
      className="fixed inset-0 w-full h-full bg-transparent pointer-events-auto"
    />
  );
};
