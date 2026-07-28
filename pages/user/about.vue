<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">关于我们</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <!-- Logo 区 -->
      <view class="logo-section">
        <view class="logo-ring">
          <view class="logo-core"><text class="logo-emoji">💝</text></view>
        </view>
        <text class="logo-title">盲盒交友</text>
        <text class="logo-sub">BLIND BOX DATING</text>
        <text class="logo-version">v{{ version }}</text>
      </view>

      <!-- 内容 -->
      <view class="content-card" v-if="htmlContent">
        <mp-html :content="htmlContent"></mp-html>
      </view>

      <view v-else class="intro-card">
        <text class="intro-title">✨ 关于盲盒交友</text>
        <text class="intro-text">盲盒交友是一款充满惊喜的社交小程序。每个人都可以将自己的信息放入神秘盲盒，等待有缘人解锁。我们相信每一次相遇都是命运的安排。</text>
        <view class="intro-divider"></view>
        <text class="intro-title">🎯 玩法说明</text>
        <view class="intro-step" v-for="step in steps" :key="step.num">
          <view class="intro-step__num">{{ step.num }}</view>
          <view class="intro-step__info">
            <text class="intro-step__title">{{ step.title }}</text>
            <text class="intro-step__desc">{{ step.desc }}</text>
          </view>
        </view>
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
      htmlContent: '',
      steps: [
        { num: '01', title: '投放盲盒', desc: '填写基本信息和微信号，上传一张自拍照，支付费用后等待审核上线' },
        { num: '02', title: '匹配发现', desc: '系统每次为你匹配5个神秘盲盒，展示对方昵称和颜值评分' },
        { num: '03', title: '解锁联系', desc: '看到心动的盲盒，花费1次解锁机会，即可查看对方照片和微信号' },
        { num: '04', title: '开启缘分', desc: '加上微信，开启你们的缘分故事' },
      ]
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
    this.loadContent()
  },
  methods: {
    async loadContent() {
      try {
        const res = await this.$wxapi.cmsPage('aboutus')
        if (res.code === 0 && res.data && res.data.info) {
          this.htmlContent = res.data.info.content || ''
        }
      } catch (e) {}
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

.logo-section {
  display: flex; flex-direction: column; align-items: center;
  padding: 48rpx 0 56rpx;
}
.logo-ring {
  width: 200rpx; height: 200rpx; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  padding: 4rpx;
  box-shadow: 0 0 60rpx rgba(192, 132, 252, 0.5);
  margin-bottom: 32rpx;
}
.logo-core {
  width: 100%; height: 100%; border-radius: 50%;
  background: #1a0533;
  display: flex; align-items: center; justify-content: center;
}
.logo-emoji { font-size: 96rpx; }
.logo-title {
  font-size: 48rpx; font-weight: 900;
  background: linear-gradient(135deg, #c084fc, #f5c842);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 6rpx; margin-bottom: 8rpx;
}
.logo-sub { font-size: 20rpx; color: #5b4d6b; letter-spacing: 4rpx; margin-bottom: 16rpx; }
.logo-version {
  font-size: 22rpx; color: #8b7aa0;
  background: rgba(192, 132, 252, 0.1);
  padding: 6rpx 20rpx; border-radius: 9999rpx;
  border: 1rpx solid rgba(192, 132, 252, 0.2);
}

.content-card {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.intro-card {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  margin-bottom: 32rpx;
}
.intro-title {
  display: block; font-size: 30rpx; font-weight: 700; color: #c084fc;
  margin-bottom: 20rpx;
}
.intro-text {
  display: block; font-size: 26rpx; color: #8b7aa0; line-height: 1.8;
  margin-bottom: 32rpx;
}
.intro-divider {
  height: 1rpx; background: rgba(192, 132, 252, 0.1); margin-bottom: 32rpx;
}
.intro-step {
  display: flex; gap: 24rpx; margin-bottom: 28rpx;
  &:last-child { margin-bottom: 0; }
  &__num {
    width: 56rpx; height: 56rpx; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #c084fc);
    display: flex; align-items: center; justify-content: center;
    font-size: 22rpx; color: #fff; font-weight: 800; flex-shrink: 0;
  }
  &__info { flex: 1; padding-top: 4rpx; }
  &__title { display: block; font-size: 28rpx; font-weight: 700; color: #f0e6ff; margin-bottom: 8rpx; }
  &__desc { display: block; font-size: 24rpx; color: #8b7aa0; line-height: 1.6; }
}
.bottom-safe { height: 60rpx; }
</style>
