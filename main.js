import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Global Variables
const canvas = document.getElementById('three-canvas');
let scene, camera, renderer, controls;
let models = {};
let selectedRoom = null;
let editMode = false;

// Room Configurations
const roomDescriptions = {
    'Room 1': {
        description: "Room 1 - Adviser: Sir Mercado - Section: Edison",
        directions: "First floor, First room from the left stairs"
    },
    'Room 2': {
        description: "Room 2 - Adviser: Sir Managyo - Section: Einstein",
        directions: "First floor, Second room from the Left Stairs"
    },
    'Room 3': {
        description: "Room 3 - Adviser: Sir Naval - Section: Rutherford",
        directions: "First floor, Second room from the Right Stairs"
    },
    'Room 4': {
        description: "Room 4 - Adviser: Sir Miranda - Section: Hawking",
        directions: "First floor, First room from the Right Stairs"
    },
    'Room 5': {
        description: "Library",
        directions: "Second floor, First room from the Right Stairs"
    },
    'Room 6': {
        description: "Faculty",
        directions: "Second floor, Second room from the Right Stairs"
    },
    'Room 7': {
        description: "Physics Laboratory - Sir Ocampo",
        directions: "Second floor, Second room from the Left Stairs"
    },
    'Room 8': {
        description: "Chemistry Laboratory - Sir Garcia",
        directions: "Second floor, First room from the Left Stairs"
    }
};

let roomCameraConfig = {
    'Room 1': { position: { x: -60, y: 15, z: 10 }, target: { x: -60, y: 12, z: 0 } },
    'Room 2': { position: { x: -20, y: 15, z: 10 }, target: { x: -20, y: 12, z: 0 } },
    'Room 3': { position: { x: 20, y: 15, z: 10 }, target: { x: 20, y: 12, z: 0 } },
    'Room 4': { position: { x: 60, y: 15, z: 10 }, target: { x: 60, y: 12, z: 0 } },
    'Room 5': { position: { x: -45, y: 27, z: 12 }, target: { x: -45, y: 25, z: 0 } },
    'Room 6': { position: { x: -10, y: 27, z: 12 }, target: { x: -10, y: 25, z: 0 } },
    'Room 7': { position: { x: 20, y: 27, z: 12 }, target: { x: 20, y: 25, z: 0 } },
    'Room 8': { position: { x: 60, y: 27, z: 12 }, target: { x: 60, y: 25, z: 0 } }
};

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }

    createUIElements();
    initScene();
    loadModels();
    animate();
});

// UI Functions
function createUIElements() {
    // Description Box
    if (!document.getElementById("description-box")) {
        const descBox = document.createElement("div");
        descBox.id = "description-box";
        descBox.className = "info-box";
        document.body.appendChild(descBox);
    }

    // Directions Box
    if (!document.getElementById("directions-box")) {
        const dirBox = document.createElement("div");
        dirBox.id = "directions-box";
        dirBox.className = "info-box directions";
        document.body.appendChild(dirBox);
    }

    // Edit Mode Button
    const editBtn = document.createElement("button");
    editBtn.id = "edit-mode-button";
    editBtn.textContent = "Edit Mode: OFF";
    editBtn.className = "control-button";
    document.body.appendChild(editBtn);
    editBtn.addEventListener("click", toggleEditMode);

    // Home View Button
    const homeBtn = document.createElement("button");
    homeBtn.id = "home-view-button";
    homeBtn.textContent = "Reset View";
    homeBtn.className = "control-button";
    homeBtn.style.top = "60px";
    document.body.appendChild(homeBtn);
    homeBtn.addEventListener("click", resetCamera);
}

function toggleEditMode() {
    editMode = !editMode;
    document.getElementById("edit-mode-button").textContent = `Edit Mode: ${editMode ? "ON" : "OFF"}`;
    showNotification(`Edit mode ${editMode ? "enabled" : "disabled"}`);
}

// Scene Functions
function initScene() {
    renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 30);
    camera.target = new THREE.Vector3(0, 20, 0);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    
    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(10, 20, 10);
    scene.add(light);
    
    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    canvas.addEventListener('click', onObjectClick);
    
    controls.target.copy(camera.target);
    controls.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Model Loading
