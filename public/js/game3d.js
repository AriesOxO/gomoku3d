// Three.js 3D 渲染模块入口
// 整合所有 3D 子模块并提供统一接口

/**
 * 初始化 Three.js 场景
 */
function initThreeJS() {
  const canvas = document.getElementById('gameCanvas');
  
  // 初始化场景
  const { scene, camera, renderer } = initScene(canvas);
  
  // 设置光照
  setupLighting(scene);
  
  // 创建棋盘
  createBoard(scene);
  
  // 初始化棋子组
  initStonesGroup(scene);
  
  // 创建底座和粒子效果
  createBasePlatform(scene);
  createParticles(scene);
  
  // 初始化相机位置
  updateCameraPosition();
  
  // 设置输入事件
  setupInputHandlers(canvas);
  
  // 开始动画循环
  animate();
}

/**
 * 动画循环
 */
function animate() {
  requestAnimationFrame(animate);

  // 更新棋子动画
  updateStonesAnimation();

  // 悬停标记动画
  const hoverMarker = getHoverMarker();
  if (hoverMarker.visible) {
    hoverMarker.material.opacity = 0.4 + 0.2 * Math.sin(Date.now() * 0.005);
  }

  const renderer = getRenderer();
  const scene = getScene();
  const camera = getCamera();
  renderer.render(scene, camera);
}
