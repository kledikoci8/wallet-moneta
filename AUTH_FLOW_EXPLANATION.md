# 🔐 Authentication Flow Explanation

## Why App Goes Directly to Homepage

### The Situation

When you open the app for the first time (or after reinstalling), it goes **directly to the homepage** instead of showing the sign-in page.

### Why This Happens

**You're already signed in!** Clerk caches your authentication session, so:

1. ✅ You signed in previously
2. ✅ Clerk saved your session (in secure storage)
3. ✅ Session is still valid
4. ✅ App detects you're authenticated
5. ✅ Redirects to homepage (correct behavior!)

### The Logs Confirm This

```
[Root Layout] Navigation check - isSignedIn: true onboarded: true
```

- `isSignedIn: true` = You have an active Clerk session
- `onboarded: true` = You completed onboarding
- **Result:** App correctly shows homepage

---

## 🎯 Expected Authentication Flow

### First Time User (Never Signed In):

```
1. App Launch
   ↓
2. Clerk checks session → isSignedIn: false
   ↓
3. Navigate to /sign-in
   ↓
4. User signs up or logs in
   ↓
5. Clerk creates session → isSignedIn: true
   ↓
6. Check onboarding → onboarded: false
   ↓
7. Navigate to /onboarding
   ↓
8. User completes onboarding
   ↓
9. Set onboarded: true
   ↓
10. Navigate to / (homepage)
```

### Returning User (Already Signed In):

```
1. App Launch
   ↓
2. Clerk checks session → isSignedIn: true (cached)
   ↓
3. Check onboarding → onboarded: true
   ↓
4. Navigate to / (homepage) ✅ CORRECT!
```

---

## 🧪 How to Test Sign-In Flow

### Method 1: Sign Out in the App (Recommended)

