<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">投放记录</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
      <view v-if="loading && list.length === 0" class="loading-wrap">
        <view class="loading-orb"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="!loading && list.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">还没有投放过盲盒</text>
        <view class="empty-btn" @click="goPush">去投放</view>
      </view>

      <view v-else>
        <view class="log-item" v-for="item in list" :key="item.id">
          <!-- 状态标签 -->
          <view class="log-item__header">
            <text class="log-item__id">#{{ item.id }}</text>
            <view class="status-tag" :class="'status-' + item.status">
              {{ statusLabel(item.status) }}
            </view>
          </view>

          <view class="log-item__body">
            <!-- 昵称 + 性别 各占半行 -->
            <view class="log-item__row2">
              <view class="log-item__cell">
                <text class="log-label">昵称</text>
                <text class="log-value log-nick">{{ item.nick }}</text>
              </view>
              <view class="log-item__cell">
                <text class="log-label">性别</text>
                <view class="gender-tag" :class="item.gender === 1 ? 'gender-male' : 'gender-female'">
                  <text class="gender-symbol">{{ item.gender === 1 ? '♂' : '♀' }}</text>
                  <text class="gender-name">{{ item.gender === 1 ? '男生' : '女生' }}</text>
                </view>
              </view>
            </view>
            <!-- 自拍照 + 微信号 各占半行 -->
            <view class="log-item__row2">
              <view class="log-item__cell" v-if="item.pic">
                <text class="log-label">自拍照</text>
                <view class="pic-preview-btn" @click="previewPic(item.pic)">
                  <text class="pic-preview-icon">🖼</text>
                  <text class="pic-preview-text">查看照片</text>
                </view>
              </view>
              <view class="log-item__cell" :class="{ 'log-item__cell--full': !item.pic }">
                <text class="log-label">微信号</text>
                <text class="log-value log-wx">{{ item.wx }}</text>
              </view>
            </view>
            <!-- 留言单独整行 -->
            <view class="log-item__row" v-if="item.remark && item.remark !== 'null'">
              <text class="log-label">留言</text>
              <text class="log-value log-remark">{{ item.remark }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="log-item__actions">
            <!-- 待支付 -->
            <view v-if="item.status === 0" class="action-btn action-pay" @click="payBox(item)">
              立即支付
            </view>
            <!-- 投放中，可停止 -->
            <view v-if="item.status === 3" class="action-btn action-stop" @click="changeStatus(item, 31)">
              停止投放
            </view>
            <!-- 已停止，可恢复 -->
            <view v-if="item.status === 31" class="action-btn action-resume" @click="changeStatus(item, 3)">
              恢复投放
            </view>
            <!-- 删除 -->
            <view
              v-if="item.status === 31 || item.status === 2 || item.status === -1"
              class="action-btn action-delete"
              @click="deleteBox(item)"
            >删除</view>
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
      if (refresh) { this.page = 1; this.list = []; this.noMore = false }
      this.loading = true
      const res = await this.$wxapi.blindBoxFriendsPushLogs({
        token: this.token,
        page: this.page,
        pageSize: this.pageSize
      })
      this.loading = false
      if (res.code === 0) {
        const data = (res.data && res.data.result) || []
        this.list = [...this.list, ...data]
        if (data.length < this.pageSize || this.list.length >= (res.data.totalRow || 0)) {
          this.noMore = true
        } else {
          this.page++
        }
      } else if (res.code != 700) {
        uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.noMore = true
      }
    },
    loadMore() { this.loadList() },
    statusLabel(s) {
      const map = { 0: '待支付', 1: '审核中', 2: '审核失败', 3: '投放中', 31: '已停止', '-1': '已关闭' }
      return map[s] !== undefined ? map[s] : '未知'
    },
    async payBox(item) {
      uni.showLoading({ title: '支付中...' })
      const res = await this.$wxapi.blindBoxFriendsPay({ token: this.token, id: item.id })
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: '支付成功！', icon: 'success' })
        this.loadList(true)
      } else if (res.code == 20002) {
        // 拉起在线支付
		const payRes = await this.$pay.pay('wxpay', {}, res.data,
			'投放盲盒:' + item.id, '投放盲盒:' + item.id, {
				type: 22,
				boxId:item.id
			},
			(res) => {
				// 支付成功的逻辑
				this.loadList(true)
			}, (err) => {
				// 支付失败的逻辑
			}
		)
      } else {
        uni.showToast({ title: res.msg || '支付失败', icon: 'none' })
      }
    },
    async changeStatus(item, status) {
      const label = status === 31 ? '停止投放' : '恢复投放'
      uni.showLoading({ title: `${label}中...` })
      const res = await this.$wxapi.blindBoxFriendsChangeStatus({ token: this.token, id: item.id, status })
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: `${label}成功`, icon: 'success' })
        // 直接修改当前 item 状态，无需重新拉取列表
        const target = this.list.find(i => i.id === item.id)
        if (target) target.status = status
      } else {
        uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    },
    async deleteBox(item) {
      uni.showModal({
        title: '删除确认',
        content: '确定删除这条投放记录吗？',
        success: async (r) => {
          if (!r.confirm) return
          uni.showLoading({ title: '删除中...' })
          const res = await this.$wxapi.blindBoxFriendsDelete({ token: this.token, id: item.id })
          uni.hideLoading()
          if (res.code === 0) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            // 直接从列表移除，无需重新拉取
            this.list = this.list.filter(i => i.id !== item.id)
          } else {
            uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
          }
        }
      })
    },
    previewPic(url) {
      uni.previewImage({ urls: [url], current: url })
    },
    goBack() { uni.navigateBack() },
    goPush() { uni.switchTab({ url: '/pages/push/index' }) }
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
.list-scroll { flex: 1; padding: 0 24rpx; box-sizing: border-box; margin-top: 32rpx; }
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
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); opacity: 0.7; } }
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
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
  }
  &__id { font-size: 24rpx; color: #5b4d6b; }
  &__body { margin-bottom: 24rpx; }
  &__row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 14rpx;
    gap: 16rpx;
    &:last-child { margin-bottom: 0; }
  }
  &__actions { display: flex; gap: 16rpx; flex-wrap: wrap; }
}

