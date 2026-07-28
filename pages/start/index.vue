<template>
  <view class="page">
    <!-- 背景光晕 -->
    <view class="orb orb1"></view>
    <view class="orb orb2"></view>
    <view class="orb orb3"></view>
    <view class="orb orb4"></view>

    <!-- 主内容 -->
    <view class="content" :class="{ visible: show }">
      <!-- Logo -->
      <view class="logo-wrap">
        <view class="logo-ring outer">
          <view class="logo-ring mid">
            <view class="logo-ring inner">
              <view class="logo-core">
                <text class="logo-emoji">💝</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <text class="title">盲 盒 交 友</text>
      <text class="subtitle">BLIND BOX DATING</text>
      <text class="slogan">每一次解锁，都是命运的安排</text>

      <!-- 特色说明 -->
      <view class="features">
        <view class="feature-item">
          <text class="feature-icon">📦</text>
          <text class="feature-text">神秘投放</text>
        </view>
        <view class="feature-dot">·</view>
        <view class="feature-item">
          <text class="feature-icon">🔓</text>
          <text class="feature-text">惊喜解锁</text>
        </view>
        <view class="feature-dot">·</view>
        <view class="feature-item">
          <text class="feature-icon">💫</text>
          <text class="feature-text">缘分相遇</text>
        </view>
      </view>
    </view>

    <!-- 底部进度条 -->
    <view class="progress-wrap" :class="{ visible: show }">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
      <text class="progress-text">正在加载...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      progress: 0,
    }
  },
  onLoad() {
    setTimeout(() => { this.show = true }, 100)
    // 模拟加载进度
    let p = 0
    const timer = setInterval(() => {
      p += Math.random() * 25
      if (p >= 100) {
        p = 100
        clearInterval(timer)
        setTimeout(() => this.goMain(), 400)
      }
      this.progress = Math.min(p, 100)
    }, 300)
  },
  methods: {
    goMain() {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  width: 100vw;
  height: 100vh;
  background: #0d0118;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

/* 背景光晕 */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100rpx);
  pointer-events: none;
}
.orb1 {
  width: 600rpx; height: 600rpx;
  background: rgba(124, 58, 237, 0.4);
  top: -150rpx; left: -150rpx;
  animation: drift1 8s ease-in-out infinite;
}
.orb2 {
  width: 500rpx; height: 500rpx;
  background: rgba(236, 72, 153, 0.3);
  bottom: -100rpx; right: -100rpx;
  animation: drift2 10s ease-in-out infinite;
}
.orb3 {
  width: 400rpx; height: 400rpx;
  background: rgba(192, 132, 252, 0.25);
  bottom: 200rpx; left: -50rpx;
  animation: drift3 12s ease-in-out infinite;
}
.orb4 {
  width: 300rpx; height: 300rpx;
  background: rgba(245, 200, 66, 0.15);
  top: 200rpx; right: 0;
  animation: drift1 9s ease-in-out infinite reverse;
}

@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60rpx, 40rpx) scale(1.05); }
  66% { transform: translate(-40rpx, 60rpx) scale(0.98); }
}
@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-80rpx, -60rpx) scale(1.08); }
}
@keyframes drift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40% { transform: translate(50rpx, -80rpx) scale(1.1); }
  80% { transform: translate(30rpx, 50rpx) scale(0.95); }
}

/* 主内容 */
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(40rpx);
  transition: opacity 0.8s ease, transform 0.8s ease;
  &.visible { opacity: 1; transform: translateY(0); }
}

/* Logo 环 */
.logo-wrap { margin-bottom: 60rpx; }
.logo-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  &.outer {
    width: 280rpx; height: 280rpx;
    background: rgba(124, 58, 237, 0.12);
    border: 2rpx solid rgba(192, 132, 252, 0.15);
    animation: rotate-slow 20s linear infinite;
  }
  &.mid {
    width: 230rpx; height: 230rpx;
    background: rgba(124, 58, 237, 0.2);
    border: 2rpx solid rgba(192, 132, 252, 0.3);
    animation: rotate-slow 15s linear infinite reverse;
  }
  &.inner {
    width: 180rpx; height: 180rpx;
    background: linear-gradient(135deg, rgba(124,58,237,0.5), rgba(192,132,252,0.4));
    border: 2rpx solid rgba(192, 132, 252, 0.6);
    box-shadow: 0 0 60rpx rgba(192, 132, 252, 0.5);
  }
}
@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.logo-core {
  width: 100%; height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
.logo-emoji { font-size: 88rpx; }

.title {
  font-size: 56rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #c084fc 0%, #f0abfc 50%, #f5c842 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 8rpx;
  margin-bottom: 12rpx;
}
.subtitle {
  font-size: 22rpx;
  color: #5b4d6b;
  letter-spacing: 6rpx;
  margin-bottom: 32rpx;
}
.slogan {
  font-size: 26rpx;
  color: #8b7aa0;
  margin-bottom: 64rpx;
  letter-spacing: 2rpx;
}

.features {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.feature-icon { font-size: 40rpx; }
.feature-text { font-size: 22rpx; color: #8b7aa0; }
.feature-dot { font-size: 28rpx; color: #3d2a52; }

/* 进度条 */
.progress-wrap {
  position: absolute;
  bottom: 120rpx;
  left: 80rpx;
  right: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  opacity: 0;
  transition: opacity 0.8s ease 0.4s;
  &.visible { opacity: 1; }
}
.progress-bar {
  width: 100%;
  height: 4rpx;
  background: rgba(192, 132, 252, 0.15);
  border-radius: 9999rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #c084fc, #f5c842);
  border-radius: 9999rpx;
  transition: width 0.3s ease;
  box-shadow: 0 0 12rpx rgba(192, 132, 252, 0.6);
}
.progress-text { font-size: 22rpx; color: #5b4d6b; }
</style>
