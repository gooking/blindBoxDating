<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部：高度与胶囊对齐 -->
    <view class="header" :style="{ height: navBarHeight + 'px' }">
      <text class="header__title">投放盲盒</text>
      <text class="header__sub">留下你的信息，等待有缘人解锁</text>
    </view>

    <!-- 余额栏 -->
    <view class="balance-bar">
      <view class="balance-item">
        <text class="balance-item__num">{{ balance.pushTimes }}</text>
        <text class="balance-item__label">剩余投放次数</text>
      </view>
      <view class="balance-divider"></view>
      <view class="balance-item">
        <text class="balance-item__num">{{ balance.pullTimes }}</text>
        <text class="balance-item__label">解锁次数</text>
      </view>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-card">
        <!-- 昵称 -->
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input
            class="form-input"
            v-model="form.nick"
            placeholder="给自己起个好听的昵称"
            placeholder-class="input-placeholder"
            maxlength="20"
          />
        </view>

        <!-- 性别 -->
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-group">
            <view
              class="gender-btn"
              :class="{ active: form.gender === 1 }"
              @click="form.gender = 1"
            >
              <text class="gender-emoji">💙</text>
              <text class="gender-text">男生</text>
            </view>
            <view
              class="gender-btn"
              :class="{ active: form.gender === 2 }"
              @click="form.gender = 2"
            >
              <text class="gender-emoji">💜</text>
              <text class="gender-text">女生</text>
            </view>
          </view>
        </view>

        <!-- 微信号 -->
        <view class="form-item">
          <text class="form-label">微信号</text>
          <input
            class="form-input"
            v-model="form.wx"
            placeholder="解锁后对方可见的微信号"
            placeholder-class="input-placeholder"
            maxlength="30"
          />
        </view>

        <!-- 个人照片 -->
        <view class="form-item">
          <text class="form-label">自拍照 <text class="form-label-hint">（解锁后可见）</text></text>
          <view class="upload-area" @click="chooseImage">
            <image v-if="form.pic" :src="form.pic" mode="aspectFill" class="upload-preview"></image>
            <view v-else class="upload-placeholder">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传照片</text>
            </view>
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <text class="form-label">留言</text>
          <textarea
            class="form-textarea"
            v-model="form.remark"
            placeholder="写一句让人心动的话吧..."
            placeholder-class="input-placeholder"
            maxlength="100"
          ></textarea>
          <text class="char-count">{{ (form.remark || '').length }}/100</text>
        </view>
      </view>

      <!-- 投放须知 -->
      <view class="notice-card">
        <text class="notice-title">📋 投放须知</text>
        <text class="notice-item">· 投放后需支付费用，审核通过后正式上线</text>
        <text class="notice-item">· 自拍照仅在对方解锁后才会展示</text>
        <text class="notice-item">· 信息审核通常在1小时内完成</text>
        <text class="notice-item">· 可在「投放记录」中管理已投放的盲盒</text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submit" :class="{ disabled: submitting }">
        <text v-if="!submitting">✨ 投放盲盒</text>
        <text v-else>投放中...</text>
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
      submitting: false,
      balance: { pullTimes: 0, pushTimes: 0 },
      form: {
        nick: '',
        gender: 2,
        wx: '',
        pic: '',
        remark: '',
      }
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
  },
  onShow() {
    this.loadBalance()
  },
  methods: {
    async loadBalance() {
      if (!this.token) return
      const res = await this.$wxapi.blindBoxFriendsBalance(this.token)
      if (res.code === 0) this.balance = res.data
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempPath = res.tempFilePaths[0]
          uni.showLoading({ title: '压缩中...' })
          try {
            // 先压缩：质量 60，宽度限制 1200px，大幅减小文件体积
            const compressed = await new Promise((resolve, reject) => {
              uni.compressImage({
                src: tempPath,
                quality: 60,
                success: r => resolve(r.tempFilePath),
                fail: () => resolve(tempPath) // 压缩失败则用原图继续上传
              })
            })
            uni.showLoading({ title: '上传中...' })
            const uploadRes = await this.$wxapi.uploadFile(this.token, compressed)
            uni.hideLoading()
            if (uploadRes.code === 0) {
              this.form.pic = uploadRes.data.url || uploadRes.data
            } else {
              uni.showToast({ title: '上传失败', icon: 'none' })
            }
          } catch (e) {
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },
    async submit() {
      if (!this.token) {
        uni.navigateTo({ url: '/pages/login/login' })
        return
      }
      if (!this.form.nick.trim()) {
        uni.showToast({ title: '请填写昵称', icon: 'none' })
        return
      }
      if (!this.form.gender) {
        uni.showToast({ title: '请选择性别', icon: 'none' })
        return
      }
      if (!this.form.wx.trim()) {
        uni.showToast({ title: '请填写微信号', icon: 'none' })
        return
      }
      this.submitting = true
      const res = await this.$wxapi.blindBoxFriendsPush({
        token: this.token,
        nick: this.form.nick.trim(),
        gender: this.form.gender,
        wx: this.form.wx.trim(),
        pic: this.form.pic,
        remark: this.form.remark.trim(),
		shopId: 0
      })
      this.submitting = false
      if (res.code === 0) {
        // 投放成功，检查是否需要支付
        if (res.data.status === 0) {
          // 待支付，引导支付
          uni.showModal({
            title: '投放成功',
            content: '盲盒已创建，需支付费用才能正式上线。是否立即支付？',
            confirmText: '立即支付',
            success: async (r) => {
              if (r.confirm) {
                await this.payBox(res.data.id)
              } else {
                uni.navigateTo({ url: '/pages/push-logs/index' })
              }
            }
          })
        } else {
          uni.showToast({ title: '投放成功！', icon: 'success' })
          setTimeout(() => uni.navigateTo({ url: '/pages/push-logs/index' }), 1200)
        }
      } else {
        uni.showToast({ title: res.msg || '投放失败', icon: 'none' })
      }
    },
    async payBox(boxId) {
      uni.showLoading({ title: '支付中...' })
      const res = await this.$wxapi.blindBoxFriendsPay({ token: this.token, id: boxId })
      uni.hideLoading()
      if (res.code == 0) {
        uni.showToast({ title: '支付成功，等待审核！', icon: 'success' })
        this.form = { nick: '', gender: 2, wx: '', pic: '', remark: '' }
        setTimeout(() => uni.navigateTo({ url: '/pages/push-logs/index' }), 1500)
      } else if (res.code == 20002) {
        // 拉起在线支付
		const payRes = await this.$pay.pay('wxpay', {}, res.data,
			'投放盲盒:' + boxId, '投放盲盒:' + boxId, {
				type: 22,
				boxId
			},
			(res) => {
				// 支付成功的逻辑
				uni.navigateTo({ url: '/pages/push-logs/index' })
			}, (err) => {
				// 支付失败的逻辑
			}
		)
      } else {
        uni.showToast({ title: res.msg || '支付失败', icon: 'none' })
        uni.navigateTo({ url: '/pages/push-logs/index' })
      }
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
.status-bar { flex-shrink: 0; }

.header {
  padding: 0 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  &__title {
    display: block;
    font-size: 44rpx;
    font-weight: 800;
    background: linear-gradient(135deg, #c084fc, #f5c842);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  &__sub {
    display: block;
    font-size: 24rpx;
    color: #8b7aa0;
    margin-top: 4rpx;
  }
}

.balance-bar {
  display: flex;
  align-items: center;
  margin: 32rpx 32rpx 32rpx;
  background: rgba(44, 15, 82, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 24rpx;
  padding: 28rpx 0;
}
.balance-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  &__num {
    font-size: 44rpx;
    font-weight: 900;
    color: #f5c842;
  }
  &__label { font-size: 22rpx; color: #8b7aa0; margin-top: 4rpx; }
}
.balance-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(192, 132, 252, 0.2);
}

.form-scroll { 
	flex: 1;
	padding: 0 32rpx;
	box-sizing: border-box;
}

.form-card {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 32rpx;
  padding: 40rpx 36rpx;
  margin-bottom: 24rpx;
}

.form-item {
  margin-bottom: 40rpx;
  &:last-child { margin-bottom: 0; }
}
.form-label {
  display: block;
  font-size: 26rpx;
  color: #c084fc;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.form-label-hint { font-size: 22rpx; color: #5b4d6b; font-weight: 400; }

.form-input {
  width: 100%;
  height: 80rpx;
  background: rgba(13, 1, 24, 0.6);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #f0e6ff;
  box-sizing: border-box;
}
.input-placeholder { color: #5b4d6b; }

.gender-group {
  display: flex;
  gap: 24rpx;
}
.gender-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  background: rgba(13, 1, 24, 0.6);
  border: 2rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 20rpx;
  transition: all 0.2s;
  &.active {
    border-color: #c084fc;
    background: rgba(124, 58, 237, 0.2);
    box-shadow: 0 0 20rpx rgba(192, 132, 252, 0.3);
  }
}
.gender-emoji { font-size: 56rpx; }
.gender-text { font-size: 26rpx; color: #c4b5d4; margin-top: 8rpx; }

.upload-area {
  width: 100%;
  height: 240rpx;
  background: rgba(13, 1, 24, 0.6);
  border: 2rpx dashed rgba(192, 132, 252, 0.3);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.upload-preview { width: 100%; height: 100%; }
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.upload-icon { font-size: 64rpx; opacity: 0.5; }
.upload-text { font-size: 26rpx; color: #5b4d6b; }

.form-textarea {
  width: 100%;
  min-height: 140rpx;
  background: rgba(13, 1, 24, 0.6);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #f0e6ff;
  box-sizing: border-box;
  line-height: 1.6;
}
.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #5b4d6b;
  margin-top: 8rpx;
}

.notice-card {
  background: rgba(245, 200, 66, 0.06);
  border: 1rpx solid rgba(245, 200, 66, 0.2);
  border-radius: 24rpx;
  padding: 32rpx 36rpx;
  margin-bottom: 40rpx;
}
.notice-title {
  display: block;
  font-size: 28rpx;
  color: #f5c842;
  font-weight: 700;
  margin-bottom: 20rpx;
}
.notice-item {
  display: block;
  font-size: 24rpx;
  color: #8b7aa0;
  line-height: 2;
}

.submit-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc, #f0abfc);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.5);
  margin-bottom: 40rpx;
  &.disabled { opacity: 0.6; }
}

.bottom-safe { height: 40rpx; }
</style>
