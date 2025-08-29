# @time-locked-wallet/react

React hooks và components cho Time-Locked Wallet trên Solana.

## 📦 Cài đặt

```bash
npm install @time-locked-wallet/react
# hoặc
yarn add @time-locked-wallet/react
```

## 🚀 Sử dụng nhanh

### 1. Thiết lập Provider

```tsx
import { TimeLockProvider } from '@time-locked-wallet/react';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const config = {
  programId: 'YourProgramId',
  cluster: 'devnet'
};

function App() {
  return (
    <TimeLockProvider config={config} connection={connection}>
      <YourComponent />
    </TimeLockProvider>
  );
}
```

### 2. Sử dụng Hooks

```tsx
import { useLockCreation, useLockInfo, useUserLocks, useWithdraw } from '@time-locked-wallet/react';

function MyComponent() {
  // Tạo time-lock mới
  const { createLock, isCreating } = useLockCreation();
  
  // Xem thông tin lock
  const { lockInfo, isLoading } = useLockInfo(lockAddress);
  
  // Lấy danh sách locks của user
  const { locks } = useUserLocks(userAddress);
  
  // Rút tiền
  const { withdraw, isWithdrawing } = useWithdraw();
}
```

### 3. Sử dụng Components

```tsx
import { 
  LockCreationForm, 
  LockInfoCard, 
  LocksList, 
  WithdrawButton 
} from '@time-locked-wallet/react';

function Dashboard() {
  return (
    <div>
      <LockCreationForm onLockCreated={handleLockCreated} />
      <LocksList userAddress={userAddress} />
      <LockInfoCard lockAddress={lockAddress} />
      <WithdrawButton lockAddress={lockAddress} />
    </div>
  );
}
```

## 🎣 Hooks API

### `useLockCreation()`

Hook để tạo time-locked wallets mới.

```tsx
const {
  createLock,          // Function tạo lock
  depositAssets,       // Function deposit assets
  isCreating,          // Loading state
  isDepositing,        // Deposit loading state
  error,               // Error message
  createdLockAddress,  // Address của lock vừa tạo
  depositTxSignature,  // Transaction signature
  reset               // Reset state
} = useLockCreation();
```

### `useLockInfo(lockAddress, autoRefresh?, refreshInterval?)`

Hook để lấy thông tin về một time-lock wallet.

```tsx
const {
  lockInfo,        // Thông tin lock
  isLoading,       // Loading state
  error,           // Error message
  refreshLockInfo  // Function refresh thủ công
} = useLockInfo(lockAddress);
```

### `useUserLocks(userAddress, autoRefresh?, refreshInterval?)`

Hook để lấy danh sách locks của user.

```tsx
const {
  locks,        // Array of WalletInfo
  isLoading,    // Loading state
  error,        // Error message
  refreshLocks, // Function refresh
  addLock,      // Thêm lock vào list
  removeLock    // Xóa lock khỏi list
} = useUserLocks(userAddress);
```

### `useWithdraw()`

Hook để rút tiền từ time-locked wallets.

```tsx
const {
  withdraw,             // Function rút tiền
  checkWithdrawStatus,  // Check xem có thể rút chưa
  isWithdrawing,        // Loading state
  error,                // Error message
  withdrawTxSignature,  // Transaction signature
  reset                 // Reset state
} = useWithdraw();
```

## 🧩 Components API

### `<LockCreationForm />`

Form component để tạo time-locked wallets.

```tsx
<LockCreationForm
  onLockCreated={(lockAddress) => console.log('Created:', lockAddress)}
  onDeposited={(txSignature) => console.log('Deposited:', txSignature)}
  className="custom-class"
  disabled={false}
/>
```

### `<LockInfoCard />`

Card component hiển thị thông tin lock.

```tsx
<LockInfoCard
  lockAddress={lockAddress}
  autoRefresh={true}
  refreshInterval={30000}
  className="custom-class"
  onRefresh={(lockInfo) => console.log('Refreshed:', lockInfo)}
/>
```

### `<LocksList />`

Component hiển thị danh sách locks của user.

```tsx
<LocksList
  userAddress={userAddress}
  autoRefresh={true}
  refreshInterval={60000}
  className="custom-class"
  onLockSelect={(lockInfo) => console.log('Selected:', lockInfo)}
  showCreateButton={true}
  onCreateNew={() => console.log('Create new')}
/>
```

### `<WithdrawButton />`

