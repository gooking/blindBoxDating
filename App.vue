<script>
	import CONFIG from '@/config.js'
	import AUTH from '@/common/auth.js'
	export default {
		globalData: {
			curLat: undefined,
			curLong: undefined,
			adminLogined: false,
			goLogin: false,
		},
		onLaunch: function() {
			uni.addInterceptor('request', {
			  success: (res) => {
			    if(res.data && res.data.code == 2000) {
					// #ifdef H5
					uni.redirectTo({ url: '/pages/login/login' })
					// #endif
				}
			  },
			})
			this.vuex('versionNum', uni.getAppBaseInfo().appVersion)
			this.checkForUpdate()
		},
		onShow(e) {
			if (e && e.query && e.query.inviter_id) {
				this.vuex('referrer', e.query.inviter_id)
			}
			if (e && e.query && e.query.code) {
				this.wxmpLogin(e.query.code)
				return
			}
			AUTH.checkHasLogined().then(isLogined => {
				if (!isLogined) {
					// #ifdef MP-WEIXIN
					AUTH.authorize().then(res => {
						if(res.code == 0) {
							this.getUserApiInfo()
						}
					})
					// #endif
				} else {
					this.getUserApiInfo()
				}
			})
		},
		onHide: function() {},
		onPageNotFound(e) {
			console.error(e)
		},
		methods: {
			checkForUpdate() {
				// #ifdef MP
				const updateManager = uni.getUpdateManager()
				updateManager.onCheckForUpdate(function(res) {})
				updateManager.onUpdateReady(function(res) {
					uni.showModal({
						title: '更新提示',
						content: '新版本已就绪，是否立即重启？',
						success(res) {
							if (res.confirm) updateManager.applyUpdate()
						}
					})
				})
				updateManager.onUpdateFailed(function(res) {})
				// #endif
			},
			async getUserApiInfo() {
				const _this = this.$vm ? this.$vm : this
				const res = await _this.$wxapi.userDetail(_this.token)
				if (res.code == 0) {
					_this.vuex('apiUserInfoMap', res.data)
					return res.data
				}
				return null
			},
			async wxmpLogin(code) {
				const _this = this.$vm ? this.$vm : this
				const res = await this.$wxapi.wxmpAuth({ code })
				if (res.code == 0) {
					_this.vuex('token', res.data.token)
					_this.vuex('uid', res.data.uid)
					_this.vuex('openid', res.data.openid)
					setTimeout(() => { uni.$emit('loginOK', {}) }, 500)
				}
			},
		}
	}
</script>

<style lang="scss">
	/* #ifdef H5 */
	uni-page-head { display: none; }
	/* #endif */

	page {
		background-color: #0d0118;
		color: #f0e6ff;
	}
	
	scroll-view {
		box-sizing: border-box;
	}

	/* 全局滚动条隐藏 */
	::-webkit-scrollbar { display: none; }

	/* 通用卡片玻璃效果 */
	.glass-card {
		background: rgba(34, 10, 64, 0.7);
		border: 1rpx solid rgba(192, 132, 252, 0.2);
		border-radius: 32rpx;
	}

	/* 紫色渐变按钮 */
	.btn-primary {
		background: linear-gradient(135deg, #7c3aed 0%, #c084fc 50%, #f0abfc 100%);
		border-radius: 9999rpx;
		color: #fff;
		font-weight: 700;
		box-shadow: 0 4rpx 24rpx rgba(120, 60, 200, 0.4);
	}

	/* 金色文字 */
	.text-gold {
		color: #f5c842;
	}

	/* 主题色文字 */
	.text-primary {
		color: #c084fc;
	}

	/* 空状态提示 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 48rpx;

		.empty-icon {
			font-size: 120rpx;
			margin-bottom: 32rpx;
			opacity: 0.4;
		}

		.empty-text {
			font-size: 28rpx;
			color: #8b7aa0;
		}
	}
</style>
