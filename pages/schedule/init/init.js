// pages/schedule/init/init.js
let util = require('../../../utils/util');
let config = require('../../../config');

let moment = require('../../../utils/moment');
let info;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    PAGE: false,         //默认页面没有数据时,不展示页面结构 
    scheduleArray: [],   //日程类型数组
    scheduleName: {},    //选择的日程类型
    scheduleTypeId:-1,   //日期选择id，默认-1
    isShowFull: !1,      //是否显示完整日历
    isShowDone: false,   //是否显示已过期/已完成
    checkboxIsShow: {    //是否隐藏过期日历
      value: '隐藏已过期/已完成',
      checked: 'true'
    },
    customizeType: {    //自定义类型日程
      value: '',
      checked: 'false'
    },
    weeks:'',            //星期
    calendar_type: -1,   //	日程类型：-1=全部；0=未分类；-2=面试；-3=入职；自定义类型传其主键ID
    curWeekArr:[],       //当前日期所在周
    curMounthArr:[],     //当前日期所在月
    curTime :[],         //当前日期
    dayArr:[],           //当前一周的天数
    audition:[],            //面试类型
    entry:[],               //入职类型
    customize:[]            //自定义类型
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
    //设置页面默认值
    this.getday();
    this.getScheduleType()

    // console.info(this.getWeekStartEnd('2019-07-09'))
  },

  /**
 * 生命周期函数--监听页面显示
 */
  onShow: function () {
    this.getScheduleInfo()
  },

  //获取全部分类
  getScheduleType() {
    const that = this
    const parms = {
      mark: 1
    }
    util.request({
      url: config.apiUrl + '/apis/hr/hrzp/calendar/w_min_get_type_list',
      data: parms,
      method: "POST",
      withSessionKey: true
    }, that.getScheduleType).then(res => {
      if (res && res.resultcode == 0) {
        that.setData({
          scheduleArray: res.data,
          scheduleName: res.data[0]
        })
     
      }
    })
  },


  /**
   * 获取日程列表数量统计
   */

  getWeekDate(){
      const that = this
      const parms = {
        start_time: that.data.curWeekArr[0],
        end_time: that.data.curWeekArr[1],
        calendar_type: that.data.scheduleTypeId
      }
      util.request({
        url: config.apiUrl + '/apis/hr/hrzp/calendar/w_min_get_calendar_count',
        data: parms,
        method: "POST",
        withSessionKey: true
      }, that.getWeekDate).then(res => {
        if (res && res.resultcode == 0) {
          console.log("res", res)
          const dateArr = this.getweekArr(res.data)
          this.setData({
            dayArr: dateArr
          })
          console.log("dateArr", dateArr)
        }
      })
  },

