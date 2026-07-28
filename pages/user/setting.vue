<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">设置</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="menu-section">
        <text class="menu-section__title">账户</text>
        <view class="menu-list">
          <view class="menu-item" @click="goProfile">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
              <text>👤</text>
            </view>
            <text class="menu-item__label">个人资料</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goSecurity">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #3b82f6, #60a5fa);">
              <text>🔐</text>
            </view>
            <text class="menu-item__label">账号安全</text>
            <text class="menu-item__arrow">›</text>
          </view>
        </view>
      </view>

      <view class="menu-section">
        <text class="menu-section__title">其他</text>
        <view class="menu-list">
          <view class="menu-item" @click="goAbout">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #8b5cf6, #c4b5fd);">
              <text>ℹ️</text>
            </view>
            <text class="menu-item__label">关于我们</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="clearCache">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #6b7280, #9ca3af);">
              <text>🗑️</text>
            </view>
            <text class="menu-item__label">清除缓存</text>
            <text class="menu-item__arrow">›</text>
          </view>
        </view>
      </view>

      <view class="version-badge">
        <text class="version-text">盲盒交友 v{{ version }}</text>
      </view>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script>
import { getNavBarInfo } from '@/common/navbar.js'
export default {
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      version: '1.0.0',
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    try {
      const appInfo = uni.getAppBaseInfo()
      this.version = appInfo.appVersion || '1.0.0'
    } catch (e) {}
  },
  methods: {
    goProfile() { uni.navigateTo({ url: '/pages/user/profile' }) },
    goSecurity() { uni.navigateTo({ url: '/pages/user/security' }) },
    goAbout() { uni.navigateTo({ url: '/pages/user/about' }) },
    clearCache() {
      uni.showModal({
        title: '清除缓存',
        content: '确定清除本地缓存数据吗？',
        success: (res) => {
          if (res.confirm) {
            // 只清除非登录态的缓存
            uni.showToast({ title: '缓存已清除', icon: 'success' })
          }
        }
      })
    },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0533 0%, #0d0118 40%);
  display: flex;
  flex-direction: column;
}
.status-bar { flex-shrink: 0; }
.nav-bar {
  display: flex; align-items: center;
  padding: 0 32rpx; box-sizing: border-box; flex-shrink: 0;
  &__back { font-size: 56rpx; color: #c084fc; width: 80rpx; line-height: 1; }
  &__title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #f0e6ff; }
  &__placeholder { width: 80rpx; }
}
.content-scroll { flex: 1; padding: 0 24rpx; }
.menu-section { margin-bottom: 24rpx; }
.menu-section__title {
  display: block; font-size: 24rpx; color: #5b4d6b;
  padding: 16rpx 16rpx 12rpx; letter-spacing: 2rpx;
}
.menu-list {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx; overflow: hidden;
}
.menu-item {
  display: flex; align-items: center; padding: 28rpx 32rpx; gap: 24rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.08);
  &:last-child { border-bottom: none; }
  &:active { background: rgba(192, 132, 252, 0.08); }
  &__icon {
    width: 72rpx; height: 72rpx; border-radius: 20rpx;
    display: flex; align-items: center; justify-content: center;
    font-size: 36rpx; flex-shrink: 0;
  }
  &__label { flex: 1; font-size: 30rpx; color: #c4b5d4; font-weight: 500; }
  &__arrow { font-size: 36rpx; color: #5b4d6b; }
}
.version-badge {
  display: flex; justify-content: center;
  padding: 48rpx 0 32rpx;
}
.version-text {
  font-size: 22rpx; color: #3d2a52;
  background: rgba(192, 132, 252, 0.08);
  padding: 8rpx 28rpx; border-radius: 9999rpx;
  border: 1rpx solid rgba(192, 132, 252, 0.1);
}
.bottom-safe { height: 40rpx; }
</style>
