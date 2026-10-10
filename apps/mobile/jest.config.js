/** Jest config — preset jest-expo + alias del monorepo (M11). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@habitos/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};
