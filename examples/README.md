# Time-Locked Wallet Examples

Collection của các ví dụ minh họa cách sử dụng Time-Locked Wallet library.

## Available Examples

### 1. Vanilla JavaScript Demo
- **Path:** `vanilla-js/`
- **Description:** Demo đơn giản với HTML/CSS/JS thuần
- **Features:** Connect wallet, create locks, withdraw
- **Run:** Mở `index.html` trong browser

### 2. React + Vite Demo  
- **Path:** `react-vite/`
- **Description:** Modern React app với TypeScript và Vite
- **Features:** Component-based, hooks, real-time updates
- **Run:** `npm install && npm run dev`

## Chọn example phù hợp

### Vanilla JS - Phù hợp khi:
- ✅ Cần demo nhanh, không setup
- ✅ Integrate vào website có sẵn
- ✅ Học logic core đơn giản
- ✅ Không cần build tools

### React + Vite - Phù hợp khi:
- ✅ Xây dựng app React hoàn chỉnh
- ✅ Cần TypeScript support
- ✅ Modern development workflow
- ✅ Component reusability

## Usage Pattern

Cả hai example đều follow pattern chung:

1. **Connect Wallet** - Phantom wallet connection
2. **Create Lock** - Tạo time-locked wallet với amount + unlock time
3. **View Lock** - Xem thông tin lock với countdown
4. **Withdraw** - Rút tiền khi đến thời gian

## Integration Tips

### Để integrate vào project của bạn:

1. **Copy logic từ examples**
2. **Modify UI theo design system của bạn**  
3. **Replace localStorage với real Solana program calls**
4. **Add error handling và loading states**

### Key components cần implement:

- Wallet connection management
- Lock creation form với validation
- Lock info display với real-time countdown  
- Withdraw functionality với proper checks

## Notes

- Examples sử dụng **localStorage** để simulate blockchain data
- Production cần replace với actual Solana program integration
- UI được design đơn giản để focus vào logic
- Có thể customize styling theo needs
