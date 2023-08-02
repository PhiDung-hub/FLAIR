# V3 Pool Metrics calculation

This repo provides script to calculate [Fee Liquidity-Adjusted Instantaneous Returns (FLAIR)](https://uniswap.org/flair.pdf).

# Get started

## Environments

**Use [Node.js](https://nodejs.org/en) 18.x**

1. Install [pnpm](https://pnpm.io/installation) or just use with npm.
2. Install deps:

```bash
pnpm install
```

3. Copy `.env.example` to `.env` then start prisma

```bash
pnpm prisma generate
```

4. Download demo database at: [drive](https://drive.google.com/drive/folders/1HoPuV1rmfWyMdfHxYclsz0Ww2j-3s49q) and place in `prisma/`.

_NOTE_

- Demo database at `prisma/dev.db`, contains necessary data to run scripts with variables specified in this script
- Use another database path -> change `DATABASE_URL` in `.env`

# Scripts

1. Cleaner - `scripts/clean.ts`: Clean database, run with `-h` for more information.
1. Cleaner - `scripts/extractCSV.ts`: Extract schemas as csv to "csv" folder, run with `-h` for more information.
1. Block data collection - `scripts/fetchBlocks.ts`: Cache block info for FLAIR calculations, run with `-h` for more information.
1. Pool states collection - `scripts/fetchPoolState.ts`: Collect pool & tick data (default USDC-WETH-0.05%), run with `-h` for more information. Change pool in scripts
1. Swaps collection - `scripts/fetchSwapsData.ts`: Collect swaps data for a pool (default USDC-WETH-0.05%), run with `-h` for more information. Change pool in scripts
1. Pool data initializer - `scripts/initializePool.ts`: Cache a target pool in db, config params in script.
1. Example FLAIR calculation for a position - `scripts/getFLAIR.ts`: Config params in script. Data must be collected in advance.
1. Calculate FLAIR for RangeProtocol vaults - `scripts/FLAIR_Range/*.ts`: Details in scripts. Data must be collected in advance.

## Run scripts

### Option 1: Use `tsc` and `node`

```bash
tsc # if typescript compiler globally installed
# OR
pnpm tsc
```

Then

```
node <script_file.js> [...options]
```

### Option 2: Use Node REPL such as `ts-node`

```bash
pnpm ts-node-esm <script_file.ts> [...options]
```

## Tests

See `"scripts"` in `package.json`

```bash
pnpm test
```

# Source code structures

- `src/*` - source code & sciprts for data collection and FLAIR calculations.
- `test/*` - Tests with matching `src` orders.

## Source code references

### Database

1. `src/stores.ts` - functions to interact with db through Prisma ORM.
2. `prisma/*` - Prisma config info.

Schemas Overview at `prisma/schema.prisma`

- `Block` - Store `block.timestamp` and `block.number`
- `Pool` - Store liquidity pool informations
- `PoolData` - An entry represents state of a pool at a specific block, indexed by `address`, `block.number`
- `TickData` - An entry represents state of a tick inside a pool at a specific block, indexed by `address`, `block.number`, `tickIdx`

### Clients

1. `src/viem_client.ts` - Interact with EVM chains through [viem.sh](https://viem.sh/docs/introduction.html)
2. `src/queries.ts` - Query UniswapV3 states through [v3-subgraph](https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3)
3. `reference_schema.graphql` - field description for subgraph client. Taken from [official v3-subgraph repo](https://github.com/Uniswap/v3-subgraph/blob/main/schema.graphql)

### Core logic

1. `src/position.ts` - Mock up liquidity provision positions.
2. `src/flair/exact.ts` - Calculate exact FLAIR for a given position, use all swaps and states of the pool.
3. `src/flair/estimate.ts` - Estimate FLAIR for a given position, position fee estimated by constant weighted volume, done block by block.

### Helpers

1. `src/helpers/constants.ts` - V3 and network (only Ethereum mainnet for now) constants.
2. `src/helpers/tickProcessing.ts` - Process raw ticks data to get actual liquidity activated.
3. `src/helpers/v3_math.ts` - Utilities for pricing and liquidity calculations

# Test Coverage

```
src
├── flair
│   ├── exact.ts [✓]
│   ├── estimate.ts [✓]
├── helpers
│   ├── constants.ts [N/A]
│   ├── tickProcessing.ts [✓]
│   └── v3_math.ts [✓]
├── scripts
│   ├── clean.ts [Manual]
│   ├── fetchBlocks.ts [Manual]
│   ├── fetchPoolState.ts [Manual]
│   ├── getFLAIR.ts [Manual]
│   └── initializePool.ts [Manual]
├── position.ts [✓]
├── queries.ts [✓]
├── stores.ts [Manual]
└── viem_client.ts [✓]
```
