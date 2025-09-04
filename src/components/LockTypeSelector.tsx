import React from 'react';

export interface LockType {
  id: 'self-lock' | 'send-to-others';
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

interface LockTypeSelectorProps {
  lockTypes: LockType[];
  selectedLockType: LockType;
  onLockTypeSelect: (lockType: LockType) => void;
}

const LockTypeSelector: React.FC<LockTypeSelectorProps> = ({
  lockTypes,
  selectedLockType,
  onLockTypeSelect,
}) => {
  return (
    <div className="space-y-3">
      {lockTypes.map((lockType) => (
        <div
          key={lockType.id}
          className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
            selectedLockType.id === lockType.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          } ${!lockType.available ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => lockType.available && onLockTypeSelect(lockType)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {lockType.name}
                </h3>
                {!lockType.available && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {lockType.description}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedLockType.id === lockType.id
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300 dark:border-gray-600'
                } ${!lockType.available ? 'opacity-50' : ''}`}
              >
                {selectedLockType.id === lockType.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LockTypeSelector;
