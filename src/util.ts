import { LogItem, PromiseItem, levelEnum } from './interface';
const queue: Array<PromiseItem> = [];
let isCandidatePending: boolean = false;

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && window.location !== undefined;
}

export function wrapContent(
  content: string,
  level: keyof typeof levelEnum,
  url: string,
  userId: string
): LogItem {
  return {
    c: content,
    l: level,
    t: Date.now(),
    ul: url,
    ud: userId
  };
}

export function getContentLength(content: LogItem) {
  const json = JSON.stringify(content);
  return json.length;
}

export function devConsole(enableConsole: boolean, ...args: any[]): void {
  args.unshift('[WoodpeckerLog] ');
  enableConsole && console.log.apply(console, args);
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

export function debounce<T>(
  method: (...args: ReadonlyArray<any>) => T,
  time: number = 100
): (...args: ReadonlyArray<any>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function () {
    clearTimeout(timeout);

    timeout = setTimeout(function () {
      return method.apply(this, arguments);
    }, time);
  };
}
