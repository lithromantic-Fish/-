// pages/transfer/transfer.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageOptions: {},
    share_code: '',
    share_type: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    // console.warn('page[transfer]-options->', options)

    let that = this
    if (options.share_code){
      that.setData({
        share_code: options.share_code,
        pageOptions: options
      })
    }
    
  },
  onShow: function () {
    let that = this
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    } else{
      util.IsGetAuthinfo()
    }
  },
  //单份多份简历区分跳转
  goToResumePage(code) {


    let that = this
    let _code = code ? code : ''
    let _type = that.data.share_type
    let URL = ''

    //code 101  没有密码 102 有密码
    if (_code == 101 || _code == 102) {
      //单份简历页面
      if (_type == 2) {
        URL = '/pages/resume_base/resume_base?share_code=' + that.data.share_code
      } else if (_type == 3) {
        //多份简历页面
        URL = '/pages/resume_list/resume_list?share_code=' + that.data.share_code
      }
    } else if (_code == 303 || _code == 304) {
      //303未通过密码验证, 
      //304分享密码已经更改,需要重新输入
      //跳密码页面
      URL = '/pages/extract/extract?share_code=' + that.data.share_code
    } else {
      console.warn('page extract.wxml -> resume type is not defined')
      return
    }

    // console.warn('page[transfer]-reLaunch->', URL)
    // 关闭所有页面跳转
    wx.reLaunch({
      url: URL
    })
  },
  /**
   * 公众号里的页面地址 判断跳转相应页面
   */
  //获取页面初始数据
  getInitData: function () {
    let that = this
    wx.showLoading()
    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_turn_to',
      data: {
        'share_code': that.data.pageOptions.share_code
      },
      method: "POST",
      withSessionKey: true
    }, that.getInitData).then(res => {
      // console.info('page -->', that.data.pageOptions.share_code)
      let data = res.data
      that.setData({
        'share_code': data.share_code ? data.share_code : '',
        'share_type': data.type ? data.type : 0
      })

      // 跳转 101 102 303 304
      that.goToResumePage(res.resultcode)
    })

  },
})