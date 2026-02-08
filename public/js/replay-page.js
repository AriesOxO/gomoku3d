/**
 * 回放页面逻辑
 * 管理回放页面的 UI 和 3D 渲染
 */

let replayController = null;
let scene, camera, renderer;
let board, stones = [];
let isDragging = false;

// 从 URL 获取对局 ID
function getGameIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

// 加载回放数据
async function loadReplayData() {
  const gameId = getGameIdFromURL();

  if (!gameId || isNaN(gameId)) {
    showError('无效的对局 ID');
    return;
  }

  try {
    const data = await API.getReplayData(gameId);
    initReplay(data);
  } catch (error) {
    showError(error.message || '加载回放数据失败');
  }
}

// 初始化回放
function initReplay(gameData) {
  // 创建回放控制器
  replayController = new ReplayController(gameData);

  // 显示游戏信息
  displayGameInfo(gameData);

  // 初始化 3D 场景
  init3DScene();

  // 显示控制面板
  document.getElementById('loading').style.display = 'none';
  document.getElementById('controls').style.display = 'block';

  // 更新 UI
  updateUI();
}

// 显示游戏信息
function displayGameInfo(gameData) {
  const title = `${gameData.blackPlayer} (黑) vs ${gameData.whitePlayer} (白)`;
  document.getElementById('game-title').textContent = title;

  const winnerText = gameData.winner === 0 ? '平局' : 
                     gameData.winner === 1 ? `${gameData.blackPlayer} 胜` :
                     `${gameData.whitePlayer} 胜`;
  
  const date = new Date(gameData.finishedAt).toLocaleString('zh-CN');
  const duration = formatDuration(gameData.duration);
  
  document.getElementById('game-meta').textContent = 
    `${winnerText} | ${gameData.totalMoves} 手 | ${duration} | ${date}`;
  
  document.getElementById('total-steps').textContent = gameData.totalMoves;
}

// 格式化时长
function formatDuration(seconds) {
  if (!seconds) return '未知';
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}分${secs}秒`;
}

// 初始化 3D 场景
function init3DScene() {
  const container = document.getElementById('replayCanvas');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x667eea);

  // 创建相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: container });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // 创建棋盘
  createBoard();

  // 窗口大小调整
  window.addEventListener('resize', onWindowResize);

  // 开始渲染
  animate();
}

// 创建棋盘
function createBoard() {
  const boardSize = 15;
  const cellSize = 1;
  const boardGeometry = new THREE.BoxGeometry(boardSize * cellSize, 0.5, boardSize * cellSize);
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
  board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.receiveShadow = true;
  scene.add(board);

  // 绘制网格线
  const gridHelper = new THREE.GridHelper(boardSize * cellSize, boardSize, 0x000000, 0x000000);
  gridHelper.position.y = 0.26;
  scene.add(gridHelper);
}

// 放置棋子
function placeStone(row, col, color) {
  const cellSize = 1;
  const stoneGeometry = new THREE.SphereGeometry(0.4, 32, 32);
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: color === 1 ? 0x000000 : 0xffffff
  });
  
  const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
  stone.castShadow = true;
  
  const x = (col - 7) * cellSize;
  const z = (row - 7) * cellSize;
  stone.position.set(x, 0.65, z);
  
  scene.add(stone);
  stones.push(stone);
}

// 移除最后一个棋子
function removeLastStone() {
  if (stones.length > 0) {
    const stone = stones.pop();
    scene.remove(stone);
  }
}

// 清空所有棋子
function clearAllStones() {
  stones.forEach(stone => scene.remove(stone));
  stones = [];
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// 窗口大小调整
function onWindowResize() {
  const container = document.getElementById('replayCanvas');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// 更新 UI
function updateUI() {
  const currentStep = replayController.getCurrentStep();
  const totalSteps = replayController.getTotalSteps();
  
  document.getElementById('current-step').textContent = currentStep;
  
  // 更新进度条
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  document.getElementById('progress-fill').style.width = progress + '%';
  document.getElementById('progress-handle').style.left = progress + '%';
  
  // 更新播放按钮
  const playBtn = document.getElementById('btn-play');
  playBtn.textContent = replayController.getIsPlaying() ? '⏸' : '▶';
  playBtn.title = replayController.getIsPlaying() ? '暂停' : '播放';
}

// 渲染当前棋盘状态
function renderBoard() {
  clearAllStones();
  const board = replayController.getBoard();
  
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] !== 0) {
        placeStone(row, col, board[row][col]);
      }
    }
  }
  
  updateUI();
}

// 控制按钮事件
document.addEventListener('DOMContentLoaded', () => {
  loadReplayData();

  // 播放/暂停
  document.getElementById('btn-play').addEventListener('click', () => {
    if (replayController.getIsPlaying()) {
      replayController.pause();
    } else {
      replayController.play();
    }
    updateUI();
  });

  // 上一步
  document.getElementById('btn-prev').addEventListener('click', () => {
    replayController.pause();
    replayController.prevStep();
    renderBoard();
  });

  // 下一步
  document.getElementById('btn-next').addEventListener('click', () => {
    replayController.pause();
    replayController.nextStep();
    renderBoard();
  });

  // 第一步
  document.getElementById('btn-first').addEventListener('click', () => {
    replayController.pause();
    replayController.gotoStep(0);
    renderBoard();
  });

  // 最后一步
  document.getElementById('btn-last').addEventListener('click', () => {
    replayController.pause();
    replayController.gotoStep(replayController.getTotalSteps());
    renderBoard();
  });

  // 速度控制
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      replayController.setSpeed(speed);
      
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 进度条点击
  document.getElementById('progress-bar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const step = Math.floor(percent * replayController.getTotalSteps());
    
    replayController.pause();
    replayController.gotoStep(step);
    renderBoard();
  });

  // 进度条拖动
  const handle = document.getElementById('progress-handle');
  const progressBar = document.getElementById('progress-bar');

  handle.addEventListener('mousedown', () => {
    isDragging = true;
    replayController.pause();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const rect = progressBar.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    
    const percent = x / rect.width;
    const step = Math.floor(percent * replayController.getTotalSteps());
    
    replayController.gotoStep(step);
    renderBoard();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
});

// 监听回放控制器的步进事件
setInterval(() => {
  if (replayController && replayController.getIsPlaying()) {
    renderBoard();
  }
}, 50);

// 显示错误
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (replayController) {
    replayController.destroy();
  }
});
