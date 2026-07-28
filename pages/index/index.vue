<template>
  <view class="page">
    <!-- 顶部状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部标题栏：高度和右边距适配小程序胶囊按钮 -->
    <view class="header" :style="{ height: navBarHeight + 'px', paddingRight: menuButtonRight + 'px' }">
      <view class="header__left">
        <text class="header__title">盲 盒 交 友</text>
        <text class="header__sub">遇见命中注定的TA</text>
      </view>
      <view class="header__right">
        <!-- #ifndef MP-WEIXIN -->
        <view class="balance-pill" @click="goRecharge">
          <text class="balance-pill__icon">🔑</text>
          <text class="balance-pill__num">{{ balance.pullTimes }}</text>
          <text class="balance-pill__label">次</text>
        </view>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <!-- 小程序中余额胶囊移到筛选栏，此处留空让右侧安全区与胶囊对齐 -->
        <!-- #endif -->
      </view>
    </view>

    <!-- 筛选栏（小程序中在此显示余额胶囊） -->
    <view class="filter-bar">
      <view
        class="filter-btn"
        :class="{ active: filterGender === 0 }"
        @click="setFilter(0)"
      >全部</view>
      <view
        class="filter-btn"
        :class="{ active: filterGender === 1 }"
        @click="setFilter(1)"
      >男生</view>
      <view
        class="filter-btn"
        :class="{ active: filterGender === 2 }"
        @click="setFilter(2)"
      >女生</view>
      <view class="filter-spacer"></view>
      <!-- #ifdef MP-WEIXIN -->
      <view class="balance-pill balance-pill--sm" @click="goRecharge">
        <text class="balance-pill__icon">🔑</text>
        <text class="balance-pill__num">{{ balance.pullTimes }}</text>
      </view>
      <!-- #endif -->
      <view class="refresh-btn" @click="doRefresh" :class="{ spinning: isRefreshing }">
        <text class="refresh-btn__icon">↻</text>
        <text class="refresh-btn__text">换一批</text>
      </view>
    </view>

    <!-- 盲盒卡片列表 -->
    <scroll-view class="box-scroll" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="loading-wrap">
        <view class="loading-orb"></view>
        <text class="loading-text">正在为你匹配...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && boxes.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无盲盒，先去投放一个吧</text>
        <view class="empty-btn" @click="switchTab(1)">去投放</view>
      </view>

      <!-- 卡片网格 -->
      <view v-else class="box-grid">
        <view
          class="box-card"
          v-for="(item, index) in boxes"
          :key="item.id"
          @click="onBoxTap(item)"
        >
          <view class="box-card__inner">
            <!-- 盲盒封面 -->
            <view class="box-card__cover">
              <view class="box-card__mystery">
                <text class="box-mystery__emoji">{{ genderEmoji(item.gender) }}</text>
              </view>
              <!-- 颜值星级 -->
              <view class="box-card__stars">
                <text
                  v-for="s in 5"
                  :key="s"
                  class="star"
                  :class="{ lit: s <= Math.round(item.appearance) }"
                >★</text>
              </view>
            </view>
            <!-- 信息 -->
            <view class="box-card__info">
              <text class="box-card__nick">{{ item.nick }}</text>
              <text class="box-card__tag">{{ genderLabel(item.gender) }}</text>
            </view>
            <!-- 解锁按钮 -->
            <view class="box-card__unlock" @click.stop="onUnlock(item)">
              <text class="unlock-icon">🔓</text>
              <text class="unlock-text">解锁</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部提示 -->
      <view v-if="boxes.length > 0" class="list-footer">
        <text>共展示 {{ boxes.length }} 个盲盒 · 换一批获取更多</text>
      </view>
    </scroll-view>

    <!-- 解锁结果弹窗 -->
    <view class="modal-mask" v-if="showResult" @click.self="closeResult">
      <view class="result-modal">
        <view class="result-modal__header">
          <text class="result-modal__title">✨ 解锁成功</text>
          <view class="result-modal__close" @click="closeResult">✕</view>
        </view>
        <view class="result-modal__avatar">
          <image
            v-if="unlockResult.pic"
            :src="unlockResult.pic"
            mode="aspectFill"
            class="result-avatar-img"
          ></image>
          <view v-else class="result-avatar-placeholder">
            <text>{{ genderEmoji(unlockResult.gender) }}</text>
          </view>
        </view>
        <view class="result-modal__body">
          <text class="result-nick">{{ unlockResult.nick }}</text>
          <view class="result-stars">
            <text v-for="s in 5" :key="s" class="star" :class="{ lit: s <= Math.round(unlockResult.appearance) }">★</text>
          </view>
          <text class="result-remark">{{ unlockResult.remark || '这个人很神秘，没有留言～' }}</text>
          <view class="result-wx-row">
            <text class="result-wx-label">微信号</text>
            <text class="result-wx-val" @click="copyWx">{{ unlockResult.wx }}</text>
            <view class="result-copy-btn" @click="copyWx">复制</view>
          </view>
        </view>
        <view class="result-modal__footer">
          <view class="result-close-btn" @click="closeResult">关闭</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getNavBarInfo } from '@/common/navbar.js'
