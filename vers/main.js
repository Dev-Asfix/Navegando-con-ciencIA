import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Configurar la escena, la cámara y el renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 3000000);
camera.position.set(500, 100, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Controles para manipular la cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Apunta al centro de la escena
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 100;
controls.maxDistance = 2000;

// Luces
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(200, 500, 200);
scene.add(light);

// --------- AGREGAR EL CIELO ---------
let sky;
const skyParameters = {
    elevation: 2,
    azimuth: 180
};

sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();
const sunDistance = 400000;

function updateSky() {
    const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
    const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun).multiplyScalar(sunDistance);
    light.position.copy(sun).multiplyScalar(sunDistance);
}
updateSky();

// --------- AGREGAR EL AGUA (THREE.js) ---------
let water;
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const waterNormalMap = new THREE.TextureLoader().load('public/waternormals.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
});

water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterNormalMap,
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = -Math.PI / 2;
scene.add(water);

// --------- CARGAR EL BARCO ---------
const loader = new GLTFLoader();
loader.load(
    'public/barco.glb',
    function (gltf) {
        // --- INICIO DE LA SOLUCIÓN MÁS ROBUSTA PARA CENTRAR EL BARCO ---

        // 1. Crear un grupo vacío que actuará como contenedor del barco
        const boatContainer = new THREE.Group();

        // 2. Calcular la caja contenedora del modelo 
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        box.getSize(size);

        // 3. Normalizar el modelo (opcional, para controlar el tamaño fácilmente)
        const scaleFactor = 150 / Math.max(size.x, size.y, size.z);
        gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Volvemos a calcular la caja y el tamaño con la nueva escala
        box.setFromObject(gltf.scene);
        box.getSize(size);
        const center = box.getCenter(new THREE.Vector3());

        // 4. Mover el modelo *dentro del grupo* para que su centro coincida con el origen del grupo.
        // Esto es lo que realmente centra el barco.
        gltf.scene.position.sub(center);

        // 5. Añadir el barco al grupo contenedor.
        boatContainer.add(gltf.scene);

        // 6. Posicionar el grupo contenedor para que flote sobre el agua.
        // El punto de origen del grupo ya está en el centro, así que solo movemos el grupo.
        boatContainer.position.y = size.y / 2 + 10; // Elevamos el grupo la mitad de la altura del barco + 10 unidades para que flote.

        // 7. Añadir el grupo contenedor a la escena.
        scene.add(boatContainer);

        // --- FIN DE LA SOLUCIÓN MÁS ROBUSTA ---

        console.log("Barco cargado y centrado.");
        // A partir de aquí, el grupo 'boatContainer' es el que se puede manipular.
        // Por ejemplo, boatContainer.rotation.y += 0.01;
    },
    undefined,
    function (error) {
        console.error('An error happened loading the boat:', error);
    }
);

// --------- CARGAR EL MAR (modelo GLB) ---------
const seaLoader = new GLTFLoader();
seaLoader.load(
    'public/Mar.glb',
    function (gltf) {
        scene.add(gltf.scene);
        console.log("Modelo de mar cargado.");
    },
    undefined,
    function (error) {
        console.error('An error happened loading the sea model:', error);
    }
);


// --------- LOOP DE ANIMACIÓN ---------
function animate() {
    requestAnimationFrame(animate);
    water.material.uniforms['time'].value += 1.0 / 60.0;
    controls.update();
    renderer.render(scene, camera);
}

// Redimensionamiento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();