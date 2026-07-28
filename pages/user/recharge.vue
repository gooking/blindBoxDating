<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">余额充值</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="balance-card">
        <view class="balance-card__glow"></view>
        <text class="balance-card__label">当前余额（元）</text>
        <text class="balance-card__num">{{ balance }}</text>
      </view>

      <view class="amounts-card" v-if="rechargeSendRules.length > 0">
        <text class="card-title">快速选择</text>
        <view class="amounts-grid">
          <view
            class="amount-item"
            v-for="rule in rechargeSendRules"
            :key="rule.confine"
            :class="{ active: amount == rule.confine }"
            @click="amount = rule.confine"
          >
            <text class="amount-num">¥{{ rule.confine }}</text>
            <text class="amount-gift" v-if="rule.send > 0">赠 ¥{{ rule.send }}</text>
          </view>
        </view>
      </view>

      <view class="custom-amount-card">
        <text class="card-title">自定义金额</text>
        <view class="input-wrap">
          <text class="currency-sign">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="amount"
            placeholder="请输入充值金额"
            placeholder-class="ph"
          />
        </view>
      </view>

      <view class="tips-card">
        <text class="tips-title">💡 温馨提示</text>
        <text class="tips-item">· 充值金额实时到账</text>
        <text class="tips-item">· 充值记录可在「我的钱包」查看</text>
      </view>

      <view class="submit-btn" @click="submit">立即充值</view>
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
      balance: '0.00',
      amount: '',
      rechargeSendRules: [],
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadData()
  },
  methods: {
    async loadData() {
      const res = await this.$wxapi.userAmount(this.token)
      if (res.code === 0) this.balance = (res.data.balance || 0).toFixed(2)
      const res2 = await this.$wxapi.rechargeSendRules()
      if (res2.code === 0) this.rechargeSendRules = res2.data || []
    },
    async submit() {
      if (!this.amount || Number(this.amount) <= 0) {
        uni.showToast({ title: '请输入正确的充值金额', icon: 'none' })
        return
      }
	  const payRes = await this.$pay.pay('wxpay', {}, this.amount,
	  	'在线充值', '在线充值', null,
	  	(res) => {
	  		// 支付成功的逻辑
	  		this.loadList(true)
	  	}, (err) => {
	  		// 支付失败的逻辑
	  	}
	  )
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

.balance-card {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #2d0f52, #7c3aed 60%, #c084fc);
  border-radius: 32rpx; padding: 48rpx 40rpx;
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 24rpx; box-shadow: 0 12rpx 48rpx rgba(124, 58, 237, 0.4);
  &__glow {
    position: absolute; top: -60rpx; right: -60rpx;
    width: 300rpx; height: 300rpx; border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }
  &__label { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-bottom: 16rpx; }
  &__num { font-size: 88rpx; font-weight: 900; color: #fff; }
}

.card-title { display: block; font-size: 28rpx; font-weight: 700; color: #8b7aa0; margin-bottom: 20rpx; }

.amounts-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx; padding: 32rpx; margin-bottom: 24rpx;
}
.amounts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.amount-item {
  background: rgba(13, 1, 24, 0.5); border: 2rpx solid rgba(192,132,252,0.15);
  border-radius: 16rpx; padding: 20rpx 12rpx;
  display: flex; flex-direction: column; align-items: center; gap: 6rpx;
  &.active { border-color: #c084fc; background: rgba(124,58,237,0.2); }
}
.amount-num { font-size: 32rpx; font-weight: 800; color: #f0e6ff; }
.amount-gift { font-size: 20rpx; color: #10b981; background: rgba(16,185,129,0.12); padding: 2rpx 10rpx; border-radius: 9999rpx; }

.custom-amount-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx; padding: 32rpx; margin-bottom: 24rpx;
}
.input-wrap {
  display: flex; align-items: center; gap: 12rpx;
  border-bottom: 1rpx solid rgba(192,132,252,0.2); padding-bottom: 16rpx;
}
.currency-sign { font-size: 48rpx; font-weight: 800; color: #f5c842; }
.amount-input { flex: 1; font-size: 48rpx; font-weight: 800; color: #f0e6ff; }
.ph { color: #5b4d6b; }

.tips-card {
  background: rgba(245,200,66,0.06); border: 1rpx solid rgba(245,200,66,0.2);
  border-radius: 24rpx; padding: 28rpx 32rpx; margin-bottom: 40rpx;
}
.tips-title { display: block; font-size: 26rpx; color: #f5c842; font-weight: 700; margin-bottom: 14rpx; }
.tips-item { display: block; font-size: 24rpx; color: #8b7aa0; line-height: 2; }

.submit-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc, #f0abfc);
  border-radius: 9999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 34rpx; font-weight: 800; color: #fff; letter-spacing: 4rpx;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.5);
  margin-bottom: 40rpx;
}
.bottom-safe { height: 40rpx; }
</style>
