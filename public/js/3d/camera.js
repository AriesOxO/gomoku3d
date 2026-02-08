// 相机控制模块
// 负责相机位置和视角的控制

let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 22 };

/**
 * 更新相机位置
 */
function updateCameraPosition() {
  const camera = getCamera();
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
 * 旋转相机
 */
function rotateCamera(dx, dy) {
  cameraAngle.theta -= dx * 0.005;
  cameraAngle.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi + dy * 0.005));
  updateCameraPosition();
}

/**
 * 缩放相机
 */
function zoomCamera(delta) {
  cameraAngle.radius = Math.max(12, Math.min(35, cameraAngle.radius + delta));
  updateCameraPosition();
}

/**
 * 窗口大小调整处理
 */
function onResize() {
  const camera = getCamera();
  const renderer = getRenderer();
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
