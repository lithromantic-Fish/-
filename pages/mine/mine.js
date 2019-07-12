let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  data: {
    PAGE: false,
    isShowFixed: false,
    pageOptions: {},
    // pageIndex: 1,
    pageData: [],
    //input搜索框相关
    aboutSearch: {
      isShowInput: false,
      inputValue: '',
    },
    //搜索popup
    POPUP: {
      BG: false, //遮罩背景
      joblistArea: false, //职位列表
      resultArea: false, //搜索结果列表
      datelineArea: false, //时间排序列表
    },
    //全局当前用户是否是HR本人
    isHR: 0,
    //筛选条件
    filter: {
      page: 1,
      name: '',
      job_title: '',
      is_operate: 0, //0是所有 1是操作过的简历
      order: 0 //0不排序,1按简历操作时间排序,2按简历接收时间排序
    },
    //搜索结果展示相关
    SEARCHAREA: {
      COUNT: 0,
      REASULT: [],
      position: {},
      positionStatus: true,
      dateline: [{
        'name': '默认排序',
        'value': 0,
        'checked': false
      },{
          'name': '按简历操作时间排序',
          'value': 1,
          'checked': false
      },],
      selectedOrderName: '默认排序',
      datelineStatus: true,
    },
    //操作记录
    operationRecord: [],
    //数据列表 数量统计
    INIT_COUNT: 0, //页面加载初始数据统计
    FILTER_COUNT: 0, //筛选数据统计
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {

    let that = this
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    } 
    
  },
  onShow: function(){
    util.IsGetAuthinfo()
    
  },
  //获取页面初始数据
  getInitData: function() {
    let that = this
    // 显示loading
    
    wx.showLoading()
    //请求
    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_share_list',
      data: {},
      method: "POST",
      withSessionKey: true
    }, that.getInitData).then(res => {
      let data = res.data
      // //后端未上线时的处理/上线后可删除
      if (util.type(res) != 'object') {
        // console.info('res ->>>', res)
        that.setData({
          PAGE: true
        })
        return;
      }

      //渲染页面初始数据
      if (res.resultcode === 0) {
        //渲染页面初始数据
        that.setData({
          ['PAGE']: true,
          ['isHR']: data.is_hr ? data.is_hr : '',
          ['pageData']: data.data ? data.data : [],
          ['INIT_COUNT']: data.count ? data.count : 0,
          ['SEARCHAREA.position']: data.all_job_title ? data.all_job_title : [],
        })
        //设置操作记录左上角标记状态
        that._setOperationRecord()


        //设置操作顺序排序的选项
        if (that.data.isHR == 1) {
          let opt = {
            'name': '按简历转发时间排序',
            'value': 2,
            'checked': false
          }
          that.setData({
            ['SEARCHAREA.dateline']: that.data.SEARCHAREA.dateline.concat(opt)
          })
        } else {
          let opt = {
            'name': '按简历接收时间排序',
            'value': 3,
            'checked': false
          }
          that.setData({
            ['SEARCHAREA.dateline']: that.data.SEARCHAREA.dateline.concat(opt)
          })
        }
      }

    }).catch(res => {
    })
  },

  //获取搜索数据
  getSearchData: function() {
    let that = this

    wx.showLoading()

    that.setData({
      ['filter.page']: 1
    })

    if (that.data.filter.name != '') {
      that.setData({
        ['filter.page_size']: 5
      })
    } else {
      that.setData({
        ['filter.page_size']: ''
      })
    }

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_share_list',
      data: that.data.filter,
      method: "POST",
      withSessionKey: true
    }, that.getSearchData).then(res => {
      let data = res.data
      if (res.resultcode === 0) {
        that.setData({
          ['SEARCHAREA.COUNT']: data.count,
          ['SEARCHAREA.REASULT']: data.data ? data.data : []
        })

        that._showPopup('resultArea')
      }
    })
  },
  //获取筛选数据
  getFilterData: function(page) {
    let that = this

    wx.showLoading()

    if (page > 1) {
      that.setData({
        ['filter.page']: page
      })
    } else {
      that.setData({
        ['filter.page']: 1
      })
    }

    that.setData({
      ['filter.page_size']: ''
    })

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_share_list',
      data: that.data.filter,
      method: "POST",
      withSessionKey: true
    }, that.getFilterData).then(res => {
      let data = res.data
      if (res.resultcode === 0) {
        // 设置数据结果
        if (page > 1) {
          let oldData = that.data.pageData
          that.setData({
            ['pageData']: that.data.pageData.concat(data.data),
            ['FILTER_COUNT']: data.count ? data.count : 0
          })
        } else {
          that.setData({
            ['pageData']: data.data ? data.data : [],
            ['FILTER_COUNT']: data.count ? data.count : 0
          })
        }

        that._setOperationRecord()
      }
    })

    that._showPopup()
  },

  //设置标记状态
  _setOperationRecord: function() {
    let that = this
    let OR = that.data.pageData
    for (let i = 0; i < OR.length; i++) {
      let _or = OR[i].share_id + '_' + OR[i].rid
      if (util.getOperationRecord(_or)) {
        let isRead = 'pageData[' + i + '].isRead'
        that.setData({
          [isRead]: true
        })
      }
    }
  },

  //显示哪个遮罩
  _showPopup: function(opts) {
    let that = this
    let _opts = opts
    let data = that.data.POPUP

    for (let k in data) {

      let _k = "POPUP." + k + ""
      if (k == _opts) {
        that.setData({
          [_k]: true
        })
      } else {
        that.setData({
          [_k]: false
        })
      }
    }
    if (_opts) {
      that.setData({
        ['POPUP.BG']: true
      })
    } else {
      that.setData({
        ['POPUP.BG']: false
      })
    }

  },
  _closePosiiton: function(e){
    this._showPopup()
    this.setData({
      ['SEARCHAREA.positionStatus']: true,
      ['SEARCHAREA.datelineStatus']: true,
    })
  },
  //搜索框相关事件 [4]
  // 1,绑定展示出input搜索框事件
  _showInput: function(e) {
    let that = this
    that.setData({
      ['aboutSearch.isShowInput']: !that.data.aboutSearch.isShowInput
    })
  },
  // 2,清除input value事件
  _clearInput: function(e) {
    let that = this
    that.setData({
      ['aboutSearch.inputValue']: '',
      ['aboutSearch.isShowInput']: !that.data.aboutSearch.isShowInput,
      ['filter.name']: '',
    })
    //刷新数据
    that.getFilterData()
  },
  // 3,input输入事件 [入口函数防抖动 1秒/2次]
  _getInputValue: util.debounce(function(e) {

    let that = this
    let v = util.trim(e.detail.value)

    if (v == '') {
      that._showPopup()
    } else {
      that.setData({
        ['aboutSearch.inputValue']: v,
        ['aboutSearch.isShowInput']: true,
        ['filter.name']: v
      })
      that._showPopup('resultArea')

      that.getSearchData()
    }
  }, 500),
  // 4,input失去焦点
  _bindInputBlur: function(e) {
    let that = this
    let v = util.trim(e.detail.value)
    if (v == '') {
      that.setData({
        ['aboutSearch.isShowInput']: !that.data.aboutSearch.isShowInput
      })
    }
  },
  // 职位筛选相关 [2]
  // 1,显示职位选择列表
  _changePosition() {
    let that = this

    if (!that.data.SEARCHAREA.position) return

    if (that.data.SEARCHAREA.positionStatus) {

      that._showPopup('joblistArea')
      that.setData({
        ['SEARCHAREA.positionStatus']: !that.data.SEARCHAREA.positionStatus
      })
    } else {
      that._showPopup('')
      that.setData({
        ['SEARCHAREA.positionStatus']: !that.data.SEARCHAREA.positionStatus
      })
    }

  },
  // 2,职位选择
  _selectPosition: function(e) {
    let that = this
    let edata = e.currentTarget.dataset
    let data = that.data.SEARCHAREA.position

    for (let k in data) {
      let checked = 'SEARCHAREA.position[' + k + '].checked'
      if (k == edata.index) {
        that.setData({
          ['filter.job_title']: data[k].key,
          [checked]: true
        })
      } else {
        that.setData({
          [checked]: false
        })
      }
    }
    //刷新数据
    that.getFilterData()
  },

  //只看我操作过的简历 筛选事件
  _checkMine: function(e) {

    let that = this
    let v = e.currentTarget.dataset.value

    if (v == 0) {
      v = 1
    } else if (v == 1) {
      v = 0
    }

    that.setData({
      ['filter.is_operate']: v
    })

    //刷新数据
    that.getFilterData()
  },

  //排序相关 [2]
  // 1,展开排序选择
  _changeOrder: function(e) {
    let that = this
    if (that.data.SEARCHAREA.datelineStatus) {
      that._showPopup('datelineArea')
      that.setData({
        ['SEARCHAREA.datelineStatus']: !that.data.SEARCHAREA.datelineStatus
      })
    } else {
      that._showPopup('')
      that.setData({
        ['SEARCHAREA.datelineStatus']: !that.data.SEARCHAREA.datelineStatus
      })
    }
  },
  // 2,排序选择
  _selectDateline: function(e) {
    let that = this
    let _e = e.currentTarget.dataset
    let data = that.data.SEARCHAREA.dateline

    for (let k in data) {
      if (k == _e.index) {
        let dateline = 'SEARCHAREA.dateline[' + _e.index + '].checked'
        that.setData({
          [dateline]: true,
          ['filter.order']: _e.value,
          ['SEARCHAREA.selectedOrderName']: _e.name
        })
      } else {
        let dateline = 'SEARCHAREA.dateline[' + k + '].checked'
        that.setData({
          [dateline]: false
        })
      }
    }
    that.setData({
      ['SEARCHAREA.datelineStatus']: !that.data.SEARCHAREA.datelineStatus
    })
    that.getFilterData()
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

    //设置页面参数后跳转
    let url = '/pages/template/resume_op/resume_op'
    // 设置页面参数
    url = util.addParam2url(url, data)
    util.gotoPage({
      url: url
    })
  },
  //查看单份简历
  _showJL: function(e) {
    let that = this
    let data = e.currentTarget.dataset
    //记录查看记录
    let operationRecord = data.share_id + '_' + data.rid
    util.setOperationRecord(operationRecord)
    let isRead = 'pageData[' + data.index + '].isRead'
    that.setData({
      [isRead]: true
    })

    //设置单份简历页面参数后跳转
    let url = '/pages/resume_base/resume_base'
    // 设置单份简历页面参数
    url = util.addParam2url(url, data)
    //跳转简历详情页
    util.gotoPage({
      url: url
    })
  },
  //查看所有
  _checkAll: function() {
    let that = this
    that.getFilterData()
  },

  onPageScroll: function(e) { // 获取滚动条当前位置
    let that = this
    if (e.scrollTop > 100) {
      that.setData({
        ['isShowFixed']: true
      })
    } else {
      that.setData({
        ['isShowFixed']: false
      })
    }
  },
  //吸附按钮相关事件 [4]
  // 1.点击全部职位
  _fixedAllPosition: function() {
    let that = this
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    setTimeout(that._changePosition, 300)
  },
  // 2.点击已操作
  _fixedOP: function(e) {
    let that = this
    console.info(e)
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    setTimeout(function() {

      let _value = ''
      if (that.data.filter.is_operate == 1) {
        _value = 0
      } else {
        _value = 1
      }

      that.setData({
        ['filter.is_operate']: _value
      })
      that._checkMine(e)

    }, 300)
  },
  // 3.排序
  _fixedDesc: function() {
    let that = this
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    setTimeout(that._changeOrder, 300)
  },
  // 4, 搜索
  _fixedSearch: function() {
    let that = this
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    setTimeout(that._showInput, 300)
  },
  // 下拉加载更多
  onReachBottom() {
    let that = this
    if (that.data.INIT_COUNT && (that.data.filter.page > (that.data.INIT_COUNT / 20))) {
      return
    }
    // console.info(that.data.pageData)
    if (that.data.FILTER_COUNT && (that.data.filter.page > (that.data.FILTER_COUNT / 20))) {
      return
    }
    that.getFilterData(++that.data.filter.page)
  }
})