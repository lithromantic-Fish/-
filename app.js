//app.js
let util = require('./utils/util');
let config = require('./config');
let Promise = util.Promise;

let topics = {}; // 回调函数存放的数组

App({
  onLaunch: function (options) {
    let self = this;
    //console.info(options)

    let path = options.path; // 打开小程序的页面, 如pages/index/index
    let scene = options.scene; // 打开小程序的场景值

    let systemInfo = util.getSystemInfoSync();
    this.GD.systemInfo = systemInfo;
    
  },


  onShow(options) {

    let path = options.path; // 打开小程序的页面, 如pages/index/index
    let scene = options.scene; // 打开小程序的场景值

    // wx.showModal({
    //  content: 'app onShow' + JSON.stringify(options)
    // })

    // 1007 单人聊天会话中的小程序消息卡片
    // 1008 群聊会话中的小程序消息卡片
    // 1011 扫描二维码
    // 1012 长按图片识别二维码
    // 1013 手机相册选取二维码
    // 1036 当小程序从 （App 分享消息卡片） 打开时
    // if (scene == 1007 ||
    //   scene == 1008 ||
    //   scene == 1011 ||
    //   scene == 1012 ||
    //   scene == 1013) {

    //   if (path.indexOf('index/index') < 0) {

    //     console.log('scene: 小程序scene, onshow处理');
    //     util.autoLogin();
    //   }
    // }

    //let systemInfo;

    // if (!this.GD.systemInfo) {
    //  systemInfo = util.getSystemInfoSync(); 

    //  // 避免栈溢出
    //  if (++this.GD.getSystemInfoCnt < this.GD.getSystemInfoMax) {
    //    this.GD.systemInfo = systemInfo;
    //  } else {
    //    this.GD.getSystemInfoCnt = 0;
    //  }
    //  console.log('app onShow, getSystemInfo1:', systemInfo);

    // } else {
    //  console.log('app onShow, getSystemInfo2:', systemInfo);
    // }

    // var pages = getCurrentPages() //获取加载的页面

    // var currentPage = pages[pages.length - 1] //获取当前页面的对象

    // var url = currentPage.route //当前页面url

    // var options = currentPage.options //如果要获取url中所带的参数可以查看options


    // let path = options
    // //除首页外 所有页面都需要授权
    // //因为首页是 拒绝授权的承载页
    // if (path != 'pages/index/index') {
    //   let query = {}
    //   query.path = options.path
    //   query.query = options.query

    //   util.runFn(util.getAuthinfo, null, query)
    // }

  },

  // 应用全局数据, global data
  GD: {
    // 授权成功后的数据, 包含用户信息
    authinfo: null,

    getCodeErrLimit: 1, // 获取code错误超过指定次数报错(和wx.login有关)
    getCodeErrCount: 0, // 获取code错误次数

    //wsReConnectCnt: 0, // ws重连次数统计

    // 是否获取过 ''获取用户信息' 的权限
    getAuthGetUserInfo: false,

    // 是否获取过 '保存图片到相册' 的权限
    getAuthSaveImageToPhotosAlbum: false,

    systemInfo: null, // 系统信息

    getSystemInfoCnt: 0, // 获取系统信息次数
    getSystemInfoMax: 3, // 获取系统信息最大次数

    //txCloudVideoId: '', // 腾讯云视频id(在视频列表页做缓存用)

    // 是否开启全局调试模式, 这个会在个人中心页面启用禁用
    debugMode: true,

    // 解密得到的手机号
    phoneNumber: '',

    /**
     * pageSource 页面来源
     * pageOptions 来源页面的参数
     * 1 [/page/mine/mine] 我的
     * 2 [/page/resume_list/resume_list] 简历列表页
     * 3 [] 小程序
     * 4 [/page/extract/extract] 输入密码页面
    */
    // pageSource : 0,
    // pageOptions: {},
  },

  /**
   * 将wx的api promise化, 避免回调的写法
   * @param {function} wxApi 小程序中的api名, 如wx.request
   * @param {object} options  wxApi对应的配置项列表, 实际调用时传入
   * @param {object} defaults 默认的参数对象, **限内部使用**
   */
  promisify: function(wxApi, options = {}, defaults = {}) {
    return util.promisify(wxApi, options, defaults);
  },

  /**
   * wx.request封装
   * 如果是微信的api, 这里的结果会多一层, 类似下面这样
   */
  request: function(options) {
    return util.request(options);
  },

  /**
   * 跳转页面方法封装, 本项目中跳转太多了, 统一处理下
   * 主要是为了应对页面栈大小超过5的情况, 在catch中处理
   * 跳转的api多数为只有一个参数url, 其他为回调
   */
  gotoPage: function(options) {
    return util.gotoPage(options);
  },

  wxGetUserInfo(options) {

    let defaults = {
      success: util.noop,
      // onReject: util.noop, // 拒绝授权
    };
    options = util.extend({}, defaults, options);

    let self = this;
    let authInfoStore = util._getStorageSync('authInfo');

    if (authInfoStore) {
      let parsedRes = util.parseWXUserInfoRes(authInfoStore);
      return Promise.resolve(parsedRes);
    }

    return util.promisify(wx.getUserInfo, {
      lang: 'zh_CN'
    })
      .then(res => {
        console.log('wxGetUserInfo(), success', res);
        util._setStorageSync('authInfo', res);

        util.runFn(options.success, null, res);

        // 这里要继续往下传, 不然在外部中取不到
        return Promise.resolve(util.parseWXUserInfoRes(res));
      })
      .catch(err => {
        if (!self.GD.getAuthGetUserInfo) {
          self.GD.getAuthGetUserInfo = true;

          console.warn('用户拒绝获取个人信息', err);
          util._setStorageSync('authInfo', '');
          return Promise.reject(err);
        }

        return util.openSetting().then(res => {
          // 用户同意获取个人信息, 再获取, 必定成功, 进入到then里
          if (res.userInfo) {
            return self.wxGetUserInfo();
          } else {
            return Promise.reject(err);
          }
        }).catch(err => {
          return Promise.reject(err);
        });
      });
  },
  /**
   * 触发事件
   */
  trigger: function(topic, args) {

    if (!topics[topic]) {
      return false;
    }

    setTimeout(function() {
      var subscribers = topics[topic],
        len = subscribers ? subscribers.length : 0;

      while (len--) {
        subscribers[len].func(topic, args);
      }
    }, 0);

    return true;
  },
  /**
   * 自定义弹窗获取用户信息
   * 也就是<button open-type="getUserInfo"></button>
   * @param {*} options 
   */
  wxGetUserInfoByButton(options) {
    console.info('options', options)

    // 如果缓存命中, 回调
    let rawUser = util.getRawUser();
    if (rawUser) {
      return util.runFn(options.success, null, rawUser);
    }

    console.info('rawUser2', rawUser)
  }

})