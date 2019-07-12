// pages/authorization/authorization.js
let util = require('../../utils/util');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 弹窗显示控制
    isShow: false,
    title: '微信授权',
    content: '三茅招聘获取您的公开信息(昵称、头像等)',
    confirmText: '确定',
    userInfo: null,
    backOptions: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.setData({
      backOptions: options
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},
  onShow: function () {},
  /**
   * 自定义授权确定按钮
   */
  confirmEvent: function(){

    let that = this
    that.setData({
      isShow: !that.data.isShow
    })
    //是否获取到了授权信息
    let rawData = arguments[0].detail.rawData;

    if (rawData){
      var _options = that.data.backOptions
      let _url = decodeURIComponent(_options.backpath)

      delete _options.backpath

      _url = util.addParam2url(_url, _options)

      util._setStorageSync('authinfo', rawData);

      wx.showLoading({
        title: '',
      })
      
      //当前页面登录 获取code
      util._getCode().then(code => {
        // 根据获取的code 从后台获取 sessionkey
        return util._getSessionKeyByApi(code, util._getStorageSync('authinfo')).then(res => {
          util.gotoPage({
            url: '/' + _url,
            openType: 'reLaunch'
          })
        })
      })

      // util.gotoPage({
      //   url: '/'+_url,
      //   openType: 'reLaunch'
      // })

    } else {
      util.gotoPage({
        url: '/pages/index/index',
        openType: 'reLaunch'
      })
    }

  }
})