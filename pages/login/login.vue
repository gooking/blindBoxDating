<template>
  <view class="page">
    <!-- 背景光晕 -->
    <view class="bg-orb bg-orb--1"></view>
    <view class="bg-orb bg-orb--2"></view>
    <view class="bg-orb bg-orb--3"></view>

    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 返回按钮（有上级页面时显示） -->
    <view
      class="back-btn"
      :style="{ top: statusBarHeight + 'px', height: navBarHeight + 'px' }"
      @click="goBack"
      v-if="canBack"
    >
      <text class="back-icon">‹</text>
    </view>

    <!-- Logo 区 -->
    <view class="logo-area">
      <view class="logo-ring">
        <view class="logo-inner">
          <text class="logo-emoji">💝</text>
        </view>
      </view>
      <text class="logo-title">盲盒交友</text>
      <text class="logo-sub">遇见命中注定的TA</text>
    </view>

    <!-- 登录表单卡片 -->
    <view class="form-card">

      <!-- #ifdef H5 -->
      <!-- H5：验证码登录 -->
      <text class="form-card__title">手机号登录</text>

      <!-- 手机号输入 -->
      <view class="input-wrap">
        <text class="input-prefix">+86</text>
        <view class="input-divider"></view>
        <input
          class="form-input"
          type="number"
          v-model="mobile"
          placeholder="请输入手机号码"
          placeholder-class="ph"
          maxlength="11"
        />
      </view>

      <!-- 图形验证码 -->
      <view class="input-wrap">
        <text class="input-icon">🔒</text>
        <input
          class="form-input"
          type="number"
          v-model="picCode"
          placeholder="请输入图形验证码"
          placeholder-class="ph"
          maxlength="6"
        />
        <image
          class="pic-code-img"
          :src="picCodeUrl"
          mode="heightFix"
          @click="refreshPicCode"
        />
      </view>

      <!-- 验证码输入 -->
      <view class="input-wrap">
        <text class="input-icon">🔐</text>
        <input
          class="form-input"
          type="number"
          v-model="smsCode"
          placeholder="请输入验证码"
          placeholder-class="ph"
          maxlength="6"
        />
        <view
          class="code-btn"
          :class="{ disabled: countdown > 0 }"
          @click="sendCode"
        >{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</view>
      </view>

      <!-- 验证码登录按钮 -->
      <view class="login-btn" @click="doLogin" :class="{ loading: logging }">
        <text v-if="!logging">验证码登录</text>
        <text v-else>登录中...</text>
      </view>
      <!-- #endif -->

      <!-- #ifdef MP-WEIXIN -->
      <!-- 小程序：一键手机号登录 -->
      <text class="form-card__title">授权登录</text>

      <button
        class="quick-login-btn"
        open-type="getPhoneNumber"
        @getphonenumber="onGetPhoneNumber"
        :disabled="quickLogging"
      >
        <text class="quick-login-btn__icon">📱</text>
        <text class="quick-login-btn__text">{{ quickLogging ? '登录中...' : '授权手机号一键登录' }}</text>
      </button>
      <!-- #endif -->

      <!-- 协议勾选行 -->
      <view class="agreement-row" @click="toggleAgreed">
        <view class="checkbox" :class="{ checked: agreed }">
          <text v-if="agreed" class="checkbox__tick">✓</text>
        </view>
        <text class="agreement-text">我已阅读并同意</text>
        <text class="agreement-link" @click.stop="openAgreement('yhxy')">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @click.stop="openAgreement('ysxy')">《隐私政策》</text>
      </view>
    </view>

    <!-- 底部装饰文字 -->
    <view class="footer-text">
      <text>解锁每一个神秘的相遇</text>
    </view>
  </view>
</template>

<script>
import { getNavBarInfo } from '@/common/navbar.js'
import AUTH from '@/common/auth.js'

export default {
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      mobile: '',
      smsCode: '',
      countdown: 0,
      timer: null,
      logging: false,
      picKey: '',
      picCode: '',
      picCodeUrl: '',
      quickLogging: false,
      canBack: false,
      agreed: false,       // 协议勾选状态，默认不勾
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
    const pages = getCurrentPages()
    this.canBack = pages.length > 1
    // #ifdef H5
    this.refreshPicCode()
    // #endif
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    toggleAgreed() {
      this.agreed = !this.agreed
    },
    // #ifdef H5
    // 生成/刷新图形验证码
    refreshPicCode() {
      this.picKey = Math.random().toString(36).slice(2, 10) + Date.now()
      this.picCodeUrl = this.$wxapi.graphValidateCodeUrl(this.picKey)
      this.picCode = ''
    },
    // #endif
    // 检查是否已同意协议
    checkAgreed() {
      if (!this.agreed) {
        uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none', duration: 2000 })
        return false
      }
      return true
    },
    // #ifdef H5
    async sendCode() {
      if (this.countdown > 0) return
      if (!this.mobile || this.mobile.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.picCode) {
        uni.showToast({ title: '请输入图形验证码', icon: 'none' })
        return
      }
      if (!this.checkAgreed()) return
      uni.showLoading({ title: '发送中...' })
      const res = await this.$wxapi.smsValidateCode(this.mobile, this.picKey, this.picCode)
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: '验证码已发送', icon: 'success' })
        this.countdown = 60
        this.timer = setInterval(() => {
          this.countdown--
          if (this.countdown <= 0) {
            clearInterval(this.timer)
            this.timer = null
          }
        }, 1000)
      } else {
        uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
        // 发送失败（含图形验证码错误），自动刷新图形验证码
        this.refreshPicCode()
      }
    },
    async doLogin() {
      if (!this.mobile || this.mobile.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.smsCode || this.smsCode.length < 4) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }
      if (!this.checkAgreed()) return
      this.logging = true
      const res = await this.$wxapi.loginMobileSmsCode({
        mobile: this.mobile,
        code: this.smsCode,
        autoReg: true
      })
      this.logging = false
      if (res.code === 0) {
        this.onLoginSuccess(res.data)
      } else {
        uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    },
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序一键手机号登录
    async onGetPhoneNumber(e) {
      if (!this.checkAgreed()) return
      // 用户拒绝授权
      if (!e.detail || !e.detail.code) {
        uni.showToast({ title: '已取消授权', icon: 'none' })
        return
      }
      this.quickLogging = true
      uni.showLoading({ title: '登录中...' })
      try {
        // 同时获取登录 code
        const loginCode = await AUTH.wxaCode()
        const res = await this.$wxapi.loginWxaMobileV3({
          code: loginCode,
          codeMobile: e.detail.code,
          autoReg: true,
          referrer: this.referrer || ''
        })
        uni.hideLoading()
        this.quickLogging = false
        if (res.code === 0) {
          this.onLoginSuccess(res.data)
        } else {
          uni.showToast({ title: res.msg || '一键登录失败', icon: 'none' })
        }
      } catch (err) {
        uni.hideLoading()
        this.quickLogging = false
        uni.showToast({ title: '登录异常，请稍后重试', icon: 'none' })
      }
    },
    // #endif

    // 登录成功统一处理
    onLoginSuccess(data) {
      this.vuex('token', data.token)
      this.vuex('uid', data.uid)
      if (data.mobile) this.vuex('mobile', data.mobile)
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack()
        } else {
          uni.switchTab({ url: '/pages/index/index' })
        }
      }, 800)
    },

    goBack() {
      uni.navigateBack()
    },
    openAgreement(key) {
      uni.navigateTo({ url: `/pages/agreement/agreement?key=${key}` })
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #0d0118;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;  /* 左右留出间距，不再贴边 */
  overflow: hidden;
  position: relative;
}

