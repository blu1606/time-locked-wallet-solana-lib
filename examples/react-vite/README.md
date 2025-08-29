# React + Vite Example

Đây là ví dụ sử dụng React + Vite để demo Time-Locked Wallet với TypeScript.

## Cài đặt và chạy

```bash
cd examples/react-vite
npm install
npm run dev
```

## Chức năng

- ✅ Connect Phantom wallet với React hooks
- ✅ Component-based UI
- ✅ Real-time updates
- ✅ TypeScript support
- ✅ Modern React patterns

## Cấu trúc

- `App.tsx` - Main component với wallet hooks
- `index.css` - Styling
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript config

## Tính năng chính

### Custom Hooks
- `useWallet()` - Quản lý wallet connection
- Auto-connect nếu đã connected trước đó

### Components
- `WalletConnection` - Hiển thị wallet info
- `CreateLockForm` - Form tạo lock
- `LockInfo` - Hiển thị thông tin lock với countdown
- `WithdrawSection` - Withdraw funds

## Lưu ý

- Demo sử dụng localStorage, không connect blockchain thực
- Production cần integrate với Solana program
- UI responsive và user-friendly
