//resume_base.js
let util = require('../../utils/util');
let config = require('../../config');
//获取应用实例
const app = getApp()

Page({

  data: {
    PAGE: !false,
    pageOptions: {},
    //点击手机号码 显示 action-sheet
    actionSheetHidden: true,
    actionSheetItems: ['', '复制', '呼叫', '同步到通讯录'],
    //简历分享相关
    share_id: '',
    share_type: '',
    share_rid: '',
    share_uid: '',
    share_gid: '',
    share_code: null,
    // 如果是多份简历里的其中一份,就获取下一份的id
    next_id: 0,
    //分享者信息
    sharer: {},
    isShowTip: false, //是否显示查看原始简历提示语
    navTabIndex: 1, //选中第几个tab
    //permission 评价修改进程里的 选项数据
    permission: '',
    //operate 操作记录
    operate: [],
    //简历源文件
    source_file: '',
    //简历信息
    resume: {},
    //查看原始简历 相关
    checkSourceFile: {},
    //工作经历相关
    experience: {
      height: "180px",
      isShow: false
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onLoad: function(options) {


    // console.info('page resume_base -> options', options)

    let that = this
    let share_id = '',
      share_rid = '',
      share_uid = '',
      share_gid = '',
      share_code = ''

    if (options.share_id) {
      share_id = options.share_id
    }

    if (options.rid) {
      share_rid = options.rid
    }

    if (options.uid) {
      share_uid = options.uid
    }
    if (options.gid) {
      share_gid = options.gid
    }

    if (options.share_code) {
      share_code = options.share_code
    }

    that.setData({
      pageOptions: options ? options : [],
      share_id: share_id ? share_id : '',
      share_rid: share_rid ? share_rid : '',
      share_uid: share_uid ? share_uid : '',
      share_gid: share_gid ? share_gid : '',
      share_code: share_code ? share_code : ''
    })

  },
  onShow: function () {
    var that = this;
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    } else {
      //获取授权
      util.IsGetAuthinfo()
    }
  },
  //获取页面初始数据
  getInitData: function() {
    let that = this
    let URL = config.apiUrl
    wx.showLoading()

    //来源页面 参数
    let opts = {}

    // console.info('page resume_base - opts-->', opts)

    //不同页面来源 请求不同接口
    if (that.data.pageOptions.page_source == 1) {
      //如果来源是 我的[page/mine/mine]
      URL += '/hr/hrzp/share/w_min_share_detail'
      opts = {
        share_id: that.data.pageOptions.share_id,
        share_code: that.data.pageOptions.share_code,
        rid: that.data.pageOptions.rid,
        uid: that.data.pageOptions.uid,
        gid: that.data.pageOptions.gid,
      }
    } else if (that.data.pageOptions.page_source == 3) {
      //如果来源是 标准简历
      URL += '/hr/hrzp/min/resume'
      opts = {
        rid: that.data.pageOptions.rid,
        uid: that.data.pageOptions.uid,
        gid: that.data.pageOptions.gid,
      }
    } else {
      URL += '/hr/hrzp/share/w_min_jl_share'
      opts = {
        share_code: that.data.pageOptions.share_code,
        id: that.data.pageOptions.id ? that.data.pageOptions.id : ''
      }
    }

    // console.warn('page[resume_base]->opts', opts)

    util.request({
      url: URL,
      data: opts,
      method: "POST",
      withSessionKey: true
    }, that.getInitData).then(res => {
      let data = res.data
      if (res.resultcode === 0) {
        // 当前简历是有设置密码的
        that.setData({
          ['PAGE']: true,
          ['pageData']: data,
          //转发留言 相关
          ['sharer.isHR']: data.is_hr ? data.is_hr : 0,
          ['sharer.avatar']: data.avatar ? data.avatar : '',
          ['sharer.nickname']: data.nickname ? data.nickname : '',
          ['sharer.msg']: data.msg ? data.msg : '',
          //评价修改进程需要的 表单选项数据
          ['permission']: data.permission ? data.permission : '',
          //简历分享类型 2,单份 3,多份
          ['share_type']: data.type ? data.type : 0,
          ['share_id']: data.share_id ? data.share_id : that.data.share_id,
          //operate 操作记录
          ['operate']: data.operate ? data.operate : 0,
          //source_file 简历源文件
          ['source_file']: data.source_file ? data.source_file : 0,
          //简历信息
          ['resume']: data.resume,
          ['resume.first_name']: data.resume.name ? data.resume.name.substring(0, 1) : '',
          //多份简历列表的某一份简历
          ['next_id']: data.next_id ? data.next_id : 0
        })

        // console.info('that.data.PAGE', that.data.PAGE)
        //设置title
        let _title = ''
        if (data.use_logo_coname == 1) {
          _title = data.resume.name + '-' + data.company_name
        } else {
          _title = data.resume.name + '的简历-三茅招聘' //为路由参数
        }

        wx.setNavigationBarTitle({
          title: _title
        })

        if (that.data.share_type != 2) {
          wx.hideShareMenu()
        }
      } else if (res.resultcode == 303 || res.resultcode == 304) {
        //303分享有密码但未通过密码验证进入简历页
        //304分享密码已更改
        //都跳 密码页
        let url = '/pages/extract/extract'
        url = util.addParam2url(url, that.data.pageOptions)
        util.gotoPage({
          url: url,
          openType: 'redirectTo'
        })
      }
    })
  },
  //收集用户的formid
  switchFormSubmit(e) {
    let formId = e.detail.formId

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_collect_form_id',
      data: {
        'form_id': formId
      },
      method: "POST",
      withSessionKey: true
    });
  },
  // 返回列表 按钮 [多份简历时]
  _backToList: function() {
    wx.navigateBack()
  },
  // 下一份 按钮 [多份简历时]
  _showNext: function() {
    let that = this
    
    util.gotoPage({
      url: '/pages/resume_base/resume_base?share_code=' + that.data.share_code + '&id=' + that.data.next_id,
      openType: 'redirectTo'
    })
  },
  //tab 点击
  navTabClick: function(e) {
    let that = this
    let _index = e.target.dataset.index
    if (_index == 2) {
      //查看原始简历
      util.runFn(that.showSourceFile, that, e)
    } else {
      this.setData({
        navTabIndex: _index
      })
    }
  },
  //查看原始简历
  showSourceFile: function(e) {

    let that = this
    let share_code = that.data.share_code ? that.data.share_code : that.data.pageOptions.share_code
    let rid = that.data.resume.id ? that.data.resume.id : that.data.pageOptions.rid
    let uid = that.data.resume.uid ? that.data.resume.uid : that.data.pageOptions.uid
    let gid = that.data.resume.gid ? that.data.resume.gid : that.data.pageOptions.gid
    let URL = config.apiUrl
    let opts = {}
    
    if (that.data.pageOptions.page_source == 3) {
      URL += '/hr/hrzp/min/get_source_file'
      opts = {
        'uid': uid,
        'rid': rid,
        'gid': gid
      }
    }  else {
      URL += '/hr/hrzp/share/w_get_source_file'
      opts = {
        'share_code': share_code,
        'rid': rid
      }
    }

    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request({
      url: URL,
      data: opts,
      method: "POST",
      withSessionKey: true,
      autoHideLoading: false
    }, that.showSourceFile).then(res => {
      let data = res.data
      if (data != '') {
        let URL = data
        //下载文件缓存到本地
        wx.showLoading({
          title: '加载中',
          mask: true
          })
        wx.downloadFile({
          url: URL,
          success: function(res) {
            let filePath = res.tempFilePath
            wx.openDocument({
              filePath: filePath,
              success: function(res) {
                console.info('openDocument success res', res)

              },
              fail: function(res) {
                console.info('openDocument fail res', res)

              },
              complete: function() {}
            })
          },
          fail: function() {
            // fail
            wx.showToast({
              title: '原始简历不存在',
              icon: 'none',
              duration: 2000
            })
          },
          complete: function() {
            // complete
            wx.hideLoading()
          }
        })

      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 2000
        })
      }
    })

    return
  },
  //手机号码 相关
  actionSheetTap: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    });
  },
  actionSheetChange: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    });
  },
  listenerActionSheet: function () {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    });
  },
  bindItemTap: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    });
    console.log('tap ', e.currentTarget.dataset);
    let that = this
    let tapIndex = e.currentTarget.dataset.index

    if (tapIndex == 1) {
      // 一键复制
      wx.setClipboardData({
        data: that.data.resume.mobile,
        success: function (res) {
          wx.getClipboardData({
            success: function (res) {
              console.log(res.data) // data
            }
          })
        }
      })
    } else if (tapIndex == 2) {
      // 呼叫号码
      wx.makePhoneCall({
        phoneNumber: that.data.resume.mobile
      })
    } else if (tapIndex == 3) {
      // 添加到手机通讯录
      wx.addPhoneContact({
        firstName: that.data.resume.name, //联系人姓名
        mobilePhoneNumber: that.data.resume.mobile, //联系人手机号
      })
    }
  },
  // 提示呼叫号码还是将号码添加到手机通讯录
  phoneNumTap: function() {
    var that = this;
    // 提示呼叫号码还是将号码添加到手机通讯录
    wx.showActionSheet({
      itemList: ['复制', '呼叫', '同步到通讯录'],
      success: function(res) {
        if (res.tapIndex === 0) {
          // 一键复制
          wx.setClipboardData({
            data: that.data.resume.mobile,
            success: function(res) {
              wx.getClipboardData({
                success: function(res) {
                  console.log(res.data) // data
                }
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 呼叫号码
          wx.makePhoneCall({
            phoneNumber: that.data.resume.mobile
          })
        } else if (res.tapIndex == 2) {
          // 添加到手机通讯录
          wx.addPhoneContact({
            firstName: that.data.resume.name, //联系人姓名
            mobilePhoneNumber: that.data.resume.mobile, //联系人手机号
          })
        }
      }
    })
  },
  //一键复制邮箱地址
  mailCopyTap() {
    let that = this
    // 一键复制邮箱地址 功能条
    wx.showActionSheet({
      itemList: ['复制邮箱地址'],
      success: function(res) {
        if (res.tapIndex === 0) {
          // 一键复制
          wx.setClipboardData({
            data: that.data.resume.email,
            success: function(res) {
              wx.getClipboardData({
                success: function(res) {
                  console.log(res.data) // data
                }
              })
            }
          })
        }
      }
    })
  },
  //关闭提示语
  _closeTip: function() {
    var self = this;
    self.setData({
      isShowTip: !self.data.isShowTip
    })
  },
  //评价/修改进程按钮
  _changeJC(e) {
    let data = e.currentTarget.dataset

    if (data.is_send != 1 ) {
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
      url: url
    })
  },
  //转发功能
  onShareAppMessage: function(res) {
    let that = this
    return {
      title: that.data.resume.name + '的简历-三茅招聘',
      path: '/pages/transfer/transfer?share_code=' + that.data.share_code
    }
  },
  _experience: function(){
    this.setData({
      'experience.height': 'auto',
      'experience.isShow': !this.data.experience.isShow
    })
  }

})