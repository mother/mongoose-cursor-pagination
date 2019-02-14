module.exports = {
   rootDir: '../../',
   testEnvironment: 'node',
   testMatch: ['<rootDir>/tests/*.js'],
   setupFilesAfterEnv: [require.resolve('./setup.js')]
}
