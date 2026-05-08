import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const EARTH_RADIUS = 2;
const GRID_RADIUS = EARTH_RADIUS * 1.002;
const TEACHING_RADIUS = EARTH_RADIUS * 0.48;

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

function createLatitudePoints(radius, latitude, startLongitude = 0, endLongitude = 360, segments = 128) {
  const points = [];

  for (let index = 0; index <= segments; index += 1) {
    const longitude = startLongitude + ((endLongitude - startLongitude) * index) / segments;
    points.push(createSpherePoint(radius, latitude, longitude));
  }

  return points;
}

function createLongitudePoints(radius, longitude, startLatitude = -90, endLatitude = 90, segments = 128) {
  const points = [];

  for (let index = 0; index <= segments; index += 1) {
    const latitude = startLatitude + ((endLatitude - startLatitude) * index) / segments;
    points.push(createSpherePoint(radius, latitude, longitude));
  }

  return points;
}

function createCentralAnglePoints(radius, latitude, longitude, segments = 40) {
  const points = [];
  const angle = toRadians(latitude);
  const azimuth = toRadians(longitude);
  const meridianDirection = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth));
  const northDirection = new THREE.Vector3(0, 1, 0);

  for (let index = 0; index <= segments; index += 1) {
    const t = (angle * index) / segments;
    const point = new THREE.Vector3()
      .copy(meridianDirection)
      .multiplyScalar(Math.cos(t) * radius)
      .add(new THREE.Vector3().copy(northDirection).multiplyScalar(Math.sin(t) * radius));

    points.push(point);
  }

  return points;
}

function createLineGeometry(points) {
  return new THREE.BufferGeometry().setFromPoints(points);
}

function replaceLineGeometry(line, points) {
  const nextGeometry = createLineGeometry(points);
  line.geometry.dispose();
  line.geometry = nextGeometry;
}

function projectToScreen(point, camera, renderer) {
  const projected = point.clone().project(camera);
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;

  return {
    x: ((projected.x + 1) * width) / 2,
    y: ((1 - projected.y) * height) / 2,
    visible: projected.z >= -1 && projected.z <= 1,
  };
}

