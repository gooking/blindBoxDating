<template>
  <view class="nav-bar" :style="{ background: background }">
    <view class="nav-bar__status" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar__content">
      <view class="nav-bar__left" @click="handleBack" v-if="showBack">
        <text class="nav-bar__back-icon" :style="{ color: iconColor }">‹</text>
      </view>
      <view class="nav-bar__left" v-else></view>
      <view class="nav-bar__title" :style="{ color: titleColor }">
        <slot name="title">{{ title }}</slot>
      </view>
      <view class="nav-bar__right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
    title: { type: String, default: '' },
    background: { type: String, default: '#1a0533' },
    titleColor: { type: String, default: '#f0e6ff' },
    iconColor: { type: String, default: '#c084fc' },
    showBack: { type: Boolean, default: true },
    delta: { type: Number, default: 1 }
  },
  data() {
    return { statusBarHeight: 0 }
  },
  created() {
    const info = uni.getSystemInfoSync()
    this.statusBarHeight = info.statusBarHeight || 0
  },
  methods: {
    handleBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack({ delta: this.delta })
      } else {
        uni.switchTab({ url: '/pages/index/index' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.nav-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 999;
  &__content {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 24rpx;
  }
  &__left {
    width: 80rpx;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  &__back-icon {
    font-size: 56rpx;
    line-height: 1;
  }
  &__title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__right {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
