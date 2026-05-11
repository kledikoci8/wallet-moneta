# 🚀 Quick Start Guide - After Loading Fix

## ✅ Pre-Flight Checklist

### 1. Start Backend Server
```bash
cd backend
npm start
```
**Expected output:** `Server is up and running on PORT: 5001`

### 2. Verify Backend Health
```bash
curl http://localhost:5001/api/health
```
**Expected output:** `It's working`

### 3. Find Your Local IP Address
```bash
# macOS/Linux
ipconfig getifaddr en0

# Windows
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### 4. Update API URL
Edit `mobile/constants/api.js`:
```javascript
export const API_URL = "http://YOUR_IP_HERE:5001/api";
```
Replace `YOUR_IP_HERE` with the IP from step 3.

### 5. Verify Environment Variables
Check `mobile/.env`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```
Make sure this exists and is not empty.

### 6. Start Expo (with cache clear)
```bash
cd mobile
npx expo start -c
```

### 7. Open App on Device/Emulator
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

---

## 🐛 Troubleshooting

### App Stuck on Loading Screen?

**Check Console Logs:**
Look for these messages in Metro bundler terminal:
- `[Root Layout] Auth loaded, checking onboarding status...`
- `[useTransactions] Loading data...`
- `[Home] Rendering main content with X transactions`

**If you see errors:**

1. **"Failed to fetch"** → Backend not running or wrong IP
   - Restart backend server
   - Verify API_URL in `constants/api.js`
   - Test with: `curl http://YOUR_IP:5001/api/health`

2. **"Missing Publishable Key"** → Clerk not configured
   - Check `mobile/.env` file exists
   - Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
   - Restart Expo after changing .env

3. **"Loading timeout reached"** → Network issue
   - Ensure device is on same WiFi as computer
   - Check firewall settings
   - Try using localhost if using emulator

---

## 📱 Testing the Fix

### Expected Behavior:

1. **App starts** → Shows loading spinner with "Initializing..."
2. **Auth loads** → Shows "Loading..."
3. **Data loads** → Shows home screen with transactions
4. **Total time** → Should be under 3 seconds

### If Backend is Stopped:

1. **App starts** → Shows loading spinner
2. **After 10 seconds** → Shows error screen
3. **Error message** → "Unable to connect to server"
4. **Retry button** → Attempts to reconnect

---

## 🎯 What Was Fixed

1. ✅ **Clerk publishableKey** - Now properly configured
2. ✅ **Infinite useEffect loops** - Fixed dependencies
3. ✅ **Circular dependencies** - Removed from useTransactions
4. ✅ **Silent failures** - Added error handling and timeouts
5. ✅ **Better logging** - Console logs for debugging
6. ✅ **Error screens** - User-friendly error messages

---

## 📊 Success Indicators

You'll know it's working when you see:

**In Console:**
```
[Root Layout] Auth loaded, checking onboarding status...
[Root Layout] Onboarding status: true
[Root Layout] Rendering main stack
[useTransactions] Loading data...
[useTransactions] Fetched 5 transactions
[Home] Rendering main content with 5 transactions
```

**On Screen:**
- Home screen with balance card
- List of transactions
- Navigation buttons working
- No infinite loading spinner

---

## 🔄 If You Need to Reset

```bash
# Clear all caches
cd mobile
rm -rf node_modules
npm install
npx expo start -c

# Reset AsyncStorage (if needed)
# In app, go to Settings → Clear Data (if you add this feature)
# Or uninstall and reinstall the app
```

---

## 📞 Need More Help?

See `LOADING_FIX_GUIDE.md` for detailed technical documentation.
