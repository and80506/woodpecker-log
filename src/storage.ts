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
  const db = await openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      const appListStore = db.createObjectStore(OBJECT_STORE_APP_STATUS);
      const logDetailsStore = db.createObjectStore(OBJECT_STORE_LOG_DETAIL, {
        keyPath: 'createTime',
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
 * @method 从最早的记录迭代删除直到总大小 < limitSize
 * @param db IDBPDatabase
 * @param totalSize OBJECT_STORE_LOG_DETAIL表已存记录总大小
 * @param size 待删除的记录大小总和
 */
async function deleteTableRecord(db: IDBPDatabase, totalSize: number, limitSize: number) {
  if (!db) {
    return null;
  }
  let currentSize = totalSize;
  let cursor = await db
    .transaction(OBJECT_STORE_LOG_DETAIL, 'readwrite')
    .store.index('createTime')
    .openCursor();
  while (cursor) {
    const storedObject = cursor.value.content;
    currentSize;
    if (currentSize > limitSize) {
      const contentLength = getContentLength(storedObject);
      cursor.delete();
      currentSize -= contentLength;
      cursor = await cursor.continue();
    } else {
      cursor = null;
    }
  }
  if (currentSize !== totalSize) {
    await db.put(
      OBJECT_STORE_APP_STATUS,
      {
        totalSize: currentSize
      },
      'totalSize'
    );
  }
  return currentSize;
}

/**
 * @method 保存日志
 * @param bytesQuota 可用总存储容量
 * @param appKey 应用名
 * @param content
 */
export function asyncSave(
  bytesQuota: number,
  appKey: string,
  content: LogItem,
  enableConsole: boolean
) {
  return inQueue(async function () {
    // throw Error: 打开数据库出错
    const db = await asyncOpenDB();
    let appTotalSize = 0;
    let totalSizeItem = await db.get(OBJECT_STORE_APP_STATUS, 'totalSize');
    const lastTotalSize = totalSizeItem ? totalSizeItem.totalSize : 0;
    const contentLength = getContentLength(content);
    appTotalSize += lastTotalSize;
    appTotalSize += contentLength;
    // console.log(MESSAGES.MESSAGE_LOG_TOTALSIZE, appTotalSize);

    // throw Error: 事务处于只读模式、以关键字参数作为主键的一条记录已经存在在存储对象中，或其他错误
    const now = Date.now();
    const item = await db.add(OBJECT_STORE_LOG_DETAIL, {
      createTime: now,
      appKey,
      content
    });
    if (appTotalSize > bytesQuota) {
      console.error('存满');
      // 存满时日志自动删除策略：查询距今最早的记录，逐个删除直至总大小 < limitSize
      await deleteTableRecord(db, appTotalSize, 0.7 * bytesQuota);
    } else {
      await db.put(
        OBJECT_STORE_APP_STATUS,
        {
          totalSize: appTotalSize
        },
        'totalSize'
      );
    }
    db.close();
    return item;
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
  enableConsole: boolean
) {
  // throw Error: 打开数据库出错
  const db = await asyncOpenDB();
  const items = await db.getAll(OBJECT_STORE_LOG_DETAIL, IDBKeyRange.bound(startDate, endDate));
  db.close();
  devConsole(enableConsole, MESSAGES.MESSAGE_LOG_ITEMS, items);
  // 按appKey检索
  return filterByAppKey(items, appKey);
}

/**
 * @method 根据日志内容检索
 * @param appKey 应用名
 * @param queryStr
 */
export async function asyncQueryByContent(
  appKey: string,
  queryStr: string,
  enableConsole: boolean
) {
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
  devConsole(enableConsole, MESSAGES.MESSAGE_LOG_ITEMS, items);
  // 按appKey检索
  return filterByAppKey(items, appKey);
}
