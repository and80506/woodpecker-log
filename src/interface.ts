import { DBSchema } from 'idb';
import { OBJECT_STORE_APP_STATUS, OBJECT_STORE_LOG_DETAIL } from './constants';

export type LoggerFn = (...args: any[]) => void;

export interface sdkOptions {
  appKey?: string;
  bytesQuota?: number;
  reportUrl?: string;
  enableSendBeacon?: boolean;
  userId?: string;
  enableConsole?: boolean;
}

export enum levelEnum {
  trace = 1,
  info = 2,
  warn = 3,
  error = 4,
  fatal = 5,
  assert = 6
}

export interface LogItem {
  // 日志内容
  c: string;
  // 日志级别
  l: keyof typeof levelEnum;
  // 记录时间
  t: number;
  // 当前页面url
  ul: string;
  // 当前用户id
  ud: string;
}

export interface LogDB extends DBSchema {
  [OBJECT_STORE_APP_STATUS]: {
    key: string;
    value: {
      totalSize: number;
    };
  };
  [OBJECT_STORE_LOG_DETAIL]: {
    key: string;
    value: {
      createTime: number;
      appKey: string;
      content: LogItem;
    };
    indexes: {
      createTime: number;
      appKey: string;
    };
  };
}

export type LogDetailItem = LogDB[typeof OBJECT_STORE_LOG_DETAIL]['value'];

export interface PromiseItem {
  asyncFunction: Function;
  resolve: Function;
  reject: Function;
}
