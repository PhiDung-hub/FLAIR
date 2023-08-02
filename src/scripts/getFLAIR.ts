import { computeFLAIR_Exact, computeFLAIR_Estimate } from "../flair/index.js";
import { startInRangePosition } from "../position.js";
import { LQTY, USDC, WETH } from "../helpers/constants.js";
import { retrievePool } from "../stores.js";

async function main() {
  const START_BLOCK = 17456800;
  const END_BLOCK = 17593300;
  const targetPool = await retrievePool({
    token1: WETH,
    token0: USDC,
    feeTier: 500,
    // token0: LQTY,
    // feeTier: 3000,
  });
  if (!targetPool) {
    throw new Error("Pool is not initialized");
  }
  const { address } = targetPool;
  const position = await startInRangePosition(
    { fromBlock: START_BLOCK, toBlock: END_BLOCK },
    address as `0x${string}`,
    20,
    20,
    10
  );
  console.log(`Position: `, position, `\n`);
  // const estimated_flair = await computeFLAIR_Estimate(position);
  // console.log(`FLAIR estimate: `, estimated_flair, `\n`);
  const exact_flair = await computeFLAIR_Exact(position);
  console.log(`FLAIR exact:`, exact_flair, `\n`);
}
main();
