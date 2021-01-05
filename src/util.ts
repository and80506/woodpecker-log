import { LogItem, PromiseItem } from './interface';
const queue: Array<PromiseItem> = [];
let isCandidatePending: boolean = false;

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && window.location !== undefined;
}

export function wrapContent(content: string, level: string): LogItem {
  return {
    c: content,
    l: level,
    t: Date.now()
  };
}

export function getContentLength(content: LogItem) {
  return content.c.length;
}

export function devConsole(debug: boolean, ...args: any[]): void {
  debug && console.log.apply(console, args);
}
/**
 * @method 串行执行Promise队列
 */
async function doPromiseInQueue() {
  while (queue.length && !isCandidatePending) {
    isCandidatePending = true;
    let candidate = queue.shift();
    try {
      const lastResult = await candidate.asyncFunction();
      candidate.resolve(lastResult);
    } catch (err) {
      candidate.reject(err);
    }
    isCandidatePending = false;
    doPromiseInQueue();
    await candidate;
  }
}

/**
 * @method 按顺序消费Promise并触发回调
 * @param asyncFunction
 */
export async function inQueue(asyncFunction: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    queue.push({
      asyncFunction,
      resolve,
      reject
    });
    doPromiseInQueue();
  });
}
