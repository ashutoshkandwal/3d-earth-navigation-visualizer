import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const EARTH_RADIUS = 2;
const GRID_RADIUS = EARTH_RADIUS * 1.002;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function createSpherePoint(radius, latitude, longitude) {
  const lat = toRadians(latitude);
  const lon = toRadians(longitude);

  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lon),
  );
}

function createLatitudeGeometry(radius, latitude, segments = 128) {
  const points = [];

  for (let i = 0; i < segments; i += 1) {
    const longitude = (i / segments) * 360;
    points.push(createSpherePoint(radius, latitude, longitude));
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

function createLongitudeGeometry(radius, longitude, segments = 128) {
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    const latitude = -90 + (i / segments) * 180;
    points.push(createSpherePoint(radius, latitude, longitude));
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

function App() {
  const mountRef = useRef(null);
  const showLatitudesRef = useRef(true);
  const showMeridiansRef = useRef(true);
  const [showLatitudes, setShowLatitudes] = useState(true);
  const [showMeridians, setShowMeridians] = useState(true);

  useEffect(() => {
    showLatitudesRef.current = showLatitudes;
  }, [showLatitudes]);

  useEffect(() => {
    showMeridiansRef.current = showMeridians;
  }, [showMeridians]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const depthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 64, 64),
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
      }),
    );
    scene.add(depthSphere);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x0077ff,
        wireframe: true,
        opacity: 0.4,
        transparent: true,
      }),
    );
    scene.add(earth);

    const latGroup = new THREE.Group();
    const lonGroup = new THREE.Group();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf5f7fa,
      depthTest: true,
      depthWrite: false,
      transparent: false,
    });

    for (let lat = -80; lat <= 80; lat += 10) {
      const geometry = createLatitudeGeometry(GRID_RADIUS, lat, 128);
      const line = new THREE.LineLoop(geometry, lineMaterial);
      latGroup.add(line);
    }

    for (let lon = 0; lon < 360; lon += 15) {
      const geometry = createLongitudeGeometry(GRID_RADIUS, lon, 128);
      const line = new THREE.Line(geometry, lineMaterial);
      lonGroup.add(line);
    }

    scene.add(latGroup);
    scene.add(lonGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);

      latGroup.visible = showLatitudesRef.current;
      lonGroup.visible = showMeridiansRef.current;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();

      const disposedMaterials = new Set();
      const disposedGeometries = new Set();

      scene.traverse((object) => {
        if (object.geometry && !disposedGeometries.has(object.geometry)) {
          disposedGeometries.add(object.geometry);
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];

          materials.forEach((material) => {
            if (!disposedMaterials.has(material)) {
              disposedMaterials.add(material);
              material.dispose();
            }
          });
        }
      });

      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100vw", height: "100vh" }}
      />

      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "grid",
          gap: 10,
          padding: 12,
          borderRadius: 12,
          background: "rgba(8, 10, 18, 0.72)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          onClick={() => setShowLatitudes((value) => !value)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          {showLatitudes ? "Hide Latitudes" : "Show Latitudes"}
        </button>
        <button
          onClick={() => setShowMeridians((value) => !value)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          {showMeridians ? "Hide Meridians" : "Show Meridians"}
        </button>
      </div>
    </>
  );
}

export default App;
