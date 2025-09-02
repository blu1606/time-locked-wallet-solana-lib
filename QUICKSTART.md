# ⚡ Quick Start - Time-Locked Wallet

## 🎯 Chạy nhanh trong 3 bước

### 🔧 Bước 0: Prerequisites
Đảm bảo đã cài đặt:
- **Solana CLI** (`solana --version`)
- **Anchor CLI** (`anchor --version`) 
- **Node.js v18+** (`node --version`)
- **Phantom Wallet** (browser extension)

---

### 🚀 Option 1: Auto Setup (Recommended)

```bash
# Chạy script tự động
./quick-start.sh
```

Sau đó làm theo hướng dẫn in ra màn hình.

---

### 🔨 Option 2: Manual Setup

#### Terminal 1 - Blockchain
```bash
solana-test-validator
```

#### Terminal 2 - Deploy 
```bash
anchor deploy
solana airdrop 5
```

#### Terminal 3 - Frontend
```bash
cd examples/react-vite
npm run dev
```

---

### 🦊 Bước cuối: Setup Phantom

1. **Import wallet**: Paste private key từ `~/.config/solana/id.json`
2. **Change network**: Add Custom RPC `http://127.0.0.1:8899`
3. **Test**: Vào `http://localhost:5173` và connect wallet

---

## 🎮 Test Flow

1. **Connect Wallet** → Approve trong Phantom
2. **Create Lock** → Fill form + Submit transaction  
3. **View Info** → Countdown timer hiển thị
4. **Withdraw** → Sau khi unlock time + Approve transaction

---

## 🛠️ Troubleshooting

| Lỗi | Fix |
|-----|-----|
| Connection refused | `solana-test-validator` chưa chạy |
| Program not found | `anchor deploy` lại |
| Insufficient funds | `solana airdrop 2` |
| Phantom lỗi | Refresh page + reconnect |

---

## 📚 Chi tiết đầy đủ

Xem `SETUP_GUIDE.md` để có hướng dẫn chi tiết từng bước.

---

**Ready to build? Let's go! 🚀**