/**
 * 获取当前日程信息,默认当天
 */
  getScheduleInfo(time=this.data.curTime){
    const that = this
    var parms = {
      start_time : time,
      end_time:time,
      calendar_type: this.data.calendar_type
    }
    util.request({
      url: config.apiUrl + '/apis/hr/hrzp/calendar/w_min_get_calendar_list',
      data: parms,
      method: "POST",
      withSessionKey: true
    }, that.getScheduleInfo).then(res => {
      if (res && res.resultcode == 0) {
        console.log("res", res.data[0].list)
     
        res.data[0].list.forEach(ele=>{
          if(ele.colour==101){
            this.data.audition.push(ele)
          }else if(ele.colour==102){
            this.data.entry.push(ele)
          }else if(ele.colour==103){
            this.data.customize.push(ele)
          }
        })
        that.setData({
          audition: this.data.audition,
          entry: this.data.entry,
          customize: this.data.customize
        })
    
      }
    })
  },

  /**
   * 切换日期
   */
  tabDate(e){
    let currTapDate = e.currentTarget.dataset.item.oldDate
    let currTapDateindex = e.currentTarget.dataset.index
    this.data.dayArr.forEach(ele=>{
      if(ele.oldDate==currTapDate)return
      else{
        ele.active = false
        this.data.dayArr[currTapDateindex].active = true
      }
    })
    this.setData({
      dayArr: this.data.dayArr
    })
  },


  /**
   * 获取天数
   */
  getday() {
    const date = new Date();
    const curYear = date.getFullYear();
    const curMonth = date.getMonth() + 1;
    const curDate = date.getDate();
    const timestamp = this.newDate(curYear, curMonth, curDate);
    const weeks = this.getDayOfWeek(curYear, curMonth, curDate);
    console.log('当前日期', timestamp)
    console.log('当前所在星期', weeks)

    const curWeekArr = this.changeType(this.getWeekStartEnd(timestamp))
    const curMounthArr = this.changeType(this.getMonthStartEnd(timestamp))
    this.setData({
        weeks: this.typeWeeks(weeks),
      curWeekArr,
      curMounthArr,
      curTime: timestamp
    })

    this.getWeekDate();
    // console.log('timestamp', timestamp)
  },

  /**
   * 星期优化
   */
  typeWeeks(week){
    let nowWeek = ''
    switch (week) {
      case 0:
        nowWeek = '周日'
        break;
      case 2:
        nowWeek = '周二'
        break;
      case 3:
        nowWeek = '周三'
        break;
      case 4:
        nowWeek = '周四'
        break;
      case 5:
        nowWeek = '周五'
        break;
      case 6:
        nowWeek = '周六'
        break;
      case 1:
        nowWeek = '周一'
        break;

      default:
        break;
    }
    return nowWeek
  },
  /**
   * 如果是ios，-转/
   */
  changeType(dateArr){
    let newArr = []
    if(this.isIos){
      dateArr.forEach(ele => {
        newArr.push(ele.replace(/-/g, '/'))
      })
      return newArr
    }else{
      return dateArr
    }
  },

  /**
   * 返回当前日期时间，格式YYY-MM-DD或YYY/MM/DD
   */
  newDate(year, month, day) {
    let cur = `${+year}-${+month}-${+day}`;
    if (this.isIos()) {
      cur = `${+year}/${+month}/${+day}`;
    }
    return cur;
  },


  /**
   * 返回指定日期是星期几
   */
  getDayOfWeek(year, month, date) {
    return new Date(Date.UTC(year, month - 1, date)).getDay();
  },
  /**
   * 是否iphone
   */
  isIos() {
    const sys = this.getSystemInfo();
    return /iphone|ios/i.test(sys.platform);
  },
  getSystemInfo() {
    if (info) return info;
    info = wx.getSystemInfoSync();
    return info;
  },
  /**
   * 获取一周的天数
   */
  getweekArr(dateArr){
    console.log("dateArr", dateArr)
    let newDateArr = []
    dateArr.forEach((ele,idx)=>{

      let obj = {}
      obj.date = new Date(ele.date).getDate()
      obj.week_name = ele.week_name
      obj.oldDate = ele.date
      obj.week_num = parseInt(ele.week_num)
      obj.count = parseInt(ele.count)
      newDateArr.push(obj)
    })
    let nowDay = new Date(this.data.curTime).getDate()
    newDateArr.forEach(ele=>{
      if (nowDay == ele.date) {
        ele.active = true
      } else {
        ele.active = false
      }
    })

    console.log('newDateArr', newDateArr)
    console.log("curTime", this.data.curTime)
    return newDateArr
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  checkboxChange(e) {
    this.setData({
      "checkboxIsShow.checked": !this.data.checkboxIsShow.checked
    })
    console.log('checkbox发生change事件，携带value值为：', e)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  // 筛选日程类型
  bindPickerChange: function (e) {
    let val = e.detail.value
  
    console.log('picker发送选择改变，携带值为', e.detail.value)
    console.log('scheduleArray', this.data.scheduleArray[e.detail.value].id)

    this.setData({
      scheduleName: this.data.scheduleArray[val],
      scheduleTypeId: this.data.scheduleArray[e.detail.value].id
    })
    // console.log('e', e.currentTarget.dataset.id)
  },
  // 
  isShowFull: function () {
    this.setData({
      isShowFull: !this.data.isShowFull
    })
  },

  // 传入一个日期 获取时间 该日期对应的 周 的开始 结束时间 数组
  getWeekStartEnd: function (date) {
    let oneDayTime = 24 * 60 * 60 * 1000
    let now = new Date(date)
    let nowTime = now.getTime()
    let day = now.getDay()

    if (day == 0) {
      // 原版 周一开始算
      // let end = moment(new Date(date)).format("YYYY-MM-DD")
      // let start = moment(new Date(date) - 6 * oneDayTime).format("YYYY-MM-DD")

      // 改版 周日开始算
      let end = moment(new Date(date) + 6 * oneDayTime).format("YYYY-MM-DD")
      // let start = moment(new Date(date) - 7 * oneDayTime).format("YYYY-MM-DD")
      return [date, end]
    } else {
      // 原版 周一开始算
      // let MondayTime = nowTime - (day - 1) * oneDayTime
      // let SundayTime = nowTime + (7 - day) * oneDayTime

      // 周日开始算
      let MondayTime = nowTime - day * oneDayTime
      let SundayTime = nowTime + (6 - day) * oneDayTime

      let start = moment(new Date(MondayTime)).format("YYYY-MM-DD")
      let end = moment(new Date(SundayTime)).format("YYYY-MM-DD")

      return [start, end]
    }
  },
  // 传入一个日期 获取时间 该日期对应的 月 的开始 结束时间 数组
  getMonthStartEnd: function (time) {
    console.log("time",time)
    var ary=[]
    if (this.isIos()){
       ary = time.split("/")
    }else{
       ary = time.split("-")
    }
    const yNum = parseInt(ary[0])
    const mNum = parseInt(ary[1])
    // const dNum = parseInt(ary[2])
    let mstart = moment(new Date(yNum, mNum - 1, 1)).format("YYYY-MM-DD")
    let mend = moment(new Date(yNum, mNum, 0)).format("YYYY-MM-DD")
    return [mstart, mend]
  },

  // 获取两个日期之间的所有日期 数组集合
  getBetweenDateStr: function (start, end) {
    var result = []
    var beginDay = start.split("-")
    var endDay = end.split("-")
    var diffDay = new Date()
    var dateList = new Array()
    var i = 0
    diffDay.setDate(beginDay[2])
    diffDay.setMonth(beginDay[1] - 1)
    diffDay.setFullYear(beginDay[0])
    result.push(start)
    while (i == 0) {
      var countDay = diffDay.getTime() + 24 * 60 * 60 * 1000
      diffDay.setTime(countDay)
      dateList[2] = diffDay.getDate()
      dateList[1] = diffDay.getMonth() + 1
      dateList[0] = diffDay.getFullYear()
      if (String(dateList[1]).length == 1) {
        dateList[1] = "0" + dateList[1]
      }
      if (String(dateList[2]).length == 1) {
        dateList[2] = "0" + dateList[2]
      }
      result.push(dateList[0] + "-" + dateList[1] + "-" + dateList[2])
      if (
        dateList[0] == endDay[0] &&
        dateList[1] == endDay[1] &&
        dateList[2] == endDay[2]
      ) {
        i = 1
      }
    }
    return result
  }
})