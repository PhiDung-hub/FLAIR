import { cachePool } from "../stores.js";
import {
  getERC20TokensDecimals,
  getPoolAddress,
  getPoolTickSpacing,
} from "../viem_client.js";
import { LQTY, WETH } from "../helpers/constants.js";

async function main() {
  const token0 = LQTY;
  const token1 = WETH;
  const feeTier = 3000;

  const address = await getPoolAddress(token0, token1, feeTier);
  const tickSpacing = await getPoolTickSpacing(address);
  const [decimals0, decimals1] = await getERC20TokensDecimals([token0, token1]);

  await cachePool({
    decimals0,
    decimals1,
    token0,
    token1,
    feeTier: feeTier,
    address,
    tickSpacing,
    name: "LQTY-WETH-0.3%",
  });
}
main();
