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

function createPolarAnglePoints(angleDegrees, radius = TEACHING_RADIUS * 0.34, segments = 40) {
  const points = [];
  const angle = toRadians(angleDegrees);
  const northPoleY = GRID_RADIUS * 1.03;

  for (let index = 0; index <= segments; index += 1) {
    const theta = (angle * index) / segments;
    points.push(new THREE.Vector3(radius * Math.cos(theta), northPoleY, radius * Math.sin(theta)));
  }

  return points;
}

function createPoleTangentArmPoints(angleDegrees, radius = TEACHING_RADIUS * 0.22, poleY = GRID_RADIUS * 1.03) {
  const angle = toRadians(angleDegrees);
  const center = new THREE.Vector3(0, poleY, 0);
  const endpoint = new THREE.Vector3(radius * Math.cos(angle), poleY, radius * Math.sin(angle));

  return [center, endpoint];
}

function createPoleAngleArcPoints(angleDegrees, radius = TEACHING_RADIUS * 0.22, poleY = GRID_RADIUS * 1.03, segments = 48) {
  const points = [];
  const angle = toRadians(angleDegrees);

  for (let index = 0; index <= segments; index += 1) {
    const theta = (angle * index) / segments;
    points.push(new THREE.Vector3(radius * Math.cos(theta), poleY, radius * Math.sin(theta)));
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

function isFrontFacing(point, camera) {
  if (!(point instanceof THREE.Vector3)) {
    return false;
  }

  const cameraPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);

  return point.clone().dot(cameraPosition) >= 0;
}

function formatLatitudeValue(latitude) {
  if (latitude === 0) {
    return `0${"\u00B0"} at Equator`;
  }

  return `${Math.abs(Math.round(latitude))}${"\u00B0"} ${latitude > 0 ? "N" : "S"}`;
}

function formatLongitudeValue(longitude) {
  if (longitude === 0) {
    return `0${"\u00B0"} at Prime Meridian`;
  }

  return `${Math.abs(Math.round(longitude))}${"\u00B0"} ${longitude > 0 ? "E" : "W"}`;
}

function createLatitudeLearningLayer() {
  const group = new THREE.Group();
  group.renderOrder = 20;

  const styles = {
    plane: new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.15,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    equator: new THREE.LineBasicMaterial({
      color: 0xffda7a,
      depthTest: true,
      depthWrite: false,
    }),
    meridian: new THREE.LineBasicMaterial({
      color: 0x90dcff,
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
    northPole: new THREE.MeshBasicMaterial({
      color: 0xf8ffff,
      depthTest: true,
      depthWrite: false,
    }),
    southPole: new THREE.MeshBasicMaterial({
      color: 0xff8c7a,
      depthTest: true,
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
  equatorialPlane.renderOrder = 30;

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

  const northPoleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), styles.northPole);
  northPoleMarker.renderOrder = 25;

  const southPoleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), styles.southPole);
  southPoleMarker.renderOrder = 25;

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
    northPoleMarker,
    southPoleMarker,
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

  const northPoleLabelState = {
    text: "North Pole",
    point: new THREE.Vector3(0, GRID_RADIUS * 1.03, 0),
  };

  const southPoleLabelState = {
    text: "South Pole",
    point: new THREE.Vector3(0, -GRID_RADIUS * 1.03, 0),
  };

  const update = (latitude, longitude, visible) => {
    const surfacePoint = createSpherePoint(GRID_RADIUS, latitude, longitude);
    const equatorPoint = createSpherePoint(GRID_RADIUS, 0, longitude);
    const meridianArcPoints = createLongitudePoints(GRID_RADIUS, longitude, 0, latitude, 64);
    const angleArcPoints = createCentralAnglePoints(TEACHING_RADIUS * 1.1, latitude, longitude, 80);
    const labelMidpoint = angleArcPoints[Math.floor(angleArcPoints.length / 2)] ?? new THREE.Vector3();

    replaceLineGeometry(selectedParallelLine, createLatitudePoints(GRID_RADIUS, latitude));
    replaceLineGeometry(selectedMeridianLine, createLongitudePoints(GRID_RADIUS, longitude));
    replaceLineGeometry(meridianArcLine, meridianArcPoints);
    replaceLineGeometry(radiusToPlace, [new THREE.Vector3(), surfacePoint]);
    replaceLineGeometry(radiusToEquator, [new THREE.Vector3(), equatorPoint]);
    replaceLineGeometry(centralAngleArc, angleArcPoints);

    marker.position.copy(surfacePoint);
    northPoleMarker.position.set(0, GRID_RADIUS * 1.01, 0);
    southPoleMarker.position.set(0, -GRID_RADIUS * 1.01, 0);
    centerMarker.position.set(0, 0, 0);
    group.visible = visible;
    labelState.text = `Latitude = ${formatLatitudeValue(latitude)}`;
    labelState.point.copy(labelMidpoint);
    planeLabelState.point.set(GRID_RADIUS * 1.04, 0, GRID_RADIUS * 0.08);
    northPoleLabelState.point.set(0, GRID_RADIUS * 1.03, 0);
    southPoleLabelState.point.set(0, -GRID_RADIUS * 1.03, 0);
  };

  return {
    group,
    update,
    labelState,
    planeLabelState,
    northPoleLabelState,
    southPoleLabelState,
    debugSummary() {
      return {
        equatorialPlane: 1,
        marker: 1,
        poleMarkers: 2,
        angleArc: 1,
        meridianArc: 1,
        radiusLines: 2,
      };
    },
  };
}

function createLongitudeLearningLayer() {
  const group = new THREE.Group();
  group.renderOrder = 20;

  const styles = {
    equator: new THREE.LineBasicMaterial({
      color: 0xffda7a,
      depthTest: true,
      depthWrite: false,
    }),
    primeMeridian: new THREE.LineBasicMaterial({
      color: 0xc8f7ff,
      depthTest: true,
      depthWrite: false,
    }),
    primeMeridianPlane: new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.08,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    oppositeMeridianPlane: new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.08,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    selectedMeridianPlane: new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.08,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    selectedMeridian: new THREE.LineBasicMaterial({
      color: 0xfdb5b5,
      depthTest: true,
      depthWrite: false,
    }),
    equatorArc: new THREE.LineBasicMaterial({
      color: 0xfff1a8,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.98,
    }),
    poleArc: new THREE.LineBasicMaterial({
      color: 0xffd166,
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
      depthTest: true,
      depthWrite: false,
    }),
    northPole: new THREE.MeshBasicMaterial({
      color: 0xf8ffff,
      depthTest: true,
      depthWrite: false,
    }),
    southPole: new THREE.MeshBasicMaterial({
      color: 0xff8c7a,
      depthTest: true,
      depthWrite: false,
    }),
  };

  const meridianPlaneGeometry = new THREE.CircleGeometry(EARTH_RADIUS * 1.05, 96);

  const primeMeridianPlane = new THREE.Mesh(meridianPlaneGeometry, styles.primeMeridianPlane);
  primeMeridianPlane.rotation.x = 0;
  primeMeridianPlane.rotation.y = 0;
  primeMeridianPlane.renderOrder = 30;

  const oppositeMeridianPlane = new THREE.Mesh(
    meridianPlaneGeometry.clone(),
    styles.oppositeMeridianPlane,
  );
  oppositeMeridianPlane.rotation.x = 0;
  oppositeMeridianPlane.rotation.y = Math.PI;
  oppositeMeridianPlane.renderOrder = 30;

  const selectedMeridianPlane = new THREE.Mesh(
    meridianPlaneGeometry.clone(),
    styles.selectedMeridianPlane,
  );
  selectedMeridianPlane.rotation.x = 0;
  selectedMeridianPlane.rotation.y = toRadians(40);
  selectedMeridianPlane.renderOrder = 30;

  const equatorLine = new THREE.LineLoop(
    createLineGeometry(createLatitudePoints(GRID_RADIUS, 0)),
    styles.equator,
  );
  const primeMeridianLine = new THREE.Line(
    createLineGeometry(createLongitudePoints(GRID_RADIUS, 0)),
    styles.primeMeridian,
  );
  const selectedMeridianLine = new THREE.Line(
    createLineGeometry(createLongitudePoints(GRID_RADIUS, 40)),
    styles.selectedMeridian,
  );
  const equatorArcLine = new THREE.Line(
    createLineGeometry(createLatitudePoints(GRID_RADIUS, 0, 0, 40, 72)),
    styles.equatorArc,
  );
  const northPrimeArm = new THREE.Line(
    createLineGeometry(createPoleTangentArmPoints(0, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03)),
    styles.radius,
  );
  const northSelectedArm = new THREE.Line(
    createLineGeometry(createPoleTangentArmPoints(40, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03)),
    styles.radius,
  );
  const southPrimeArm = new THREE.Line(
    createLineGeometry(createPoleTangentArmPoints(0, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03)),
    styles.radius,
  );
  const southSelectedArm = new THREE.Line(
    createLineGeometry(createPoleTangentArmPoints(40, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03)),
    styles.radius,
  );
  const poleAngleArc = new THREE.Line(
    createLineGeometry(createPoleAngleArcPoints(40, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03, 72)),
    styles.poleArc,
  );
  const southPoleAngleArc = new THREE.Line(
    createLineGeometry(createPoleAngleArcPoints(40, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03, 72)),
    styles.poleArc,
  );
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), styles.marker);
  marker.renderOrder = 25;

  const northPoleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), styles.northPole);
  northPoleMarker.renderOrder = 25;

  const southPoleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), styles.southPole);
  southPoleMarker.renderOrder = 25;

  group.add(
    primeMeridianPlane,
    oppositeMeridianPlane,
    selectedMeridianPlane,
    equatorLine,
    primeMeridianLine,
    selectedMeridianLine,
    equatorArcLine,
    northPrimeArm,
    northSelectedArm,
    southPrimeArm,
    southSelectedArm,
    poleAngleArc,
    southPoleAngleArc,
    marker,
    northPoleMarker,
    southPoleMarker,
  );

  const labelState = {
    text: "",
    point: new THREE.Vector3(),
  };

  const primeMeridianLabelState = {
    text: "Prime Meridian (0\u00B0)",
    point: new THREE.Vector3(GRID_RADIUS * 1.02, GRID_RADIUS * 0.4, 0),
  };

  const oppositeMeridianLabelState = {
    text: "180\u00B0 E/W Meridian",
    point: new THREE.Vector3(-GRID_RADIUS * 1.02, GRID_RADIUS * 0.34, 0),
  };

  const selectedMeridianLabelState = {
    text: "Meridian through Place",
    point: new THREE.Vector3(GRID_RADIUS * 0.4, GRID_RADIUS * 0.65, 0),
  };

  const northPoleLabelState = {
    text: "North Pole",
    point: new THREE.Vector3(0, GRID_RADIUS * 1.03, 0),
  };

  const southLongitudeLabelState = {
    text: "",
    point: new THREE.Vector3(GRID_RADIUS * 0.26, -GRID_RADIUS * 1.035, GRID_RADIUS * 0.04),
  };

  const update = (latitude, longitude, visible) => {
    const surfacePoint = createSpherePoint(GRID_RADIUS, latitude, longitude);
    const northLabelPoint = createPoleAngleArcPoints(longitude, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03, 72)[36] ?? new THREE.Vector3();
    const southLabelPoint = createPoleAngleArcPoints(longitude, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03, 72)[36] ?? new THREE.Vector3();
    const meridianLabelPoint = createSpherePoint(GRID_RADIUS * 1.04, Math.max(Math.min(latitude, 55), 18), longitude);
    const primeLabelPoint = createSpherePoint(GRID_RADIUS * 1.04, 35, 0);
    const oppositeLabelPoint = createSpherePoint(GRID_RADIUS * 1.04, 35, 180);
    const longitudeText = `Longitude = ${formatLongitudeValue(longitude)}`;

    replaceLineGeometry(selectedMeridianLine, createLongitudePoints(GRID_RADIUS, longitude));
    replaceLineGeometry(equatorArcLine, createLatitudePoints(GRID_RADIUS, 0, 0, longitude, 72));
    replaceLineGeometry(northPrimeArm, createPoleTangentArmPoints(0, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03));
    replaceLineGeometry(northSelectedArm, createPoleTangentArmPoints(longitude, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03));
    replaceLineGeometry(southPrimeArm, createPoleTangentArmPoints(0, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03));
    replaceLineGeometry(southSelectedArm, createPoleTangentArmPoints(longitude, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03));
    replaceLineGeometry(poleAngleArc, createPoleAngleArcPoints(longitude, TEACHING_RADIUS * 0.22, GRID_RADIUS * 1.03, 72));
    replaceLineGeometry(southPoleAngleArc, createPoleAngleArcPoints(longitude, TEACHING_RADIUS * 0.22, -GRID_RADIUS * 1.03, 72));

    marker.position.copy(surfacePoint);
    northPoleMarker.position.set(0, GRID_RADIUS * 1.01, 0);
    southPoleMarker.position.set(0, -GRID_RADIUS * 1.01, 0);
    group.visible = visible;
    labelState.text = longitudeText;
    labelState.point.copy(northLabelPoint);
    primeMeridianLabelState.point.copy(primeLabelPoint);
    oppositeMeridianLabelState.point.copy(oppositeLabelPoint);
    selectedMeridianLabelState.point.copy(meridianLabelPoint);
    northPoleLabelState.point.set(0, GRID_RADIUS * 1.03, 0);
    southLongitudeLabelState.text = longitudeText;
    southLongitudeLabelState.point.copy(southLabelPoint).add(new THREE.Vector3(0.14, -0.04, 0));
    primeMeridianPlane.visible = visible;
    oppositeMeridianPlane.visible = visible;
    selectedMeridianPlane.visible = visible;
    selectedMeridianPlane.rotation.y = toRadians(longitude);
    primeMeridianLabelState.text = "Prime Meridian (0\u00B0)";
    oppositeMeridianLabelState.text = "180\u00B0 E/W Meridian";
    selectedMeridianLabelState.text = "Meridian through Place";
  };

  return {
    group,
    update,
    labelState,
    northPoleLabelState,
    southLongitudeLabelState,
    primeMeridianLabelState,
    oppositeMeridianLabelState,
    selectedMeridianLabelState,
    debugSummary() {
      return {
        marker: 1,
        northPoleMarker: 1,
        southPoleMarker: 1,
        poleAngleArc: 2,
        equatorArc: 1,
        meridianLines: 2,
        meridianPlanes: 3,
      };
    },
  };
}

