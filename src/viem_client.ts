import { createPublicClient, http, parseAbi, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { RANGE_LQTY_WETH } from "./helpers/constants.js";

export const viem_client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

///////////// GENERAL FUNCTIONS /////////////
export async function getBlockTimestamp(blockNumber: number) {
  return viem_client
    .getBlock({ blockNumber: parseUnits(blockNumber.toString(), 0) })
    .then((block) => block.timestamp);
}

export async function getCurrentBlock() {
  return viem_client.getBlock().then((block) => block.number);
}

export async function getERC20TokensDecimals(tokenAddresses: `0x${string}`[]) {
  return viem_client
    .multicall({
      contracts: tokenAddresses.map((address) => ({
        address,
        abi: parseAbi([
          // @ts-ignore
          "function decimals() external view returns (uint8)",
        ]),
        functionName: "decimals",
      })),
    })
    .then((results) => {
      if (results.find((r) => r.error)) {
        throw new Error("Invalid token");
      }
      return results.map((token) => Number(token.result));
    });
}
/////////////////////////////////////////////

///////////////// UniswapV3 /////////////////
const UniswapV3Factory = {
  address: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // mainnet
  abi: parseAbi([
    // @ts-ignore
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  ]),
};

const UniswapV3Pool = {
  abi: parseAbi([
    // @ts-ignore
    "function tickSpacing() external view returns (int24)",
    // @ts-ignore
    "function positions(bytes32 key) external view returns (uint128 _liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  ]),
};

export async function getPoolAddress(
  tokenA: string,
  tokenB: string,
  feeTier: number
) {
  return viem_client
    .readContract({
      ...UniswapV3Factory,
      // @ts-ignore
      functionName: "getPool",
      args: [tokenA, tokenB, feeTier],
    })
    .then((result) => (result as string).toLowerCase() as `0x${string}`);
}

export async function getPoolTickSpacing(address: `0x${string}`) {
  return viem_client
    .readContract({
      address,
      abi: UniswapV3Pool.abi,
      // @ts-ignore
      functionName: "tickSpacing",
    })
    .then((result) => result as number);
}

export async function getPositionInfo(
  address: `0x${string}`,
  positionId: `0x${string}` // bytes32 id
) {
  return viem_client
    .readContract({
      address,
      abi: UniswapV3Pool.abi,
      // @ts-ignore
      functionName: "positions",
      args: [positionId],
    })
    .then((result) => {
      let r = result as [bigint, bigint, bigint, bigint, bigint];
      return {
        liquidity: r[0],
        feeGrowthInside0LastX128: r[1],
        feeGrowthInside1LastX128: r[2],
        tokensOwed0: r[3],
        tokensOwed1: r[4],
      };
    });
}
/////////////////////////////////////////////

/////////////// Range Protocol //////////////
const RangeVault = {
  abi: parseAbi([
    // @ts-ignore
    "function lowerTick() external view returns (int24)",
    // @ts-ignore
    "function upperTick() external view returns (int24)",
    // @ts-ignore
    "function getPositionID() external view returns (bytes32)",
    // @ts-ignore
    "function pool() external view returns (address)",
  ]),
};

const Range_LQTY_WETH = {
  address: RANGE_LQTY_WETH,
  abi: RangeVault.abi,
} as const;

export async function getRange_LQTY_WETH_info() {
  const { lowerTick, upperTick, positionID, poolAddress } = await viem_client
    .multicall({
      contracts: [
        {
          ...Range_LQTY_WETH,
          // @ts-ignore
          functionName: "lowerTick",
        },
        {
          ...Range_LQTY_WETH,
          // @ts-ignore
          functionName: "upperTick",
        },
        {
          ...Range_LQTY_WETH,
          // @ts-ignore
          functionName: "getPositionID",
        },
        {
          ...Range_LQTY_WETH,
          // @ts-ignore
          functionName: "pool",
        },
      ],
    })
    .then((results) => {
      if (
        results[0].error ||
        results[1].error ||
        results[2].error ||
        results[3].error
      ) {
        throw new Error("Error requesting Range LQTY-WETH-0.3% Vault");
      }

      return {
        lowerTick: results[0].result as number,
        upperTick: results[1].result as number,
        positionID: results[2].result as `0x${string}`,
        poolAddress: results[3].result as `0x${string}`,
      };
    });
  const { liquidity } = await getPositionInfo(poolAddress, positionID);

  return { lowerTick, upperTick, liquidity };
}
/////////////////////////////////////////////
