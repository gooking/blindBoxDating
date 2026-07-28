<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-bar__back" @click="goBack">‹</view>
      <text class="nav-bar__title">账号安全</text>
      <view class="nav-bar__placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">

      <!-- 绑定手机号 -->
      <view class="section-card">
        <text class="section-title">🔑 绑定手机</text>

        <!-- 已绑定：显示手机号 -->
        <view v-if="mobile" class="bind-row">
          <text class="bind-label">已绑定手机</text>
          <text class="bind-value">{{ mobileDisplay }}</text>
        </view>

        <!-- 未绑定：手动填写手机号 + 验证码 -->
        <view v-if="!mobile">
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="bindMobile" placeholder="请输入手机号" type="number" maxlength="11" placeholder-class="ph" />
          </view>
          <view class="form-item">
            <text class="form-label">验证码</text>
            <input class="form-input" v-model="bindSmsCode" placeholder="请输入验证码" type="number" maxlength="6" placeholder-class="ph" />
            <view class="code-btn" :class="{ disabled: bindSmsCounting }" @click="sendBindSms">
              {{ bindSmsCounting ? bindSmsCountdown + 's' : '获取验证码' }}
            </view>
          </view>
          <view class="action-btn" @click="doBindMobile" :class="{ loading: binding }">
            {{ binding ? '绑定中...' : '绑定手机号' }}
          </view>
        </view>

        <!-- 分割线（小程序才有一键绑定） -->
        <!-- #ifdef MP-WEIXIN -->
        <view class="divider" :class="{ 'divider--mt': !mobile }">
          <view class="divider__line"></view>
          <text class="divider__text">或</text>
          <view class="divider__line"></view>
        </view>

        <!-- 一键授权绑定（微信小程序专用） -->
        <button
          class="quick-bind-btn"
          open-type="getPhoneNumber"
          @getphonenumber="onGetPhoneNumber"
          :disabled="quickBinding"
        >
          <text class="quick-bind-btn__icon">📱</text>
          <text class="quick-bind-btn__text">{{ quickBinding ? '绑定中...' : '授权手机号一键绑定' }}</text>
        </button>
        <!-- #endif -->
      </view>

      <!-- ===== 修改登录密码（已删除，全程无需密码登录） ===== -->

      <!-- ===== 交易密码（暂时注释，后期可能用到） =====
      <view class="section-card">
        <text class="section-title">交易密码</text>
        <view class="form-item">
          <text class="form-label">新密码</text>
          <input class="form-input" v-model="payPwd" placeholder="6位数字交易密码" password maxlength="6" type="number" placeholder-class="ph" />
        </view>
        <view class="form-item">
          <text class="form-label">确认密码</text>
          <input class="form-input" v-model="payPwd2" placeholder="再次输入交易密码" password maxlength="6" type="number" placeholder-class="ph" />
        </view>
        <view class="action-btn" @click="setPayPwd" :class="{ loading: savingPay }">
          {{ savingPay ? '设置中...' : '设置交易密码' }}
        </view>
      </view>
      ===== 交易密码 END ===== -->

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
      // 手动绑定
      bindMobile: '',
      bindSmsCode: '',
      binding: false,
      bindSmsCounting: false,
      bindSmsCountdown: 60,
      bindSmsTimer: null,
      // 一键授权绑定
      quickBinding: false,
      // 交易密码（暂时保留数据，配合注释掉的 UI）
      // payPwd: '', payPwd2: '', savingPay: false,
    }
  },
  computed: {
    // 手机号脱敏显示
    mobileDisplay() {
      const m = this.mobile || ''
      if (m.length === 11) return m.slice(0, 3) + '****' + m.slice(7)
      return m
    }
  },
  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight = nav.navBarHeight
  },
  onUnload() {
    if (this.bindSmsTimer) clearInterval(this.bindSmsTimer)
  },
  methods: {
    // ---------- 手动填写手机号绑定 ----------
    async sendBindSms() {
      if (this.bindSmsCounting) return
      if (!this.bindMobile || this.bindMobile.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
      }
      uni.showLoading({ title: '发送中...' })
      const res = await this.$wxapi.smsValidateCode(this.bindMobile)
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: '验证码已发送', icon: 'success' })
        this.bindSmsCounting = true
        this.bindSmsCountdown = 60
        this.bindSmsTimer = setInterval(() => {
          this.bindSmsCountdown--
          if (this.bindSmsCountdown <= 0) {
            clearInterval(this.bindSmsTimer)
            this.bindSmsCounting = false
          }
        }, 1000)
      } else {
        uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
      }
    },
    async doBindMobile() {
      if (!this.bindMobile || this.bindMobile.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
      }
      if (!this.bindSmsCode) {
        uni.showToast({ title: '请输入验证码', icon: 'none' }); return
      }
      this.binding = true
      const res = await this.$wxapi.bindMobile(this.token, this.bindMobile, this.bindSmsCode)
      this.binding = false
      if (res.code === 0) {
        uni.showToast({ title: '绑定成功', icon: 'success' })
        this.vuex('mobile', this.bindMobile)
        this.bindMobile = ''
        this.bindSmsCode = ''
      } else {
        uni.showToast({ title: res.msg || '绑定失败', icon: 'none' })
      }
    },

    // ---------- 微信授权一键绑定 ----------
    // #ifdef MP-WEIXIN
    async onGetPhoneNumber(e) {
      if (!e.detail || !e.detail.code) {
        uni.showToast({ title: '已取消授权', icon: 'none' }); return
      }
      this.quickBinding = true
      uni.showLoading({ title: '绑定中...' })
      try {
        // 使用 SDK：bindMobileWxappV2(token, code)
        // code 为 getPhoneNumber 回调返回的动态令牌，data 直接返回绑定的手机号
        const res = await this.$wxapi.bindMobileWxappV2(this.token, e.detail.code)
        uni.hideLoading()
        this.quickBinding = false
        if (res.code === 0) {
          uni.showToast({ title: '绑定成功', icon: 'success' })
          this.vuex('mobile', res.data)  // res.data 即手机号字符串
        } else {
          uni.showToast({ title: res.msg || '一键绑定失败', icon: 'none' })
        }
      } catch (err) {
        uni.hideLoading()
        this.quickBinding = false
        uni.showToast({ title: '绑定异常，请稍后重试', icon: 'none' })
      }
    },
    // #endif

    // ---------- 交易密码（暂时注释，方法保留备用） ----------
    // async setPayPwd() {
    //   if (!this.payPwd || !this.payPwd2) { uni.showToast({ title: '请填写交易密码', icon: 'none' }); return }
    //   if (this.payPwd !== this.payPwd2) { uni.showToast({ title: '两次输入不一致', icon: 'none' }); return }
    //   this.savingPay = true
    //   const res = await this.$wxapi.setPayPassword(this.token, this.payPwd)
    //   this.savingPay = false
    //   if (res.code === 0) { uni.showToast({ title: '设置成功', icon: 'success' }); this.payPwd = ''; this.payPwd2 = '' }
    //   else { uni.showToast({ title: res.msg, icon: 'none' }) }
    // },

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