1. **Open the app** (you'll be on homepage)
2. **Tap the logout icon** in the top right corner
3. **Confirm logout**
4. **You'll see the sign-in page!**

### Method 2: Clear App Data (Complete Reset)

#### For iOS Simulator:
```bash
# Stop Expo server (Ctrl+C)

# Uninstall the app
xcrun simctl uninstall booted com.anonymous.mobile

# Restart Expo
cd mobile
npx expo start -c

# Scan QR code again
```

#### For Android Emulator:
```bash
# Stop Expo server (Ctrl+C)

# Uninstall the app
adb uninstall com.anonymous.mobile

# Restart Expo
cd mobile
npx expo start -c
```

#### For Physical Device:
1. **Uninstall the app** from your device
2. **Reinstall Expo Go** from App Store/Play Store
3. **Scan QR code** again

### Method 3: Clear Clerk Session Programmatically

Add this temporarily to test:

```javascript
// In mobile/app/_layout.jsx
import { useClerk } from "@clerk/clerk-expo";

export default function RootLayout() {
  const { signOut } = useClerk();
  
  // TEMPORARY: Auto sign out on launch
  useEffect(() => {
    signOut();
  }, []);
  
  // ... rest of code
}
```

**⚠️ IMPORTANT:** Remove this after testing!

---

## 🔍 Understanding the Code

### Root Layout Navigation Logic

```javascript
// mobile/app/(root)/_layout.jsx

useEffect(() => {
  if (!isLoaded || onboarded === null || !initialCheckDone) return;

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboarding = segments[1] === "onboarding";

  // Priority 1: Not signed in → go to sign-in
  if (!isSignedIn && !inAuthGroup) {
    router.replace("/sign-in");
  } 
  // Priority 2: Signed in but not onboarded → go to onboarding
  else if (isSignedIn && !onboarded && !inOnboarding) {
    router.replace("/onboarding");
  } 
  // Priority 3: Signed in and onboarded → go to home
  else if (isSignedIn && onboarded && (inAuthGroup || inOnboarding)) {
    router.replace("/");
  }
}, [isLoaded, isSignedIn, onboarded, segments, initialCheckDone]);
```

### Auth Layout Logic

```javascript
// mobile/app/(auth)/_layout.jsx

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect to home
  if (isSignedIn) {
    return <Redirect href={'/'} />;
  }

  // Otherwise, show sign-in/sign-up screens
  return <Stack screenOptions={{headerShown: false}} />;
}
```

---

## 📊 State Diagram

```
┌─────────────────────────────────────────────────────┐
│                   App Launch                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Check Clerk    │
         │ Session        │
         └────────┬───────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  isSignedIn: false   isSignedIn: true
        │                   │
        ▼                   ▼
  ┌──────────┐      ┌──────────────┐
  │ Sign-In  │      │ Check        │
  │ Page     │      │ Onboarding   │
  └──────────┘      └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
           onboarded: false  onboarded: true
                  │                 │
                  ▼                 ▼
           ┌──────────┐      ┌──────────┐
           │Onboarding│      │ Homepage │
           │  Screen  │      │          │
           └──────────┘      └──────────┘
```

---

## 🎯 Current Behavior is CORRECT

### Your Current State:
- ✅ **Signed In:** Yes (Clerk session active)
- ✅ **Onboarded:** Yes (completed onboarding)
- ✅ **Result:** Shows homepage

### This is the EXPECTED behavior for a returning user!

The app is working correctly. It's showing the homepage because:
1. You have a valid authentication session
2. You've completed onboarding
3. The app correctly recognizes you as a returning user

---

## 🔄 Session Management

### How Clerk Manages Sessions:

1. **Sign In:** Creates session, stores in secure storage
2. **App Close:** Session persists
3. **App Reopen:** Session automatically restored
4. **Sign Out:** Session cleared
5. **Token Expiry:** Session automatically refreshed

### Session Storage:
- **iOS:** Keychain (secure)
- **Android:** EncryptedSharedPreferences (secure)
- **Persists:** Across app restarts
- **Cleared:** Only on sign out or uninstall

---

## 🧪 Testing Different Scenarios

### Scenario 1: New User
```
1. Uninstall app
2. Reinstall app
3. Open app
4. See: Sign-in page ✅
5. Sign up
6. See: Onboarding ✅
7. Complete onboarding
8. See: Homepage ✅
```

### Scenario 2: Returning User (Your Case)
```
1. Open app
2. Clerk checks session → Valid
3. See: Homepage ✅ (CORRECT!)
```

### Scenario 3: Signed Out User
```
1. Open app
2. Tap logout
3. See: Sign-in page ✅
4. Sign in
5. See: Homepage ✅ (skip onboarding)
```

---

## 🐛 Troubleshooting

### "I want to see the sign-in page"

**Solution:** Sign out first!
1. Tap logout icon in top right
2. Confirm logout
3. You'll see sign-in page

### "I want to test onboarding again"

**Solution:** Clear onboarding flag:
```javascript
// Temporarily add to app
import AsyncStorage from "@react-native-async-storage/async-storage";

AsyncStorage.removeItem("@wallet_onboarded");
// Then reload app
```

### "I want to test as a completely new user"

**Solution:** Uninstall and reinstall app (see Method 2 above)

---

## ✅ Verification Checklist

To verify auth flow is working correctly:

- [ ] **New User:** Uninstall → Reinstall → See sign-in page
- [ ] **Sign Up:** Can create account and verify email
- [ ] **Onboarding:** See onboarding after sign up
- [ ] **Homepage:** See homepage after onboarding
- [ ] **Sign Out:** Logout button works
- [ ] **Sign In:** Can sign in after logout
- [ ] **Session Persist:** Homepage shows after app restart
- [ ] **Skip Onboarding:** Returning users don't see onboarding

---

## 📝 Summary

### The "Issue" is Not an Issue!

**What you're seeing:** App goes directly to homepage

**Why:** You're already signed in (Clerk session cached)

**Is this correct?** ✅ YES! This is the expected behavior for returning users

**How to see sign-in page:** Sign out first using the logout button

**How to test as new user:** Uninstall and reinstall the app

---

## 🎓 Key Takeaways

1. **Clerk caches sessions** - This is a feature, not a bug
2. **Returning users skip auth** - Provides better UX
3. **Sign out to test auth flow** - Use logout button
4. **Uninstall to test new user flow** - Complete reset
5. **Current behavior is correct** - App working as designed

---

**Status:** ✅ Working as Expected  
**Action Required:** None (unless you want to test auth flow)  
**To Test Auth:** Sign out using logout button in app
