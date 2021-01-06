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
// 记录本地日志
wpLog.info('This is a test.');
// 查询本地日志信息
wpLog.queryByContent('This is a');
```

### 初始化配置

`new WoodpeckerLogger(options)`实例化时需传入`options`配置，也可不传入任何配置，SDK将启用默认配置。
- options.appKey: 字符串类型，实例记录日志时会存储的应用名称，用于区分不同应用记录的日志，不传时实例使用$anonymous作为应用名。可选参数。
- options.bytesQuota: 数值类型，设定客户端可使用的indexDB存储上限，单位为MBytes。不同应用共用存储上限，超出上限后，将启用循环记录功能，自动删除最早的日志。可选参数。
- options.reportUrl: 字符串类型，传入后report方法将使用该地址作为上报日志的服务器地址，如不传，则需要在调研report时指定该参数。可选参数。
- options.enableSendBeacon: 布尔类型，开启后启用sendBeacon上报日志。 默认`false`。可选参数。
- options.debug: 布尔类型，开启后在客户端console控制台打印调试信息。默认`false`。可选参数。

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

| <img src="./demo/images/edge.png" alt="IE / Edge" width="24px" height="24px" /><br/>IE / Edge | <img src="./demo/images/firefox.png" alt="Firefox" width="24px" height="24px" /><br/>Firefox | <img src="./demo/images/chrome.png" alt="Chrome" width="24px" height="24px" /><br/>Chrome | <img src="./demo/images/safari.png" alt="Safari" width="24px" height="24px" /><br/>Safari | <img src="./demo/images/safari.png" alt="iOS Safari" width="24px" height="24px" /><br/>iOS Safari | <img src="./demo/images/opera.png" alt="Opera" width="24px" height="24px" /><br/>Opera |
| --------- | --------- | --------- | --------- | --------- | --------- |
| IE11, Edge| last 2 versions| last 2 versions| last 2 versions| last 2 versions| last 2 versions


## 使用许可
The MIT License (MIT)