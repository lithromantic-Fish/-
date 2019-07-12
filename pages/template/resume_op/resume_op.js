// pages/template/resume_op/resume_op.js

var util = require('../../../utils/util');
var config = require('../../../config');


Page({

  /**
   * 初始数据
   */
  data: {
    PAGE: false,
    isXz: 1, //是否选择了 接收该简历协作消息提醒 [1默认选中]
    pageOptions: [],
    //关于淘汰原因隐藏展示
    all_reason: {},
    out_reason: [],
    out_reason_id: '',
    out_reason_name: '',
    out_reason_value: '',
    // 改招聘进程 相关
    permission: [],
    permission_value: '',
    permission_name: '',
    permission_text: '',
    selectedFlag: [], //折叠手风琴数组
    //多份简历时id
  },
  onLoad: function(options) {

    var that = this;
    that.setData({
      ['pageOptions']: options
    })

    //页面标题
    wx.setNavigationBarTitle({
      title: '修改招聘进程'
    })

  },

  onShow: function() {
    var that = this;
    //如果已经授权,请求首页数据
    if (util._getStorageSync('authinfo')) {
      that.getInitData()
    } else {
      //授权
      util.IsGetAuthinfo()
    }
  },
  //获得单选框选项
  getInitData: function() {
    let that = this

    wx.showLoading()

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_get_permission',
      data: that.data.pageOptions,
      method: "POST",
      withSessionKey: true,
    }, that.getInitData).then(res => {
      if (res.resultcode == 0) {
        that.setData({
          ['all_reason']: res.data.out_reason,
          ['permission']: res.data.permission,
          ['PAGE']: true
        })

        //设置手风琴效果
        that.setSelectStatus(res.data.permission)


        that.checkState()
      } else if (res.resultcode == 301 || res.resultcode == 302) {

      } else if (res.resultcode == 303 || res.resultcode == 304) {
        let URL = util.addParam2url('/pages/extract/extract', that.data.pageOptions)

        util.gotoPage({
          url: URL,
          openType: 'redirectTo'
        })
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 1500
        })
      }
    });

  },
  //收集用户的formid
  switchFormSubmit(e) {
    let that = this
    let formId = e.detail.formId

    wx.request({
      url: config.apiUrl + '/hr/hrzp/share/w_collect_form_id',
      method: "POST",
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cache-control': 'no-cache'
      },
      data: {
        'form_id': formId,
        'share_id': that.data.pageOptions.share_id,
        'rid': that.data.pageOptions.rid,
        'session_key': util._getStorageSync()
      },
    });
  },
  //设置手风琴效果
  setSelectStatus: function(data) {
    let self = this
    // console.log(data)
    var arr = []
    for (let i = 0; i < data.length; i++) {
      arr.push(false)
    }

    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].children.length; j++) {
        if (data[i].children[j].checked == true) {
          arr[i] = true
        }
      }
    }

    self.setData({
      selectedFlag: arr
    })
    // console.info('选中状态',arr)
  },

  //手风琴效果
  showTabs: function(e){
    let self = this
    // let flag = self.data.selectedFlag
    let { index } = e.currentTarget.dataset
    console.info(index)
    // console.info(flag)

    let flag = 'selectedFlag[' + index +']'
    
    // if (flag[index]) {

      self.setData({
        [flag]: !self.data.selectedFlag[index]
      })
    // }

    console.info(flag)

  },

  //接收该简历协作消息提醒
  _checkboxChange(e) {
    let that = this;
    let _v = e.detail.value ? e.detail.value.toString() : '';
    that.setData({
      ['isXz']: _v
    })
  },
  //招聘进程表单提交
  submitForm(e) {

    let that = this
    let data = that.data
    let submitStatu = false

    // if (data.permission_value == '') {
    //   util.showToast({
    //     title: '请选择招聘进程',
    //     icon: 'none',
    //     duration: 1500
    //   });
    //   return;
    // }

    for (let i = 0; i < data.permission.length; i++) {
      for (let j = 0; j < data.permission[i].children.length; j++) {
        if (data.permission[i].children[j].checked == true) {
          that.setData({
            permission_value: data.permission[i].children[j].id
          })
        }
      }
    }
    // 请求未返回不能提交
    if (submitStatu) {
      return
    } else {
      wx.showLoading({
        title: '',
        mark: true
      })
    }
    submitStatu = true

    util.request({
      url: config.apiUrl + '/hr/hrzp/share/w_min_set_process',
      data: {
        'id': data.pageOptions.rid, //分享简历id
        'uid': data.pageOptions.uid, //分享简历用户id
        'gid': data.pageOptions.gid, //gid
        'share_id': data.pageOptions.share_id, //分享id
        'is_receive': data.isXz, //接收简历协作消息提醒
        'status': data.permission_value, //招聘进程选择项
        'feedback': data.permission_text, //备注
        'out_reason': data.out_reason_value //淘汰原因
      },
      method: "POST",
      withSessionKey: true,
      autoHideLoading: false
    }).then(res => {

      if (res.resultcode == 0) {
        util.showToast({
          title: '评价/修改成功',
          duration: 1500,
          complete: function() {
            if (res.data != '') {
              if (data.pageOptions.page_source && data.pageOptions.page_source == 2) {
                // 设置改变父页面的值
                let pages = getCurrentPages();
                let currPage = pages[pages.length - 1]; //当前页面
                let prevPage = pages[pages.length - 2]; //上一个页面
                //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
                let _data = 'dataItem[' + data.pageOptions.index + '].status_text'
                prevPage.setData({
                  [_data]: res.data
                })
              }
            }
            //返回上一页
            setTimeout(wx.navigateBack, 1500)
          }
        });
      } else {
        util.showToast({
          title: res.msg,
          icon: 'none',
          duration: 1500
        });
      }

      submitStatu = false
    }).catch(res => {
      submitStatu = false
    });

  },
  //清空/设置 淘汰原因选择列表
  clearData: function() {
    let self = this
    //不需要展示然后选择淘汰原因的 则清空对应数据
    self.setData({
      ['out_reason']: [],
      ['out_reason_name']: '',
      ['out_reason_value']: ''
    })
  },
  setOutData(id, name) {
    let self = this
    console.info(id)
    self.setData({
      ['out_reason']: self.data.all_reason['a' + id].children,
      ['out_reason_name']: name
    })
  },
  //查询是否默认有淘汰状态的选中
  checkState() {
    let self = this
    let data = self.data
    for (let i = 0; i < data.permission.length; i++) {
      for (let j = 0; j < data.permission[i].children.length; j++) {
        // 如果是选中状态,并且需要弹窗 就显示弹窗
        if (data.permission[i].children[j].checked == true && data.permission[i].children[j].type == 3) {
          // console.info('查询是否默认有淘汰状态的选中', data.permission[i].children[j].id, data.permission[i].children[j].name)
          self.setOutData(data.permission[i].children[j].id, data.permission[i].children[j].name)
        }
      }
    }
  },
  //单选框选择 //
  formRadioChange(e) {
    let that = this
    let items = that.data.permission
    // 进程选项 类型
    let _dataset = e.currentTarget.dataset

    if (_dataset.root == 0) {
      return;
    }
    //设置 选中
    for (let i = 0, len = items.length; i < len; ++i) {
      for (let j = 0, len1 = items[i].children.length; j < len1; ++j) {
        if (items[i].children[j].id == _dataset.id) {
          items[i].children[j].checked = true
          //如果 type等于3 则需要展示淘汰理由 然后选择理由
          if (_dataset.type == 3) {
            //先清空对应数据
            that.clearData()
            that.setOutData(_dataset.id, _dataset.name)
          } else {
            //不需要展示然后选择淘汰原因的 则清空对应数据
            that.clearData()
          }
        } else {
          items[i].children[j].checked = false
        }
      }
    }
    that.setData({
      ['permission']: items,
      ['permission_value']: _dataset.id,
      ['permission_name']: _dataset.name
    })
  },
  //选择 out 原因
  bindPickerChange(e) {
    let self = this

    self.setData({
      'out_reason_value': self.data.out_reason[e.detail.value]
    })
    console.info(e.detail.value)
  },
  //输入备注/评价
  textareaChange(e) {
    this.setData({
      permission_text: e.detail.value
    })
  }
})