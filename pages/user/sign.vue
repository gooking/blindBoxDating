<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">每日签到</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <!-- 签到主卡 -->
      <view class="sign-card">
        <view class="sign-card__glow"></view>
        <text class="sign-card__label">连续签到</text>
        <view class="sign-card__days-wrap">
          <text class="sign-card__days">{{ continueDay }}</text>
          <text class="sign-card__unit">天</text>
        </view>
        <text class="sign-card__desc">
          今日签到可获得
          <text class="sign-card__score">{{ todayScore }}</text>
          积分
        </text>
        <view
          class="sign-btn"
          :class="{ signed: hasSigned }"
          @click="doSign"
        >
          <text>{{ hasSigned ? '✓ 今日已签到' : '✨ 立即签到' }}</text>
        </view>
      </view>

      <!-- 签到规则 -->
      <view class="rules-card" v-if="signRules.length > 0">
        <text class="card-title">签到奖励规则</text>
        <view class="rules-grid">
          <view class="rule-item" v-for="rule in signRules" :key="rule.continueDay">
            <text class="rule-item__day">第{{ rule.continueDay }}天</text>
            <text class="rule-item__score">+{{ rule.score }}</text>
            <text class="rule-item__unit">积分</text>
          </view>
        </view>
      </view>

      <!-- 签到记录 -->
      <view class="logs-card">
        <text class="card-title">最近签到记录</text>
        <view v-if="signLogs.length === 0" class="empty-state">
          <text class="empty-text">暂无签到记录</text>
        </view>
        <view class="log-item" v-for="item in signLogs" :key="item.id">
          <text class="log-date">{{ item.dateAdd }}</text>
          <text class="log-score">+{{ item.score }} 积分</text>
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
      hasSigned: false,
      continueDay: 0,
      todayScore: 0,
      signRules: [],
      signLogs: [],
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadSignInfo()
    this.loadSignRules()
    this.loadSignLogs()
  },
  methods: {
    async loadSignInfo() {
      const res = await this.$wxapi.scoreTodaySignedInfo(this.token)
      if (res.code === 0) {
        this.hasSigned = true
        this.continueDay = res.data.continueDay || 0
        this.todayScore = res.data.score || 0
      } else { this.hasSigned = false }
    },
    async loadSignRules() {
      const res = await this.$wxapi.scoreSignRules()
      if (res.code === 0) {
        this.signRules = res.data || []
        if (!this.hasSigned && this.signRules.length > 0) this.todayScore = this.signRules[0].score || 0
      }
    },
    async loadSignLogs() {
      const res = await this.$wxapi.scoreSignLogs({ token: this.token, page: 1, pageSize: 30 })
      if (res.code === 0) this.signLogs = res.data.result || []
    },
    async doSign() {
      if (this.hasSigned) { uni.showToast({ title: '今日已签到', icon: 'none' }); return }
      uni.showLoading({ title: '签到中...' })
      const res = await this.$wxapi.scoreSign(this.token)
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: '签到成功！', icon: 'success' })
        this.hasSigned = true
        this.loadSignInfo(); this.loadSignLogs()
      } else { uni.showToast({ title: res.msg || '签到失败', icon: 'none' }) }
    },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(180deg, #1a0533 0%, #0d0118 40%); display: flex; flex-direction: column; }
.status-bar { flex-shrink: 0; }
.nav-bar {
  display: flex; align-items: center;
  padding: 0 32rpx; box-sizing: border-box; flex-shrink: 0;
  &__back { font-size: 56rpx; color: #c084fc; width: 80rpx; line-height: 1; }
  &__title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #f0e6ff; }
  &__placeholder { width: 80rpx; }
}
.content-scroll { flex: 1; padding: 0 24rpx; }

.sign-card {
  position: relative;
  background: linear-gradient(135deg, #2d0f52, #7c3aed 60%, #c084fc);
  border-radius: 32rpx; padding: 56rpx 40rpx;
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 48rpx rgba(124, 58, 237, 0.4);
  overflow: hidden;
  &__glow {
    position: absolute; top: -80rpx; right: -80rpx;
    width: 300rpx; height: 300rpx; border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }
  &__label { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-bottom: 16rpx; }
  &__days-wrap { display: flex; align-items: baseline; gap: 8rpx; margin-bottom: 16rpx; }
  &__days { font-size: 120rpx; font-weight: 900; color: #fff; line-height: 1; }
  &__unit { font-size: 32rpx; color: rgba(255,255,255,0.8); }
  &__desc { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-bottom: 48rpx; }
  &__score { font-size: 32rpx; font-weight: 800; color: #f5c842; }
}
.sign-btn {
  height: 88rpx; width: 320rpx;
  background: rgba(255,255,255,0.95);
  border-radius: 9999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 800; color: #7c3aed;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2);
  &.signed { background: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); box-shadow: none; }
}

.card-title { display: block; font-size: 28rpx; font-weight: 700; color: #c084fc; margin-bottom: 24rpx; }

.rules-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx; padding: 32rpx; margin-bottom: 24rpx;
}
.rules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.rule-item {
  background: rgba(13, 1, 24, 0.5); border: 1rpx solid rgba(192,132,252,0.1);
  border-radius: 16rpx; padding: 16rpx 12rpx;
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  &__day { font-size: 22rpx; color: #8b7aa0; }
  &__score { font-size: 32rpx; font-weight: 800; color: #f5c842; }
  &__unit { font-size: 20rpx; color: #5b4d6b; }
}

.logs-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx; padding: 32rpx; margin-bottom: 32rpx;
}
.empty-state { text-align: center; padding: 40rpx 0; }
.empty-text { font-size: 26rpx; color: #5b4d6b; }
.log-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 0; border-bottom: 1rpx solid rgba(192,132,252,0.08);
  &:last-child { border-bottom: none; }
}
.log-date { font-size: 24rpx; color: #8b7aa0; }
.log-score { font-size: 28rpx; font-weight: 700; color: #10b981; }
.bottom-safe { height: 60rpx; }
</style>