function createLatitudeTeachingLayer() {
  const group = new THREE.Group();
  group.renderOrder = 20;

  const styles = {
    plane: new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.15,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    equator: new THREE.LineBasicMaterial({
      color: 0xffd166,
      depthTest: true,
      depthWrite: false,
    }),
    meridian: new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      depthTest: true,
      depthWrite: false,
    }),
    parallel: new THREE.LineBasicMaterial({
      color: 0xfca5a5,
      depthTest: true,
      depthWrite: false,
    }),
    arc: new THREE.LineBasicMaterial({
      color: 0xfff1a8,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.98,
    }),
    radius: new THREE.LineBasicMaterial({
      color: 0x9be7ff,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.98,
    }),
    marker: new THREE.MeshBasicMaterial({
      color: 0xffb020,
      depthTest: false,
      depthWrite: false,
    }),
    center: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
    }),
  };

  const equatorialPlane = new THREE.Mesh(
    new THREE.CircleGeometry(EARTH_RADIUS * 1.05, 96),
    styles.plane,
  );
  equatorialPlane.position.set(0, 0, 0);
  equatorialPlane.rotation.x = -Math.PI / 2;
  equatorialPlane.renderOrder = 5;

  const equatorLine = new THREE.LineLoop(
    createLineGeometry(createLatitudePoints(GRID_RADIUS, 0)),
    styles.equator,
  );
  const selectedParallelLine = new THREE.LineLoop(
    createLineGeometry(createLatitudePoints(GRID_RADIUS, 30)),
    styles.parallel,
  );
  const selectedMeridianLine = new THREE.Line(
    createLineGeometry(createLongitudePoints(GRID_RADIUS, 40)),
    styles.meridian,
  );
  const meridianArcLine = new THREE.Line(
    createLineGeometry(createLongitudePoints(GRID_RADIUS, 40, 0, 30)),
    styles.arc,
  );
  const radiusToPlace = new THREE.Line(
    createLineGeometry([new THREE.Vector3(), createSpherePoint(GRID_RADIUS, 30, 40)]),
    styles.radius,
  );
  const radiusToEquator = new THREE.Line(
    createLineGeometry([new THREE.Vector3(), createSpherePoint(GRID_RADIUS, 0, 40)]),
    styles.radius,
  );
  const centralAngleArc = new THREE.Line(
    createLineGeometry(createCentralAnglePoints(TEACHING_RADIUS, 30, 40)),
    styles.arc,
  );
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), styles.marker);
  marker.renderOrder = 25;

  const centerMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 20), styles.center);
  centerMarker.renderOrder = 25;

  group.add(
    equatorialPlane,
    equatorLine,
    selectedParallelLine,
    selectedMeridianLine,
    meridianArcLine,
    radiusToPlace,
    radiusToEquator,
    centralAngleArc,
    marker,
    centerMarker,
  );

  const labelState = {
    text: "",
    point: new THREE.Vector3(),
  };

  const planeLabelState = {
    text: "Equatorial Plane",
    point: new THREE.Vector3(GRID_RADIUS * 1.04, 0, GRID_RADIUS * 0.08),
  };

  const update = (latitude, longitude, visible) => {
    const surfacePoint = createSpherePoint(GRID_RADIUS, latitude, longitude);
    const equatorPoint = createSpherePoint(GRID_RADIUS, 0, longitude);
    const meridianArcPoints = createLongitudePoints(GRID_RADIUS, longitude, 0, latitude, 64);
    const angleArcPoints = createCentralAnglePoints(TEACHING_RADIUS * 1.1, latitude, longitude, 80);
    const labelLatitude = Math.round(Math.abs(latitude));
    const hemisphere = latitude >= 0 ? "N" : "S";
    const labelMidpoint = angleArcPoints[Math.floor(angleArcPoints.length / 2)] ?? new THREE.Vector3();

    replaceLineGeometry(selectedParallelLine, createLatitudePoints(GRID_RADIUS, latitude));
    replaceLineGeometry(selectedMeridianLine, createLongitudePoints(GRID_RADIUS, longitude));
    replaceLineGeometry(meridianArcLine, meridianArcPoints);
    replaceLineGeometry(radiusToPlace, [new THREE.Vector3(), surfacePoint]);
    replaceLineGeometry(radiusToEquator, [new THREE.Vector3(), equatorPoint]);
    replaceLineGeometry(centralAngleArc, angleArcPoints);

    marker.position.copy(surfacePoint);
    centerMarker.position.set(0, 0, 0);
    group.visible = visible;
    labelState.text = `Latitude = ${labelLatitude} deg ${hemisphere}`;
    labelState.point.copy(labelMidpoint);
    planeLabelState.point.set(GRID_RADIUS * 1.04, 0, GRID_RADIUS * 0.08);
  };

  return {
    group,
    update,
    labelState,
    planeLabelState,
    debugSummary() {
      return {
        equatorialPlane: 1,
        marker: 1,
        angleArc: 1,
        meridianArc: 1,
        radiusLines: 2,
      };
    },
  };
}

