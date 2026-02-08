// 3D 场景管理模块
// 负责 Three.js 场景的创建和基础设置

let scene, camera, renderer;

/**
 * 初始化 Three.js 场景
 */
function initScene(canvas) {
  // 创建场景
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

  // 创建相机
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  return { scene, camera, renderer };
}

/**
 * 设置场景光照
 */
function setupLighting(scene) {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
  scene.add(ambientLight);

  // 主光源
  const mainLight = new THREE.DirectionalLight(0xffeedd, 1.0);
  mainLight.position.set(10, 15, 10);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.1;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.camera.left = -15;
  mainLight.shadow.camera.right = 15;
  mainLight.shadow.camera.top = 15;
  mainLight.shadow.camera.bottom = -15;
  scene.add(mainLight);

  // 补光
  const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
  fillLight.position.set(-8, 8, -5);
  scene.add(fillLight);

  // 边缘光
  const rimLight = new THREE.PointLight(0x00e5ff, 0.5, 30);
  rimLight.position.set(0, 8, -12);
  scene.add(rimLight);
}

/**
 * 创建底座平台
 */
function createBasePlatform(scene) {
  const baseGeom = new THREE.CylinderGeometry(12, 13, 0.6, 64);
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d0d1a,
    metalness: 0.5,
    roughness: 0.6,
  });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = -0.6;
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);
}

/**
 * 创建粒子场
 */
function createParticles(scene) {
  const particleCount = 200;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = Math.random() * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00e5ff,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
  });
  const particles = new THREE.Points(particleGeom, particleMat);
  scene.add(particles);
}

/**
 * 获取场景对象
 */
function getScene() {
  return scene;
}

/**
 * 获取相机对象
 */
function getCamera() {
  return camera;
}

/**
 * 获取渲染器对象
 */
function getRenderer() {
  return renderer;
}
