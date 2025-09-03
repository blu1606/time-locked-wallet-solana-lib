import { validateAndNormalizePublicKey } from './utils/validation'
import { PublicKey } from '@solana/web3.js'

export interface LockData {
  address: string
  amount: number
  unlockTimestamp: number
  tokenMint?: string
  createdAt: number
  isUnlocked?: boolean
}

/**
 * Enhanced localStorage manager với event-driven updates
 */
export class StorageManager {
  private static LOCK_PREFIX = 'time_lock_'
  
  /**
   * Save lock data với validation và event dispatch
   */
  static saveLock(data: Omit<LockData, 'address' | 'createdAt'> & { address: string | PublicKey }): void {
    try {
      const normalizedAddress = validateAndNormalizePublicKey(data.address).toString()
      const lockData: LockData = {
        ...data,
        address: normalizedAddress,
        createdAt: Date.now(),
        isUnlocked: Date.now() > data.unlockTimestamp
      }
      
      const key = `${this.LOCK_PREFIX}${normalizedAddress}`
      localStorage.setItem(key, JSON.stringify(lockData))
      
      console.log('StorageManager: Saved lock data', { address: normalizedAddress, data: lockData })
      
      // Dispatch custom event for UI updates (browser only)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lockDataChanged', { 
          detail: { action: 'save', address: normalizedAddress, data: lockData }
        }))
      }
    } catch (error) {
      console.error('Failed to save lock data:', error)
      throw new Error(`Failed to save lock data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Get specific lock data
   */
  static getLock(address: string | PublicKey): LockData | null {
    try {
      const normalizedAddress = validateAndNormalizePublicKey(address).toString()
      const key = `${this.LOCK_PREFIX}${normalizedAddress}`
      const data = localStorage.getItem(key)
      
      if (!data) return null
      
      const parsed = JSON.parse(data) as LockData
      // Ensure address is normalized và update unlock status
      parsed.address = normalizedAddress
      parsed.isUnlocked = Date.now() > parsed.unlockTimestamp
      return parsed
    } catch (error) {
      console.error('Failed to get lock data:', error)
      return null
    }
  }
  
  /**
   * Get all locks với sorting và filtering
   */
  static getAllLocks(): LockData[] {
    try {
      const locks: LockData[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.LOCK_PREFIX)) {
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data) as LockData
              // Extract và normalize address from key
              const address = key.replace(this.LOCK_PREFIX, '')
              
              try {
                const normalizedAddress = validateAndNormalizePublicKey(address).toString()
                parsed.address = normalizedAddress
                parsed.isUnlocked = Date.now() > parsed.unlockTimestamp
                locks.push(parsed)
              } catch (validationError) {
                console.warn('Invalid address in localStorage key:', key, validationError)
                // Cleanup invalid entries
                localStorage.removeItem(key)
              }
            } catch (parseError) {
              console.warn('Failed to parse lock data for key:', key, parseError)
              // Cleanup corrupted entries
              localStorage.removeItem(key)
            }
          }
        }
      }
      
      // Sort by creation time (newest first)
      return locks.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('Failed to get all locks:', error)
      return []
    }
  }
  
  /**
   * Remove specific lock
   */
  static removeLock(address: string | PublicKey): void {
    try {
      const normalizedAddress = validateAndNormalizePublicKey(address).toString()
      const key = `${this.LOCK_PREFIX}${normalizedAddress}`
      localStorage.removeItem(key)
      
      console.log('StorageManager: Removed lock', { address: normalizedAddress })
      
      // Dispatch custom event for UI updates (browser only)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lockDataChanged', { 
          detail: { action: 'remove', address: normalizedAddress }
        }))
      }
    } catch (error) {
      console.error('Failed to remove lock data:', error)
    }
  }
  
  /**
   * Clear all locks
   */
  static clearAllLocks(): void {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.LOCK_PREFIX)) {
          keys.push(key)
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key))
      
      console.log('StorageManager: Cleared all locks', { count: keys.length })
      
      // Dispatch custom event for UI updates (browser only)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lockDataChanged', { 
          detail: { action: 'clear' }
        }))
      }
    } catch (error) {
      console.error('Failed to clear all locks:', error)
    }
  }
  
  /**
   * Get locks count
   */
  static getLocksCount(): number {
    return this.getAllLocks().length
  }
  
  /**
   * Get unlocked locks count
   */
  static getUnlockedLocksCount(): number {
    return this.getAllLocks().filter(lock => lock.isUnlocked).length
  }
}
