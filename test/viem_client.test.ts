import { assert } from "chai";
import { describe, test } from "mocha";
import {
  getBlockTimestamp,
  getERC20TokensDecimals,
  getPoolAddress,
  getPoolTickSpacing,
} from "../src/viem_client.js";
import { WETH, USDC, LQTY, WBTC } from "../src/helpers/constants.js";

describe("Testing viem client for Ethereum mainnet", () => {
  test("Get pool address USDC/WETH-0.05%", async function(this) {
    this.timeout(5000);
    const USDC_WETH_5BIPS = await getPoolAddress(USDC, WETH, 500);
    assert.equal(USDC_WETH_5BIPS, "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640");
  });

  test("Get pools' tick spacing", async function(this) {
    this.timeout(5000);
    const USDC_WETH_5BIPS = await getPoolTickSpacing(
      "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    );
    assert.equal(USDC_WETH_5BIPS, 10);

    const USDC_WETH_30BIPS = await getPoolTickSpacing(
      "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
    );
    assert.equal(USDC_WETH_30BIPS, 60);
  });

  test("Get block timestamp", async function(this) {
    this.timeout(5000);
    const BLOCK_17593300 = await getBlockTimestamp(17593300);
    assert.equal(BLOCK_17593300, BigInt(1688142755));
  });

  test("Get token decimals", async function(this) {
    this.timeout(5000);
    const tokens = [USDC, WETH, LQTY, WBTC];
    const decimals = await getERC20TokensDecimals(tokens as `0x${string}`[]);
    assert.deepEqual(decimals, [6, 18, 18, 8]);
  });
});
