// Time-Locked Wallet Vanilla JS Demo
class TimeLockWallet {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.currentLockAddress = null;
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        // Initialize Solana connection (devnet for demo)
        this.connection = new solanaWeb3.Connection(
            solanaWeb3.clusterApiUrl('devnet'), 
            'confirmed'
        );

        this.setupEventListeners();
        this.checkWalletConnection();
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('createLockForm').addEventListener('submit', (e) => this.createLock(e));
        document.getElementById('refreshLockBtn').addEventListener('click', () => this.refreshLockInfo());
        document.getElementById('withdrawBtn').addEventListener('click', () => this.withdraw());

        // Auto-refresh lock info when address changes
        document.getElementById('lockAddress').addEventListener('input', (e) => {
            this.currentLockAddress = e.target.value.trim();
            if (this.currentLockAddress) {
                this.refreshLockInfo();
            }
        });
    }

    async checkWalletConnection() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                    this.wallet = response;
                    this.updateWalletUI();
                }
            } catch (error) {
                // User hasn't connected yet
                console.log('Wallet not connected yet');
            }
        }
    }

    async connectWallet() {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                throw new Error('Phantom wallet not found! Please install Phantom.');
            }

            const response = await window.solana.connect();
            this.wallet = response;
            this.updateWalletUI();
            this.showStatus('Wallet connected successfully!', 'success');
        } catch (error) {
            this.showStatus(`Error connecting wallet: ${error.message}`, 'error');
        }
    }

    async updateWalletUI() {
        if (!this.wallet) return;

        const address = this.wallet.publicKey.toString();
        document.getElementById('walletAddress').textContent = 
            `${address.slice(0, 8)}...${address.slice(-8)}`;

        try {
            const balance = await this.connection.getBalance(this.wallet.publicKey);
            document.getElementById('walletBalance').textContent = 
                (balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
        } catch (error) {
            document.getElementById('walletBalance').textContent = 'Error loading';
        }

        document.getElementById('walletStatus').style.display = 'block';
        document.getElementById('connectWallet').textContent = 'Connected';
        document.getElementById('connectWallet').disabled = true;
    }

    async createLock(event) {
        event.preventDefault();
        
        if (!this.wallet) {
            this.showStatus('Please connect your wallet first', 'error', 'createLockStatus');
            return;
        }

        try {
            const amount = parseFloat(document.getElementById('amount').value);
            const unlockDate = document.getElementById('unlockDate').value;
            const unlockTime = document.getElementById('unlockTime').value;

            if (!amount || !unlockDate || !unlockTime) {
                throw new Error('Please fill in all fields');
            }

            const unlockDateTime = new Date(`${unlockDate}T${unlockTime}`);
            const now = new Date();

            if (unlockDateTime <= now) {
                throw new Error('Unlock time must be in the future');
            }

            // For demo purposes, we'll simulate the transaction
            // In a real implementation, this would call the actual Solana program
            this.showStatus('Creating time-locked wallet...', 'info', 'createLockStatus');
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate a mock lock address for demo
            const mockLockAddress = solanaWeb3.Keypair.generate().publicKey.toString();
            
            this.showStatus(`Lock created successfully! Address: ${mockLockAddress}`, 'success', 'createLockStatus');
            
            // Auto-fill the lock address for convenience
            document.getElementById('lockAddress').value = mockLockAddress;
            this.currentLockAddress = mockLockAddress;
            
            // Create mock lock data for demo
            this.createMockLockData(mockLockAddress, amount, unlockDateTime);
            this.refreshLockInfo();
            
        } catch (error) {
            this.showStatus(`Error creating lock: ${error.message}`, 'error', 'createLockStatus');
        }
    }

    createMockLockData(address, amount, unlockTime) {
        const lockData = {
            owner: this.wallet.publicKey.toString(),
            amount: amount,
            unlockTime: unlockTime.getTime(),
            created: Date.now()
        };
        
        // Store in localStorage for demo persistence
        localStorage.setItem(`lock_${address}`, JSON.stringify(lockData));
    }

    async refreshLockInfo() {
        if (!this.currentLockAddress) {
            document.getElementById('lockInfo').style.display = 'none';
            return;
        }

        try {
            // In a real implementation, this would fetch from the blockchain
            // For demo, we'll use localStorage
            const lockDataStr = localStorage.getItem(`lock_${this.currentLockAddress}`);
            
            if (!lockDataStr) {
                this.showStatus('Lock not found or invalid address', 'error', 'lockInfo');
                document.getElementById('lockInfo').style.display = 'none';
                return;
            }

            const lockData = JSON.parse(lockDataStr);
            this.updateLockInfoUI(lockData);
            
        } catch (error) {
            this.showStatus(`Error fetching lock info: ${error.message}`, 'error', 'lockInfo');
            document.getElementById('lockInfo').style.display = 'none';
        }
    }

    updateLockInfoUI(lockData) {
        const now = Date.now();
        const unlockTime = new Date(lockData.unlockTime);
        const isUnlocked = now >= lockData.unlockTime;

        document.getElementById('lockOwner').textContent = 
            `${lockData.owner.slice(0, 8)}...${lockData.owner.slice(-8)}`;
        document.getElementById('lockAmount').textContent = `${lockData.amount} SOL`;
        document.getElementById('lockUnlockTime').textContent = unlockTime.toLocaleString();
        document.getElementById('lockStatus').textContent = isUnlocked ? 'Unlocked ✅' : 'Locked 🔒';
        
        // Update time remaining
        if (isUnlocked) {
            document.getElementById('lockTimeRemaining').textContent = 'Ready to withdraw!';
            document.getElementById('lockTimeRemaining').style.color = '#28a745';
        } else {
            const timeRemaining = this.formatTimeRemaining(lockData.unlockTime - now);
            document.getElementById('lockTimeRemaining').textContent = timeRemaining;
            document.getElementById('lockTimeRemaining').style.color = '#007bff';
        }

        // Update withdraw button
        const isOwner = this.wallet && this.wallet.publicKey.toString() === lockData.owner;
        document.getElementById('withdrawBtn').disabled = !isUnlocked || !isOwner;
        
        if (!isOwner) {
            document.getElementById('withdrawBtn').textContent = 'Not Owner';
        } else if (isUnlocked) {
            document.getElementById('withdrawBtn').textContent = 'Withdraw Funds';
        } else {
            document.getElementById('withdrawBtn').textContent = 'Still Locked';
        }

        document.getElementById('lockInfo').style.display = 'block';
        
        // Start auto-refresh if lock is still active
        if (!isUnlocked) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    formatTimeRemaining(milliseconds) {
        const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
        const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.refreshLockInfo();
        }, 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async withdraw() {
        if (!this.wallet || !this.currentLockAddress) {
            this.showStatus('Please connect wallet and select a lock', 'error', 'withdrawStatus');
            return;
        }

        try {
            this.showStatus('Processing withdrawal...', 'info', 'withdrawStatus');
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            // For demo, mark as withdrawn
            localStorage.removeItem(`lock_${this.currentLockAddress}`);
            
            this.showStatus('Withdrawal successful! Funds sent to your wallet.', 'success', 'withdrawStatus');
            
            // Refresh UI
            document.getElementById('lockInfo').style.display = 'none';
            document.getElementById('withdrawBtn').disabled = true;
            this.updateWalletUI(); // Refresh balance
            
        } catch (error) {
            this.showStatus(`Error withdrawing: ${error.message}`, 'error', 'withdrawStatus');
        }
    }

    showStatus(message, type, elementId = 'status') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = `<div class="${type}">${message}</div>`;
        
        // Auto-clear success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.innerHTML = '';
            }, 5000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeLockWallet();
});

// Set minimum date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('unlockDate').min = today;
    document.getElementById('unlockDate').value = today;
    
    // Set default time to 1 hour from now
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    const timeString = oneHourLater.toTimeString().slice(0, 5);
    document.getElementById('unlockTime').value = timeString;
});
