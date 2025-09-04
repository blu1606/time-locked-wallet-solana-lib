# Tối ưu Frontend Requests - Giải pháp Rate Limiting

## 🎯 Nguyên nhân chính:

### 1. **Polling quá thường xuyên (mỗi 5 giây)**
- DashboardPage: `setInterval(loadLocks, 5000)`
- AccountTestPage: `setInterval(refresh, 5000)`
- useBalance hook: `setInterval(refresh, 5000)`

### 2. **useEffect dependencies không kiểm soát**
- Dashboard re-render liên tục khi wallet state thay đổi
- Gọi `getUserTimeLocks()` → `allAccounts.all()` nhiều lần

### 3. **Không có caching mechanism**
- Mỗi lần load lại gọi full RPC request
- Không có debouncing cho user actions

## 🔧 Giải pháp:

### **1. Tăng polling interval (5s → 30s)**
```tsx
// Thay đổi từ 5000ms thành 30000ms
const interval = setInterval(refresh, 30000);
```

### **2. Thêm caching với timestamp**
```tsx
const cache = {
  data: null,
  timestamp: 0,
  ttl: 30000 // 30 seconds
};

const getCachedData = async () => {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < cache.ttl) {
    return cache.data;
  }
  
  const freshData = await fetchFromRPC();
  cache.data = freshData;
  cache.timestamp = now;
  return freshData;
};
```

### **3. Debouncing cho user actions**
```tsx
import { debounce } from 'lodash';

const debouncedLoadBalance = useCallback(
  debounce(async () => {
    // load balance logic
  }, 1000),
  [connection, publicKey]
);
```

### **4. Conditional loading**
```tsx
useEffect(() => {
  // Chỉ load khi thật sự cần thiết
  if (connected && publicKey && !isLoading) {
    loadTimeLocks();
    loadWalletBalance();
  }
}, [connected, publicKey]); // Loại bỏ loadTimeLocks, loadWalletBalance khỏi deps
```

### **5. Background sync khi user inactive**
```tsx
useEffect(() => {
  let isActive = true;
  
  const handleVisibilityChange = () => {
    isActive = !document.hidden;
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  const interval = setInterval(() => {
    if (isActive) {
      refresh();
    }
  }, isActive ? 30000 : 60000); // Slower when inactive
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(interval);
  };
}, []);
```

## 🚨 Lỗi Program vs Frontend:

### **Frontend Errors (Rate Limiting - 429):**
- Connection refused
- Too many requests
- Network timeout
- **Giải pháp:** Optimize polling, add caching, debouncing

### **Program Errors (InstructionDidNotDeserialize - 102):**
- Invalid instruction data
- Account state mismatch
- Serialization issues
- **Giải pháp:** Check account validation, instruction format

## 📊 Monitoring:

### **Request tracking:**
```tsx
const requestCounter = {
  count: 0,
  resetTime: Date.now(),
  limit: 100 // per minute
};

const trackRequest = () => {
  const now = Date.now();
  if (now - requestCounter.resetTime > 60000) {
    requestCounter.count = 0;
    requestCounter.resetTime = now;
  }
  
  requestCounter.count++;
  console.log(`Requests this minute: ${requestCounter.count}/${requestCounter.limit}`);
  
  if (requestCounter.count > requestCounter.limit) {
    throw new Error('Rate limit exceeded');
  }
};
```

## 🎯 Priority Implementation:

1. **Immediate:** Tăng polling interval từ 5s → 30s
2. **Short-term:** Thêm caching mechanism
3. **Medium-term:** Implement debouncing và conditional loading
4. **Long-term:** Background sync và request monitoring
