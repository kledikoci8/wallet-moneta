# 🔄 Redirect Loop Fix - FINAL SOLUTION

## 🔴 The Problem

The `<Redirect>` component in Expo Router causes the parent layout to **completely unmount and remount**, which means:
- All state is reset (including refs!)
- All effects run again
- Creates an infinite redirect loop

```
[Root Layout] Not onboarded, redirecting to /onboarding
[Root Layout] Loading... (component remounts)
[Root Layout] Checking onboarding... (effect runs again)
[Root Layout] Not onboarded, redirecting to /onboarding
... (infinite loop)
```

## ✅ The Solution

**Use `router.replace()` instead of `<Redirect>`** with segment-based navigation guards:

```javascript
import { useRouter, useSegments } from "expo-router";

const router = useRouter();
const segments = useSegments();

useEffect(() => {
  if (!isLoaded || onboarded === null) return;

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboarding = segments[1] === "onboarding";

  // Navigate based on state, but check current location first
  if (!isSignedIn && !inAuthGroup) {
    router.replace("/sign-in");
  } else if (isSignedIn && !onboarded && !inOnboarding) {
    router.replace("/onboarding");
  } else if (isSignedIn && onboarded && (inAuthGroup || inOnboarding)) {
    router.replace("/");
  }
}, [isLoaded, isSignedIn, onboarded, segments]);

// Always render the Stack (no conditional Redirect)
return <Stack screenOptions={{ headerShown: false }} />;
```

### Why This Works

1. **No conditional rendering** - Stack always renders
2. **Imperative navigation** - `router.replace()` doesn't cause remount
3. **Segment guards** - Prevents navigation loops by checking current location
4. **Single effect** - Runs when state changes, not on every render

## 🆚 Comparison

### ❌ Old Approach (Broken)
```javascript
if (!isSignedIn) {
  return <Redirect href="/sign-in" />; // Causes remount!
}
if (!onboarded) {
  return <Redirect href="/onboarding" />; // Causes remount!
}
return <Stack />;
```

### ✅ New Approach (Fixed)
```javascript
useEffect(() => {
  // Check where we are
  const inOnboarding = segments[1] === "onboarding";
  
  // Navigate only if needed
  if (isSignedIn && !onboarded && !inOnboarding) {
    router.replace("/onboarding");
  }
}, [isSignedIn, onboarded, segments]);

// Always render Stack
return <Stack />;
```

## 🧪 Testing

### Expected Logs (Success)

```
[Root Layout] Checking onboarding status...
[Root Layout] Onboarding value from storage: null
[Root Layout] Navigation check - isSignedIn: true onboarded: false
[Root Layout] Signed in but not onboarded, navigating to onboarding
[Root Layout] Rendering stack
[Onboarding] Screen mounted
```

### Bad Logs (Still Broken)

```
[Root Layout] Not onboarded, redirecting to /onboarding
[Root Layout] Loading... isLoaded: true onboarded: null
[Root Layout] Not onboarded, redirecting to /onboarding
... (repeating)
```

## 📝 Key Principles

1. **Never use `<Redirect>` in layout files** - Causes remount loops
2. **Use `router.replace()` for navigation** - Imperative, no remount
3. **Check segments before navigating** - Prevents navigation loops
4. **Always render the Stack** - No conditional rendering of layout

## 🎯 Summary

**Issue:** `<Redirect>` causes layout remount → infinite loop  
**Solution:** Use `router.replace()` with segment guards  
**Result:** Clean navigation, no loops, app loads correctly  

---

**Status:** ✅ Fixed (Final)  
**Date:** 2026-05-11  
**Approach:** Imperative navigation with segment guards
