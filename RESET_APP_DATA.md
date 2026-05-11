# 🔄 How to Reset App Data

## To Test Login/Sign-Up Flow from Scratch

### Method 1: Sign Out in the App (Recommended)

1. Open the app
2. Tap the **logout icon** in the top right corner
3. Confirm logout
4. You'll see the sign-in page

---

### Method 2: Clear All Data (Complete Reset)

This will reset everything: authentication, onboarding, and all local data.

#### For iOS Simulator:

```bash
# Stop Expo server first (Ctrl+C)

# Uninstall the app
xcrun simctl uninstall booted com.anonymous.mobile

# Or reset the entire simulator
xcrun simctl erase all

# Restart Expo
cd mobile
npx expo start -c
```

#### For Android Emulator:

```bash
# Stop Expo server first (Ctrl+C)

# Uninstall the app
adb uninstall com.anonymous.mobile

# Or clear app data
adb shell pm clear com.anonymous.mobile

# Restart Expo
cd mobile
npx expo start -c
```

#### For Physical Device (Expo Go):

1. **Uninstall the app** from your device
2. **Reinstall Expo Go** from the App Store/Play Store
3. **Scan the QR code** again

---

### Method 3: Clear AsyncStorage Programmatically

Add this code temporarily to force a reset:

**In `mobile/app/_layout.jsx`**, add this at the top of the component:

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Add this inside the component
useEffect(() => {
  // TEMPORARY: Clear all data for testing
  AsyncStorage.clear().then(() => {
    console.log("All AsyncStorage data cleared");
  });
}, []);
```

**⚠️ IMPORTANT:** Remove this code after testing!

---

## 📋 What Gets Reset

### Sign Out (Method 1):
- ✅ Clerk authentication session
- ❌ Onboarding status (stays completed)
- ❌ Local app data

### Clear App Data (Method 2):
- ✅ Clerk authentication session
- ✅ Onboarding status
- ✅ All local app data
- ✅ Complete fresh start

### Clear AsyncStorage (Method 3):
- ✅ Onboarding status
- ✅ Theme preferences
- ✅ Other local data
- ⚠️ Clerk session might persist

---

## 🎯 Expected Flow After Reset

### Complete Reset (Method 2):

1. **Loading screen** → "Initializing..."
2. **Onboarding screen** → 4 slides
3. **Sign-in page** → Clerk authentication
4. **Home screen** → Your wallet dashboard

### Sign Out Only (Method 1):

1. **Sign-in page** → Clerk authentication
2. **Home screen** → Your wallet dashboard (no onboarding)

---

## 🔍 Verify You're Signed Out

Check the console logs:

```
[Root Layout] Navigation check - isSignedIn: false
[Root Layout] Not signed in, navigating to sign-in
```

If you see `isSignedIn: false`, you're successfully signed out!

---

## 🐛 Troubleshooting

### "I signed out but still see the home screen"

1. **Force close the app** completely
2. **Reopen it**
3. Check console logs for `isSignedIn: false`

### "The sign-in page doesn't appear"

1. Check if `(auth)` layout is working:
   ```bash
   # Check if sign-in.jsx exists
   ls mobile/app/\(auth\)/sign-in.jsx
   ```

2. Verify Clerk configuration in `.env`:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. Restart Expo with cache clear:
   ```bash
   npx expo start -c
   ```

---

## ✅ Quick Test Checklist

- [ ] Sign out button visible in home screen
- [ ] Tapping sign out shows confirmation dialog
- [ ] Confirming logout redirects to sign-in page
- [ ] Sign-in page shows Clerk authentication UI
- [ ] Can navigate to sign-up page
- [ ] After signing in, redirected to home screen

---

**Current Status:** You're signed in, so the app correctly shows the home screen. Sign out to see the login page!
