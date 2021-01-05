import { LogDB, LogDetailItem, LogItem } from './interface';
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase } from 'idb';
import { MESSAGES } from './constants';
import {
  DATABASE_NAME,
  OBJECT_STORE_APP_STATUS,
  OBJECT_STORE_LOG_DETAIL,
  DATABASE_VERSION
} from './constants';
import { getContentLength, inQueue, devConsole } from './util';

export function isSupportIndexDB() {
  if (!window.indexedDB || !window.IDBKeyRange) {
    return false;
  }
  return true;
}

function filterByAppKey(items: LogDetailItem[], appKey: string) {
  const returned = items.filter((item) => {
    return item.appKey === appKey;
  });
  return returned;
}

/**
 * @method 打开indexDB数据库并创建表
 * @param content
 */
async function asyncOpenDB() {
  const db = await openDB<LogDB>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      const appListStore = db.createObjectStore(OBJECT_STORE_APP_STATUS);
      const logDetailsStore = db.createObjectStore(OBJECT_STORE_LOG_DETAIL, {
        keyPath: 'id',
        autoIncrement: true
      });
      logDetailsStore.createIndex('createTime', 'createTime');
      logDetailsStore.createIndex('appKey', 'appKey');
    }
  });
  return db;
}

export async function asyncDeleteDB() {
  const result = await deleteDB(DATABASE_NAME);
  return result;
}

/**
 * @method 保存日志
 * @param bytesQuota 可用总存储容量
 * @param appKey 应用名
 * @param content
 */
export async function asyncSave(
  bytesQuota: number,
  appKey: string,
  content: LogItem,
  debug: boolean
) {
  return await inQueue(async function () {
    // throw Error: 打开数据库出错
    const db = await asyncOpenDB();
    let appTotalSize = 0;
    let totalSizeItem = await db.get(OBJECT_STORE_APP_STATUS, 'totalSize');
    const lastTotalSize = totalSizeItem ? totalSizeItem.totalSize : 0;
    appTotalSize += lastTotalSize;
    appTotalSize += getContentLength(content);
    devConsole(debug, MESSAGES.MESSAGE_LOG_TOTALSIZE, appTotalSize);
    if (appTotalSize <= bytesQuota) {
      // throw Error: 事务处于只读模式、以关键字参数作为主键的一条记录已经存在在存储对象中，或其他错误
      const now = Date.now();
      const item = await db.add(OBJECT_STORE_LOG_DETAIL, {
        createTime: now,
        appKey,
        content
      });
      await db.put(
        OBJECT_STORE_APP_STATUS,
        {
          totalSize: appTotalSize
        },
        'totalSize'
      );
      db.close();
      return item;
    } else {
      console.error('存满');
      return null;
      // TODO: 存满时日志自动删除策略：查询最近7天的日志大小（=N）和总日志条数（=count），如果N<0.8*bytesQuota，删除7天前的日志，否则删除距今最早的0.2*count
    }
  });
}

/**
 * @method 检索两个日期之间的日志记录
 * @param appKey 应用名
 * @param startDate
 * @param endDate
 * @return items
 */
export async function asyncGetByDateRange(
  appKey: string,
  startDate: number,
  endDate: number,
  debug: boolean
) {
  // throw Error: 打开数据库出错
  const db = await asyncOpenDB();
  const items = await db.getAll(OBJECT_STORE_LOG_DETAIL, IDBKeyRange.bound(startDate, endDate));
  db.close();
  devConsole(debug, MESSAGES.MESSAGE_LOG_ITEMS, items);
  // 按appKey检索
  return filterByAppKey(items, appKey);
}

/**
 * @method 根据日志内容检索
 * @param appKey 应用名
 * @param queryStr
 */
export async function asyncQueryByContent(appKey: string, queryStr: string, debug: boolean) {
  const db = await asyncOpenDB();
  const items = [];
  let cursor = await db
    .transaction(OBJECT_STORE_LOG_DETAIL, 'readwrite')
    .store.index('createTime')
    .openCursor();
  while (cursor) {
    const content = cursor.value.content;
    if (content.c.indexOf(queryStr) > -1) {
      items.push(cursor.value);
    }
    cursor = await cursor.continue();
  }
  devConsole(debug, MESSAGES.MESSAGE_LOG_ITEMS, items);
  // 按appKey检索
  return filterByAppKey(items, appKey);
}