function App() {
  const mountRef = useRef(null);
  const latitudeLabelRef = useRef(null);
  const planeLabelRef = useRef(null);
  const teachingLayerRef = useRef(null);
  const showLatitudesRef = useRef(true);
  const showMeridiansRef = useRef(true);
  const showLatitudeTeachingModeRef = useRef(false);
  const latitudeDegreesRef = useRef(30);
  const longitudeDegreesRef = useRef(40);
  const [showLatitudes, setShowLatitudes] = useState(true);
  const [showMeridians, setShowMeridians] = useState(true);
  const [showLatitudeTeachingMode, setShowLatitudeTeachingMode] = useState(false);
  const [latitudeDegrees, setLatitudeDegrees] = useState(30);
  const [longitudeDegrees, setLongitudeDegrees] = useState(40);

  useEffect(() => {
    showLatitudesRef.current = showLatitudes;
  }, [showLatitudes]);

  useEffect(() => {
    showMeridiansRef.current = showMeridians;
  }, [showMeridians]);

  useEffect(() => {
    showLatitudeTeachingModeRef.current = showLatitudeTeachingMode;
  }, [showLatitudeTeachingMode]);

  useEffect(() => {
    latitudeDegreesRef.current = latitudeDegrees;
  }, [latitudeDegrees]);

  useEffect(() => {
    longitudeDegreesRef.current = longitudeDegrees;
  }, [longitudeDegrees]);

  useEffect(() => {
    const layer = teachingLayerRef.current;

    if (layer) {
      layer.update(
        latitudeDegreesRef.current,
        longitudeDegreesRef.current,
        showLatitudeTeachingModeRef.current,
      );
    }
  }, [latitudeDegrees, longitudeDegrees, showLatitudeTeachingMode]);

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

    const gridLineMaterial = new THREE.LineBasicMaterial({
      color: 0xf5f7fa,
      depthTest: true,
      depthWrite: false,
    });

    const equatorLine = new THREE.LineLoop(
      createLineGeometry(createLatitudePoints(GRID_RADIUS, 0)),
      new THREE.LineBasicMaterial({
        color: 0xb2f5ea,
        depthTest: true,
        depthWrite: false,
      }),
    );
    latGroup.add(equatorLine);

    for (let lat = -80; lat <= 80; lat += 10) {
      if (lat === 0) {
        continue;
      }

      const geometry = createLineGeometry(createLatitudePoints(GRID_RADIUS, lat, 0, 360, 128));
      const line = new THREE.LineLoop(geometry, gridLineMaterial);
      latGroup.add(line);
    }

    for (let lon = 0; lon < 360; lon += 15) {
      const geometry = createLineGeometry(createLongitudePoints(GRID_RADIUS, lon, -90, 90, 128));
      const line = new THREE.Line(geometry, gridLineMaterial);
      lonGroup.add(line);
    }

    scene.add(latGroup);
    scene.add(lonGroup);

    const teachingLayer = createLatitudeTeachingLayer();
    teachingLayerRef.current = teachingLayer;
    scene.add(teachingLayer.group);
    teachingLayer.update(
      latitudeDegreesRef.current,
      longitudeDegreesRef.current,
      showLatitudeTeachingModeRef.current,
    );
    console.log("[LatitudeTeachingMode] created", {
      ...teachingLayer.debugSummary(),
      groupChildren: teachingLayer.group.children.length,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;

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
      controls.enabled = true;

      const labelState = teachingLayer?.labelState;
      const labelPoint = labelState?.point;
      const labelText = labelState?.text ?? "";
      const planeLabelState = teachingLayer?.planeLabelState;
      const planeLabelPoint = planeLabelState?.point;
      const planeLabelText = planeLabelState?.text ?? "";
      const canProjectLabel =
        showLatitudeTeachingModeRef.current &&
        camera &&
        renderer &&
        labelPoint instanceof THREE.Vector3;
      const canProjectPlaneLabel =
        showLatitudeTeachingModeRef.current &&
        camera &&
        renderer &&
        planeLabelPoint instanceof THREE.Vector3;

      if (canProjectLabel) {
        const projected = projectToScreen(labelPoint, camera, renderer);

        if (latitudeLabelRef.current && projected.visible) {
          latitudeLabelRef.current.style.display = "block";
          latitudeLabelRef.current.textContent = labelText;
          latitudeLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 12}px)`;
        } else if (latitudeLabelRef.current) {
          latitudeLabelRef.current.style.display = "none";
        }
      } else {
        if (latitudeLabelRef.current) {
          latitudeLabelRef.current.style.display = "none";
        }
      }

      if (canProjectPlaneLabel) {
        const projected = projectToScreen(planeLabelPoint, camera, renderer);

        if (planeLabelRef.current && projected.visible) {
          planeLabelRef.current.style.display = "block";
          planeLabelRef.current.textContent = planeLabelText;
          planeLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y + 12}px)`;
        } else if (planeLabelRef.current) {
          planeLabelRef.current.style.display = "none";
        }
      } else if (planeLabelRef.current) {
        planeLabelRef.current.style.display = "none";
      }

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

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, []);

  const teachingText =
    "Latitude is the angle at the centre of the Earth, or the arc of the meridian between the Equator and the parallel of latitude of the place.";

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100vw", height: "100vh" }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            display: "grid",
            gap: 10,
            width: 320,
            padding: 12,
            borderRadius: 12,
            background: "rgba(8, 10, 18, 0.72)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(10px)",
            color: "#f5f7fa",
            pointerEvents: "auto",
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
        <button
          onClick={() => setShowLatitudeTeachingMode((value) => !value)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          {showLatitudeTeachingMode ? "Latitude Teaching Mode: On" : "Latitude Teaching Mode: Off"}
        </button>

        {showLatitudeTeachingMode ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: 12,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
              <span>Latitude: {latitudeDegrees} deg</span>
              <input
                type="range"
                min="-90"
                max="90"
                step="1"
                value={latitudeDegrees}
                onChange={(event) => setLatitudeDegrees(Number(event.target.value))}
              />
            </label>

            <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
              <span>Longitude: {longitudeDegrees} deg</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={longitudeDegrees}
                onChange={(event) => setLongitudeDegrees(Number(event.target.value))}
              />
            </label>

            <p style={{ fontSize: 13, lineHeight: 1.45, color: "#d1d5db", textAlign: "left" }}>
              {teachingText}
            </p>
          </div>
        ) : null}
        </div>
      </div>

      <div
        ref={latitudeLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={planeLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#b8f3ff",
          fontSize: 13,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />
    </>
  );
}

export default App;
