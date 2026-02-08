// 棋子模块
// 负责棋子的创建、动画和管理

let stonesGroup;

/**
 * 初始化棋子组
 */
function initStonesGroup(scene) {
  stonesGroup = new THREE.Group();
  scene.add(stonesGroup);
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
  addMoveHighlight(x, z, color);
}

/**
 * 添加落子高亮标记
 */
function addMoveHighlight(x, z, color) {
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
  getScene().add(glow);
}

/**
 * 移除上一步的高亮标记
 */
function removeLastMoveHighlight() {
  const scene = getScene();
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
 * 更新棋子动画
 */
function updateStonesAnimation() {
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
}
