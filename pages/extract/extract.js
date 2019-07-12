//resume_base.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({
  //share.type 2,单份简历 3,多份简历
  data: {
    PAGE: false,
    pageOptions: {},
    share_code: null,
    share: {
      name: '',
      dateline: '',
      avatar: '',
      count: '',
      reminder: '',
      type: ''
    },
    password: ''
  },

  onLoad: function (options) {
    
    // 存储基础 share_code
    let share_code = ''
    if (options.share_code) {
      share_code = options.share_code
    }

    let that = this
    that.setData({
      ['pageOptions']: options,
      ['share_code']: share_code
    })

  },
  onShow: function () {
    let that = this
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    } else {
      //授权 
      util.IsGetAuthinfo()
    }
  },
  //单份多份简历区分跳转
  goToResumePage() {
    let that = this
    let _type = that.data.share.type
    let URL = ''
    let pagesource = that.data.pageOptions.page_source

    //如果 有页面来源值 
    //则返回相应页面
    if (pagesource == 1) {
      //如果来源是 我的[page/mine/mine]
      //则不管 type 直接跳转 简历详情页 
      URL = '/pages/resume_base/resume_base'
      URL = util.addParam2url(URL, that.data.pageOptions)
    } else if (pagesource == 2) {
      //如果来源是 多份简历页面[pages/resume_list/resume_list]
      //则不管 type 直接跳转 简历详情页 
      URL = '/pages/resume_list/resume_list'
      URL = util.addParam2url(URL, that.data.pageOptions)
    } else {
      if (_type == '2') {
        //单份简历页面
        URL = '/pages/resume_base/resume_base?share_code=' + that.data.share_code
      } else if (_type == '3') {
        //多份简历页面
        URL = '/pages/resume_list/resume_list?share_code=' + that.data.share_code
      } else {
        console.info('page extract.wxml -> resume type is not defined')
        return
      }
    }

    // 关闭当前页面跳转
    wx.redirectTo({
      url: URL
    })
  },
  //获取页面初始数据
  getInitData: function() {
    let that = this
    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_share_index',
      data: {
        'share_code': that.data.share_code
      },
      method: "POST",
      withSessionKey: true
    }).then(res => {
      let data = res.data
      
      if (res.resultcode === 0) {
        // 当前简历是有设置密码的
        that.setData({
          ['PAGE']: !that.data.PAGE,
          ['share.name']: data.name,
          ['share.dateline']: data.dateline,
          ['share.avatar']: data.avatar,
          ['share.count']: data.count,
          ['share.reminder']: data.reminder,
          ['share.type']: data.type
        })
      } else if (res.resultcode === 101) {
        // 当前简历是有设置密码的
        that.setData({
          ['PAGE']: !that.data.PAGE,
          ['share.type']: data.type
        })
        // 当前简历是没有密码的
        that.goToResumePage()
      }
    })

  },
  //密码输入框
  _bindinput(e) {
    let _val = e.detail.value
    this.setData({
      'password': _val
    })
  },
  //提取按钮事件
  passwordSubmit() {

    var that = this

    if (!that.data.password) {
      return
    }

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_verify_pass',
      data: {
        'password': that.data.password,
        'share_code': that.data.share_code
      },
      method: "POST",
      withSessionKey: true
    }, that.passwordSubmit).then(res => {
      if (res.resultcode === 201) {
        //201 密码正确
        that.goToResumePage()
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 2000
        })
      }
    })

  },
  methods: {

  }

})