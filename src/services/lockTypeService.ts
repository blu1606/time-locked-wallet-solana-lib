import { LockType } from '../components/LockTypeSelector';

export class LockTypeService {
  private static readonly LOCK_TYPES: LockType[] = [
    {
      id: 'self-lock',
      name: 'Self-Lock',
      description: 'Lock your tokens and withdraw to your wallet when unlocked',
      icon: '',
      available: true,
    },
    {
      id: 'send-to-others',
      name: 'Send to Others',
      description: 'Send tokens to others with time-lock (coming soon)',
      icon: '',
      available: false,
    },
  ];

  static getDefaultLockTypes(): LockType[] {
    return this.LOCK_TYPES;
  }

  static getSelfLockType(): LockType {
    return this.LOCK_TYPES.find(lockType => lockType.id === 'self-lock')!;
  }

  static getSendToOthersType(): LockType {
    return this.LOCK_TYPES.find(lockType => lockType.id === 'send-to-others')!;
  }
}
