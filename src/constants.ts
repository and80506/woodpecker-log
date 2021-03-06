export const VERSION: string = '0.1.0';
export const DATABASE_NAME = 'WoodpeckerLog';
export const OBJECT_STORE_APP_STATUS = 'appStatus';
export const OBJECT_STORE_LOG_DETAIL = 'logDetails';
export const DATABASE_VERSION = 1;
export const M_BYTES = 1024 * 1024;
export const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
export const APP_KEY_ANONYMOUS = '$anonymous';
export enum ERRORS {
  ERR_CONFIG_SDK_INIT_OPTION = 'Invalid option type.',
  ERR_STORAGE = 'Log storage not support indexDB or fill full.',
  ERR_QUERY_DATE_PARAMETER = 'days parameter should be a valid number.',
  ERR_NOT_SUPPORTED = 'not supported.'
}
export enum MESSAGES {
  MESSAGE_REPORT_URL = 'report url is empty',
  MESSAGE_LOG_CONTENT = 'save log content',
  MESSAGE_LOG_TOTALSIZE = 'total log size',
  MESSAGE_LOG_ITEMS = 'query result log items'
}
