// 获取客户端环境信息
export function getEnvInfo() {
  const navigator = window.navigator;
  const connection = (navigator as any).connection;
  return {
    // 设备的网络连接信息
    network: {
      effectiveType: connection.effectiveType,
      rtt: connection.rtt,
      downlink: connection.downlink
    },
    // 浏览器平台名
    platform: navigator.platform,
    // 以G为单位的大概的机器内存
    deviceMemory: (navigator as any).deviceMemory,
    userAgent: navigator.userAgent
  };
}

// 获取错误信息
// TODO: error信息完善
// errorType String 错误类型
// errorLevel String 异常级别
// errorStack String 错误 stack 信息
// errorFilename String 出错文件
// errorLineNo Number 出错行
// errorColNo Number 出错列位置
// errorMessage String 错误描述（开发者定义）
// errorTimeStamp Number 时间戳
export function getErrorInfo() {
  try {
    throw new Error('traceError');
  } catch (e) {
    return e.stack;
  }
}

// 获取事件信息
// targetElement HTMLElement 用户操作的 DOM 元素
// targetDOMPath Array<HTMLElement> 该 DOM 元素的节点路径
// targetCSS Object 该元素的自定义样式表
// targetAttrs Object 该元素当前的属性及值
// eventType String 事件类型
// pageX Number 事件 x 轴坐标
// pageY Number 事件 y 轴坐标
// screenX Number 事件 x 轴坐标
// screenY Number 事件 y 轴坐标
// pageW Number 页面宽度
// pageH Number 页面高度
// screenW Number 屏幕宽度
// screenH Number 屏幕高度
// eventKey String 触发事件的键
export function getEventInfo() {}

// 获取页面信息
// action String 进行了什么操作
// referer String 上一个路径，来源 URL
// prevAction String 上一个操作
// data Object 当前界面的 state、data
// dataSources Array<Object> 上游 api 给了什么数据
// dataSend Object 提交了什么数据
// activeTime Number 活跃时长
export function getPageInfo() {}
