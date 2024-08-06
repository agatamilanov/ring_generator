import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

let ring;
let crossSectionScene, crossSectionCamera, crossSectionRenderer;
const ringSize = 52;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('3d-viewer').appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(15, 50);
scene.add(gridHelper);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const spotLightIntensity = 0.5;
const spotLightDistance = 20;
const spotLightColor = 0xffffff;
const numberOfLights = 8;

for (let i = 0; i < numberOfLights; i++) {
    const angle = (i / numberOfLights) * Math.PI * 2;
    const x = Math.cos(angle) * spotLightDistance;
    const z = Math.sin(angle) * spotLightDistance;

    const spotLight = new THREE.SpotLight(spotLightColor, spotLightIntensity);
    spotLight.position.set(x, 20, z);
    spotLight.lookAt(new THREE.Vector3(0, 0, 0));
    spotLight.castShadow = true;

    scene.add(spotLight);
}

// Funkcia na vytvorenie druhej scény a kamery pre prierez
function initCrossSection() {
    crossSectionScene = new THREE.Scene();
    crossSectionCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
    crossSectionCamera.position.z = 10;

    crossSectionRenderer = new THREE.WebGLRenderer({ antialias: true });
    crossSectionRenderer.setSize(200, 200);
    document.getElementById('cross-section-viewer').appendChild(crossSectionRenderer.domElement);
}

function generateRing() {
    const size = document.getElementById('ringSize').value;
    const radius = size / (2 * Math.PI);
    let geometry;

    if (ring) {
        scene.remove(ring);
        if (crossSectionScene.children.length > 0) {
            crossSectionScene.remove(crossSectionScene.children[0]);
        }
    }

    const width = Math.random() * (4.5 - 2) + 2;
    const thickness = Math.random() * (1.8 - 1.5) + 1.5;

    const shape = new THREE.Shape();
    const halfWidth = width / 2;

    // Vytvorenie prsteňa so zaoblenými rohmi
    shape.moveTo(radius, -halfWidth);
    shape.lineTo(radius, halfWidth);
    shape.quadraticCurveTo(radius, halfWidth + 0.15, radius + 0.15, halfWidth + 0.15);
    shape.lineTo(radius + thickness - 0.15, halfWidth + 0.15);
    shape.quadraticCurveTo(radius + thickness, halfWidth + 0.15, radius + thickness, halfWidth);
    shape.lineTo(radius + thickness, -halfWidth);
    shape.quadraticCurveTo(radius + thickness, -halfWidth - 0.15, radius + thickness - 0.15, -halfWidth - 0.15);
    shape.lineTo(radius + 0.15, -halfWidth - 0.15);
    shape.quadraticCurveTo(radius, -halfWidth - 0.15, radius, -halfWidth);

    // Zabezpečenie uzavretia tvaru
    shape.closePath();

    const points = shape.getPoints();
    geometry = new THREE.LatheGeometry(points, 100);

    const material = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        shininess: 100,
        reflectivity: 0.9
    });

    ring = new THREE.Mesh(geometry, material);
    scene.add(ring);

    // Vytvorenie prierezu pomocou čiarového grafu
    const crossSectionGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const crossSectionLine = new THREE.Line(crossSectionGeometry, lineMaterial);
    crossSectionScene.add(crossSectionLine);

    document.getElementById('message').innerText = `Vygenerovala sa Ti prsteň veľkosti ${size}`;
}

function downloadSTL() {
    if (!ring) return;

    // Zafixovanie rotácie pred exportom
    ring.rotation.set(0, 0, 0);

    const exporter = new STLExporter();
    const stlString = exporter.parse(ring);
    const blob = new Blob([stlString], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    const size = document.getElementById('ringSize').value;
    link.href = URL.createObjectURL(blob);
    link.download = `ring_${size}.stl`;
    link.click();
}

function animate(time) {
    if (ring) {
        ring.rotation.x = time / 2000;
        ring.rotation.y = time / 1000;
    }
    controls.update();
    renderer.render(scene, camera);
    crossSectionRenderer.render(crossSectionScene, crossSectionCamera); // vykreslenie prierezu
}

function init() {
    initCrossSection(); // inicializácia scény a kamery pre prierez
    renderer.setAnimationLoop(animate);
}

document.getElementById('generateButton').addEventListener('click', generateRing);
document.getElementById('downloadButton').addEventListener('click', downloadSTL);

init();
