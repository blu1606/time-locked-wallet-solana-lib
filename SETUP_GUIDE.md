# 🚀 Hướng dẫn chạy Time-Locked Wallet Project

## 📋 Yêu cầu hệ thống

- **Node.js**: v18+ (hiện tại v18.20.8, recommend upgrade to v20+)
- **Rust**: Latest stable version
- **Solana CLI**: v1.16+
- **Anchor CLI**: v0.29+
- **Phantom Wallet**: Browser extension

---

## 🔧 Bước 1: Setup Environment

### 1.1 Kiểm tra Solana CLI
```bash
solana --version
solana config get
```

### 1.2 Tạo wallet nếu chưa có
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### 1.3 Set config cho localhost
```bash
solana config set --url localhost
solana config set --keypair ~/.config/solana/id.json
```

---

## 🏗️ Bước 2: Build Project

### 2.1 Vào thư mục project
```bash
cd /Volumes/WorkSpace/VScode/Blockchain/time-locked-wallet-solana-lib
```

### 2.2 Build smart contract
```bash
anchor build
```

### 2.3 Build packages
```bash
# Build core package
cd packages/core
npm run build

# Build react package  
cd ../react
npm run build

# Quay về root
cd ../..
```

---

## 🌐 Bước 3: Start Blockchain (Terminal 1)

### 3.1 Start local validator
```bash
solana-test-validator
```

**Chờ thấy message**: `"Ledger location: test-ledger"`

### 3.2 Kiểm tra validator (Terminal mới)
```bash
solana cluster-version
# Kết quả: 2.3.8 (hoặc tương tự)
```

---

## 📄 Bước 4: Deploy Smart Contract (Terminal 2)

### 4.1 Deploy contract
```bash
cd /Volumes/WorkSpace/VScode/Blockchain/time-locked-wallet-solana-lib
anchor deploy
```

**Lưu ý Program ID** (ví dụ: `Cbrwi9hDB1bQ9fhAqJDPMHxTmXNkGq96Z7KZXjXQJ3dB`)

### 4.2 Airdrop SOL để test
```bash
solana airdrop 5
solana balance
```

---

## 💻 Bước 5: Start Frontend (Terminal 3)

### 5.1 Setup react-vite example
```bash
cd examples/react-vite
npm install
```

### 5.2 Update Program ID (nếu cần)
```bash
# Mở file src/App.tsx và update PROGRAM_ID với ID từ bước 4.1
```

### 5.3 Start development server
```bash
npm run dev
```

**Frontend sẽ chạy tại**: `http://localhost:5173`

---

## 🦊 Bước 6: Setup Phantom Wallet

### 6.1 Install Phantom Extension
- Vào [phantom.app](https://phantom.app) và install extension

### 6.2 Import wallet vào Phantom
1. Open Phantom
2. Click "Import Wallet" 
3. Paste private key từ `~/.config/solana/id.json`
4. Set password

### 6.3 Change network to Localhost
1. Phantom Settings → "Change Network"
2. Add Custom RPC: `http://127.0.0.1:8899`
3. Switch to Localhost network

---

## 🎮 Bước 7: Test Full Flow

### 7.1 Mở browser
Vào `http://localhost:5173`

### 7.2 Connect Wallet
1. Click "Connect Phantom Wallet"
2. Approve connection trong Phantom

### 7.3 Create Time Lock
1. Fill form:
   - Amount: `0.1` SOL
   - Date: Hôm nay
   - Time: Hiện tại + 1 phút
2. Click "Create Lock"
3. Approve transaction trong Phantom

### 7.4 View Lock Info
- Lock information sẽ hiển thị với countdown timer
- Wait for unlock time

### 7.5 Withdraw Funds
1. Sau khi countdown = 0
2. Click "Withdraw Funds"  
3. Approve transaction
4. Check balance increase

---

## 🛠️ Commands Summary

```bash
# Terminal 1 - Blockchain
solana-test-validator

# Terminal 2 - Deploy & Setup  
cd /Volumes/WorkSpace/VScode/Blockchain/time-locked-wallet-solana-lib
anchor build
anchor deploy
solana airdrop 5

# Terminal 3 - Frontend
cd examples/react-vite
npm install
npm run dev
```

---

## 🔍 Troubleshooting

### ❌ "Connection refused"
- Đảm bảo `solana-test-validator` đang chạy
- Check `solana config get` RPC URL = `http://127.0.0.1:8899`

### ❌ "Program not found"
- Re-deploy: `anchor deploy`
- Update Program ID trong `src/App.tsx`

### ❌ "Insufficient funds"
- Airdrop thêm SOL: `solana airdrop 2`
- Check balance: `solana balance`

### ❌ Node version warnings
- Upgrade to Node v20+: `nvm install 20 && nvm use 20`

### ❌ Phantom not connecting
- Refresh page và reconnect
- Clear browser cache
- Đảm bảo Phantom đang ở localhost network

---

## 📊 Expected Results

### ✅ Success Indicators:
- **Validator**: `solana cluster-version` returns version
- **Deploy**: Program ID displayed after `anchor deploy`
- **Frontend**: `http://localhost:5173` loads without errors
- **Wallet**: Phantom shows SOL balance
- **Transaction**: Create/withdraw transactions confirm

### 📈 Performance:
- **Build time**: ~30 seconds
- **Deploy time**: ~10 seconds  
- **Frontend start**: ~5 seconds
- **Transaction time**: ~2-5 seconds

---

## 🎯 Next Steps (Optional)

1. **Test với DevNet**: Change cluster to devnet
2. **Add SPL Tokens**: Implement token locks
3. **Mobile Testing**: Test responsive design
4. **Performance**: Add loading states
5. **Security**: Add input validation

---

## 🏆 Success! 

Khi hoàn thành tất cả bước trên, bạn sẽ có:
- ✅ Local Solana blockchain running
- ✅ Smart contract deployed và functional  
- ✅ Frontend với React components
- ✅ Full create → view → withdraw flow
- ✅ Production-ready architecture

**Happy coding!** 🚀

---

*Được tạo: 2/9/2024*  
*Version: 1.0*
