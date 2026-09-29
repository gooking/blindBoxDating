<template>
  <view class="page">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部标题栏 -->
    <view class="header" :style="{ height: navBarHeight + 'px' }">
      <text class="header__title">漂流瓶</text>
      <text class="header__sub">匿名漂流，遇见世界上的你</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-nav">
      <view class="tab-nav__track">
        <view
          class="tab-nav__thumb"
          :style="{ left: activeTab === 'throw' ? '2%' : '52%' }"
        ></view>
        <view
          class="tab-nav__item"
          :class="{ 'is-active': activeTab === 'throw' }"
          @click="switchTab('throw')"
        >
          <text class="tab-nav__text">🌊 扔瓶子</text>
        </view>
        <view
          class="tab-nav__item"
          :class="{ 'is-active': activeTab === 'catch' }"
          @click="switchTab('catch')"
        >
          <text class="tab-nav__text">🎣 捡瓶子</text>
        </view>
      </view>
    </view>

    <!-- ═══════════════ 扔瓶子 ═══════════════ -->
    <scroll-view v-if="activeTab === 'throw'" scroll-y class="scroll-area">
      <!-- 引导横幅 -->
      <view class="hero-banner">
        <view class="hero-banner__orb">
          <text class="hero-banner__emoji">🍾</text>
          <view class="hero-banner__ring r1"></view>
          <view class="hero-banner__ring r2"></view>
          <view class="hero-banner__ring r3"></view>
        </view>
        <text class="hero-banner__title">写下你的心声</text>
        <text class="hero-banner__desc">让文字随海浪漂流，等待有缘人拾起</text>
      </view>

      <!-- 输入卡片 -->
      <view class="input-card">
        <view class="input-card__head">
          <text class="input-card__label">✉️ 瓶中信</text>
          <text class="input-card__count">{{ throwContent.length }}/200</text>
        </view>
        <textarea
          class="input-card__area"
          v-model="throwContent"
          placeholder="写下你想说的话，也许它会漂到某个懂你的人手中..."
          placeholder-class="ph-cls"
          :maxlength="200"
        ></textarea>
      </view>

      <!-- 匿名提示 -->
      <view class="anon-tag">
        <text class="anon-tag__icon">🔒</text>
        <text class="anon-tag__text">内容完全匿名，对方不知道你是谁</text>
      </view>

      <!-- 投放按钮 -->
      <view
        class="ocean-btn"
        :class="{ 'ocean-btn--busy': throwing }"
        @click="throwBottle"
      >
        <text class="ocean-btn__text">{{ throwing ? '漂流中...' : '🌊 投入大海' }}</text>
      </view>

      <view class="page-spacer"></view>
    </scroll-view>

    <!-- ═══════════════ 捡瓶子 ═══════════════ -->
    <scroll-view v-if="activeTab === 'catch'" scroll-y class="scroll-area">
      <!-- 大海场景 -->
      <view class="sea-stage" @click="catchBottle">
        <!-- 波浪层 -->
        <view class="sea-stage__waves">
          <view class="sea-wave sw1"></view>
          <view class="sea-wave sw2"></view>
          <view class="sea-wave sw3"></view>
        </view>
        <!-- 漂浮的瓶子 -->
        <view class="sea-stage__bottle" :class="{ 'is-fishing': catching }">
          <text class="sea-stage__icon">🍾</text>
        </view>
        <!-- 提示文字 -->
        <view class="sea-stage__cta">
          <text class="sea-stage__hint">{{ catching ? '🌊 海浪翻涌中...' : '点击打捞漂流瓶' }}</text>
        </view>
      </view>

      <!-- 捡到的瓶子结果 -->
      <view v-if="caughtBottle" class="found-wrap">
        <!-- 分隔标题 -->
        <view class="divider-title">
          <view class="divider-title__line"></view>
          <text class="divider-title__text">✨ 发现了一只漂流瓶</text>
          <view class="divider-title__line"></view>
        </view>

        <!-- 内容卡片 -->
        <view class="found-card">
          <!-- 发送者 -->
          <view class="found-card__sender">
            <image
              :src="caughtBottle.userInfo.avatarUrl || '/static/default-avatar.svg'"
              mode="aspectFill"
              class="found-card__avatar"
            ></image>
            <view class="found-card__meta">
              <text class="found-card__nick">{{ caughtBottle.userInfo.nick || '神秘的陌生人' }}</text>
              <text class="found-card__time">{{ formatDate(caughtBottle.bottleInfo.dateAdd) }}</text>
            </view>
            <view class="found-card__badge">匿名</view>
          </view>

          <!-- 瓶中信内容 -->
          <view class="found-card__msg">
            <text class="msg-quote msg-quote--open">"</text>
            <text class="msg-text">{{ caughtBottle.bottleInfo.txt }}</text>
            <text class="msg-quote msg-quote--close">"</text>
          </view>
        </view>

        <!-- 再捞按钮 -->
        <view class="re-fish-wrap" @click.stop="catchBottle">
          <view class="re-fish-btn">
            <text class="re-fish-btn__text">🎣 再捞一个</text>
          </view>
        </view>
      </view>

      <!-- 初始引导文案（未捡到时显示） -->
      <view v-if="!caughtBottle && !catching" class="sea-guide">
        <view class="sea-guide__item">
          <text class="sea-guide__icon">🌊</text>
          <text class="sea-guide__text">每次打捞都是与陌生人的奇妙相遇</text>
        </view>
        <view class="sea-guide__item">
          <text class="sea-guide__icon">💌</text>
          <text class="sea-guide__text">瓶中装着别人的心事与故事</text>
        </view>
        <view class="sea-guide__item">
          <text class="sea-guide__icon">✨</text>
          <text class="sea-guide__text">或许下一个就是命中注定的相遇</text>
        </view>
      </view>

      <view class="page-spacer"></view>
    </scroll-view>
    <!-- ═══════════════ 投瓶动画遮罩 ═══════════════ -->
    <view v-if="showThrowAnim" class="throw-mask">
      <!-- 背景海浪 -->
      <view class="throw-mask__sea">
        <view class="throw-sea-wave tsw1"></view>
        <view class="throw-sea-wave tsw2"></view>
        <view class="throw-sea-wave tsw3"></view>
      </view>

      <!-- 粒子光点 -->
      <text class="throw-spark sp1">✦</text>
      <text class="throw-spark sp2">✦</text>
      <text class="throw-spark sp3">✦</text>
      <text class="throw-spark sp4">✧</text>
      <text class="throw-spark sp5">✦</text>

      <!-- 漂流瓶主体：旋转 → 飞向远方 -->
      <view class="throw-bottle">
        <text class="throw-bottle__icon">🍾</text>
      </view>

      <!-- 底部提示文字 -->
      <view class="throw-mask__tip">
        <text class="throw-mask__tip-text">投入大海...</text>
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
      activeTab: 'throw',   // 'throw' | 'catch'

      // 扔瓶子
      throwContent: '',
      throwing: false,
      showThrowAnim: false,   // 投瓶动画遮罩

      // 捡瓶子
      catching: false,
      caughtBottle: null,
    }
  },

  onLoad() {
    const nav = getNavBarInfo()
    this.statusBarHeight = nav.statusBarHeight
    this.navBarHeight    = nav.navBarHeight
  },

  methods: {
    switchTab(tab) {
      if (this.activeTab === tab) return
      this.activeTab = tab
    },

    // ── 扔瓶子 ──────────────────────────────────────────
    async throwBottle() {
      if (!this.token) {
        uni.navigateTo({ url: '/pages/login/login' })
        return
      }
      const content = this.throwContent.trim()
      if (!content) {
        uni.showToast({ title: '请先写下你想说的话', icon: 'none' })
        return
      }

      this.throwing = true
      const params = { token: this.token, content }

      // 尝试获取位置（可选，失败也不影响投放）
      try {
        const loc = await new Promise((resolve) => {
          uni.getLocation({
            type: 'wgs84',
            success: (res) => resolve(res),
            fail:    ()    => resolve(null),
          })
        })
        if (loc) {
          params.latitude  = loc.latitude
          params.longitude = loc.longitude
        }
      } catch (_) {}

      const res = await this.$wxapi.bottleMsgPublish(params)
      this.throwing = false

      if (res.code === 0) {
        this.throwContent = ''
        // 播放投瓶动画（约 2.2s），动画进行到中段再提示
        this.showThrowAnim = true
        setTimeout(() => {
          uni.showToast({ title: '🍾 瓶子已漂向远方', icon: 'none', duration: 1500 })
        }, 1000)
        setTimeout(() => {
          this.showThrowAnim = false
        }, 2300)
      } else {
        uni.showToast({ title: res.msg || '投放失败，请稍后再试', icon: 'none' })
      }
    },

    // ── 捡瓶子 ──────────────────────────────────────────
    async catchBottle() {
      if (!this.token) {
        uni.navigateTo({ url: '/pages/login/login' })
        return
      }
      if (this.catching) return

      this.catching    = true
      this.caughtBottle = null

      // 模拟打捞动画延迟，让动效更有感觉
      await new Promise((r) => setTimeout(r, 1400))

      const res = await this.$wxapi.bottleMsgSalvage(this.token)
      this.catching = false

      if (res.code === 0 && res.data && res.data.bottleInfo) {
        this.caughtBottle = res.data
      } else if (res.code === 0) {
        uni.showToast({ title: '大海里暂无漂流瓶～', icon: 'none' })
      } else {
        uni.showToast({ title: res.msg || '打捞失败，请稍后再试', icon: 'none' })
      }
    },

    // ── 时间格式化 ──────────────────────────────────────
    formatDate(dateStr) {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr.replace(/-/g, '/'))
        const diff = Date.now() - date.getTime()
        const mins  = Math.floor(diff / 60000)
        if (mins < 1)  return '刚刚'
        if (mins < 60) return `${mins} 分钟前`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} 小时前`
        const days = Math.floor(hours / 24)
        if (days < 7)   return `${days} 天前`
        return dateStr.slice(0, 10)
      } catch (_) {
        return dateStr
      }
    },
  },
}
</script>

<style lang="scss" scoped>
// ── 基础布局 ──────────────────────────────────────────────
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0533 0%, #0d0118 60%);
  display: flex;
  flex-direction: column;
}

.status-bar { flex-shrink: 0; }

// ── 顶部标题 ──────────────────────────────────────────────
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
    background: linear-gradient(135deg, #60a5fa, #c084fc, #f0abfc);
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

// ── Tab 导航 ──────────────────────────────────────────────
.tab-nav {
  padding: 0 32rpx 28rpx;
  flex-shrink: 0;
}

.tab-nav__track {
  position: relative;
  display: flex;
  height: 84rpx;
  background: rgba(44, 15, 82, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 9999rpx;
  padding: 6rpx;
  box-sizing: border-box;
}

.tab-nav__thumb {
  position: absolute;
  top: 6rpx;
  bottom: 6rpx;
  width: 46%;
  background: linear-gradient(135deg, #2563eb, #7c3aed, #c084fc);
  border-radius: 9999rpx;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4rpx 20rpx rgba(124, 58, 237, 0.55);
}

.tab-nav__item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.tab-nav__text {
  font-size: 28rpx;
  font-weight: 700;
  color: #8b7aa0;
  transition: color 0.25s;

  .tab-nav__item.is-active & { color: #ffffff; }
}

// ── 滚动区域 ──────────────────────────────────────────────
.scroll-area {
  flex: 1;
  padding: 0 32rpx;
  box-sizing: border-box;
}

// ── 扔瓶子 Hero ──────────────────────────────────────────
.hero-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 52rpx 32rpx 44rpx;
  margin-bottom: 32rpx;
  background: linear-gradient(145deg, rgba(7, 22, 56, 0.88), rgba(26, 5, 51, 0.92));
  border: 1rpx solid rgba(96, 165, 250, 0.22);
  border-radius: 32rpx;
  overflow: hidden;

  &__orb {
    position: relative;
    width: 140rpx;
    height: 140rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28rpx;
  }

  &__emoji {
    font-size: 86rpx;
    position: relative;
    z-index: 1;
    animation: hero-float 3.2s ease-in-out infinite;
  }

  &__ring {
    position: absolute;
    border-radius: 50%;
    border: 2rpx solid rgba(96, 165, 250, 0.38);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ring-pulse 3.2s ease-out infinite;
  }

  &__title {
    font-size: 38rpx;
    font-weight: 800;
    color: #f0e6ff;
    margin-bottom: 12rpx;
  }

  &__desc {
    font-size: 26rpx;
    color: #8b7aa0;
    text-align: center;
    line-height: 1.7;
  }
}

// 三圈波纹，延迟递进
.r1 { width: 96rpx;  height: 96rpx;  animation-delay: 0s; }
.r2 { width: 148rpx; height: 148rpx; animation-delay: 1.05s; }
.r3 { width: 200rpx; height: 200rpx; animation-delay: 2.1s; }

@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}

@keyframes ring-pulse {
  0%   { opacity: 0.75; transform: translate(-50%, -50%) scale(0.65); }
  100% { opacity: 0;    transform: translate(-50%, -50%) scale(1.7); }
}

// ── 输入卡片 ──────────────────────────────────────────────
.input-card {
  background: rgba(34, 10, 64, 0.7);
  border: 1rpx solid rgba(192, 132, 252, 0.2);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  &__label {
    font-size: 28rpx;
    font-weight: 700;
    color: #c084fc;
  }

  &__count {
    font-size: 22rpx;
    color: #5b4d6b;
  }

  &__area {
    width: 100%;
    min-height: 220rpx;
    background: rgba(13, 1, 24, 0.6);
    border: 1rpx solid rgba(192, 132, 252, 0.15);
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #f0e6ff;
    box-sizing: border-box;
    line-height: 1.85;
  }
}

.ph-cls {
  color: #5b4d6b;
  font-size: 26rpx;
}

// ── 匿名提示条 ──────────────────────────────────────────
.anon-tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 28rpx;
  margin-bottom: 32rpx;
  background: rgba(37, 99, 235, 0.08);
  border: 1rpx solid rgba(59, 130, 246, 0.22);
  border-radius: 16rpx;

  &__icon { font-size: 28rpx; }
  &__text { font-size: 24rpx; color: #93c5fd; }
}

// ── 投入大海 按钮 ──────────────────────────────────────────
.ocean-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #1d4ed8, #7c3aed, #c084fc);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(29, 78, 216, 0.48);

  &__text {
    font-size: 34rpx;
    font-weight: 800;
    color: #fff;
    letter-spacing: 4rpx;
  }

  &--busy { opacity: 0.65; }
}

// ── 大海场景 ──────────────────────────────────────────────
.sea-stage {
  position: relative;
  height: 390rpx;
  background: linear-gradient(180deg, #04091a 0%, #080f26 45%, #12082b 100%);
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 36rpx;
  border: 1rpx solid rgba(59, 130, 246, 0.14);
  box-shadow: inset 0 -50rpx 100rpx rgba(29, 78, 216, 0.12);

  &__waves {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200rpx;
  }

  &__bottle {
    position: relative;
    z-index: 2;
    margin-bottom: 24rpx;
    animation: bottle-bob 4.5s ease-in-out infinite;

    &.is-fishing {
      animation: bottle-spin 0.55s linear infinite;
    }
  }

  &__icon { font-size: 100rpx; }

  &__cta {
    position: relative;
    z-index: 2;
  }

  &__hint {
    font-size: 26rpx;
    color: rgba(147, 197, 253, 0.85);
    background: rgba(0, 0, 0, 0.38);
    padding: 12rpx 36rpx;
    border-radius: 9999rpx;
    border: 1rpx solid rgba(59, 130, 246, 0.25);
  }
}

// 三层波浪
.sea-wave {
  position: absolute;
  border-radius: 42%;
}

.sw1 {
  width: 260%;
  height: 130rpx;
  bottom: 28rpx;
  left: -80%;
  background: rgba(29, 78, 216, 0.28);
  animation: sea-roll 7s linear infinite;
}

.sw2 {
  width: 260%;
  height: 110rpx;
  bottom: 14rpx;
  left: -50%;
  background: rgba(59, 130, 246, 0.18);
  animation: sea-roll 9s linear infinite reverse;
  animation-delay: -2s;
}

.sw3 {
  width: 260%;
  height: 90rpx;
  bottom: 0;
  left: -30%;
  background: rgba(96, 165, 250, 0.1);
  animation: sea-roll 12s linear infinite;
  animation-delay: -5s;
}

@keyframes bottle-bob {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  30%       { transform: translateY(-20rpx) rotate(5deg); }
  65%       { transform: translateY(10rpx) rotate(-2deg); }
}

@keyframes bottle-spin {
  0%   { transform: rotate(0deg) scale(1.08); }
  100% { transform: rotate(360deg) scale(1.08); }
}

@keyframes sea-roll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

// ── 捡到的瓶子 ──────────────────────────────────────────
.found-wrap { margin-bottom: 32rpx; }

.divider-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;

  &__line {
    flex: 1;
    height: 1rpx;
    background: rgba(192, 132, 252, 0.22);
  }

  &__text {
    font-size: 28rpx;
    font-weight: 700;
    color: #f0e6ff;
    white-space: nowrap;
  }
}

.found-card {
  background: linear-gradient(145deg, rgba(6, 16, 40, 0.96), rgba(20, 5, 40, 0.96));
  border: 1rpx solid rgba(59, 130, 246, 0.26);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  box-shadow:
    0 8rpx 40rpx rgba(0, 0, 0, 0.55),
    0 0 0 1rpx rgba(96, 165, 250, 0.08);

  // 发送者信息行
  &__sender {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 32rpx;
  }

  &__avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(59, 130, 246, 0.45);
    flex-shrink: 0;
  }

  &__meta { flex: 1; }

  &__nick {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #f0e6ff;
    margin-bottom: 8rpx;
  }

  &__time {
    display: block;
    font-size: 22rpx;
    color: #8b7aa0;
  }

  &__badge {
    font-size: 20rpx;
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.1);
    border: 1rpx solid rgba(59, 130, 246, 0.3);
    padding: 8rpx 18rpx;
    border-radius: 9999rpx;
    white-space: nowrap;
  }

  // 瓶中信内容
  &__msg {
    background: rgba(0, 0, 0, 0.28);
    border-radius: 20rpx;
    border-left: 4rpx solid rgba(96, 165, 250, 0.55);
    padding: 24rpx 28rpx;
  }
}

.msg-quote {
  display: block;
  font-size: 60rpx;
  color: rgba(96, 165, 250, 0.38);
  line-height: 0.8;
  font-family: Georgia, serif;

  &--close {
    text-align: right;
    margin-top: 8rpx;
  }
}

.msg-text {
  display: block;
  font-size: 30rpx;
  color: #f0e6ff;
  line-height: 1.95;
  margin: 10rpx 0;
}

// ── 再捞按钮 ──────────────────────────────────────────────
.re-fish-wrap {
  display: flex;
  justify-content: center;
}

.re-fish-btn {
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #1d4ed8, #7c3aed);
  border-radius: 9999rpx;
  box-shadow: 0 6rpx 24rpx rgba(29, 78, 216, 0.45);

  &__text {
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
  }
}

// ── 初始引导文案 ──────────────────────────────────────────
.sea-guide {
  padding: 8rpx 0 40rpx;

  &__item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 22rpx 28rpx;
    margin-bottom: 16rpx;
    background: rgba(34, 10, 64, 0.5);
    border: 1rpx solid rgba(192, 132, 252, 0.12);
    border-radius: 16rpx;
  }

  &__icon { font-size: 36rpx; }
  &__text { font-size: 26rpx; color: #8b7aa0; line-height: 1.5; }
}

.page-spacer { height: 48rpx; }

// ── 投瓶动画遮罩 ──────────────────────────────────────────
.throw-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #020a1c 0%, #060f28 45%, #100626 100%);
  // 整体遮罩：渐入 → 停留 → 渐出
  animation: mask-life 2.3s ease-in-out forwards;

  // 背景波浪容器
  &__sea {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  &__tip {
    position: absolute;
    bottom: 22%;
  }

  &__tip-text {
    font-size: 28rpx;
    color: rgba(147, 197, 253, 0.7);
    letter-spacing: 4rpx;
    animation: tip-blink 2.3s ease-in-out forwards;
  }
}

// 遮罩淡入淡出
@keyframes mask-life {
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  72%  { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes tip-blink {
  0%   { opacity: 0; }
  15%  { opacity: 0.9; }
  70%  { opacity: 0.9; }
  100% { opacity: 0; }
}

// 背景波浪（复用海洋动效）
.throw-sea-wave {
  position: absolute;
  border-radius: 42%;
}

.tsw1 {
  width: 260%; height: 130rpx; bottom: 28rpx; left: -80%;
  background: rgba(29, 78, 216, 0.22);
  animation: sea-roll 7s linear infinite;
}

.tsw2 {
  width: 260%; height: 110rpx; bottom: 14rpx; left: -50%;
  background: rgba(59, 130, 246, 0.14);
  animation: sea-roll 9s linear infinite reverse;
  animation-delay: -2s;
}

.tsw3 {
  width: 260%; height: 90rpx; bottom: 0; left: -30%;
  background: rgba(96, 165, 250, 0.08);
  animation: sea-roll 12s linear infinite;
  animation-delay: -5s;
}

// 漂流瓶：蓄力 → 高速旋转 → 飞向远方消失
.throw-bottle {
  position: relative;
  z-index: 2;
  animation: bottle-launch 1.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;

  &__icon { font-size: 110rpx; display: block; }
}

@keyframes bottle-launch {
  /* 初始：稍大、轻微倾斜 */
  0% {
    transform: translate(0, 0) rotate(-18deg) scale(1.25);
    opacity: 1;
  }
  /* 蓄力：往左下收 */
  12% {
    transform: translate(-48rpx, 56rpx) rotate(-35deg) scale(1.3);
    opacity: 1;
  }
  /* 发力上扬，开始快速旋转 */
  28% {
    transform: translate(30rpx, -80rpx) rotate(180deg) scale(1.15);
    opacity: 1;
  }
  /* 飞行中段 */
  55% {
    transform: translate(160rpx, -300rpx) rotate(600deg) scale(0.55);
    opacity: 0.9;
  }
  /* 接近地平线，越来越小 */
  80% {
    transform: translate(270rpx, -500rpx) rotate(900deg) scale(0.18);
    opacity: 0.35;
  }
  /* 消失 */
  100% {
    transform: translate(320rpx, -640rpx) rotate(1080deg) scale(0.02);
    opacity: 0;
  }
}

// 光点粒子 —— 5颗分布在不同位置，错开动画时机
.throw-spark {
  position: absolute;
  z-index: 3;
  font-size: 28rpx;
  color: rgba(96, 165, 250, 0.85);
  animation: spark-float 2.3s ease-out forwards;
}

.sp1 { top: 38%; left: 42%; animation-delay: 0.15s; font-size: 36rpx; color: #c084fc; }
.sp2 { top: 32%; left: 58%; animation-delay: 0.35s; }
.sp3 { top: 28%; left: 36%; animation-delay: 0.55s; font-size: 24rpx; }
.sp4 { top: 25%; left: 62%; animation-delay: 0.25s; color: #f0abfc; }
.sp5 { top: 42%; left: 64%; animation-delay: 0.45s; font-size: 20rpx; }

@keyframes spark-float {
  0%   { transform: translate(0, 0) scale(0); opacity: 0; }
  18%  { transform: translate(0, -20rpx) scale(1.2); opacity: 1; }
  55%  { transform: translate(10rpx, -90rpx) scale(0.9); opacity: 0.75; }
  100% { transform: translate(20rpx, -200rpx) scale(0); opacity: 0; }
}

</style>
