import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function createCircle(radius, segments, axis = "xy") {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i * Math.PI * 2) / segments;

    if (axis === "xy") {
      points.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
    } else if (axis === "xz") {
      points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
    }
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function App() {
  const mountRef = useRef(null);

  const [showLat, setShowLat] = useState(false);
  const [showLon, setShowLon] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // Earth
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true, opacity: 0.4, transparent: true })
    );
    scene.add(earth);

    // Groups
    const latGroup = new THREE.Group();
    const lonGroup = new THREE.Group();

    // 🔵 Latitudes
    for (let lat = -80; lat <= 80; lat += 10) {
      const r = 2 * Math.cos((lat * Math.PI) / 180);
      const y = 2 * Math.sin((lat * Math.PI) / 180);

      const geometry = createCircle(r, 100, "xy");
      geometry.translate(0, y, 0);

      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      latGroup.add(line);
    }

    // 🔵 Longitudes
    for (let lon = 0; lon < 180; lon += 10) {
      const angle = (lon * Math.PI) / 180;

      const points = [];
      for (let i = 0; i <= 100; i++) {
        const theta = (i * Math.PI) / 100 - Math.PI / 2;

        const x = 2 * Math.cos(theta) * Math.cos(angle);
        const y = 2 * Math.sin(theta);
        const z = 2 * Math.cos(theta) * Math.sin(angle);

        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );

      lonGroup.add(line);
    }

    scene.add(latGroup);
    scene.add(lonGroup);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = () => {
      requestAnimationFrame(animate);

      latGroup.visible = showLat;
      lonGroup.visible = showLon;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => mount.removeChild(renderer.domElement);
  }, [showLat, showLon]);

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* 🔵 Control Panel */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "rgba(0,0,0,0.6)",
        padding: 10,
        borderRadius: 5
      }}>
        <button onClick={() => setShowLat(!showLat)}>
          Toggle Latitudes
        </button>
        <br /><br />
        <button onClick={() => setShowLon(!showLon)}>
          Toggle Meridians
        </button>
      </div>
    </>
  );
}

export default App;