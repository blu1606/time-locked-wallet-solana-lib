import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TimeLockedWallet } from "../target/types/time_locked_wallet";
import {
  PublicKey,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";

describe("Event Emission Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
  const connection = provider.connection;

  let wallet: any;
  let eventListeners: number[] = [];

  before(async () => {
    wallet = provider.wallet;
    
    // Airdrop SOL for testing
    try {
      await connection.requestAirdrop(wallet.publicKey, 5 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Airdrop failed, assuming sufficient balance");
    }
  });

  afterEach(async () => {
    // Clean up event listeners after each test
    for (const listenerId of eventListeners) {
      try {
        await program.removeEventListener(listenerId);
      } catch (error) {
        console.log("Failed to remove listener:", listenerId);
      }
    }
    eventListeners = [];
  });

  describe("Account Closure Events", () => {
    it("Should emit AccountClosed event on withdrawAndCloseSol", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let eventReceived = false;
      let eventData: any = null;

      // 1. Set up event listener
      const listenerId = program.addEventListener('AccountClosed', (event, slot) => {
        eventReceived = true;
        eventData = event;
        console.log("📡 AccountClosed event received:", event);
      });
      eventListeners.push(listenerId);

      // 2. Create and fund account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Withdraw and close
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 5. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 6. Verify event was emitted
      expect(eventReceived).to.be.true;
      expect(eventData).to.not.be.null;
      expect(eventData.timeLockAccount.toString()).to.equal(timeLockAccount.toString());
      expect(eventData.owner.toString()).to.equal(wallet.publicKey.toString());
      expect(eventData.rentRefunded).to.be.greaterThan(0);
    });

    it("Should emit AccountClosed event on closeEmptyAccount", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let eventReceived = false;
      let eventData: any = null;

      // 1. Set up event listener
      const listenerId = program.addEventListener('AccountClosed', (event, slot) => {
        eventReceived = true;
        eventData = event;
        console.log("📡 AccountClosed event received:", event);
      });
      eventListeners.push(listenerId);

      // 2. Create empty account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Close empty account
      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 5. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 6. Verify event was emitted
      expect(eventReceived).to.be.true;
      expect(eventData).to.not.be.null;
      expect(eventData.timeLockAccount.toString()).to.equal(timeLockAccount.toString());
      expect(eventData.rentRefunded).to.be.greaterThan(0);
    });
  });

  describe("Rent Refund Events", () => {
    it("Should emit RentRefunded event with correct amount", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let rentEventReceived = false;
      let rentEventData: any = null;

      // 1. Set up event listener for rent refund
      const listenerId = program.addEventListener('RentRefunded', (event, slot) => {
        rentEventReceived = true;
        rentEventData = event;
        console.log("📡 RentRefunded event received:", event);
      });
      eventListeners.push(listenerId);

      // 2. Create account and measure rent
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const accountInfo = await connection.getAccountInfo(timeLockAccount);
      const rentAmount = accountInfo?.lamports || 0;

      // 3. Wait for unlock and close
      await new Promise(resolve => setTimeout(resolve, 35000));

      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 4. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Verify rent refund event
      expect(rentEventReceived).to.be.true;
      expect(rentEventData).to.not.be.null;
      expect(rentEventData.recipient.toString()).to.equal(wallet.publicKey.toString());
      expect(rentEventData.amount).to.equal(rentAmount);
    });
  });

  describe("Multiple Event Listeners", () => {
    it("Should handle multiple listeners for the same event", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let listener1Called = false;
      let listener2Called = false;
      let listener3Called = false;

      // 1. Set up multiple listeners
      const listenerId1 = program.addEventListener('AccountClosed', (event, slot) => {
        listener1Called = true;
        console.log("📡 Listener 1 received AccountClosed");
      });

      const listenerId2 = program.addEventListener('AccountClosed', (event, slot) => {
        listener2Called = true;
        console.log("📡 Listener 2 received AccountClosed");
      });

      const listenerId3 = program.addEventListener('AccountClosed', (event, slot) => {
        listener3Called = true;
        console.log("📡 Listener 3 received AccountClosed");
      });

      eventListeners.push(listenerId1, listenerId2, listenerId3);

      // 2. Create and close account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 35000));

      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Verify all listeners were called
      expect(listener1Called).to.be.true;
      expect(listener2Called).to.be.true;
      expect(listener3Called).to.be.true;
    });

    it("Should handle listener removal correctly", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let permanentListenerCalled = false;
      let removedListenerCalled = false;

      // 1. Set up listeners
      const permanentListenerId = program.addEventListener('AccountClosed', (event, slot) => {
        permanentListenerCalled = true;
        console.log("📡 Permanent listener called");
      });

      const removedListenerId = program.addEventListener('AccountClosed', (event, slot) => {
        removedListenerCalled = true;
        console.log("📡 Removed listener called");
      });

      eventListeners.push(permanentListenerId);

      // 2. Remove one listener immediately
      await program.removeEventListener(removedListenerId);

      // 3. Create and close account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 35000));

      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 4. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Verify only permanent listener was called
      expect(permanentListenerCalled).to.be.true;
      expect(removedListenerCalled).to.be.false;
    });
  });

  describe("Event Error Handling", () => {
    it("Should continue processing if event listener throws error", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let errorListenerCalled = false;
      let normalListenerCalled = false;

      // 1. Set up listeners - one that throws error, one normal
      const errorListenerId = program.addEventListener('AccountClosed', (event, slot) => {
        errorListenerCalled = true;
        throw new Error("Simulated listener error");
      });

      const normalListenerId = program.addEventListener('AccountClosed', (event, slot) => {
        normalListenerCalled = true;
        console.log("📡 Normal listener executed successfully");
      });

      eventListeners.push(errorListenerId, normalListenerId);

      // 2. Create and close account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 35000));

      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Both listeners should have been called despite error
      expect(errorListenerCalled).to.be.true;
      expect(normalListenerCalled).to.be.true;
    });
  });

  describe("Event Data Validation", () => {
    it("Should emit events with all required fields", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      let accountClosedEvent: any = null;
      let rentRefundedEvent: any = null;

      // 1. Set up comprehensive event listeners
      const accountClosedListenerId = program.addEventListener('AccountClosed', (event, slot) => {
        accountClosedEvent = event;
      });

      const rentRefundedListenerId = program.addEventListener('RentRefunded', (event, slot) => {
        rentRefundedEvent = event;
      });

      eventListeners.push(accountClosedListenerId, rentRefundedListenerId);

      // 2. Create account with deposit
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 2))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait and withdraw with close
      await new Promise(resolve => setTimeout(resolve, 35000));

      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 4. Wait for events
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Validate AccountClosed event fields
      expect(accountClosedEvent).to.not.be.null;
      expect(accountClosedEvent).to.have.property('timeLockAccount');
      expect(accountClosedEvent).to.have.property('owner');
      expect(accountClosedEvent).to.have.property('rentRefunded');
      expect(accountClosedEvent).to.have.property('fundsWithdrawn');

      // 6. Validate RentRefunded event fields
      expect(rentRefundedEvent).to.not.be.null;
      expect(rentRefundedEvent).to.have.property('recipient');
      expect(rentRefundedEvent).to.have.property('amount');

      // 7. Validate field values
      expect(accountClosedEvent.owner.toString()).to.equal(wallet.publicKey.toString());
      expect(accountClosedEvent.rentRefunded).to.be.greaterThan(0);
      expect(accountClosedEvent.fundsWithdrawn).to.equal(LAMPORTS_PER_SOL / 2);
      
      expect(rentRefundedEvent.recipient.toString()).to.equal(wallet.publicKey.toString());
      expect(rentRefundedEvent.amount).to.be.greaterThan(0);
    });
  });
});
