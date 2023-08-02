import { MIN_TICK, MAX_TICK } from "./constants.js";
import keyBy from "lodash.keyby";

// NOTE: Part of code taken from Uniswap v3-info: https://github.com/Uniswap/v3-info/blob/master/src/data/pools/tickData.ts#L158
export interface TickProcessed {
  liquidityGross: bigint;
  liquidityNet: bigint;
  tickIdx: number;
  liquidityActive: bigint;
}

enum Direction {
  ASC,
  DESC,
}

// tick returned from GQL, parsed with typescript types.
interface Tick {
  tickIdx: number;
  liquidityGross: bigint;
  liquidityNet: bigint;
}

export function processAllTicks(
  activeTickProcessed: TickProcessed,
  rawTicks: Tick[],
  tickSpacing: number
) {
  const lowerTicks: Tick[] = [];
  const upperTicks: Tick[] = [];
  const activeTickIdx = activeTickProcessed.tickIdx;

  rawTicks.forEach((tick) => {
    if (tick.tickIdx > activeTickIdx) {
      upperTicks.push(tick);
    } else if (tick.tickIdx < activeTickIdx) {
      lowerTicks.push(tick);
    }
  });

  const processedLowerTicks = processSurroundingTicks(
    activeTickProcessed,
    lowerTicks,
    tickSpacing,
    lowerTicks.length,
    Direction.DESC
  );
  const processedUpperticks = processSurroundingTicks(
    activeTickProcessed,
    upperTicks,
    tickSpacing,
    upperTicks.length,
    Direction.ASC
  );
  return [...processedLowerTicks, activeTickProcessed, ...processedUpperticks];
}

// Computes the numSurroundingTicks above or below the active tick.
function processSurroundingTicks(
  activeTickProcessed: TickProcessed,
  rawTicks: Tick[],
  tickSpacing: number,
  numSurroundingTicks: number,
  direction: Direction
) {
  let previousTickProcessed: TickProcessed = activeTickProcessed;
  let processedTicks: TickProcessed[] = [];
  const tickIdxToInitializedTick = keyBy(rawTicks, "tickIdx");

  // Iterate outwards (UP/DOWN) from the active tick and build active liquidity for every tick.
  for (let i = 0; i < numSurroundingTicks; i++) {
    const tickIdx =
      direction === Direction.ASC
        ? previousTickProcessed.tickIdx + tickSpacing
        : previousTickProcessed.tickIdx - tickSpacing;

    if (tickIdx < MIN_TICK || tickIdx > MAX_TICK) {
      break;
    }

    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tickIdx: tickIdx,
      liquidityNet: BigInt(0),
      liquidityGross: BigInt(0),
    };

    // Check if there is an initialized tick at our current tick.
    // If so copy the gross and net liquidity from the initialized tick.
    const currentInitializedTick = tickIdxToInitializedTick[tickIdx.toString()];

    if (currentInitializedTick) {
      currentTickProcessed.liquidityGross =
        currentInitializedTick.liquidityGross;
      currentTickProcessed.liquidityNet = currentInitializedTick.liquidityNet;
    }

    // Update the active liquidity.
    if (direction === Direction.ASC && currentInitializedTick) {
      // If ascending and found an initialized tick => immediately apply it to the current processed tick.
      currentTickProcessed.liquidityActive +=
        currentInitializedTick.liquidityNet;
      if (currentTickProcessed.liquidityActive < 0) {
        const msg = `Liquidity amount can't be negative: ${previousTickProcessed.liquidityActive} + ${currentTickProcessed.liquidityNet}`;
        throw new Error(msg);
      }
    } else if (
      direction === Direction.DESC &&
      previousTickProcessed.liquidityNet !== 0n
    ) {
      // Look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive -=
        previousTickProcessed.liquidityNet;
      if (currentTickProcessed.liquidityActive < 0) {
        const msg = `Liquidity amount can't be negative: ${previousTickProcessed.liquidityActive} - ${previousTickProcessed.liquidityNet}`;
        throw new Error(msg);
      }
    }

    processedTicks.push(currentTickProcessed);
    previousTickProcessed = currentTickProcessed;
  }

  if (direction === Direction.DESC) {
    processedTicks = processedTicks.reverse();
  }

  return processedTicks;
}
