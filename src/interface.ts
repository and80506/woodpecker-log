import { DBSchema } from 'idb';
import { OBJECT_STORE_APP_STATUS, OBJECT_STORE_LOG_DETAIL } from './constants';

export type LoggerFn = (...args: any[]) => void;

export interface sdkOptions {
  appKey?: string;
  bytesQuota?: number;
  reportUrl?: string;
  enableSendBeacon?: boolean;
  debug?: boolean;
}

export interface ReportOptions {
  startDate: string;
  days: number;
  deviceId: string;
  environment: string;
  extraInfo: string;
}

export interface LogItem {
  c: string;
  l: string;
  t: number;
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
