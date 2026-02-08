// 主入口文件
// 负责初始化应用程序

/**
 * 应用程序初始化
 */
function initApp() {
  // 初始化 UI 事件监听器
  initUIListeners();
  
  console.log('🎮 3D 五子棋已加载');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
