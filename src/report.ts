import { request } from './http';
import { inQueue, debounce } from './util';
import { getEnvInfo } from './env';
const reportQueueGroups = new Map();
const oneKBytes = 1 * 1024;
const oneMBytes = 1 * 1024 * 1024;
const concurrencyRequestLimit = 5;
const requestDebounceTime = 1500;
const debounceRequest = debounce(executeQueueGroup, requestDebounceTime);
/**
 *
 * @method 发送行为数据
 * @param {*} url beacon发送的URL
 * @param {*} data
 * @param {*} enableSendBeacon 当前服务器是否sendBeacon条件
 */
export const immediatelyReportToServer = (url: string, data: object, enableSendBeacon: boolean) => {
  const supportBeacon = navigator.sendBeacon;
  // 当前服务器不支持POST提交beacon
  if (supportBeacon && enableSendBeacon) {
    // Beacon 代码
    const formData = objectToFormData(data);
    return new Promise((resolve, reject) => {
      const res = navigator.sendBeacon(url, formData);
      if (res) {
        resolve(res);
      } else {
        reject(res);
      }
    });
  }
  return request({ url, method: 'post', json: data, timeout: 1000 });
};

// 根据data.bizInfo分割或合并成多个小的日志分页上报，单页约1M，发送频次控制在5次/1.5s以内
export const reportToServer = (url: string, bizInfo: any[], enableSendBeacon: boolean) => {
  const len = bizInfo.length;
  const bizInfoSize = bizInfo ? JSON.stringify(bizInfo).length : 0;
  // 根据url分组维护一个待发送请求队列
  let queueGroup: any;
  if (reportQueueGroups.has(url)) {
    queueGroup = reportQueueGroups.get(url);
  } else {
    queueGroup = {
      queue: [],
      // 当前数组总大小
      lastBizInfoSize: 0,
      enableSendBeacon
    };
    reportQueueGroups.set(url, queueGroup);
  }
  // 单个体积小于1K，合并请求
  if (bizInfoSize < oneKBytes) {
    // 按体积1M分成多个数组
    if (queueGroup.lastBizInfoSize > 1 * oneMBytes) {
      queueGroup.queue.push([]);
      queueGroup.lastBizInfoSize = 0;
    }
    if (queueGroup.queue.length === 0) {
      queueGroup.queue.push([]);
    }
    bizInfo.forEach((item) => {
      queueGroup.queue[queueGroup.queue.length - 1].push(item);
    });
    queueGroup.lastBizInfoSize += bizInfoSize;
    // 单个体积大于2M，分割请求
  } else if (bizInfoSize > 2 * oneMBytes) {
    // 不需要非常精确，假定每份数据体积相同均分成多份
    let piecesNum = Math.round(bizInfoSize / oneMBytes);
    let sliceLen = Math.floor(len / piecesNum);
    for (let i = 0; i < piecesNum; i++) {
      let bizInfoPiece = bizInfo.slice(i * sliceLen, (i + 1) * sliceLen);
      queueGroup.queue.push(bizInfoPiece);
      queueGroup.lastBizInfoSize = oneMBytes;
    }
  }
  // 连续和多次执行日志上报方法时，使用防抖处理，以便有机会合并小日志
  debounceRequest();
};

// 日志并发请求控制，按总数limit为一组，一组全部请求成功后才会发起下一组请求。
function executeQueueGroup() {
  const envInfo = getEnvInfo();
  for (let [url, queueGroup] of reportQueueGroups) {
    const queue = queueGroup.queue;
    const enableSendBeacon = queueGroup.enableSendBeacon;
    let promiseArrs = [];
    let promiseArr: Promise<any>[];
    let i = 0;
    while (queue.length > 0) {
      let bizInfo = queue.shift();
      if (i % concurrencyRequestLimit === 0) {
        promiseArr = [];
      }
      promiseArr.push(
        immediatelyReportToServer(
          url,
          {
            bizInfo,
            envInfo
          },
          enableSendBeacon
        )
      );
      queueGroup.lastBizInfoSize = 0;
      if (i % concurrencyRequestLimit === 0) {
        promiseArrs.push(promiseArr);
      }
      i++;
    }
    promiseArrs.forEach((promiseArr) => {
      inQueue(async function () {
        await Promise.all(promiseArr);
      });
    });
  }
}

function objectToFormData(data: object) {
  const formData = new FormData();
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      formData.append(key, (data as any)[key]);
    }
  }
  return formData;
}
