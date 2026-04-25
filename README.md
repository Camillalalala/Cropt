To run locally and test on mobile:
install and open expo go
npx expo start -c --tunnel --port 8082 
use ur camera to scan code

Common Problems:
RNMapsAirModule Error
The error says:
TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found. Verify that a module by this name is registered in the native binary.

Fix:
This means you are using a library (likely react-native-maps) that requires native code, which is not available in Expo Go.
You must use a development build (not Expo Go) to use this module.
Run:
npx expo run:android
or
npx expo run:ios
to create a development build.

If android doesn't work, you might need to install Android Studio.


