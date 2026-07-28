<template>
  <view class="page">
    <!-- #ifdef H5 -->
    <!-- H5 没有原生导航栏，需要自定义 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">{{ title || '协议' }}</text>
      <view class="nav-bar__placeholder"></view>
    </view>
    <!-- #endif -->

    <scroll-view scroll-y class="content-scroll">
      <view v-if="loading" class="loading-wrap">
        <view class="loading-orb"></view>
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="content" class="content-card">
        <mp-html :content="content"></mp-html>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📄</text>
        <text class="empty-text">暂无内容</text>
      </view>
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
      key: '',
      title: '',
      content: '',
      loading: true,
    }
  },
  onLoad(options) {
    // #ifdef H5
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    // #endif
    this.key = options.key || ''
    if (this.key === 'yhxy') this.title = '用户协议'
    else if (this.key === 'ysxy') this.title = '隐私政策'
    else this.title = '协议详情'
    this.loadContent()
  },
  methods: {
    async loadContent() {
      if (!this.key) { this.loading = false; return }
      this.loading = true
      try {
        const res = await this.$wxapi.cmsPage(this.key)
        if (res.code === 0 && res.data && res.data.info) {
          this.title = res.data.info.title || this.title
          this.content = res.data.info.content || ''
        }
      } catch (e) {}
      this.loading = false
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
.content-scroll { flex: 1; padding: 0 24rpx 40rpx; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.loading-orb {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); opacity: 0.7; } }
.loading-text { margin-top: 24rpx; font-size: 26rpx; color: #8b7aa0; }
.content-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx; padding: 40rpx; color: #c4b5d4; font-size: 28rpx; line-height: 1.8;
}
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: #8b7aa0; }
</style>
