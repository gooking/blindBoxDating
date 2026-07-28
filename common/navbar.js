/**
 * 获取导航栏安全区域信息
 * 解决微信小程序右上角胶囊按钮遮挡问题
 *
 * @returns {Object}
 *   statusBarHeight  - 状态栏高度 (px)
 *   navBarHeight     - 导航栏内容区高度 (px)，与胶囊垂直居中对齐
 *   totalNavHeight   - 状态栏 + 导航栏总高度 (px)
 *   menuButtonRight  - 胶囊按钮右侧留白宽度 (px)，header 右 padding 需设为此值
 *   menuButtonWidth  - 胶囊按钮宽度 (px)
 */
export function getNavBarInfo() {
  const sysInfo = uni.getSystemInfoSync()
  const statusBarHeight = sysInfo.statusBarHeight || 20

  let navBarHeight = 44
  let menuButtonRight = 16
  let menuButtonWidth = 87

  // #ifdef MP-WEIXIN
  try {
    const menuBtn = uni.getMenuButtonBoundingClientRect()
    // 导航栏高度 = 胶囊上下对称留白 * 2 + 胶囊自身高度
    const menuTop = menuBtn.top - statusBarHeight
    navBarHeight = menuBtn.height + menuTop * 2
    // 右侧留白 = 屏幕宽度 - 胶囊左边缘
    menuButtonRight = sysInfo.windowWidth - menuBtn.left
    menuButtonWidth = menuBtn.width
  } catch (e) {
    navBarHeight = 44
    menuButtonRight = 87
  }
  // #endif

  // #ifdef H5
  navBarHeight = 44
  menuButtonRight = 0
  menuButtonWidth = 0
  // #endif

  return {
    statusBarHeight,
    navBarHeight,
    totalNavHeight: statusBarHeight + navBarHeight,
    menuButtonRight,
    menuButtonWidth,
  }
}
