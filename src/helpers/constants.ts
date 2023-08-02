// SUBGRAPHS
export const V3_SUBGRAPH =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";

// ETHERSCAN
export const ETHERSCAN_BASE_URL = "https://api.etherscan.io";

export const RANGE_SUBGRAPH =
  "https://api.thegraph.com/subgraphs/name/0xbateman/ethereum-uniswap";

// Uniswap V3
export const POSITION_MANAGER = "0xc36442b4a4522e871399cd717abdd847ab11fe88";
export const V3_INCREASE_LIQUIDITY_SIGNATURE =
  "0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f";
export const V3_DECREASE_LIQUIDITY_SIGNATURE =
  "0x26f6a048ee9138f2c0ce266f322cb99228e8d619ae2bff30c67f8dcf9d2377b4";
export const V3_MINT_SIGNATURE =
  "0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde";
export const V3_BURN_SIGNATURE =
  "0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c";

// MAIN NET
export const MERGE_BLOCK = 15537395; // for time delta
export const V3_START_BLOCK = 12369621;

// Tokens
export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const stETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
export const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export const LQTY = "0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D";

// Ticks
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

// Range Vaults
export const RANGE_LQTY_WETH = "0x350d81a7733ee6b001966e0844a0ebb096fabf0f";
export const RANGE_USDC_WETH = "0x9ad8d0df2da118dce898b7f5bd9ab749c593a5d9";

// Range Vaults signature
export const RANGE_LIQUIDITY_ADDED_SIGNATURE =
  "0xfa715a0b1bc7287b5d3581c11478041b0455aad0c17361fc1e55fffbdd4b6c4f";
export const RANGE_LIQUIDITY_REMOVED_SIGNATURE =
  "0x6d7e1841bf97c0b736eafb2779459ba1e0af2305cead28a8e97533589ceb2f65";

// Top position from https://revert.finance
export const TOP_LQTY_WETH_POSITIONS = [366096, 506262, 453456];
export const TOP_USDC_WETH_POSITIONS = [520645, 515539];

// repo constants
export const LAST_INDEXED_BLOCK = 17680000;
