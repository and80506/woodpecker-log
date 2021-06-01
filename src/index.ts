import { sdkOptions, LogDetailItem, levelEnum, LogItem } from './interface';
import {
  isSupportIndexDB,
  asyncSave,
  asyncGetByDateRange,
  asyncQueryByContent,
  asyncDeleteDB
} from './storage';
import { getEnvInfo, getErrorInfo } from './env';
import { isBrowser, wrapContent, devConsole } from './util';
import { immediatelyReportToServer, reportToServer } from './report';
import { ERRORS, MESSAGES, M_BYTES, APP_KEY_ANONYMOUS } from './constants';

const notInBrowser = !isBrowser();

/* eslint-disable */
function noop() {}

function verifyInBrowser(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
) {
  // node.js等非浏览器环境下不做任何处理
  let originalFunc = descriptor.value;
  descriptor.value = async function (...args) {
    if (notInBrowser) return Promise.reject(ERRORS.ERR_NOT_SUPPORTED);
    const result = await originalFunc.apply(this, args);
    return result;
  };
}

function proxySaveLog(level: keyof typeof levelEnum) {
  // node.js等非浏览器环境下不做任何处理
  if (notInBrowser) return noop;
  return function saveLog(
    bytesQuota: number,
    appKey: string,
    content: string,
    userId: string,
    enableConsole: boolean
  ): Promise<LogItem> {
    if (!isSupportIndexDB()) {
      throw new Error(ERRORS.ERR_STORAGE);
    }
    const wrappedContent = getWrappedContent(content, level, userId);
    devConsole(enableConsole, MESSAGES.MESSAGE_LOG_CONTENT, wrappedContent);
    return asyncSave(bytesQuota, appKey, wrappedContent, enableConsole);
  };
}

function getWrappedContent(content: string, level: keyof typeof levelEnum, userId: string) {
  const url = location.href;
  const wrappedContent = wrapContent(content, level, url, userId);
  return wrappedContent;
}

function formatReportData(queryData: any[]) {
  const returned: any[] = [];
  queryData.forEach((item) => {
    returned.push(contentToBizInfo(item.appKey, item.content));
  });
  return returned;
}

function contentToBizInfo(appKey: string, content: LogItem) {
  return {
    appKey: appKey,
    content: content.c,
    type: levelEnum[content.l],
    created: content.t,
    url: content.ul,
    userId: content.ud
  };
}

export default class WoodpeckerLogger {
  /**
   *
   * @param option.appKey 应用唯一key
   * @param option.bytesQuota 日志存储容量上限，单位byte
   * @param option.reportUrl 日志上报地址
   * @param option.userId 用户id
   * @param option.enableSendBeacon 是否开启sendBeacon
   * @param option.enableConsole 是否开启调试模式，调试模式下开启Console打印
   */
  readonly options: sdkOptions;

  static async deleteLogDB(): Promise<any> {
    return await asyncDeleteDB();
  }

  constructor({
    appKey = APP_KEY_ANONYMOUS,
    bytesQuota = 10 * M_BYTES,
    reportUrl = '',
    enableSendBeacon = false,
    userId = '',
    enableConsole = false
  }: sdkOptions = {}) {
    // node.js等非浏览器环境下不做任何处理
    if (notInBrowser) return;
    if (
      typeof appKey !== 'string' ||
      typeof bytesQuota !== 'number' ||
      (reportUrl && typeof reportUrl !== 'string')
    ) {
      throw new Error(ERRORS.ERR_CONFIG_SDK_INIT_OPTION);
    }
    if (reportUrl === '') {
      devConsole(enableConsole, MESSAGES.MESSAGE_REPORT_URL);
    }
    this.options = {
      appKey,
      bytesQuota,
      reportUrl,
      enableSendBeacon,
      userId,
      enableConsole
    };
  }

  async trace(content: string, userId?: string): Promise<any> {
    return proxySaveLog('trace')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      userId || this.options.userId,
      this.options.enableConsole
    );
  }

  async info(content: string, userId?: string): Promise<any> {
    return proxySaveLog('info')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      userId || this.options.userId,
      this.options.enableConsole
    );
  }

  async warn(content: string, userId?: string): Promise<any> {
    return proxySaveLog('warn')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      userId || this.options.userId,
      this.options.enableConsole
    );
  }

  async error(content: string, userId?: string): Promise<any> {
    return proxySaveLog('error')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      userId || this.options.userId,
      this.options.enableConsole
    );
  }

  async fatal(content: string, userId?: string): Promise<any> {
    return proxySaveLog('fatal')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      userId || this.options.userId,
      this.options.enableConsole
    );
  }

  async assert(assertion: boolean, content: string, userId?: string): Promise<any> {
    const { appKey, reportUrl, bytesQuota, enableSendBeacon, enableConsole } = this.options;
    const optionsUserInd = this.options.userId;
    const returned = {};
    if (enableConsole) {
      console.assert(assertion, content);
    }

    // console.assert断言结果为false
    if (false === assertion) {
      const level = 'assert';
      const traceInfo = JSON.stringify(getErrorInfo());
      const assertContent = `Assertion failed. Check the stack ${traceInfo}. Log content:${content}`;
      const wrapContent = getWrappedContent(assertContent, level, userId);
      // 本地异步存储
      proxySaveLog(level)(
        bytesQuota,
        appKey,
        assertContent,
        userId || optionsUserInd,
        enableConsole
      );
      // 异步上报
      if (reportUrl) {
        const bizInfo = [];
        bizInfo.push(contentToBizInfo(appKey, wrapContent));
        const envInfo = getEnvInfo();
        return reportToServer(reportUrl, bizInfo, enableSendBeacon);
      }
    }
  }

  @verifyInBrowser
  async queryByDays(days: number = -1): Promise<LogDetailItem[]> {
    if (typeof days !== 'number') {
      throw new Error(ERRORS.ERR_QUERY_DATE_PARAMETER);
    }
    if (days > 0) {
      days = -days;
    }
    let endDate = new Date().getTime();
    const startDate = endDate + days * 24 * 60 * 60 * 1000;
    const queryResult = await asyncGetByDateRange(
      this.options.appKey,
      startDate,
      endDate,
      this.options.enableConsole
    );
    return queryResult;
  }

  @verifyInBrowser
  async queryByContent(content: string): Promise<LogDetailItem[]> {
    const queryResult = await asyncQueryByContent(
      this.options.appKey,
      content,
      this.options.enableConsole
    );
    return queryResult;
  }

  @verifyInBrowser
  async report(days: number = -1, isSendImmediately = false): Promise<any> {
    // node.js等非浏览器环境下不做任何处理
    if (notInBrowser) return false;
    const envInfo = getEnvInfo();
    const { reportUrl, enableSendBeacon } = this.options;
    const queryResult = await this.queryByDays(days);
    // 数据预处理
    const bizInfo = formatReportData(queryResult);
    if (reportUrl) {
      if (isSendImmediately) {
        return immediatelyReportToServer(
          reportUrl,
          {
            bizInfo,
            envInfo
          },
          enableSendBeacon
        );
      }
      return reportToServer(reportUrl, bizInfo, enableSendBeacon);
    }
  }
}