Button component để rút tiền.

```tsx
<WithdrawButton
  lockAddress={lockAddress}
  className="custom-class"
  disabled={false}
  onWithdrawSuccess={(txSignature) => console.log('Success:', txSignature)}
  onWithdrawError={(error) => console.log('Error:', error)}
  showLockInfo={true}
/>
```

## 🛠️ Utilities

### Formatters

```tsx
import { 
  formatTimestamp, 
  formatTimeRemaining, 
  formatAmount,
  formatAddress 
} from '@time-locked-wallet/react';

// Format timestamp
formatTimestamp(1640995200000); // "Jan 1, 2022, 12:00:00 AM"

// Format time remaining
formatTimeRemaining(3661); // "1h 1m 1s"

// Format amount
formatAmount(1000000000, AssetType.Sol); // "1.000000000 SOL"

// Format address
formatAddress("11111111111111111111111111111112"); // "1111...1112"
```

### Validators

```tsx
import { 
  validateAddress, 
  validateAmount, 
  validateTimestamp,
  validateLockCreation 
} from '@time-locked-wallet/react';

// Validate address
validateAddress("11111111111111111111111111111112"); // true

// Validate amount
validateAmount("1.5"); // true

// Validate timestamp
validateTimestamp(Date.now() + 86400000); // true

// Validate full lock creation
const errors = validateLockCreation({
  ownerAddress: "invalid",
  unlockDate: "2024-01-01",
  unlockTime: "12:00",
  amount: "-1",
  assetType: "sol"
});
```

## 🎨 Styling

Components được thiết kế để dễ dàng customize với CSS:

```css
.lock-creation-form {
  /* Form styles */
}

.lock-info-card {
  /* Card styles */
}

.lock-info-card.expired {
  /* Expired lock styles */
}

.locks-list {
  /* List styles */
}

.withdraw-button {
  /* Button styles */
}

.withdraw-button.locked {
  /* Locked state styles */
}
```

## 📱 Examples

### Ví dụ Complete App

```tsx
import React, { useState } from 'react';
import { 
  TimeLockProvider,
  LockCreationForm,
  LocksList,
  LockInfoCard,
  WithdrawButton
} from '@time-locked-wallet/react';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const config = { programId: 'YourProgramId', cluster: 'devnet' };

function App() {
  const [selectedLock, setSelectedLock] = useState<PublicKey | null>(null);
  const [userAddress] = useState(new PublicKey('UserWalletAddress'));

  return (
    <TimeLockProvider config={config} connection={connection}>
      <div className="app">
        <h1>Time-Locked Wallet Dashboard</h1>
        
        {/* Create new lock */}
        <section>
          <h2>Create New Lock</h2>
          <LockCreationForm 
            onLockCreated={(lockAddress) => {
              console.log('Lock created:', lockAddress);
              setSelectedLock(lockAddress);
            }}
          />
        </section>

        {/* User's locks */}
        <section>
          <h2>Your Locks</h2>
          <LocksList 
            userAddress={userAddress}
            onLockSelect={(lockInfo) => setSelectedLock(lockInfo.tokenVault)}
          />
        </section>

        {/* Selected lock details */}
        {selectedLock && (
          <section>
            <h2>Lock Details</h2>
            <LockInfoCard lockAddress={selectedLock} />
            <WithdrawButton 
              lockAddress={selectedLock}
              onWithdrawSuccess={(txSignature) => {
                console.log('Withdrawal successful:', txSignature);
                setSelectedLock(null);
              }}
            />
          </section>
        )}
      </div>
    </TimeLockProvider>
  );
}

export default App;
```

### Ví dụ Custom Hook

```tsx
import { useTimeLockContext } from '@time-locked-wallet/react';
import { useState, useCallback } from 'react';

function useCustomLockManager() {
  const { client } = useTimeLockContext();
  const [locks, setLocks] = useState([]);

  const createLockWithNotification = useCallback(async (params) => {
    try {
      const lockAddress = await client.createTimeLock(params);
      // Send notification
      notifyUser('Lock created successfully!');
      return lockAddress;
    } catch (error) {
      notifyUser('Failed to create lock: ' + error.message);
      throw error;
    }
  }, [client]);

  return { createLockWithNotification, locks };
}
```

## 🔧 Development

```bash
# Build package
npm run build

# Run tests
npm test

# Watch mode
npm run watch

# Lint
npm run lint
```

## 📄 License

MIT
