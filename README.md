# Time-Locked Wallet - Complete Project Structure

## 📁 Root Structure

```
time-locked-wallet/
├── programs/                           # Anchor program (Rust)
│   └── time-locked-wallet/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs                  # Main program entry
│           ├── state.rs                # Account structures
│           ├── security.rs             # Security validations
│           ├── utils.rs                # Utility functions
│           ├── errors.rs               # Custom errors
│           └── instructions/           # Instruction modules
│               ├── mod.rs
│               ├── sol.rs              # SOL operations
│               ├── token.rs            # SPL token operations
│               └── admin.rs            # Admin functions
├── packages/                           # Library packages
│   ├── core/                          # Core TypeScript client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts               # Main exports
│   │   │   ├── client.ts              # Main client class
│   │   │   ├── types.ts               # Type definitions
│   │   │   ├── constants.ts           # Program constants
│   │   │   ├── utils.ts               # Client utilities
│   │   │   ├── builders/              # Instruction builders
│   │   │   │   ├── index.ts
│   │   │   │   ├── sol-lock.ts
│   │   │   │   └── token-lock.ts
│   │   │   └── instructions/          # Instruction helpers
│   │   │       ├── index.ts
│   │   │       ├── sol.ts
│   │   │       ├── token.ts
│   │   │       └── admin.ts
│   │   └── tests/
│   │       ├── client.test.ts
│   │       └── builders.test.ts
│   ├── react/                         # React integration
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts               # Main exports
│   │   │   ├── provider.tsx           # Context provider
│   │   │   ├── hooks/                 # React hooks
│   │   │   │   ├── index.ts
│   │   │   │   ├── useLockCreation.ts
│   │   │   │   ├── useLockInfo.ts
│   │   │   │   ├── useUserLocks.ts
│   │   │   │   └── useWithdraw.ts
│   │   │   ├── components/            # UI components
│   │   │   │   ├── index.ts
│   │   │   │   ├── LockCreationForm.tsx
│   │   │   │   ├── LockInfoCard.tsx
│   │   │   │   ├── LocksList.tsx
│   │   │   │   └── WithdrawButton.tsx
│   │   │   └── utils/
│   │   │       ├── formatters.ts
│   │   │       └── validators.ts
│   │   └── tests/
│   │       ├── hooks.test.tsx
│   │       └── components.test.tsx
│   ├── cli/                           # Command line interface
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── bin/
│   │   │   └── tlw                    # CLI entry script
│   │   ├── src/
│   │   │   ├── index.ts               # CLI main
│   │   │   ├── commands/              # CLI commands
│   │   │   │   ├── index.ts
│   │   │   │   ├── create-lock.ts
│   │   │   │   ├── withdraw.ts
│   │   │   │   ├── list-locks.ts
│   │   │   │   └── admin.ts
│   │   │   └── utils/
│   │   │       ├── config.ts
│   │   │       └── output.ts
│   │   └── tests/
│   │       └── commands.test.ts
│   └── testing/                       # Testing utilities
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── mock-client.ts
│       │   ├── test-helpers.ts
│       │   └── fixtures.ts
│       └── tests/
│           └── testing.test.ts
├── examples/                          # Example applications
│   ├── basic-react/                   # Simple React demo
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   └── public/
│   ├── nextjs-demo/                   # Next.js integration
│   │   ├── package.json
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   ├── vanilla-js/                    # Pure JavaScript example
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   └── node-backend/                  # Node.js backend example
│       ├── package.json
│       ├── src/
│       │   ├── server.ts
│       │   └── routes/
│       └── types/
├── tests/                             # Integration tests
│   ├── anchor/
│   │   └── enhanced-tests.ts
│   └── e2e/
│       ├── package.json
│       └── specs/
├── docs/                              # Documentation
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   ├── EXAMPLES.md
│   └── MIGRATION_GUIDE.md
├── scripts/                           # Build & deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── test.sh
│   └── publish.sh
├── .github/                           # GitHub workflows
│   └── workflows/
│       ├── ci.yml
│       ├── publish.yml
│       └── docs.yml
├── Anchor.toml                        # Anchor configuration
├── package.json                       # Root package.json
├── tsconfig.json                      # Root TypeScript config
├── lerna.json                         # Monorepo configuration
└── README.md                          # Main README
```
