# Time-Locked Wallet Solana Library

� **Library tạo time-locked wallet trên Solana** - cho phép người dùng lock SOL/tokens với thời gian unlock định trước.

## ✨ Features

- 🔐 **Time-locked Wallets**: Lock funds với unlock time tùy chỉnh
- ⏰ **Flexible Timing**: Support lock từ phút đến năm
- 🔗 **Solana Integration**: Built với @solana/web3.js và Anchor
- ⚛️ **React Hooks**: Ready-to-use hooks cho frontend
- 📦 **Easy Import**: Simple API, easy integration
- 🛡️ **Type Safe**: Full TypeScript support

## 📁 Project Structure

```
├── packages/
│   └── react/           # React library với hooks và components
├── examples/
│   ├── vanilla-js/      # HTML/CSS/JS demo
│   └── react-vite/      # React + TypeScript demo
├── programs/
│   └── time-locked-wallet/  # Solana program (Rust/Anchor)
└── docs/               # Documentation
```

## 🚀 Quick Start
### 1. Chạy Examples

**Vanilla JS (No setup required):**
```bash
cd examples/vanilla-js
# Mở index.html trong browser
```

**React + Vite:**
```bash
cd examples/react-vite
npm install
npm run dev
```

### 2. Sử dụng React Library

```bash
npm install @solana/web3.js @coral-xyz/anchor
# Copy packages/react vào project của bạn
```

```tsx
import React from 'react';
import { TimeLockProvider, useLockCreation, useLockInfo } from './path-to-react-lib';

function App() {
  return (
    <TimeLockProvider
      connection={connection}
      cluster="devnet"
    >
      <LockDemo />
    </TimeLockProvider>
  );
}

function LockDemo() {
  const { createLock, isLoading } = useLockCreation();
  const { lockInfo, refresh } = useLockInfo(lockAddress);

  const handleCreateLock = async () => {
    await createLock({
      amount: 0.1,
      unlockTime: new Date(Date.now() + 60000) // 1 minute
    });
  };

  return (
    <div>
      <button onClick={handleCreateLock} disabled={isLoading}>
        Create Lock
      </button>
      {lockInfo && (
        <div>
          <p>Amount: {lockInfo.amount} SOL</p>
          <p>Unlock: {lockInfo.unlockTime.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
```

## 📚 API Reference

### React Hooks

#### `useLockCreation()`
```tsx
const { createLock, isLoading, error } = useLockCreation();

await createLock({
  amount: number,           // SOL amount to lock
  unlockTime: Date,        // When to unlock
  assetType?: AssetType    // SOL or custom token
});
```

#### `useLockInfo(lockAddress)`
```tsx
const { lockInfo, isLoading, error, refresh } = useLockInfo(lockAddress);

// lockInfo structure:
{
  owner: string,
  amount: number,
  unlockTime: Date,
  assetType: AssetType,
  isUnlocked: boolean
}
```

#### `useWithdraw(lockAddress)`
```tsx
const { withdraw, canWithdraw, isLoading } = useWithdraw(lockAddress);

await withdraw(); // Withdraw when unlocked
```

### Provider Setup

```tsx
<TimeLockProvider
  connection={connection}        // Solana connection
  cluster="devnet"              // Network cluster  
  programId={programId}         // Optional: custom program ID
>
  {children}
</TimeLockProvider>
```

## 🛠️ Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Build React library
cd packages/react
npm run build

# Run examples
cd examples/react-vite
npm install && npm run dev
```

### Testing với Solana Program

```bash
# Setup Solana CLI và Anchor
# Build và deploy program
anchor build
anchor deploy --provider.cluster devnet

# Update program ID trong examples
```

## 📖 Examples Deep Dive

### Vanilla JS Example
- **File:** `examples/vanilla-js/index.html`
- **Features:** Pure HTML/CSS/JS, no build required
- **Best for:** Quick demos, learning, simple integrations

### React Example  
- **File:** `examples/react-vite/src/App.tsx`
- **Features:** Modern React, TypeScript, component-based
- **Best for:** Production apps, complex UIs

## 🏗️ Architecture

### Frontend (React)
- **Provider Pattern**: Context cho configuration
- **Custom Hooks**: Encapsulate blockchain logic
- **Local Types**: Self-contained, no external deps
- **Utils**: Formatters và validators

### Backend (Solana Program)
- **Anchor Framework**: Modern Solana development
- **Account Structure**: Efficient state management
- **Time Validation**: On-chain unlock time checking
- **Security**: Owner-only withdraw protection

## 🔧 Configuration

### Supported Networks
- ✅ **Devnet** (recommended for testing)
- ✅ **Testnet** 
- ✅ **Mainnet** (production)

### Supported Wallets
- ✅ **Phantom** (primary)
- ✅ **Solflare**
- ✅ **Any wallet-adapter compatible**

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test với examples
5. Submit PR

## 📄 License

MIT License - xem `LICENSE` file để biết chi tiết.

## 🆘 Support

- **Issues**: GitHub Issues
- **Examples**: Check `examples/` folder
- **Docs**: `docs/` folder

---

**Built with ❤️ for Solana ecosystem**
