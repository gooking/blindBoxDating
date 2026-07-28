<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">购买解锁次数</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <!-- 当前余额 -->
      <view class="balance-card">
        <view class="balance-card__ring">
          <text class="balance-card__icon">🔑</text>
        </view>
        <view class="balance-card__info">
          <text class="balance-card__num">{{ balance.pullTimes }}</text>
          <text class="balance-card__label">当前解锁次数</text>
        </view>
        <text class="balance-card__tip">每次解锁消耗 1 次</text>
      </view>

      <!-- 套餐选择 -->
      <view class="section-title">选择套餐</view>
      <view class="packages-grid">
        <!-- 规则套餐 -->
        <view
          class="pkg-card"
          v-for="pkg in packages"
          :key="pkg.times"
          :class="{ selected: !customSelected && selectedPkg && selectedPkg.times === pkg.times }"
          @click="selectPkg(pkg)"
        >
          <view class="pkg-card__top">
            <text class="pkg-times">{{ pkg.times }}</text>
            <text class="pkg-unit">次</text>
          </view>
          <view v-if="pkg.gift > 0" class="pkg-gift">
            <text>+{{ pkg.gift }}次赠送</text>
          </view>
          <view class="pkg-card__bottom">
            <text class="pkg-price">¥{{ pkg.price }}</text>
          </view>
          <view v-if="pkg.gift > 0" class="pkg-hot-badge">热门</view>
        </view>

        <!-- 自定义套餐卡片 -->
        <view
          class="pkg-card pkg-card--custom"
          :class="{ selected: customSelected }"
          @click="selectCustom"
        >
          <view class="pkg-card__top">
            <text class="pkg-times pkg-times--custom">自定义</text>
          </view>
          <view class="custom-input-wrap" @click.stop>
            <input
              class="custom-input"
              type="number"
              v-model="customTimes"
              placeholder="输入次数"
              placeholder-class="custom-input-placeholder"
              @input="onCustomInput"
              @focus="selectCustom"
            />
            <text class="custom-input-unit">次</text>
          </view>
          <view class="pkg-card__bottom">
            <text class="pkg-price" v-if="customTimesNum > 0">¥{{ customPrice }}</text>
            <text class="pkg-price pkg-price--dim" v-else>¥--</text>
          </view>
        </view>
      </view>

      <!-- 赠送规则说明 -->
      <view class="rule-card" v-if="rules.length > 0">
        <text class="rule-title">🎁 充值赠送规则</text>
        <view class="rule-item" v-for="rule in rules" :key="rule.id">
          <text class="rule-text">购买 <text class="rule-num">{{ rule.confine }}</text> 次，赠送 <text class="rule-num gold">{{ rule.send }}</text> 次</text>
        </view>
      </view>

      <!-- 确认支付 -->
      <view class="pay-btn" @click="doPay" :class="{ disabled: !canPay }">
        <view v-if="canPay">
          <text>支付 ¥{{ currentPrice }}</text>
          <text class="pay-btn-sub"> · 获得 {{ currentTotalTimes }} 次解锁</text>
        </view>
        <text v-else>请先选择套餐</text>
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
      unitPrice: 10, // 单价（元/次），从盲盒设置接口读取
      balance: { pullTimes: 0 },
      rules: [],
      packages: [],
      selectedPkg: null,
      customSelected: false,
      customTimes: '',
      paying: false,
    }
  },
  computed: {
    customTimesNum() {
      const n = parseInt(this.customTimes)
      return isNaN(n) || n <= 0 ? 0 : n
    },
    customPrice() {
      return (this.customTimesNum * this.unitPrice).toFixed(2).replace(/\.00$/, '')
    },
    canPay() {
      if (this.paying) return false
      if (this.customSelected) return this.customTimesNum > 0
      return !!this.selectedPkg
    },
    // 当前选中的购买次数（不含赠送）
    currentBuyTimes() {
      if (this.customSelected) return this.customTimesNum
      return this.selectedPkg ? this.selectedPkg.times : 0
    },
    // 当前应付金额
    currentPrice() {
      if (this.customSelected) return this.customPrice
      return this.selectedPkg ? this.selectedPkg.price : 0
    },
    // 购买后实际获得次数（含赠送）
    currentTotalTimes() {
      if (this.customSelected) return this.customTimesNum
      return this.selectedPkg ? this.selectedPkg.times + this.selectedPkg.gift : 0
    },
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadBalance()
    this.loadSetting()
    this.loadRules()
  },
  methods: {
    async loadBalance() {
      if (!this.token) return
      const res = await this.$wxapi.blindBoxFriendsBalance(this.token)
      if (res.code === 0) this.balance = res.data
    },
    async loadSetting() {
      const res = await this.$wxapi.blindBoxFriendsSetting()
      if (res.code === 0 && res.data && res.data.pullAmount) {
        this.unitPrice = res.data.pullAmount
        // 如果规则已经加载完毕，用最新单价重新计算套餐价格
        if (this.rules.length > 0) {
          this.rebuildPackages()
        }
      }
    },
    async loadRules() {
      const res = await this.$wxapi.blindBoxFriendsRechargeRule()
      if (res.code === 0 && res.data && res.data.length > 0) {
        this.rules = res.data
        this.rebuildPackages()
      }
    },
    rebuildPackages() {
      this.packages = this.rules.map(rule => ({
        times: rule.confine,
        gift: rule.send,
        price: parseFloat((rule.confine * this.unitPrice).toFixed(2)),
      }))
    },
    selectPkg(pkg) {
      this.selectedPkg = pkg
      this.customSelected = false
    },
    selectCustom() {
      this.customSelected = true
      this.selectedPkg = null
    },
    onCustomInput() {
      this.customSelected = true
      this.selectedPkg = null
    },
    async doPay() {
      if (!this.token) {
        uni.navigateTo({ url: '/pages/login/login' })
        return
      }
      if (!this.canPay) return
      this.paying = true

      const pullTimes = this.currentBuyTimes
      uni.showLoading({ title: '支付中...' })
      const res = await this.$wxapi.blindBoxFriendsBuyPullTimes({
        token: this.token,
        pullTimes
      })
      uni.hideLoading()
      this.paying = false

      if (res.code === 0) {
        uni.showToast({ title: '购买成功！', icon: 'success' })
        this.loadBalance()
      } else if (res.code == 20002) {
        // 余额不足，拉起在线支付
        await this.$pay.pay('wxpay', {}, res.data,
          '购买解锁次数:' + pullTimes, '购买解锁次数:' + pullTimes, {
            type: 21,
            pullTimes
          },
          () => {
            this.loadBalance()
            uni.showToast({ title: '购买成功！', icon: 'success' })
          },
          () => {
            // 支付失败/取消
          }
        )
      } else {
        uni.showToast({ title: res.msg || '支付失败', icon: 'none' })
      }
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
.content-scroll { flex: 1; padding: 0 24rpx; box-sizing: border-box; }

.balance-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: linear-gradient(135deg, rgba(44, 15, 82, 0.9), rgba(124, 58, 237, 0.3));
  border: 1rpx solid rgba(192, 132, 252, 0.3);
  border-radius: 28rpx;
  padding: 32rpx 36rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.25);
  &__ring {
    width: 96rpx; height: 96rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #c084fc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;
    flex-shrink: 0;
  }
  &__info { flex: 1; }
  &__num { display: block; font-size: 56rpx; font-weight: 900; color: #f5c842; }
  &__label { font-size: 24rpx; color: #8b7aa0; }
  &__tip { font-size: 22rpx; color: #b59bd5; }
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #8b7aa0;
  margin-bottom: 20rpx;
  padding-left: 8rpx;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 32rpx;
}
.pkg-card {
  position: relative;
  background: rgba(34, 10, 64, 0.7);
  border: 2rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;
  &.selected {
    border-color: #c084fc;
    background: rgba(124, 58, 237, 0.2);
    box-shadow: 0 0 24rpx rgba(192, 132, 252, 0.4);
  }
  &__top { display: flex; align-items: baseline; gap: 6rpx; }
  &__bottom { width: 100%; text-align: center; }
  &--custom { cursor: pointer; }
}
.pkg-times { font-size: 56rpx; font-weight: 900; color: #f0e6ff; }
.pkg-times--custom { font-size: 30rpx; color: #c084fc; font-weight: 700; }
.pkg-unit { font-size: 24rpx; color: #8b7aa0; }
.pkg-gift {
  background: rgba(16, 185, 129, 0.15);
  border: 1rpx solid rgba(16, 185, 129, 0.3);
  border-radius: 9999rpx;
  padding: 4rpx 16rpx;
  font-size: 20rpx;
  color: #10b981;
}
.pkg-price { font-size: 32rpx; font-weight: 800; color: #f5c842; }
.pkg-price--dim { color: #5b4d6b; font-weight: 400; }
.pkg-hot-badge {
  position: absolute;
  top: 0; right: 0;
  background: linear-gradient(135deg, #ec4899, #f0abfc);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 0 22rpx 0 16rpx;
  font-weight: 700;
}

/* 自定义输入区 */
.custom-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(13, 1, 24, 0.6);
  border: 1rpx solid rgba(192, 132, 252, 0.25);
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  width: 100%;
  box-sizing: border-box;
}
.custom-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #f0e6ff;
  text-align: center;
  height: 60rpx;
  line-height: 60rpx;
}
.custom-input-placeholder { color: #5b4d6b; font-size: 24rpx; }
.custom-input-unit {
  font-size: 24rpx;
  color: #8b7aa0;
  flex-shrink: 0;
}

.rule-card {
  background: rgba(245, 200, 66, 0.06);
  border: 1rpx solid rgba(245, 200, 66, 0.2);
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 32rpx;
}
.rule-title {
  display: block;
  font-size: 26rpx;
  color: #f5c842;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.rule-item { margin-bottom: 10rpx; }
.rule-text { font-size: 24rpx; color: #8b7aa0; }
.rule-num { color: #c084fc; font-weight: 700; }
.rule-num.gold { color: #f5c842; }

.pay-btn {
  height: 100rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc, #f0abfc);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.5);
  letter-spacing: 2rpx;
  &.disabled { opacity: 0.5; }
}
.pay-btn-sub { font-size: 24rpx; font-weight: 400; opacity: 0.85; }
.bottom-safe { height: 60rpx; }
</style>
