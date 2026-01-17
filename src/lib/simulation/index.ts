/**
 * POKKIT Simulation System
 *
 * Exports:
 * - Simulation engine (tick processing)
 * - World management
 */

export {
  processSimulationTick,
  type SimulationTickResult,
  type SimulationContext,
} from "./engine";

export {
  createWorld,
  initializeWorld,
  getDefaultWorldConfig,
  validateWorldConfig,
  isPresenceModeAvailable,
  calculateWorldStability,
  getWorldSummary,
} from "./world";