.log-label { font-size: 24rpx; color: #5b4d6b; width: 88rpx; flex-shrink: 0; padding-top: 2rpx; }
.log-value { font-size: 28rpx; color: #c4b5d4; flex: 1; }
.log-nick {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 160rpx;
}
.log-wx { color: #c084fc; font-weight: 700; }
.log-remark { color: #8b7aa0; line-height: 1.6; }

/* 两列布局行 */
.log-item__row2 {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14rpx;
  gap: 16rpx;
}
/* 每个单元格占一半 */
.log-item__cell {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0; /* 允许 flex 子项收缩以触发 text-overflow */
}
/* 无自拍照时微信号独占整行 */
.log-item__cell--full {
  flex: 2;
}

.gender-tag {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 26rpx;
  font-weight: 600;
  &.gender-male {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1rpx solid rgba(59, 130, 246, 0.3);
  }
  &.gender-female {
    background: rgba(244, 114, 182, 0.15);
    color: #f472b6;
    border: 1rpx solid rgba(244, 114, 182, 0.3);
  }
}
.gender-symbol { font-size: 28rpx; }
.gender-name { font-size: 24rpx; }

.pic-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 20rpx;
  background: rgba(124, 58, 237, 0.12);
  border: 1rpx solid rgba(192, 132, 252, 0.3);
  border-radius: 9999rpx;
}
.pic-preview-icon { font-size: 28rpx; }
.pic-preview-text { font-size: 24rpx; color: #c084fc; font-weight: 500; }

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 18rpx;
  border-radius: 9999rpx;
  font-weight: 600;
  &.status-0 { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1rpx solid rgba(245,158,11,0.3); }
  &.status-1 { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1rpx solid rgba(59,130,246,0.3); }
  &.status-2 { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1rpx solid rgba(239,68,68,0.3); }
  &.status-3 { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1rpx solid rgba(16,185,129,0.3); }
  &.status-31 { background: rgba(107, 114, 128, 0.15); color: #9ca3af; border: 1rpx solid rgba(107,114,128,0.3); }
}

.action-btn {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  &.action-pay { background: linear-gradient(135deg, #d97706, #f5c842); color: #1a0533; }
  &.action-stop { background: rgba(107, 114, 128, 0.2); color: #9ca3af; border: 1rpx solid rgba(107,114,128,0.3); }
  &.action-resume { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1rpx solid rgba(16,185,129,0.3); }
  &.action-delete { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1rpx solid rgba(239,68,68,0.25); }
}

.list-footer {
  text-align: center;
  font-size: 24rpx;
  color: #5b4d6b;
  padding: 32rpx 0 60rpx;
}
</style>
