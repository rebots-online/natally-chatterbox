import React from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Astrolabe3D } from '../src/components/Astrolabe3D';
import { calculateNatalChart } from '../src/services/ephemeris';

// Observe the actual rendered scene in this standalone test page. Production
// components do not expose test-only state or bypass login.
const probe = { frame: 0, y: 0, distance: 0, selections: 0, ready: false };
Object.assign(window, { torusProbe: probe });
const updateMatrixWorld = THREE.Object3D.prototype.updateMatrixWorld;
THREE.Object3D.prototype.updateMatrixWorld = function(force) {
  if (this.type === 'Group' && this.parent?.type === 'Scene') {
    probe.frame++;
    probe.y = this.rotation.y;
  }
  if (this.type === 'PerspectiveCamera') probe.distance = this.position.length();
  updateMatrixWorld.call(this, force);
};
const chart = await calculateNatalChart({ name: 'Synthetic interaction test', birthDate: '2000-01-01', birthTime: '00:00',
  placeName: 'Greenwich', latitude: 51.48, longitude: 0, timezoneOffset: 0, houseSystem: 'W' });
createRoot(document.getElementById('root')!).render(
  <Astrolabe3D chart={chart} isSpinning={false} resetTrigger={0} onToggleComponent={() => probe.selections++} />,
);
probe.ready = true;
