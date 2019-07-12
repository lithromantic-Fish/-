// pages/resume_invalid/resume_invalid.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    share_code: '',
    sharer_nickname: '',
    invalidType: 1, //分享失效类型 1,分享者取消分享 2,分享已经过期
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let that = this

    // console.info('page resume_invalid -- options ->', options)
    // console.info('page resume_invalid -- app.GD.pageOptions ->', app.GD.pageOptions)

    let share_code = ''
    if (options.share_code) {
      share_code = options.share_code
    }

    // console.info('page resume_invalid -- share_code ->', share_code)

    this.setData({
      ['share_code']: share_code,
      ['invalidType'] : options.type
    })

    // that.getNicknameByShare(share_code)
    that.setData({
      ['sharer_nickname']: 'HR'
    })
  },

  //share_code get nickname
  // getNicknameByShare: function (share_code){
  //   let that = this

  //   util.request({
  //     url: config.apiUrl + '/hr/hrzp/share/w_get_nickname_by_share',
  //     data: {
  //       'share_code': share_code
  //     },
  //     method: "POST",
  //     withSessionKey: true
  //   }, that.getFilterData).then(res => {
  //     let data = res.data
  //     if (res.resultcode === 0) {
  //       that.setData({
  //         ['sharer_nickname']: data
  //       })
  //     }
  //   })
    
   
  // }


})