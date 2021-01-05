啄木鸟网页日志SDK
================
日志通常是后端的概念，是一种用于记录服务端启动、运行状态的日志文件。这里的前端日志指的是记录客户端运行状态并发送到服务器进行持久化存储形成的日志文件。一般前端在开发、测试环境使用Console记录运行状态，但在生产环境使用分级别日志记录并发送到服务端存储。然后使用登录到日志服务器或者日志分析系统来分析定位问题原因。

## 特性
- 分级别记录日志 【已完成】
- 浏览器循环存储最近7天日志 【开发中】
- 多种日志上报触发方式，用户主动上报、JS Error触发上报、URL参数解析触发上报、服务与支持页面浮层触发上报
- 会话追踪，根据用户ID实现全链路追踪
- 基础的环境信息如会话id、浏览器ip地址每次上报，详细环境信息开发者或用户可选上报
- 页面生命周期、用户操作行为可选记录、可选上报
- 场景回溯，浏览器录屏
- 浏览器报警

## [DEMO 地址](TODO)

## 安装及初始化

```js
import { WoodpeckerLogger } from 'wp-log';
const wpLog = new WoodpeckerLogger();
wpLog.info('This is a test.');
wpLog.queryByContent('This is a');
```

### 初始化配置
提供regex参数以正则匹配待调试JS的path部分，得到待调试目标JS数组后，辅助protocol、host参数以替换成代理服务器JS地址。
```ascii
    foo://example.com:8042/over/there?name=ferret#nose
    \_/   \______________/\_________/ 
     |           |            |       
  protocol     host          path    
```
- path: 数组类型，表示path匹配规则，遍历数组内对象，使用regex匹配待调试JS，然后以replace(regex, value)的方式尝试替换目标JS。必选参数。
- protocol: 字符串类型，指定代理后JS地址的协议。如`http:`表示将以http协议从代理服务器上加载JS。可选参数。
- host: 对象类型，表示将对象key替换为对象value。如`{'example.com': 'log-server.com'}`表示将example.com的JS代理到log-server.com。可选参数。
- logLevel: 字符串类型，`'debug', 'info', 'warn', 'error', 'silent'`。 默认`'info'`。可选参数。
- logProvider: logProvider，，默认`window.console`。可选参数。

## 快速上手
### 日志记录
### 日志上报

## 测试
运行单测及端到端测试
```bash
$ npm i
$ npm run lint
$ npm run build
$ npm test
$ npm run e2e
```

## 浏览器兼容性

| <img src="./demo/images/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="./demo/images/safari.png" width="48px" height="48px" alt="Safari logo"> | 
| :--------------------------------------------------------------------------: | :----------------------------------------------------------------------: | 
|                                    47+ ✔                                     |                                  15+ ✔                                   |

## 使用许可
The MIT License (MIT)