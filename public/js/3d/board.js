// 棋盘模块
// 负责棋盘的创建和管理

let boardGroup;
let boardCells = [];
let hoverMarker;

/**
 * 创建棋盘
 */
function createBoard(scene) {
  boardGroup = new THREE.Group();
  scene.add(boardGroup);

  const halfBoard = BOARD_CONFIG.WIDTH / 2;

  // 棋盘表面
  createBoardSurface(halfBoard);
  
  // 网格线
  createGridLines(halfBoard);
  
  // 星位
  createStarPoints(halfBoard);
  
  // 创建交互平面
  createIntersectionPlane(scene);
  
  // 创建棋盘格子碰撞检测
  createBoardCells(scene, halfBoard);
  
  // 创建悬停标记
  createHoverMarker(scene);
}

/**
 * 创建棋盘表面
 */
function createBoardSurface(halfBoard) {
  // 棋盘主体
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
function createIntersectionPlane(scene) {
  const intersectionPlane = new THREE.Mesh(
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
function createBoardCells(scene, halfBoard) {
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
function createHoverMarker(scene) {
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
 * 获取棋盘格子数组
 */
function getBoardCells() {
  return boardCells;
}

/**
 * 获取悬停标记
 */
function getHoverMarker() {
  return hoverMarker;
}
