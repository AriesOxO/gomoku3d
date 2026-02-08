// Three.js 3D 渲染模块
// 负责 3D 场景的创建、渲染和交互

// Three.js 全局变量
let scene, camera, renderer, raycaster, mouse;
let boardGroup, stonesGroup;
let hoverMarker;
let isRotating = false;
let prevMouse = { x: 0, y: 0 };
let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 22 };
let intersectionPlane;
let boardCells = [];

// 触摸相关
let touchStartTime = 0;
let touchMoved = false;

/**
 * 初始化 Three.js 场景
 */
function initThreeJS() {
  const canvas = document.getElementById('gameCanvas');
  
  // 创建场景
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

  // 创建相机
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  updateCameraPosition();

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // 设置光照
  setupLighting();
  
  // 创建棋盘
  createBoard();
  
  // 创建底座和粒子效果
  createBasePlatform();
  createParticles();
  
  // 设置输入事件
  setupInputHandlers(canvas);
  
  // 开始动画循环
  animate();
}

/**
 * 设置场景光照
 */
function setupLighting() {
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
 * 创建棋盘
 */
function createBoard() {
  boardGroup = new THREE.Group();
  scene.add(boardGroup);

  const halfBoard = BOARD_CONFIG.WIDTH / 2;

  // 棋盘表面
  const boardGeom = new THREE.BoxGeometry(BOARD_CONFIG.WIDTH + 1.6, 0.3, BOARD_CONFIG.WIDTH + 1.6);
  const boardMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  });
  const boardMesh = new THREE.Mesh(boardGeom, boardMat);
  boardMesh.position.y = -0.15;
  boardMesh.receiveShadow = true;
  boardGroup.add(boardMesh);

  // 棋盘边缘发光
  const edgeGeom = new THREE.BoxGeometry(BOARD_CONFIG.WIDTH + 1.8, 0.32, BOARD_CONFIG.WIDTH + 1.8);
  const edgeMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.08,
  });
  const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
  edgeMesh.position.y = -0.16;
  boardGroup.add(edgeMesh);

  // 网格线
  createGridLines(halfBoard);
  
  // 星位
  createStarPoints(halfBoard);
  
  // 创建交互平面
  createIntersectionPlane();
  
  // 创建棋盘格子碰撞检测
  createBoardCells(halfBoard);
  
  // 创建悬停标记
  createHoverMarker();
  
  // 创建棋子组
  stonesGroup = new THREE.Group();
  scene.add(stonesGroup);
}

/**
 * 创建网格线
 */
function createGridLines(halfBoard) {
  const lineMat = new THREE.LineBasicMaterial({ 
    color: 0x335577, 
    transparent: true, 
    opacity: 0.5 
  });

  for (let i = 0; i < BOARD_CONFIG.SIZE; i++) {
    const offset = i * BOARD_CONFIG.CELL_SIZE - halfBoard;
    
    // 横线
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfBoard, 0.01, offset),
      new THREE.Vector3(halfBoard, 0.01, offset)
    ]);
    boardGroup.add(new THREE.Line(hGeom, lineMat));
    
    // 竖线
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offset, 0.01, -halfBoard),
      new THREE.Vector3(offset, 0.01, halfBoard)
    ]);
    boardGroup.add(new THREE.Line(vGeom, lineMat));
  }
}

/**
 * 创建星位（天元和星位）
 */
function createStarPoints(halfBoard) {
  const starPoints = [
    [3, 3], [3, 7], [3, 11],
    [7, 3], [7, 7], [7, 11],
    [11, 3], [11, 7], [11, 11]
  ];
  
  const starGeom = new THREE.SphereGeometry(0.08, 16, 16);
  const starMat = new THREE.MeshBasicMaterial({ color: 0x5588aa });
  
  starPoints.forEach(([r, c]) => {
    const dot = new THREE.Mesh(starGeom, starMat);
    dot.position.set(
      c * BOARD_CONFIG.CELL_SIZE - halfBoard, 
      0.02, 
      r * BOARD_CONFIG.CELL_SIZE - halfBoard
    );
    boardGroup.add(dot);
  });
}

/**
 * 创建交互平面（用于射线检测）
 */
