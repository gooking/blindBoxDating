<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部个人信息卡：padding-top 适配胶囊高度 -->
    <view class="profile-card">
      <view class="profile-card__bg"></view>
      <view
        class="profile-card__content"
        :style="{ paddingTop: (navBarHeight + 8) + 'px' }"
      >
        <view class="avatar-wrap" @click="goProfile">
          <image
            v-if="userInfo && userInfo.base && userInfo.base.avatarUrl"
            :src="userInfo.base.avatarUrl"
            mode="aspectFill"
            class="avatar-img"
          ></image>
          <view v-else class="avatar-placeholder">
            <text class="avatar-emoji">👤</text>
          </view>
          <view class="avatar-edit">✏️</view>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ (userInfo && userInfo.base && userInfo.base.nick) || '神秘用户' }}</text>
          <text class="profile-id">ID: {{ uid || '未登录' }}</text>
        </view>
        <view class="profile-login-btn" v-if="!token" @click="goLogin">登录/注册</view>
      </view>

      <!-- 余额统计 -->
      <view class="stats-row">
        <view class="stat-item" @click="goRecharge">
          <text class="stat-num">{{ balance.pullTimes }}</text>
          <text class="stat-label">解锁次数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goPushLogs">
          <text class="stat-num">{{ balance.pushTimes }}</text>
          <text class="stat-label">投放次数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goUnlockLogs">
          <text class="stat-num">{{ unlockCount }}</text>
          <text class="stat-label">已解锁</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <scroll-view scroll-y class="menu-scroll">
      <!-- 我的盲盒 -->
      <view class="menu-section">
        <text class="menu-section__title">我的盲盒</text>
        <view class="menu-list">
          <view class="menu-item" @click="goPushLogs">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #7c3aed, #c084fc);">
              <text>📦</text>
            </view>
            <text class="menu-item__label">投放记录</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goUnlockLogs">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #d97706, #f5c842);">
              <text>🔓</text>
            </view>
            <text class="menu-item__label">解锁记录</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goRecharge">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #ec4899, #f0abfc);">
              <text>💎</text>
            </view>
            <text class="menu-item__label">购买解锁次数</text>
            <text class="menu-item__arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 账户管理 -->
      <view class="menu-section">
        <text class="menu-section__title">账户管理</text>
        <view class="menu-list">
          <view class="menu-item" @click="goProfile">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
              <text>👤</text>
            </view>
            <text class="menu-item__label">个人资料</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goWallet">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #f59e0b, #fcd34d);">
              <text>💰</text>
            </view>
            <text class="menu-item__label">我的钱包</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goSign">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #3b82f6, #93c5fd);">
              <text>📅</text>
            </view>
            <text class="menu-item__label">每日签到</text>
            <text class="menu-item__arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 其他 -->
      <view class="menu-section">
        <text class="menu-section__title">其他</text>
        <view class="menu-list">
          <view class="menu-item" @click="goSetting">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #6b7280, #9ca3af);">
              <text>⚙️</text>
            </view>
            <text class="menu-item__label">设置</text>
            <text class="menu-item__arrow">›</text>
          </view>
          <view class="menu-item" @click="goAbout">
            <view class="menu-item__icon" style="background: linear-gradient(135deg, #8b5cf6, #c4b5fd);">
              <text>ℹ️</text>
            </view>
            <text class="menu-item__label">关于我们</text>
            <text class="menu-item__arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-wrap" v-if="token">
        <view class="logout-btn" @click="logout">退出登录</view>
      </view>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script>
