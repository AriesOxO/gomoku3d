// 输入处理模块
// 负责鼠标和触摸事件的处理

let raycaster, mouse;
let isRotating = false;
let prevMouse = { x: 0, y: 0 };
let touchStartTime = 0;
let touchMoved = false;

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
  const renderer = getRenderer();
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  if (isRotating) {
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    rotateCamera(dx, dy);
    prevMouse = { x: e.clientX, y: e.clientY };
    return;
  }

  // 悬停效果
  updateHoverEffect();
}

/**
 * 更新悬停效果
 */
function updateHoverEffect() {
  const camera = getCamera();
  const hoverMarker = getHoverMarker();
  const boardCells = getBoardCells();
  
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
  zoomCamera(e.deltaY * 0.01);
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
  
  const camera = getCamera();
  const boardCells = getBoardCells();
  
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
    rotateCamera(dx, dy);
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    // 双指缩放
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (prevMouse.pinchDist) {
      const delta = prevMouse.pinchDist - d;
      zoomCamera(delta * 0.03);
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
    const renderer = getRenderer();
    const rect = renderer.domElement.getBoundingClientRect();
    const touch = e.changedTouches[0];
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    handleBoardClick();
  }
}
