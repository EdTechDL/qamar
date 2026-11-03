// react-native-web accepts a few props the React Native typings don't declare.
// `dataSet` becomes data-* attributes on the rendered DOM node, which is how
// the mistake highlighter hit-tests a cluster under the user's finger.

import 'react-native';

declare module 'react-native' {
  interface TextProps {
    dataSet?: Record<string, string | number | undefined>;
  }
  interface ViewProps {
    dataSet?: Record<string, string | number | undefined>;
  }
}
