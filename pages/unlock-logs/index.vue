<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">解锁记录</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
      <view v-if="loading && list.length === 0" class="loading-wrap">
        <view class="loading-orb"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="!loading && list.length === 0" class="empty-state">
        <text class="empty-icon">🔒</text>
        <text class="empty-text">还没有解锁过任何盲盒</text>
        <view class="empty-btn" @click="goIndex">去发现盲盒</view>
      </view>

      <view v-else>
        <view class="log-item" v-for="item in list" :key="item.id">
          <view class="log-item__avatar">
            <image v-if="item.pic" :src="item.pic" mode="aspectFill" class="log-avatar-img"></image>
            <view v-else class="log-avatar-placeholder">
              <text>{{ item.gender === 1 ? '💙' : '💜' }}</text>
            </view>
          </view>
          <view class="log-item__body">
            <view class="log-item__row1">
              <text class="log-item__nick">{{ item.nick }}</text>
              <view class="log-item__stars">
                <text v-for="s in 5" :key="s" class="star" :class="{ lit: s <= Math.round(item.appearance) }">★</text>
              </view>
            </view>
            <view class="log-item__row2">
              <text class="log-item__tag">{{ item.gender === 1 ? '男生' : '女生' }}</text>
              <text class="log-item__shop" v-if="item.shopName">{{ item.shopName }}</text>
            </view>
            <view class="log-item__wx-row">
              <text class="log-item__wx-label">微信</text>
              <text class="log-item__wx-val">{{ item.wx }}</text>
              <view class="copy-btn" @click="copyWx(item.wx)">复制</view>
            </view>
            <text class="log-item__remark" v-if="item.remark && item.remark !== 'null'">{{ item.remark }}</text>
          </view>
        </view>

        <view class="list-footer" v-if="noMore">
          <text>已显示全部记录</text>
        </view>
        <view class="list-footer" v-else-if="loading">
          <text>加载中...</text>
        </view>
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
      loading: false,
      list: [],
      page: 1,
      pageSize: 20,
      noMore: false,
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadList()
  },
  methods: {
    async loadList(refresh = false) {
      if (this.loading || this.noMore) return
      if (refresh) {
        this.page = 1
        this.list = []
        this.noMore = false
      }
      this.loading = true
      const res = await this.$wxapi.blindBoxFriendsPullLogs({
        token: this.token,
        page: this.page,
        pageSize: this.pageSize
      })
      this.loading = false
      if (res.code === 0) {
        const data = res.data.result || []
        this.list = [...this.list, ...data]
        if (data.length < this.pageSize || this.list.length >= res.data.totalRow) {
          this.noMore = true
        } else {
          this.page++
        }
      } else if (res.code != 700) {
        uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
      }
    },
    loadMore() { this.loadList() },
    copyWx(wx) {
      uni.setClipboardData({
        data: wx,
        success: () => uni.showToast({ title: '已复制', icon: 'success' })
      })
    },
    goBack() { uni.navigateBack() },
    goIndex() { uni.switchTab({ url: '/pages/index/index' }) }
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
  display: flex;
  align-items: center;
  /* height 由 JS 动态注入 */
  padding: 0 32rpx;
  box-sizing: border-box;
  flex-shrink: 0;
  &__back { font-size: 56rpx; color: #c084fc; width: 80rpx; line-height: 1; }
  &__title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; color: #f0e6ff; }
  &__placeholder { width: 80rpx; }
}
.list-scroll { flex: 1; padding: 0 24rpx; margin-top: 32rpx; box-sizing: border-box; }
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.loading-orb {
  width: 64rpx; height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); opacity: 0.7; }
}
.loading-text { margin-top: 24rpx; font-size: 26rpx; color: #8b7aa0; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
  .empty-icon { font-size: 100rpx; margin-bottom: 32rpx; }
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

.log-item {
  display: flex;
  gap: 24rpx;
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  &__avatar { flex-shrink: 0; }
  &__body { flex: 1; min-width: 0; }
  &__row1 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10rpx; }
  &__nick { font-size: 32rpx; font-weight: 700; color: #f0e6ff; }
  &__stars { display: flex; gap: 4rpx; }
  &__row2 { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
  &__tag {
    font-size: 22rpx;
    color: #c084fc;
    background: rgba(192, 132, 252, 0.15);
    padding: 4rpx 14rpx;
    border-radius: 9999rpx;
  }
  &__shop { font-size: 22rpx; color: #5b4d6b; }
  &__wx-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background: rgba(13, 1, 24, 0.5);
    border-radius: 12rpx;
    padding: 12rpx 16rpx;
    margin-bottom: 12rpx;
  }
  &__wx-label { font-size: 22rpx; color: #5b4d6b; }
  &__wx-val { flex: 1; font-size: 26rpx; color: #c084fc; font-weight: 700; }
  &__remark { font-size: 24rpx; color: #8b7aa0; line-height: 1.6; }
}
.log-avatar-img {
  width: 96rpx; height: 96rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(192, 132, 252, 0.4);
}
.log-avatar-placeholder {
  width: 96rpx; height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d0f52, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}
.star { font-size: 22rpx; color: rgba(255,255,255,0.2); &.lit { color: #f5c842; } }
.copy-btn {
  font-size: 20rpx;
  color: #f5c842;
  background: rgba(245, 200, 66, 0.12);
  padding: 6rpx 16rpx;
  border-radius: 9999rpx;
  border: 1rpx solid rgba(245, 200, 66, 0.25);
}
.list-footer {
  text-align: center;
  font-size: 24rpx;
  color: #5b4d6b;
  padding: 32rpx 0 60rpx;
}
</style>
