require('fake-indexeddb/auto');
import WoodpeckerLogger from '../src/index';
import { sdkOptions } from '../src/interface';

describe('createLogger', () => {
  test('should be valid option', () => {
    const createLogger = jest.fn((options: sdkOptions) => {
      return new WoodpeckerLogger(options);
    });
    // @ts-ignore: 特意制造的类型错误
    createLogger();
    expect(createLogger).toHaveReturned();
  });
  test('should be valid option', () => {
    const createLogger = jest.fn((options: sdkOptions) => {
      return new WoodpeckerLogger(options);
    });
    createLogger({
      appKey: 'myTestApp',
      reportUrl: 'http://report.com',
      debug: true
    });
    expect(createLogger).toHaveReturned();
  });
  test('should be invalid option', () => {
    expect(() => {
      new WoodpeckerLogger({
        appKey: 'myTestApp',
        reportUrl: 'http://report.com',
        // @ts-ignore: 特意制造的类型错误
        bytesQuota: true
      });
    }).toThrowError(/Invalid option/);
  });
});

describe('writeAndQueryLog', () => {
  let wpLog: any;
  beforeEach(() => {
    // @ts-ignore
    wpLog = new WoodpeckerLogger();
  });
  test('should be success write', async () => {
    const writeResult = await wpLog.info('todoItem.newItemValue');
    expect(writeResult).not.toBeNull();
    const queryResult = await wpLog.queryByContent('todoItem.newItemValue');
    expect(queryResult[0]).toBeTruthy();
  });
  test('batch store should be success write', (done) => {
    // 测试批量写日志，这里是异步执行的，并且没有提供写入成功callback API
    for (let i = 0; i < 5; i++) {
      wpLog.info('batch store content');
    }
    setTimeout(() => {
      const queryResult = wpLog.queryByContent('batch store content');
      expect(queryResult).resolves.toHaveLength(5);
      done();
    }, 1000);
  });
});
