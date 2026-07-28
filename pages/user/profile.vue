<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">编辑资料</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-card">
        <!-- 头像 -->
        <view class="form-item form-item--avatar" @click="chooseAvatar">
          <text class="form-label">头像</text>
          <view class="form-item__right">
            <image
              :src="form.avatarUrl || '/static/default-avatar.svg'"
              mode="aspectFill"
              class="avatar-img"
            ></image>
            <text class="form-arrow">›</text>
          </view>
        </view>
        <!-- 昵称 -->
        <view class="form-item">
          <text class="form-label">昵称</text>
          <view class="form-item__right">
            <input
              class="form-input"
              v-model="form.nick"
              placeholder="请输入昵称"
              placeholder-class="ph"
            />
            <text class="form-arrow">›</text>
          </view>
        </view>
        <!-- 性别 -->
        <view class="form-item" @click="showGenderPicker">
          <text class="form-label">性别</text>
          <view class="form-item__right">
            <text class="form-value">{{ genderText }}</text>
            <text class="form-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="save-btn" @click="save" :class="{ loading: saving }">
        <text>{{ saving ? '保存中...' : '保存资料' }}</text>
      </view>
      <view class="bottom-safe"></view>
    </scroll-view>

    <!-- 性别选择弹窗 -->
    <view class="picker-mask" v-if="showGender" @click="showGender = false">
      <view class="picker-panel" @click.stop>
        <text class="picker-title">选择性别</text>
        <view class="picker-item" @click="selectGender(1)">
          <text class="picker-emoji">💙</text>
          <text class="picker-text">男生</text>
          <text class="picker-check" v-if="form.gender === 1">✓</text>
        </view>
        <view class="picker-item" @click="selectGender(2)">
          <text class="picker-emoji">💜</text>
          <text class="picker-text">女生</text>
          <text class="picker-check" v-if="form.gender === 2">✓</text>
        </view>
        <view class="picker-cancel" @click="showGender = false">取消</view>
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
      navBarHeight: 44,
      form: { avatarUrl: '', nick: '', gender: 0 },
      saving: false,
      showGender: false,
    }
  },
  computed: {
    genderText() {
      return { 0: '未设置', 1: '男生', 2: '女生' }[this.form.gender] || '未设置'
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    this.loadUserInfo()
  },
  methods: {
    async loadUserInfo() {
      const res = await this.$wxapi.userDetail(this.token)
      if (res.code === 0) {
        const base = res.data.base || {}
        this.form.avatarUrl = base.avatarUrl || ''
        this.form.nick = base.nick || ''
        this.form.gender = base.gender || 0
      }
    },
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          uni.showLoading({ title: '上传中...' })
          const uploadRes = await this.$wxapi.uploadFile(this.token, res.tempFilePaths[0])
          uni.hideLoading()
          if (uploadRes.code === 0) {
            this.form.avatarUrl = uploadRes.data.url || uploadRes.data
          } else {
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },
    showGenderPicker() { this.showGender = true },
    selectGender(g) { this.form.gender = g; this.showGender = false },
    async save() {
      if (this.saving) return
      this.saving = true
      const res = await this.$wxapi.modifyUserInfo({
        token: this.token,
        nick: this.form.nick,
        avatarUrl: this.form.avatarUrl,
        gender: this.form.gender
      })
      this.saving = false
      if (res.code === 0) {
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1000)
      } else {
        uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
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
.form-scroll { flex: 1; padding: 0 24rpx; }
.form-card {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 32rpx;
  overflow: hidden;
  margin-bottom: 40rpx;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 36rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.08);
  &:last-child { border-bottom: none; }
  &__right { display: flex; align-items: center; gap: 16rpx; }
  &--avatar { cursor: pointer; }
}
.form-label { font-size: 30rpx; color: #c4b5d4; font-weight: 500; }
.form-input { font-size: 30rpx; color: #f0e6ff; text-align: right; height: 60rpx; min-width: 240rpx; }
.ph { color: #5b4d6b; }
.form-value { font-size: 30rpx; color: #8b7aa0; }
.form-arrow { font-size: 40rpx; color: #5b4d6b; line-height: 1; }
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; border: 2rpx solid rgba(192, 132, 252, 0.4); }
.save-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc, #f0abfc);
  border-radius: 9999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 34rpx; font-weight: 800; color: #fff;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.5);
  margin-bottom: 40rpx;
  &.loading { opacity: 0.7; }
}
.bottom-safe { height: 40rpx; }

/* 性别选择弹窗 */
.picker-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex; align-items: flex-end;
}
.picker-panel {
  width: 100%;
  background: #1a0533;
  border-radius: 32rpx 32rpx 0 0;
  border-top: 1rpx solid rgba(192, 132, 252, 0.2);
  padding-bottom: env(safe-area-inset-bottom, 20rpx);
  overflow: hidden;
}
.picker-title {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #5b4d6b;
  padding: 32rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.1);
}
.picker-item {
  display: flex; align-items: center; gap: 24rpx;
  padding: 32rpx 48rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.08);
  &:active { background: rgba(192, 132, 252, 0.08); }
}
.picker-emoji { font-size: 40rpx; }
.picker-text { flex: 1; font-size: 32rpx; color: #f0e6ff; }
.picker-check { font-size: 36rpx; color: #c084fc; font-weight: 800; }
.picker-cancel {
  text-align: center; font-size: 32rpx; color: #8b7aa0;
  padding: 32rpx;
  &:active { background: rgba(192, 132, 252, 0.08); }
}
</style>
