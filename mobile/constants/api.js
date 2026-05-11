//const API_URL="https://wallet-api-u1jc.onrender.com/api";
//ipconfig getifaddr en0

// ⚠️ IMPORTANT: Update this IP address to match your computer's local IP
// To find your IP:
// - macOS/Linux: Run `ipconfig getifaddr en0` in terminal
// - Windows: Run `ipconfig` and look for IPv4 Address
// - Make sure your phone/emulator is on the SAME network as your computer
export const API_URL="http://192.168.1.4:5001/api";

// 🧪 To test if backend is reachable:
// curl http://192.168.1.4:5001/api/health
// Should return: "It's working"