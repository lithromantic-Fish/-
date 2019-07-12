// /components/resume_nav/resume_nav.js
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    // 操作记录
    resumeOperationRecord: { // 属性名
      type: Number, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: 0// 属性初始值（可选），如果未指定则会根据类型选择一个
    },
    //
    navTabIndex : {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /*
     * 公有方法
     */

    //tab点击
    // navTabClick() {
    //   console.info(e)
    // },
    /*
    * 内部私有方法建议以下划线开头
    * triggerEvent 用于触发事件
    */
    _navTabClick(e) {
      var that = this;
      var myEventDetail = {
        'tabName': e.target.dataset.name
      } // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项

      //触发成功回调
      that.triggerEvent("navTabClick", myEventDetail, myEventOption);
    },
  }
})
