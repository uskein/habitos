/** Jest config - preset jest-expo + alias del monorepo (M11). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@habitos/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // @noble/* es ESM-only -> debe pasar por Babel (M24 · backupCrypto).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@unimodules/.*|unimodules|@expo/vector-icons|@expo/config-plugins|@noble/.*))',
  ],
  clearMocks: true,
};