.section-card {
  background: rgba(34, 10, 64, 0.7); border: 1rpx solid rgba(192, 132, 252, 0.15);
  border-radius: 28rpx; padding: 32rpx; margin-bottom: 24rpx;
}
.section-title { display: block; font-size: 28rpx; font-weight: 700; color: #c084fc; margin-bottom: 28rpx; }

/* 已绑定手机号展示行 */
.bind-row { display: flex; align-items: center; justify-content: space-between; padding: 8rpx 0; }
.bind-label { font-size: 28rpx; color: #c4b5d4; }
.bind-value { font-size: 28rpx; color: #f0e6ff; font-weight: 600; letter-spacing: 2rpx; }

.form-item {
  display: flex; align-items: center; gap: 16rpx;
  border-bottom: 1rpx solid rgba(192, 132, 252, 0.08); padding: 20rpx 0;
  &:last-of-type { border-bottom: none; }
}
.form-label { font-size: 26rpx; color: #8b7aa0; width: 120rpx; flex-shrink: 0; }
.form-input { flex: 1; font-size: 28rpx; color: #f0e6ff; height: 60rpx; }
.ph { color: #5b4d6b; }
.code-btn {
  font-size: 22rpx; color: #c084fc; white-space: nowrap;
  padding: 8rpx 16rpx; border: 1rpx solid rgba(192,132,252,0.4); border-radius: 9999rpx;
  &.disabled { color: #5b4d6b; border-color: rgba(192,132,252,0.15); }
}
.action-btn {
  margin-top: 28rpx; height: 88rpx;
  background: linear-gradient(135deg, #7c3aed, #c084fc); border-radius: 9999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700; color: #fff;
  &.loading { opacity: 0.7; }
}

/* 分割线 */
.divider {
  display: flex; align-items: center; gap: 16rpx;
  margin: 24rpx 0;
  &--mt { margin-top: 32rpx; }
  &__line { flex: 1; height: 1rpx; background: rgba(192, 132, 252, 0.15); }
  &__text { font-size: 22rpx; color: #5b4d6b; flex-shrink: 0; }
}

/* 一键授权绑定按钮 */
.quick-bind-btn {
  width: 100%; height: 88rpx;
  background: rgba(192, 132, 252, 0.1);
  border: 1rpx solid rgba(192, 132, 252, 0.4) !important;
  border-radius: 9999rpx !important;
  display: flex; align-items: center; justify-content: center; gap: 12rpx;
  line-height: 88rpx; padding: 0; margin: 0; font-size: 0;
  &::after { border: none; }
  &[disabled] { opacity: 0.6; }
  &__icon { font-size: 30rpx; }
  &__text { font-size: 28rpx; font-weight: 700; color: #c084fc; }
}

.bottom-safe { height: 60rpx; }
</style>
