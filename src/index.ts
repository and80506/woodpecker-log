import { sdkOptions, ReportOptions, LogDetailItem } from './interface';
import {
  isSupportIndexDB,
  asyncSave,
  asyncGetByDateRange,
  asyncQueryByContent,
  asyncDeleteDB
} from './storage';
import { generateSession } from './session';
import { isBrowser, wrapContent } from './util';
import { ERRORS, M_BYTES, APP_KEY_ANONYMOUS } from './constants';

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

function proxySaveLog(level: string) {
  // node.js等非浏览器环境下不做任何处理
  if (notInBrowser) return noop;
  return function saveLog(
    bytesQuota: number,
    appKey: string,
    content: string,
    debug: boolean
  ): Promise<any> {
    if (!isSupportIndexDB()) {
      throw new Error(ERRORS.ERR_STORAGE);
    }
    const wrappedContent = wrapContent(content, level);
    const asyncSaveCallback = asyncSave(bytesQuota, appKey, wrappedContent, debug);
    return asyncSaveCallback;
  };
}

export default class WoodpeckerLogger {
  /**
   *
   * @param option.appKey 应用唯一key
   * @param option.bytesQuota 日志存储容量上限，单位byte
   * @param option.reportUrl 日志上报地址
   * @param option.enableSendBeacon 是否开启sendBeacon
   * @param option.debug 是否开启调试模式，调试模式下开启Console打印
   */
  readonly options: sdkOptions;

  constructor({
    appKey = APP_KEY_ANONYMOUS,
    bytesQuota = 10 * M_BYTES,
    reportUrl,
    enableSendBeacon = false,
    debug = false
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
    this.options = {
      appKey,
      bytesQuota,
      reportUrl,
      enableSendBeacon,
      debug
    };
  }

  async log(content: string): Promise<any> {
    return proxySaveLog('log')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      this.options.debug
    );
  }

  async debug(content: string): Promise<any> {
    return proxySaveLog('debug')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      this.options.debug
    );
  }

  async info(content: string): Promise<any> {
    return proxySaveLog('info')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      this.options.debug
    );
  }

  async warn(content: string): Promise<any> {
    return proxySaveLog('warn')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      this.options.debug
    );
  }

  async error(content: string): Promise<any> {
    return proxySaveLog('error')(
      this.options.bytesQuota,
      this.options.appKey,
      content,
      this.options.debug
    );
  }

  async deleteLogDB(): Promise<any> {
    return await asyncDeleteDB();
  }

  @verifyInBrowser
  async queryByDate(
    startDate: number = new Date(new Date().getDate() - 1).getTime(),
    endDate: number = new Date().getTime()
  ): Promise<LogDetailItem[]> {
    if (typeof startDate !== 'number' || typeof endDate !== 'number') {
      throw new Error(ERRORS.ERR_QUERY_DATE_PARAMETER);
    }
    const queryResult = await asyncGetByDateRange(
      this.options.appKey,
      startDate,
      endDate,
      this.options.debug
    );
    return queryResult;
  }

  @verifyInBrowser
  async queryByContent(content: string): Promise<LogDetailItem[]> {
    const queryResult = await asyncQueryByContent(this.options.appKey, content, this.options.debug);
    return queryResult;
  }

  @verifyInBrowser
  async report({ startDate, days, deviceId, environment, extraInfo }: ReportOptions): Promise<any> {
    // node.js等非浏览器环境下不做任何处理
    if (notInBrowser) return noop;
    // TODO: report to server
  }
}
