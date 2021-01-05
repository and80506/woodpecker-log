module.exports = {
    transform: {
        '.(ts|tsx)': 'ts-jest'
    },
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        resources: 'usable'
    },
    testRegex: 'test/[A-Za-z-_]+\\.test\\.(ts|tsx|js)$',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    collectCoverageFrom: ['src/*.{js,ts}']
};