function loadModels() {
    const loader = new GLTFLoader();
    const modelPaths = {
        'school': '/public/models/school-structure.glb',
        'Room 1': '/public/models/Room 1.glb',
        'Room 2': '/public/models/Room 2.glb',
        'Room 3': '/public/models/Room 3.glb',
        'Room 4': '/public/models/Room 4.glb',
        'Room 5': '/public/models/Room 5.glb',
        'Room 6': '/public/models/Room 6.glb',
        'Room 7': '/public/models/Room 7.glb',
        'Room 8': '/public/models/Room 8.glb'
    };

    for (const [name, path] of Object.entries(modelPaths)) {
        loader.load(path, 
            gltf => {
                const model = gltf.scene;
                model.name = name;
                scene.add(model);
                models[name] = model;
            },
            undefined,
            error => {
                console.error(`Error loading model ${name}:`, error);
            }
        );
    }
}

// Room Interaction
function onObjectClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        
        // Find parent room object
        while (clickedObject.parent && clickedObject.parent !== scene) {
            clickedObject = clickedObject.parent;
        }

        const roomName = clickedObject.name;
        
        if (roomDescriptions[roomName]) {
            if (editMode) {
                updateRoomCoordinates(roomName);
            } else {
                focusOnRoom(clickedObject);
                showRoomInfo(roomName);
            }
        }
    }
}

function updateRoomCoordinates(roomName) {
    roomCameraConfig[roomName] = {
        position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        target: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z
        }
    };
    showNotification(`Saved view for ${roomName}`);
}

function focusOnRoom(roomObject) {
    const roomName = roomObject.name;
    const config = roomCameraConfig[roomName] || getDefaultCameraPosition(roomObject);
    
    // Reset previous highlight
    if (selectedRoom) {
        resetRoomOpacity(selectedRoom);
    }
    
    // Highlight new room
    selectedRoom = roomObject;
    highlightRoom(roomObject);
    
    // Animate camera
    animateCameraToPosition(
        new THREE.Vector3(config.position.x, config.position.y, config.position.z),
        new THREE.Vector3(config.target.x, config.target.y, config.target.z)
    );
    
    // Show info
    showRoomInfo(roomName);
}

function getDefaultCameraPosition(roomObject) {
    const box = new THREE.Box3().setFromObject(roomObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = Math.max(size.x, size.y, size.z) * 1.5;
    
    return {
        position: {
            x: center.x,
            y: center.y + size.y * 0.3,
            z: center.z + distance
        },
        target: {
            x: center.x,
            y: center.y,
            z: center.z
        }
    };
}

function animateCameraToPosition(position, target) {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();
    const duration = 1000;
    
    const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        camera.position.lerpVectors(startPosition, position, progress);
        
        const currentTarget = new THREE.Vector3().lerpVectors(startTarget, target, progress);
        controls.target.copy(currentTarget);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

function highlightRoom(roomObject) {
    scene.traverse(child => {
        if (child.isMesh) {
            if (child.parent === roomObject) {
                child.material.transparent = false;
                child.material.opacity = 1;
            } else if (child.parent && child.parent.name !== 'school') {
                child.material.transparent = true;
                child.material.opacity = 0.3;
            }
        }
    });
}

function resetRoomOpacity(roomObject) {
    if (!roomObject) return;
    roomObject.traverse(child => {
        if (child.isMesh) {
            child.material.transparent = false;
            child.material.opacity = 1;
        }
    });
}

// UI Helpers
function showRoomInfo(roomName) {
    const descBox = document.getElementById("description-box");
    const dirBox = document.getElementById("directions-box");
    
    if (descBox && dirBox) {
        descBox.textContent = roomDescriptions[roomName].description;
        dirBox.textContent = `Directions: ${roomDescriptions[roomName].directions}`;
        
        descBox.style.display = "block";
        dirBox.style.display = "block";
    }
}

function resetCamera() {
    animateCameraToPosition(
        new THREE.Vector3(0, 25, 30),
        new THREE.Vector3(0, 25, 0)
    );
    
    scene.traverse(child => {
        if (child.isMesh) {
            child.material.transparent = false;
            child.material.opacity = 1;
        }
    });
    
    document.getElementById("description-box").style.display = "none";
    document.getElementById("directions-box").style.display = "none";
    
    selectedRoom = null;
}

function showNotification(message) {
    console.log(message);
    // Could be enhanced with a proper notification UI
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}