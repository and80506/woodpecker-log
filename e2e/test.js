var wLog = new WoodpeckerLogger();
wLog.deleteLogDB();
const writeLog = (content, done) => {
    wLog.log(content).then(result => {
        assert(result != null);
        done();
    })
};
const queryLog = (content, done) => {
    wLog.queryByContent(content).then(result => {
        console.log(JSON.stringify(result))
        assert(result.length == 1);
        done();
    })
};
describe('WoodpeckerLogger', () => {
    it('should attach to the window object', () => {
        assert(window.WoodpeckerLogger, 'window.WoodpeckerLogger is not defined');
    });
    it('should write log to indexDB', (done) => {
        writeLog('test log', done);
    });
    it('should get log from indexDB', (done) => {
        queryLog('test log', done);
    });
});
