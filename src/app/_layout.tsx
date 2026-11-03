// Root layout. SPEC §5, §16.3. Loads fonts, wraps in theme, mounts router, hosts undo toast.

// Import each weight from its own subpath. The package barrels re-export all
// 26 faces, and Metro has no way to tree-shake a `require()` of a binary
// asset — pulling from the root cost ~8 MB of unused TTFs in the web export.
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic/400Regular';
import { NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic/700Bold';
import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UndoToastHost } from '@components/primitives/UndoToast';
import { light } from '@theme/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
    Amiri_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: light.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: light.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: light.bg } }} />
        <UndoToastHost />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