import AUTH from '@/common/auth.js'
import { getNavBarInfo } from '@/common/navbar.js'
export default {
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      userInfo: null,
      balance: { pullTimes: 0, pushTimes: 0 },
      unlockCount: 0,
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
  },
  onShow() {
    if (this.token) {
      this.loadUserInfo()
      this.loadBalance()
      this.loadUnlockCount()
    }
  },
  methods: {
    async loadUserInfo() {
      const res = await this.$wxapi.userDetail(this.token)
      if (res.code === 0) this.userInfo = res.data
    },
    async loadBalance() {
      const res = await this.$wxapi.blindBoxFriendsBalance(this.token)
      if (res.code === 0) this.balance = res.data
    },
    async loadUnlockCount() {
      const res = await this.$wxapi.blindBoxFriendsPullLogs({ token: this.token, pageSize: 1 })
      if (res.code === 0) this.unlockCount = res.data.totalRow || 0
    },
    goLogin() { uni.navigateTo({ url: '/pages/login/login' }) },
    goProfile() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/user/profile' })
    },
    goWallet() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/user/wallet' })
    },
    goRecharge() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/recharge/index' })
    },
    goPushLogs() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/push-logs/index' })
    },
    goUnlockLogs() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/unlock-logs/index' })
    },
    goSign() {
      if (!this.token) { this.goLogin(); return }
      uni.navigateTo({ url: '/pages/user/sign' })
    },
    goSetting() { uni.navigateTo({ url: '/pages/user/setting' }) },
    goAbout() { uni.navigateTo({ url: '/pages/user/about' }) },
    async logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmText: '退出',
        confirmColor: '#ec4899',
        cancelText: '取消',
        success: async ({ confirm }) => {
          if (!confirm) return
          uni.showLoading({ title: '退出中...' })
          const res = await this.$wxapi.loginout(this.token)
          uni.hideLoading()
          // 无论接口成功与否，都清除本地登录态
          this.vuex('token', '')
          this.vuex('uid', '')
          this.vuex('mobile', '')
          this.userInfo = null
          this.balance = { pullTimes: 0, pushTimes: 0 }
          this.unlockCount = 0
          if (res.code !== 0) {
            uni.showToast({ title: res.msg || '退出失败，已强制登出', icon: 'none' })
          } else {
            uni.showToast({ title: '已退出登录', icon: 'success' })
          }
        }
      })
    },
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #0d0118;
  display: flex;
  flex-direction: column;
}
.status-bar { flex-shrink: 0; }

/* 个人信息卡 */
.profile-card {
  position: relative;
  margin: 0 0 24rpx;
  overflow: hidden;
  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #2d0f52 0%, #1a0533 100%);
  }
  &__content {
    position: relative;
    display: flex;
    align-items: center;
    /* padding-top 由 JS 动态注入 */
    padding: 0 40rpx 24rpx;
    gap: 24rpx;
  }
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.avatar-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(192, 132, 252, 0.5);
}
.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d0f52, #7c3aed);
  border: 3rpx solid rgba(192, 132, 252, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-emoji { font-size: 56rpx; }
.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #c084fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
}

.profile-info { flex: 1; }
.profile-name {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #f0e6ff;
  margin-bottom: 8rpx;
}
.profile-id { font-size: 22rpx; color: #8b7aa0; }
.profile-login-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  border-radius: 9999rpx;
  font-size: 26rpx;
  color: #fff;
  font-weight: 700;
}

.stats-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 24rpx 0 32rpx;
  margin: 0 40rpx;
  border-top: 1rpx solid rgba(192, 132, 252, 0.15);
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-size: 40rpx;
  font-weight: 900;
  color: #f5c842;
}
.stat-label { font-size: 22rpx; color: #8b7aa0; margin-top: 4rpx; }
.stat-divider {
  width: 1rpx;
  height: 56rpx;
  background: rgba(192, 132, 252, 0.15);
}

/* 菜单 */
.menu-scroll { flex: 1; padding: 0 24rpx; }

.menu-section {
  margin-bottom: 24rpx;
}
.menu-section__title {
  display: block;
  font-size: 24rpx;
  color: #5b4d6b;
  padding: 16rpx 16rpx 12rpx;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}
.menu-list {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  gap: 24rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.08);
  &:last-child { border-bottom: none; }
  &:active { background: rgba(192, 132, 252, 0.08); }
  &__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
  }
  &__label {
    flex: 1;
    font-size: 30rpx;
    color: #c4b5d4;
    font-weight: 500;
  }
  &__arrow {
    font-size: 36rpx;
    color: #5b4d6b;
  }
}

.bottom-safe { height: 40rpx; }

.logout-wrap {
  padding: 8rpx 0 24rpx;
  display: flex;
  justify-content: center;
}
.logout-btn {
  width: 100%;
  height: 96rpx;
  background: rgba(236, 72, 153, 0.08);
  border: 1rpx solid rgba(236, 72, 153, 0.3);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #ec4899;
  letter-spacing: 2rpx;
  &:active { background: rgba(236, 72, 153, 0.16); }
}
</style>