/* 背景光晕 */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  &--1 {
    width: 400rpx; height: 400rpx;
    background: rgba(124, 58, 237, 0.35);
    top: -100rpx; left: -100rpx;
  }
  &--2 {
    width: 300rpx; height: 300rpx;
    background: rgba(236, 72, 153, 0.25);
    top: 300rpx; right: -80rpx;
  }
  &--3 {
    width: 350rpx; height: 350rpx;
    background: rgba(192, 132, 252, 0.2);
    bottom: 0; left: 50rpx;
  }
}

.status-bar { width: 100%; }

.back-btn {
  position: absolute;
  left: 40rpx;
  display: flex;
  align-items: center;
  padding: 0 16rpx;
  z-index: 10;
}
.back-icon { font-size: 56rpx; color: #c084fc; line-height: 1; }

/* Logo */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 56rpx;
}
.logo-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  padding: 4rpx;
  box-shadow: 0 0 60rpx rgba(192, 132, 252, 0.5);
  margin-bottom: 28rpx;
}
.logo-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #1a0533;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-emoji { font-size: 80rpx; }
.logo-title {
  font-size: 48rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #c084fc, #f5c842);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 6rpx;
  margin-bottom: 10rpx;
}
.logo-sub { font-size: 24rpx; color: #8b7aa0; }

/* 表单卡片：左右有 40rpx page padding + 卡片自身 padding，不再贴边 */
.form-card {
  width: 90%;
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(34, 10, 64, 0.85);
  border: 1rpx solid rgba(192, 132, 252, 0.25);
  border-radius: 40rpx;
  padding: 48rpx 40rpx;
  backdrop-filter: blur(20px);
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
  &__title {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #f0e6ff;
    margin-bottom: 36rpx;
    text-align: center;
    letter-spacing: 2rpx;
  }
}

.input-wrap {
  display: flex;
  align-items: center;
  background: rgba(13, 1, 24, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 20rpx;
  padding: 0 24rpx;
  height: 96rpx;
  margin-bottom: 20rpx;
  gap: 16rpx;
}
.input-prefix { font-size: 28rpx; color: #8b7aa0; flex-shrink: 0; }
.input-divider { width: 1rpx; height: 40rpx; background: rgba(192, 132, 252, 0.2); flex-shrink: 0; }
.input-icon { font-size: 32rpx; flex-shrink: 0; }
.form-input { flex: 1; height: 100%; font-size: 30rpx; color: #f0e6ff; }
.ph { color: #5b4d6b; }

.code-btn {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #c084fc;
  padding: 12rpx 20rpx;
  border: 1rpx solid rgba(192, 132, 252, 0.4);
  border-radius: 9999rpx;
  white-space: nowrap;
  &.disabled { color: #5b4d6b; border-color: rgba(192, 132, 252, 0.15); }
}

.pic-code-img {
  flex-shrink: 0;
  width: 0;
  height: 64rpx;
  border-radius: 10rpx;
  overflow: hidden;
  cursor: pointer;
}

/* 验证码登录按钮 */
.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc, #f0abfc);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 32rpx rgba(124, 58, 237, 0.5);
  margin-top: 8rpx;
  &.loading { opacity: 0.7; }
}

/* 一键登录按钮（微信小程序原生 button，需重置默认样式） */
.quick-login-btn {
  width: 100%;
  height: 96rpx;
  background: rgba(192, 132, 252, 0.12);
  border: 1rpx solid rgba(192, 132, 252, 0.4) !important;
  border-radius: 9999rpx !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  /* 重置 uni/wx button 默认样式 */
  line-height: 96rpx;
  padding: 0;
  margin: 0;
  font-size: 0;  /* 子元素用 text 控制字号 */
  &::after { border: none; }
  &[disabled] { opacity: 0.6; }

  &__icon { font-size: 32rpx; }
  &__text {
    font-size: 30rpx;
    font-weight: 700;
    color: #c084fc;
  }
}

/* 协议勾选行 */
.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 28rpx;
  flex-wrap: wrap;
  gap: 6rpx;
  cursor: pointer;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 2rpx solid rgba(192, 132, 252, 0.4);
  background: rgba(13, 1, 24, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  &.checked {
    background: linear-gradient(135deg, #7c3aed, #c084fc);
    border-color: #c084fc;
  }
  &__tick {
    font-size: 22rpx;
    color: #fff;
    font-weight: 900;
    line-height: 1;
  }
}

.agreement-text { font-size: 22rpx; color: #5b4d6b; }
.agreement-link {
  font-size: 22rpx;
  color: #c084fc;
  text-decoration: underline;
}

.footer-text {
  margin-top: 40rpx;
  font-size: 22rpx;
  color: #3d2a52;
  letter-spacing: 2rpx;
}
</style>
