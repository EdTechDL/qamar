// AsyncStorage has no JS-only implementation, so the store tests need the
// in-memory mock the package ships.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
