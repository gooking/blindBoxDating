<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">我的钱包</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="balance-card__glow"></view>
      <text class="balance-card__label">可用余额（元）</text>
      <text class="balance-card__num">{{ userAmount.balance || '0.00' }}</text>
      <text class="balance-card__freeze" v-if="userAmount.freeze > 0">冻结: ¥{{ userAmount.freeze }}</text>
      <view class="balance-card__actions">
        <view class="balance-action" @click="goRecharge">
          <text class="balance-action__icon">💳</text>
          <text class="balance-action__label">充值</text>
        </view>
      </view>
    </view>

    <!-- 明细标题 -->
    <view class="section-header">
      <text class="section-title">资金明细</text>
    </view>

    <scroll-view scroll-y class="log-scroll" @scrolltolower="loadMore">
      <view v-if="loading && cashList.length === 0" class="loading-wrap">
        <view class="loading-orb"></view>
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="!loading && cashList.length === 0" class="empty-state">
        <text class="empty-icon">💸</text>
        <text class="empty-text">暂无资金记录</text>
      </view>
      <view v-else>
        <view class="log-item" v-for="item in cashList" :key="item.id">
          <view class="log-item__info">
            <text class="log-item__remark">{{ item.typeStr }}</text>
            <text class="log-item__date">{{ item.dateAdd }}</text>
            <text class="log-item__sub-remark" v-if="item.remark">{{ item.remark }}</text>
          </view>
          <view class="log-item__right">
            <text class="log-item__amount" :class="item.behavior === 0 ? 'income' : 'expense'">
              {{ item.behavior === 0 ? '+' : '-' }}{{ item.amount }}
            </text>
            <text class="log-item__balance">余: {{ item.balance }}</text>
          </view>
        </view>
        <view class="list-footer" v-if="noMore"><text>已显示全部记录</text></view>
        <view class="list-footer" v-else-if="loading"><text>加载中...</text></view>
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
      userAmount: {},
      cashList: [],
      page: 1,
      pageSize: 20,
      loading: false,
      noMore: false,
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadAmount()
    this.loadCashLogs()
  },
  methods: {
    async loadAmount() {
      const res = await this.$wxapi.userAmount(this.token)
      if (res.code === 0) this.userAmount = res.data
    },
    async loadCashLogs() {
      if (this.loading || this.noMore) return
      this.loading = true
      const res = await this.$wxapi.cashLogsV3({ token: this.token, page: this.page, pageSize: this.pageSize })
      this.loading = false
      if (res.code === 0) {
        const list = res.data.result || []
        this.cashList = this.page === 1 ? list : [...this.cashList, ...list]
        if (list.length < this.pageSize) this.noMore = true
      }
    },
    loadMore() {
      if (this.loading || this.noMore) return
      this.page++
      this.loadCashLogs()
    },
    goRecharge() { uni.navigateTo({ url: '/pages/user/recharge' }) },
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
.balance-card {
  position: relative;
  margin: 0 24rpx 32rpx;
  background: linear-gradient(135deg, #2d0f52, #7c3aed 60%, #c084fc);
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 12rpx 48rpx rgba(124, 58, 237, 0.4);
  &__glow {
    position: absolute;
    top: -60rpx; right: -60rpx;
    width: 300rpx; height: 300rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }
  &__label { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-bottom: 16rpx; }
  &__num { font-size: 88rpx; font-weight: 900; color: #fff; margin-bottom: 8rpx; }
  &__freeze { font-size: 22rpx; color: rgba(255,255,255,0.6); margin-bottom: 32rpx; }
  &__actions { display: flex; gap: 48rpx; }
}
.balance-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  &__icon { font-size: 44rpx; }
  &__label { font-size: 22rpx; color: rgba(255,255,255,0.85); }
}
.section-header { padding: 0 40rpx 16rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #8b7aa0; }
.log-scroll { flex: 1; padding: 0 24rpx; }
.loading-wrap {
  display: flex; flex-direction: column; align-items: center; padding: 80rpx 0;
}
.loading-orb {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); opacity: 0.7; } }
.loading-text { margin-top: 24rpx; font-size: 26rpx; color: #8b7aa0; }
.empty-state {
  display: flex; flex-direction: column; align-items: center; padding: 80rpx 48rpx;
  .empty-icon { font-size: 80rpx; margin-bottom: 24rpx; }
  .empty-text { font-size: 28rpx; color: #8b7aa0; }
}
.log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.12);
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  &__info { flex: 1; }
  &__remark { display: block; font-size: 28rpx; color: #c4b5d4; margin-bottom: 8rpx; }
  &__date { font-size: 22rpx; color: #5b4d6b; }
  &__sub-remark { display: block; font-size: 22rpx; color: #7a6890; margin-top: 6rpx; }
  &__right { text-align: right; }
  &__amount { display: block; font-size: 36rpx; font-weight: 800; margin-bottom: 4rpx; &.income { color: #10b981; } &.expense { color: #c084fc; } }
  &__balance { font-size: 20rpx; color: #5b4d6b; }
}
.list-footer { text-align: center; font-size: 24rpx; color: #5b4d6b; padding: 32rpx 0 60rpx; }
</style>