export default {
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,      // 导航栏内容区高度（px）
      menuButtonRight: 87,   // 胶囊右边距（px），用于 header 右侧 padding
      loading: false,
      isRefreshing: false,
      boxes: [],
      filterGender: 0,
      balance: { pullTimes: 0, pushTimes: 0 },
      showResult: false,
      unlockResult: {},
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.menuButtonRight = nav.menuButtonRight
  },
  onShow() {
    this.loadBalance()
    this.loadBoxes(false)
  },
  methods: {
    async loadBalance() {
      if (!this.token) return
      const res = await this.$wxapi.blindBoxFriendsBalance(this.token)
      if (res.code === 0) this.balance = res.data
    },
    async loadBoxes(refresh) {
      if (!this.token) {
        uni.navigateTo({ url: '/pages/login/login' })
        return
      }
      this.loading = true
      const params = { token: this.token }
      if (this.filterGender > 0) params.gender = this.filterGender
      if (refresh) params.refresh = true
      const res = await this.$wxapi.blindBoxFriendsMatch(params)
      this.loading = false
      this.isRefreshing = false
      if (res.code == 0) {
        this.boxes = res.data || []
      } else if (res.code != 0 && res.code != 700) {
        uni.showToast({ title: res.msg || '匹配失败', icon: 'none' })
      }
    },
    setFilter(gender) {
      this.filterGender = gender
      this.loadBoxes(true)
    },
    doRefresh() {
      if (this.isRefreshing) return
      if (this.balance.pullTimes <= 0) {
        uni.showModal({
          title: '解锁次数不足',
          content: '刷新需要消耗1次匹配次数，是否前往购买？',
          confirmText: '去购买',
          success: (res) => {
            if (res.confirm) this.goRecharge()
          }
        })
        return
      }
      this.isRefreshing = true
      this.loadBoxes(true)
    },
    goRecharge() {
      uni.navigateTo({ url: '/pages/recharge/index' })
    },
    switchTab(index) {
      uni.switchTab({ url: index === 1 ? '/pages/push/index' : '/pages/index/index' })
    },
    onBoxTap(item) {
      // 点击卡片弹出提示，引导解锁
      uni.showModal({
        title: '解锁盲盒',
        content: `确定花费1次解锁次数，查看 "${item.nick}" 的联系方式吗？`,
        confirmText: '确认解锁',
        success: (r) => {
          if (r.confirm) this.doUnlock(item)
        }
      })
    },
    onUnlock(item) {
      this.onBoxTap(item)
    },
    async doUnlock(item) {
      if (this.balance.pullTimes <= 0) {
        uni.showModal({
          title: '解锁次数不足',
          content: '请先购买解锁次数',
          confirmText: '去购买',
          success: (r) => { if (r.confirm) this.goRecharge() }
        })
        return
      }
      uni.showLoading({ title: '解锁中...' })
      const res = await this.$wxapi.blindBoxFriendsUnlock({ token: this.token, id: item.id })
      uni.hideLoading()
      if (res.code === 0) {
        this.unlockResult = res.data
        this.showResult = true
        this.loadBalance()
      } else {
        uni.showToast({ title: res.msg || '解锁失败', icon: 'none' })
      }
    },
    closeResult() {
      this.showResult = false
      this.unlockResult = {}
    },
    copyWx() {
      uni.setClipboardData({
        data: this.unlockResult.wx,
        success: () => uni.showToast({ title: '已复制微信号', icon: 'success' })
      })
    },
    genderLabel(g) {
      return g === 1 ? '男生' : g === 2 ? '女生' : '未知'
    },
    genderEmoji(g) {
      return g === 1 ? '💙' : g === 2 ? '💜' : '💝'
    },
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0533 0%, #0d0118 60%);
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; flex-shrink: 0; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 高度和 paddingRight 由 JS 动态注入，左侧固定 padding */
  padding: 0 0 0 40rpx;
  box-sizing: border-box;
  flex-shrink: 0;
  &__title {
    font-size: 40rpx;
    font-weight: 800;
    background: linear-gradient(135deg, #c084fc, #f0abfc, #f5c842);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 4rpx;
  }
  &__sub {
    display: block;
    font-size: 22rpx;
    color: #8b7aa0;
    margin-top: 4rpx;
  }
}

.balance-pill {
  display: flex;
  align-items: center;
  background: rgba(192, 132, 252, 0.15);
  border: 1rpx solid rgba(192, 132, 252, 0.35);
  border-radius: 9999rpx;
  padding: 10rpx 24rpx;
  gap: 8rpx;
  &__icon { font-size: 28rpx; }
  &__num { font-size: 32rpx; font-weight: 800; color: #f5c842; }
  &__label { font-size: 22rpx; color: #8b7aa0; }
  &--sm {
    padding: 8rpx 16rpx;
    .balance-pill__icon { font-size: 24rpx; }
    .balance-pill__num { font-size: 26rpx; }
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: 0 32rpx 24rpx;
  gap: 16rpx;
}

.filter-btn {
  padding: 10rpx 28rpx;
  border-radius: 9999rpx;
  font-size: 24rpx;
  color: #8b7aa0;
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  background: rgba(34, 10, 64, 0.5);
  transition: all 0.2s;
  &.active {
    background: linear-gradient(135deg, #7c3aed, #c084fc);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 4rpx 16rpx rgba(124, 58, 237, 0.4);
  }
}

.filter-spacer { flex: 1; }

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 24rpx;
  border-radius: 9999rpx;
  background: rgba(245, 200, 66, 0.1);
  border: 1rpx solid rgba(245, 200, 66, 0.3);
  &__icon { font-size: 28rpx; color: #f5c842; transition: transform 0.5s; }
  &__text { font-size: 24rpx; color: #f5c842; }
  &.spinning .refresh-btn__icon { transform: rotate(360deg); }
}

.box-scroll { flex: 1; padding: 0 24rpx; box-sizing: border-box; }

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.loading-orb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  box-shadow: 0 0 40rpx rgba(192, 132, 252, 0.6);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}
.loading-text {
  margin-top: 32rpx;
  font-size: 28rpx;
  color: #8b7aa0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
  .empty-icon { font-size: 120rpx; margin-bottom: 32rpx; }
  .empty-text { font-size: 28rpx; color: #8b7aa0; margin-bottom: 40rpx; }
}
.empty-btn {
  padding: 20rpx 64rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: #fff;
  border-radius: 9999rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.box-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding-bottom: 40rpx;
}

.box-card {
  border-radius: 28rpx;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(44, 15, 82, 0.9), rgba(26, 5, 51, 0.95));
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
  &__inner { display: flex; flex-direction: column; }
  &__cover {
    position: relative;
    height: 240rpx;
    background: linear-gradient(135deg, #2d0f52 0%, #1a0533 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__mystery { display: flex; align-items: center; justify-content: center; }
  &__stars {
    position: absolute;
    bottom: 16rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4rpx;
  }
  &__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 20rpx 8rpx;
  }
  &__nick { font-size: 28rpx; font-weight: 700; color: #f0e6ff; }
  &__tag {
    font-size: 20rpx;
    color: #c084fc;
    background: rgba(192, 132, 252, 0.15);
    padding: 4rpx 12rpx;
    border-radius: 9999rpx;
  }
  &__unlock {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin: 8rpx 20rpx 20rpx;
    padding: 16rpx;
    background: linear-gradient(135deg, #7c3aed, #c084fc);
    border-radius: 16rpx;
  }
}

.box-mystery__emoji { font-size: 80rpx; }

.star {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.2);
  &.lit { color: #f5c842; }
}

.unlock-icon { font-size: 28rpx; }
.unlock-text { font-size: 24rpx; color: #fff; font-weight: 700; }

.list-footer {
  text-align: center;
  font-size: 22rpx;
  color: #5b4d6b;
  padding: 24rpx 0 48rpx;
}

/* 解锁结果弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.result-modal {
  width: 600rpx;
  background: linear-gradient(145deg, #2d0f52, #1a0533);
  border: 1rpx solid rgba(192, 132, 252, 0.35);
  border-radius: 40rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.7);
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx 24rpx;
  }
  &__title { font-size: 36rpx; font-weight: 800; color: #f0e6ff; }
  &__close {
    width: 56rpx; height: 56rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8b7aa0;
    font-size: 28rpx;
  }
  &__avatar {
    display: flex;
    justify-content: center;
    padding: 8rpx 0 24rpx;
  }
  &__body { padding: 0 40rpx 32rpx; }
  &__footer { padding: 0 40rpx 40rpx; }
}

.result-avatar-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(192, 132, 252, 0.5);
}
.result-avatar-placeholder {
  width: 160rpx; height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d0f52, #7c3aed);
  border: 4rpx solid rgba(192, 132, 252, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
}
.result-nick {
  display: block;
  text-align: center;
  font-size: 40rpx;
  font-weight: 800;
  color: #f0e6ff;
  margin-bottom: 16rpx;
}
.result-stars {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 24rpx;
  .star { font-size: 32rpx; }
}
.result-remark {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #8b7aa0;
  margin-bottom: 32rpx;
  line-height: 1.6;
}
.result-wx-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(192, 132, 252, 0.1);
  border: 1rpx solid rgba(192, 132, 252, 0.25);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}
.result-wx-label { font-size: 24rpx; color: #8b7aa0; }
.result-wx-val { flex: 1; font-size: 28rpx; color: #c084fc; font-weight: 700; }
.result-copy-btn {
  font-size: 22rpx;
  color: #f5c842;
  background: rgba(245, 200, 66, 0.15);
  padding: 8rpx 20rpx;
  border-radius: 9999rpx;
  border: 1rpx solid rgba(245, 200, 66, 0.3);
}
.result-close-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
