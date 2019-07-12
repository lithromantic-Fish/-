//resume_list.js
let util = require('../../utils/util');
let config = require('../../config');

//获取应用实例
const app = getApp()

Page({

  data: {
    PAGE: false,
    pageOptions: {},
    pageIndex: 1,
    //简历分享相关
    share_type: '',
    share_code: null,
    share_id: null,
    //分享者信息
    sharer: {},
    //permission 评价修改进程里的 选项数据
    permission: {},
    aboutForm : {
      isHidden: true
    },
    //是否显示 提交表单弹层
    dataItem: [],
    count: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({
      ['pageOptions']: options,
      ['pageOptions.page_source']: 2,
      ['share_code']: options.share_code
    })
    var that = this;
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    }
  },
  onShow: function () {
    
    //授权 并获取 页面数据
    util.IsGetAuthinfo()
  },
  //获取页面初始数据
  getInitData: function () {
    let that = this

    wx.showLoading()

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_jl_share',
      data: {
        'page': that.data.pageIndex,
        'share_code': that.data.share_code
      },
      method: "POST",
      withSessionKey: true
    }, that.getInitData).then(res => {
      let data = res.data
      if (res.resultcode === 0) {
        if (that.data.pageIndex > 1) {
          // 如果是分页以后的数据 合并
          let oldData = that.data.dataItem
          that.setData({
            //列表data list
            ['dataItem']: data.list ? oldData.concat(data.list) : []
          })
        } else {
          // 不是分页的首页数据
          that.setData({
            ['PAGE']: true,
            ['pageData']: data,
            ['share_id']: data.share_id ? data.share_id : '',
            //转发留言 相关
            ['sharer.isHR']: data.is_hr ? data.is_hr : '',
            ['sharer.avatar']: data.avatar ? data.avatar : '',
            ['sharer.nickname']: data.nickname ? data.nickname : '',
            ['sharer.msg']: data.msg ? data.msg : '',
            //列表data list
            ['dataItem']: data.list ? data.list : [],
            ['count']: data.count,
          })
        }

        that._setOperationRecord()

        //设置title
        // wx.setNavigationBarTitle({
        //   title: data.nickname + '转发的' + data.count +'份简历-三茅招聘' //为路由参数
        // })

        //设置title
        let _title = ''
        if (data.use_logo_coname == 1) {
          _title = data.resume.name + '-' + data.company_name
        } else {
          _title = data.nickname + '转发的' + data.count + '份简历-三茅招聘' //为路由参数
        }

        wx.setNavigationBarTitle({
          title: _title
        })
      } else if (res.resultcode === 303 || res.resultcode === 304) {

        // console.info('page [resume_list] - that.data.pageOptions->', that.data.pageOptions)

        URL = '/pages/extract/extract'
        URL = util.addParam2url(URL, that.data.pageOptions)

        // console.info('page [resume_list] - URL->', URL)
        
        util.gotoPage({
          url: URL
        })
      }
    })
  },
  //设置标记状态
  _setOperationRecord: function() {
    let that = this
    let OR = that.data.dataItem
    for (let i = 0; i < OR.length; i++) {
      let _or = that.data.share_id + '_' + OR[i].rid
      if (util.getOperationRecord(_or)) {
        let isRead = 'dataItem[' + i + '].isRead'
        that.setData({
          [isRead]: true
        })
      }
    }
  },
  //查看简历详情
  _showJL(e) {
    let that = this

    let share_code = that.data.share_code
    let data = e.currentTarget.dataset
    // let share_id = e.currentTarget.dataset.id
    // let rid = e.currentTarget.dataset.rid

    //存储操作记录
    let _op = that.data.share_id+'_'+data.rid
    util.setOperationRecord(_op)
    let isRead = 'dataItem[' + data.id + '].isRead'
    that.setData({
      [isRead]: true
    })

    //设置简历页面参数后跳转
    let url = '/pages/resume_base/resume_base'
    // 设置简历页面参数
    url = util.addParam2url(url, data)
    //跳转简历详情页
    util.gotoPage({
      url: url,
    })
  },
  //修改简历招聘进程按钮
  _changeJC(e) {
    
    let that = this
    let data = e.currentTarget.dataset

    if (data.is_send != 1) {
      util.showToast({
        title: '没有权限',
        icon: 'none'
      })
      return
    }

    //设置简历页面参数后跳转
    let url = '/pages/template/resume_op/resume_op'
    // 设置简历页面参数
    url = util.addParam2url(url, data)
    util.gotoPage({
      url: url,
    })

  },
  // 下拉加载更多
  onReachBottom() {
    
    let that = this

    if (that.data.pageIndex >= (that.data.count/20)) {
      return
    }

    that.setData({
      ['pageIndex']: ++that.data.pageIndex
    })

    that.getInitData()

  },
  //转发功能
  onShareAppMessage: function (res) {
    let that = this
    return {
      title: that.data.sharer.nickname + '转发的' + that.data.count + '份简历-三茅招聘',
      path: '/pages/transfer/transfer?share_code=' + that.data.share_code
    }
  }
})