// AZEDOC — Three.js Animated Background

(function() {
'use strict';

function initThreeBg() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 60;

  // Particles
  const count = 180;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 140;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    vel[i * 3]     = (Math.random() - 0.5) * 0.012;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
    vel[i * 3 + 2] = 0;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.45,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Subtle line connections (medical grid feel)
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.04 });
  const lineGeo = new THREE.BufferGeometry();
  const lineVerts = [];
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 100;
    lineVerts.push(x, y, -20, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, -20);
  }
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3]     += vel[i * 3];
      p[i * 3 + 1] += vel[i * 3 + 1];
      if (p[i * 3]     >  70) p[i * 3]     = -70;
      if (p[i * 3]     < -70) p[i * 3]     =  70;
      if (p[i * 3 + 1] >  50) p[i * 3 + 1] = -50;
      if (p[i * 3 + 1] < -50) p[i * 3 + 1] =  50;
    }
    geo.attributes.position.needsUpdate = true;

    points.rotation.z += 0.00008;
    mat.opacity = 0.25 + Math.sin(frame * 0.005) * 0.08;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThreeBg);
} else {
  initThreeBg();
}

})();