function createIntersectionPlane() {
  intersectionPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD_CONFIG.WIDTH + 2, BOARD_CONFIG.WIDTH + 2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  intersectionPlane.rotation.x = -Math.PI / 2;
  intersectionPlane.position.y = 0;
  scene.add(intersectionPlane);
}

/**
 * 创建棋盘格子（用于精确点击检测）
 */
function createBoardCells(halfBoard) {
  boardCells = [];
  
  for (let r = 0; r < BOARD_CONFIG.SIZE; r++) {
    for (let c = 0; c < BOARD_CONFIG.SIZE; c++) {
      const cellGeom = new THREE.PlaneGeometry(
        BOARD_CONFIG.CELL_SIZE * 0.9, 
        BOARD_CONFIG.CELL_SIZE * 0.9
      );
      const cellMat = new THREE.MeshBasicMaterial({ visible: false });
      const cell = new THREE.Mesh(cellGeom, cellMat);
      cell.rotation.x = -Math.PI / 2;
      cell.position.set(
        c * BOARD_CONFIG.CELL_SIZE - halfBoard, 
        0.02, 
        r * BOARD_CONFIG.CELL_SIZE - halfBoard
      );
      cell.userData = { row: r, col: c };
      scene.add(cell);
      boardCells.push(cell);
    }
  }
}

/**
 * 创建悬停标记
 */
function createHoverMarker() {
  const hoverGeom = new THREE.RingGeometry(0.25, 0.35, 32);
  const hoverMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  hoverMarker = new THREE.Mesh(hoverGeom, hoverMat);
  hoverMarker.rotation.x = -Math.PI / 2;
  hoverMarker.position.y = 0.03;
  hoverMarker.visible = false;
  scene.add(hoverMarker);
}

/**
 * 创建底座平台
 */
function createBasePlatform() {
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
function createParticles() {
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
 * 设置输入事件处理器
 */
function setupInputHandlers(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 鼠标事件
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('click', onBoardClick);
  canvas.addEventListener('wheel', onWheel);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // 触摸事件
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);

  // 窗口大小调整
  window.addEventListener('resize', onResize);
}

/**
 * 更新相机位置
 */
function updateCameraPosition() {
  if (!camera) return;
  camera.position.x = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
  camera.position.y = cameraAngle.radius * Math.cos(cameraAngle.phi);
  camera.position.z = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
  camera.lookAt(0, 0, 0);
}

/**
 * 重置相机视角
 */
function resetCameraView() {
  cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 22 };
  updateCameraPosition();
}

/**
 * 窗口大小调整处理
 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 鼠标按下事件
 */
function onMouseDown(e) {
  if (e.button === 2 || e.button === 1) {
    isRotating = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  }
}

/**
 * 鼠标抬起事件
 */
function onMouseUp() {
  isRotating = false;
}

/**
 * 鼠标移动事件
 */
function onMouseMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  if (isRotating) {
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    cameraAngle.theta -= dx * 0.005;
    cameraAngle.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi + dy * 0.005));
    updateCameraPosition();
    prevMouse = { x: e.clientX, y: e.clientY };
    return;
  }

  // 悬停效果
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(boardCells);
  if (hits.length > 0 && gameState.gameActive && gameState.currentTurn === gameState.myColor) {
    const { row, col } = hits[0].object.userData;
    const halfBoard = BOARD_CONFIG.WIDTH / 2;
    hoverMarker.position.set(
      col * BOARD_CONFIG.CELL_SIZE - halfBoard, 
      0.03, 
      row * BOARD_CONFIG.CELL_SIZE - halfBoard
    );
    hoverMarker.visible = true;
  } else {
    hoverMarker.visible = false;
  }
}

/**
 * 鼠标滚轮事件
 */
function onWheel(e) {
  cameraAngle.radius = Math.max(12, Math.min(35, cameraAngle.radius + e.deltaY * 0.01));
  updateCameraPosition();
}

/**
 * 棋盘点击事件
 */
function onBoardClick(e) {
  if (e.button !== 0) return;
  handleBoardClick();
}

/**
 * 处理棋盘点击
 */
