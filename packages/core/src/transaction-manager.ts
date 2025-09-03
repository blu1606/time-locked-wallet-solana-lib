import { Connection, TransactionSignature } from '@solana/web3.js'

export interface TransactionToastMessages {
  sent?: string
  confirmed?: string
  failed?: string
}

export interface TransactionResult {
  signature: TransactionSignature
  confirmed: boolean
  error?: Error
}

/**
 * Enhanced transaction manager với lifecycle management
 */
export class TransactionManager {
  constructor(private connection: Connection) {}

  /**
   * Handle complete transaction lifecycle với proper error handling
   */
  async handleTransaction(
    transactionPromise: Promise<TransactionSignature>,
    messages?: TransactionToastMessages
  ): Promise<TransactionSignature> {
    try {
      console.log('TransactionManager: Starting transaction...', messages?.sent)
      
      const signature = await transactionPromise
      
      console.log('TransactionManager: Transaction sent', { 
        signature,
        message: messages?.sent || 'Transaction sent'
      })
      
      // Wait for confirmation với timeout
      const latestBlockhash = await this.connection.getLatestBlockhash()
      const confirmation = await this.connection.confirmTransaction({
        signature,
        ...latestBlockhash
      }, 'confirmed')

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`)
      }

      console.log('TransactionManager: Transaction confirmed', { 
        signature,
        message: messages?.confirmed || 'Transaction confirmed'
      })
      
      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('TransactionManager: Transaction failed', { 
        error: errorMessage,
        message: messages?.failed || 'Transaction failed'
      })
      throw error
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(signature: string) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      })
      return transaction
    } catch (error) {
      console.error('Failed to get transaction details:', error)
      return null
    }
  }

  /**
   * Wait for transaction confirmation với retry logic
   */
  async waitForConfirmation(
    signature: string, 
    maxRetries: number = 30,
    retryInterval: number = 1000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const status = await this.connection.getSignatureStatus(signature)
        
        if (status.value?.confirmationStatus === 'confirmed' || 
            status.value?.confirmationStatus === 'finalized') {
          return true
        }
        
        if (status.value?.err) {
          throw new Error(`Transaction failed: ${status.value.err}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, retryInterval))
      } catch (error) {
        console.error(`Confirmation attempt ${i + 1} failed:`, error)
        if (i === maxRetries - 1) throw error
      }
    }
    
    throw new Error('Transaction confirmation timeout')
  }
}