function App() {
  const mountRef = useRef(null);
  const latitudeLabelRef = useRef(null);
  const longitudeLabelRef = useRef(null);
  const southLongitudeLabelRef = useRef(null);
  const primeMeridianLabelRef = useRef(null);
  const oppositeMeridianLabelRef = useRef(null);
  const selectedMeridianLabelRef = useRef(null);
  const planeLabelRef = useRef(null);
  const northPoleLabelRef = useRef(null);
  const southPoleLabelRef = useRef(null);
  const latitudeLayerRef = useRef(null);
  const longitudeLayerRef = useRef(null);
  const showLatitudesRef = useRef(true);
  const showMeridiansRef = useRef(true);
  const showLatitudeLearningModeRef = useRef(false);
  const showLongitudeLearningModeRef = useRef(false);
  const latitudeDegreesRef = useRef(30);
  const longitudeDegreesRef = useRef(40);
  const [showLatitudes, setShowLatitudes] = useState(true);
  const [showMeridians, setShowMeridians] = useState(true);
  const [showLatitudeLearningMode, setShowLatitudeLearningMode] = useState(false);
  const [showLongitudeLearningMode, setShowLongitudeLearningMode] = useState(false);
  const [latitudeDegrees, setLatitudeDegrees] = useState(30);
  const [longitudeDegrees, setLongitudeDegrees] = useState(40);

  useEffect(() => {
    showLatitudesRef.current = showLatitudes;
  }, [showLatitudes]);

  useEffect(() => {
    showMeridiansRef.current = showMeridians;
  }, [showMeridians]);

  useEffect(() => {
    showLatitudeLearningModeRef.current = showLatitudeLearningMode;
  }, [showLatitudeLearningMode]);

  useEffect(() => {
    showLongitudeLearningModeRef.current = showLongitudeLearningMode;
  }, [showLongitudeLearningMode]);

  useEffect(() => {
    latitudeDegreesRef.current = latitudeDegrees;
  }, [latitudeDegrees]);

  useEffect(() => {
    longitudeDegreesRef.current = longitudeDegrees;
  }, [longitudeDegrees]);

  useEffect(() => {
    const latitudeLayer = latitudeLayerRef.current;
    const longitudeLayer = longitudeLayerRef.current;

    if (latitudeLayer) {
      latitudeLayer.update(
        latitudeDegreesRef.current,
        longitudeDegreesRef.current,
        showLatitudeLearningModeRef.current,
      );
    }

    if (longitudeLayer) {
      longitudeLayer.update(
        latitudeDegreesRef.current,
        longitudeDegreesRef.current,
        showLongitudeLearningModeRef.current,
      );
    }
  }, [latitudeDegrees, longitudeDegrees, showLatitudeLearningMode, showLongitudeLearningMode]);

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

    const latitudeLayer = createLatitudeLearningLayer();
    const longitudeLayer = createLongitudeLearningLayer();
    latitudeLayerRef.current = latitudeLayer;
    longitudeLayerRef.current = longitudeLayer;
    scene.add(latitudeLayer.group);
    scene.add(longitudeLayer.group);

    latitudeLayer.update(
      latitudeDegreesRef.current,
      longitudeDegreesRef.current,
      showLatitudeLearningModeRef.current,
    );
    longitudeLayer.update(
      latitudeDegreesRef.current,
      longitudeDegreesRef.current,
      showLongitudeLearningModeRef.current,
    );

    console.log("[LatitudeLearningMode] created", {
      ...latitudeLayer.debugSummary(),
      groupChildren: latitudeLayer.group.children.length,
    });
    console.log("[LongitudeLearningMode] created", {
      ...longitudeLayer.debugSummary(),
      groupChildren: longitudeLayer.group.children.length,
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

      const latitudeLayer = latitudeLayerRef.current;
      const longitudeLayer = longitudeLayerRef.current;
      const latitudeLabelState = latitudeLayer?.labelState;
      const latitudeLabelPoint = latitudeLabelState?.point;
      const latitudeLabelText = latitudeLabelState?.text ?? "";
      const longitudeLabelState = longitudeLayer?.labelState;
      const longitudeLabelPoint = longitudeLabelState?.point;
      const longitudeLabelText = longitudeLabelState?.text ?? "";
      const southLongitudeLabelState = longitudeLayer?.southLongitudeLabelState;
      const southLongitudeLabelPoint = southLongitudeLabelState?.point;
      const southLongitudeLabelText = southLongitudeLabelState?.text ?? "";
      const primeMeridianLabelState = longitudeLayer?.primeMeridianLabelState;
      const primeMeridianLabelPoint = primeMeridianLabelState?.point;
      const primeMeridianLabelText = primeMeridianLabelState?.text ?? "";
      const oppositeMeridianLabelState = longitudeLayer?.oppositeMeridianLabelState;
      const oppositeMeridianLabelPoint = oppositeMeridianLabelState?.point;
      const oppositeMeridianLabelText = oppositeMeridianLabelState?.text ?? "";
      const selectedMeridianLabelState = longitudeLayer?.selectedMeridianLabelState;
      const selectedMeridianLabelPoint = selectedMeridianLabelState?.point;
      const selectedMeridianLabelText = selectedMeridianLabelState?.text ?? "";
      const northPrimeArm = longitudeLayer?.northPrimeArm;
      const northSelectedArm = longitudeLayer?.northSelectedArm;
      const southPrimeArm = longitudeLayer?.southPrimeArm;
      const southSelectedArm = longitudeLayer?.southSelectedArm;
      const planeLabelState = latitudeLayer?.planeLabelState;
      const planeLabelPoint = planeLabelState?.point;
      const planeLabelText = planeLabelState?.text ?? "";
      const northPoleLabelState =
        longitudeLayer?.northPoleLabelState ?? latitudeLayer?.northPoleLabelState;
      const northPoleLabelPoint = northPoleLabelState?.point;
      const northPoleLabelText = northPoleLabelState?.text ?? "";
      const southPoleLabelState = latitudeLayer?.southPoleLabelState;
      const southPoleLabelPoint = southPoleLabelState?.point;
      const southPoleLabelText = southPoleLabelState?.text ?? "";

      const canProjectLatitudeLabel =
        showLatitudeLearningModeRef.current &&
        camera &&
        renderer &&
        latitudeLabelPoint instanceof THREE.Vector3;
      const canProjectLongitudeLabel =
        showLongitudeLearningModeRef.current &&
        camera &&
        renderer &&
        longitudeLabelPoint instanceof THREE.Vector3;
      const canProjectSouthLongitudeLabel =
        showLongitudeLearningModeRef.current &&
        camera &&
        renderer &&
        southLongitudeLabelPoint instanceof THREE.Vector3;
      const canProjectPrimeMeridianLabel =
        showLongitudeLearningModeRef.current &&
        camera &&
        renderer &&
        primeMeridianLabelPoint instanceof THREE.Vector3;
      const canProjectOppositeMeridianLabel =
        showLongitudeLearningModeRef.current &&
        camera &&
        renderer &&
        oppositeMeridianLabelPoint instanceof THREE.Vector3;
      const canProjectSelectedMeridianLabel =
        showLongitudeLearningModeRef.current &&
        camera &&
        renderer &&
        selectedMeridianLabelPoint instanceof THREE.Vector3;
      const canProjectPlaneLabel =
        showLatitudeLearningModeRef.current &&
        camera &&
        renderer &&
        planeLabelPoint instanceof THREE.Vector3;
      const canProjectNorthPoleLabel =
        (showLatitudeLearningModeRef.current || showLongitudeLearningModeRef.current) &&
        camera &&
        renderer &&
        northPoleLabelPoint instanceof THREE.Vector3;
      const canProjectSouthPoleLabel =
        (showLatitudeLearningModeRef.current || showLongitudeLearningModeRef.current) &&
        camera &&
        renderer &&
        southPoleLabelPoint instanceof THREE.Vector3;

      if (canProjectLatitudeLabel) {
        const projected = projectToScreen(latitudeLabelPoint, camera, renderer);

        if (latitudeLabelRef.current && projected.visible) {
          latitudeLabelRef.current.style.display = "block";
          latitudeLabelRef.current.textContent = latitudeLabelText;
          latitudeLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 12}px)`;
        } else if (latitudeLabelRef.current) {
          latitudeLabelRef.current.style.display = "none";
        }
      } else if (latitudeLabelRef.current) {
        latitudeLabelRef.current.style.display = "none";
      }

      if (canProjectLongitudeLabel) {
        const projected = projectToScreen(longitudeLabelPoint, camera, renderer);

        if (longitudeLabelRef.current && projected.visible) {
          longitudeLabelRef.current.style.display = "block";
          longitudeLabelRef.current.textContent = longitudeLabelText;
          longitudeLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y + 16}px)`;
        } else if (longitudeLabelRef.current) {
          longitudeLabelRef.current.style.display = "none";
        }
      } else if (longitudeLabelRef.current) {
        longitudeLabelRef.current.style.display = "none";
      }

      if (canProjectSouthLongitudeLabel) {
        const projected = projectToScreen(southLongitudeLabelPoint, camera, renderer);

        if (
          southLongitudeLabelRef.current &&
          projected.visible &&
          isFrontFacing(southLongitudeLabelPoint, camera)
        ) {
          southLongitudeLabelRef.current.style.display = "block";
          southLongitudeLabelRef.current.textContent = southLongitudeLabelText;
          southLongitudeLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 18}px)`;
        } else if (southLongitudeLabelRef.current) {
          southLongitudeLabelRef.current.style.display = "none";
        }
      } else if (southLongitudeLabelRef.current) {
        southLongitudeLabelRef.current.style.display = "none";
      }

      if (canProjectSelectedMeridianLabel) {
        const projected = projectToScreen(selectedMeridianLabelPoint, camera, renderer);

        if (
          selectedMeridianLabelRef.current &&
          projected.visible &&
          isFrontFacing(selectedMeridianLabelPoint, camera)
        ) {
          selectedMeridianLabelRef.current.style.display = "block";
          selectedMeridianLabelRef.current.textContent = selectedMeridianLabelText;
          selectedMeridianLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 14}px)`;
        } else if (selectedMeridianLabelRef.current) {
          selectedMeridianLabelRef.current.style.display = "none";
        }
      } else if (selectedMeridianLabelRef.current) {
        selectedMeridianLabelRef.current.style.display = "none";
      }

      const isPrimeMeridianFront = isFrontFacing(primeMeridianLabelPoint, camera);
      const isOppositeMeridianFront = isFrontFacing(oppositeMeridianLabelPoint, camera);
      const isNorthPoleFront = isFrontFacing(northPoleLabelPoint, camera);
      const isSouthPoleFront = isFrontFacing(southLongitudeLabelPoint, camera);

      if (
        primeMeridianLabelRef.current &&
        canProjectPrimeMeridianLabel &&
        isPrimeMeridianFront
      ) {
        const projected = projectToScreen(primeMeridianLabelPoint, camera, renderer);

        if (projected.visible) {
          primeMeridianLabelRef.current.style.display = "block";
          primeMeridianLabelRef.current.textContent = primeMeridianLabelText;
          primeMeridianLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 18}px)`;
        } else {
          primeMeridianLabelRef.current.style.display = "none";
        }
      } else if (primeMeridianLabelRef.current) {
        primeMeridianLabelRef.current.style.display = "none";
      }

      if (
        oppositeMeridianLabelRef.current &&
        canProjectOppositeMeridianLabel &&
        isOppositeMeridianFront
      ) {
        const projected = projectToScreen(oppositeMeridianLabelPoint, camera, renderer);

        if (projected.visible) {
          oppositeMeridianLabelRef.current.style.display = "block";
          oppositeMeridianLabelRef.current.textContent = oppositeMeridianLabelText;
          oppositeMeridianLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y + 18}px)`;
        } else {
          oppositeMeridianLabelRef.current.style.display = "none";
        }
      } else if (oppositeMeridianLabelRef.current) {
        oppositeMeridianLabelRef.current.style.display = "none";
      }

      if (northPrimeArm) {
        northPrimeArm.visible = isNorthPoleFront;
      }

      if (northSelectedArm) {
        northSelectedArm.visible = isNorthPoleFront;
      }

      if (southPrimeArm) {
        southPrimeArm.visible = isSouthPoleFront;
      }

      if (southSelectedArm) {
        southSelectedArm.visible = isSouthPoleFront;
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

      if (canProjectNorthPoleLabel) {
        const projected = projectToScreen(northPoleLabelPoint, camera, renderer);

        if (northPoleLabelRef.current && projected.visible) {
          northPoleLabelRef.current.style.display = "block";
          northPoleLabelRef.current.textContent = northPoleLabelText;
          northPoleLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y - 28}px)`;
        } else if (northPoleLabelRef.current) {
          northPoleLabelRef.current.style.display = "none";
        }
      } else if (northPoleLabelRef.current) {
        northPoleLabelRef.current.style.display = "none";
      }

      if (canProjectSouthPoleLabel) {
        const projected = projectToScreen(southPoleLabelPoint, camera, renderer);

        if (southPoleLabelRef.current && projected.visible) {
          southPoleLabelRef.current.style.display = "block";
          southPoleLabelRef.current.textContent = southPoleLabelText;
          southPoleLabelRef.current.style.transform = `translate(${projected.x + 12}px, ${projected.y + 20}px)`;
        } else if (southPoleLabelRef.current) {
          southPoleLabelRef.current.style.display = "none";
        }
      } else if (southPoleLabelRef.current) {
        southPoleLabelRef.current.style.display = "none";
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

  const latitudeTeachingText =
    "Latitude is the angle at the centre of the Earth, or the arc of the meridian between the Equator and the parallel of latitude of the place.";
  const longitudeTeachingText =
    "Longitude is the arc of the Equator, or the angle at the Pole, contained between the Prime Meridian and the meridian passing through the place.";

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
            width: 340,
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
            onClick={() => setShowLatitudeLearningMode((value) => !value)}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            {showLatitudeLearningMode ? "Latitude Learning Mode: On" : "Latitude Learning Mode: Off"}
          </button>
          <button
            onClick={() => setShowLongitudeLearningMode((value) => !value)}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            {showLongitudeLearningMode ? "Longitude Learning Mode: On" : "Longitude Learning Mode: Off"}
          </button>

          {showLatitudeLearningMode || showLongitudeLearningMode ? (
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
                <span>Latitude: {formatLatitudeValue(latitudeDegrees)}</span>
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
                <span>Longitude: {formatLongitudeValue(longitudeDegrees)}</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={longitudeDegrees}
                  onChange={(event) => setLongitudeDegrees(Number(event.target.value))}
                />
              </label>

              {showLatitudeLearningMode ? (
                <p style={{ fontSize: 13, lineHeight: 1.45, color: "#d1d5db", textAlign: "left" }}>
                  {latitudeTeachingText}
                </p>
              ) : null}

              {showLongitudeLearningMode ? (
                <p style={{ fontSize: 13, lineHeight: 1.45, color: "#d1d5db", textAlign: "left" }}>
                  {longitudeTeachingText}
                </p>
              ) : null}
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
        ref={longitudeLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#ffd7d7",
          fontSize: 14,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={southLongitudeLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#ffd7d7",
          fontSize: 13,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={primeMeridianLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#4ade80",
          fontSize: 12,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={oppositeMeridianLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#c084fc",
          fontSize: 12,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={selectedMeridianLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#f59e0b",
          fontSize: 12,
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

      <div
        ref={northPoleLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#f8ffff",
          fontSize: 12,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      />

      <div
        ref={southPoleLabelRef}
        style={{
          position: "fixed",
          zIndex: 11,
          pointerEvents: "none",
          display: "none",
          color: "#ff8c7a",
          fontSize: 12,
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