function handleBoardClick() {
  if (!gameState.gameActive || gameState.currentTurn !== gameState.myColor) return;
  
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(boardCells);
  
  if (hits.length > 0) {
    const { row, col } = hits[0].object.userData;
    placeStone(row, col);
  }
}

/**
 * 触摸开始事件
 */
function onTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchStartTime = Date.now();
    touchMoved = false;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}

/**
 * 触摸移动事件
 */
function onTouchMove(e) {
  e.preventDefault();
  touchMoved = true;
  
  if (e.touches.length === 1) {
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    cameraAngle.theta -= dx * 0.005;
    cameraAngle.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi + dy * 0.005));
    updateCameraPosition();
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    // 双指缩放
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (prevMouse.pinchDist) {
      const delta = prevMouse.pinchDist - d;
      cameraAngle.radius = Math.max(12, Math.min(35, cameraAngle.radius + delta * 0.03));
      updateCameraPosition();
    }
    prevMouse.pinchDist = d;
  }
}

/**
 * 触摸结束事件
 */
function onTouchEnd(e) {
  prevMouse.pinchDist = null;
  
  if (!touchMoved && Date.now() - touchStartTime < 300) {
    // 点击 = 落子
    const rect = renderer.domElement.getBoundingClientRect();
    const touch = e.changedTouches[0];
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    handleBoardClick();
  }
}

/**
 * 在 3D 场景中放置棋子
 */
function placeStone3D(row, col, color) {
  const halfBoard = BOARD_CONFIG.WIDTH / 2;
  const x = col * BOARD_CONFIG.CELL_SIZE - halfBoard;
  const z = row * BOARD_CONFIG.CELL_SIZE - halfBoard;

  // 创建棋子几何体
  const stoneGeom = new THREE.SphereGeometry(0.38, 32, 24);
  stoneGeom.scale(1, 0.5, 1);

  // 创建棋子材质
  let stoneMat;
  if (color === 1) {
    // 黑棋
    stoneMat = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
  } else {
    // 白棋
    stoneMat = new THREE.MeshPhysicalMaterial({
      color: 0xeeeeee,
      metalness: 0.1,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
  }

  const stone = new THREE.Mesh(stoneGeom, stoneMat);
  stone.position.set(x, 0.2, z);
  stone.castShadow = true;
  stone.receiveShadow = true;

  // 落子动画
  stone.position.y = 5;
  stone.userData.targetY = 0.2;
  stone.userData.animating = true;
  stone.userData.velocity = 0;

  stonesGroup.add(stone);

  // 最后落子高亮
  removeLastMoveHighlight();
  const glowGeom = new THREE.RingGeometry(0.35, 0.45, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: color === 1 ? 0x00e5ff : 0xf0c040,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(x, 0.03, z);
  glow.userData.isLastMoveHighlight = true;
  scene.add(glow);
}

/**
 * 移除上一步的高亮标记
 */
function removeLastMoveHighlight() {
  const toRemove = [];
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.isLastMoveHighlight) {
      toRemove.push(obj);
    }
  });
  toRemove.forEach(obj => {
    obj.geometry.dispose();
    obj.material.dispose();
    scene.remove(obj);
  });
}

/**
 * 清除所有棋子
 */
function clearStones() {
  while (stonesGroup.children.length) {
    const s = stonesGroup.children[0];
    s.geometry.dispose();
    s.material.dispose();
    stonesGroup.remove(s);
  }
  removeLastMoveHighlight();
}

/**
 * 动画循环
 */
function animate() {
  requestAnimationFrame(animate);

  // 棋子落下动画
  stonesGroup.children.forEach(stone => {
    if (stone.userData.animating) {
      stone.userData.velocity += 0.025; // 重力
      stone.position.y -= stone.userData.velocity;
      if (stone.position.y <= stone.userData.targetY) {
        stone.position.y = stone.userData.targetY;
        stone.userData.animating = false;
        // 轻微弹跳
        if (stone.userData.velocity > 0.05) {
          stone.userData.velocity *= -0.3;
          stone.userData.animating = true;
        }
      }
    }
  });

  // 悬停标记动画
  if (hoverMarker.visible) {
    hoverMarker.material.opacity = 0.4 + 0.2 * Math.sin(Date.now() * 0.005);
  }

  renderer.render(scene, camera);
}
