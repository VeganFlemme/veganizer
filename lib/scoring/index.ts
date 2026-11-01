// Scoring engine: pure TypeScript, no network, no Supabase. Receives data, returns results.
export * from "./types";
export { dishTotals, type TotalsOptions } from "./totals";
export { boostMainProtein, equalProteinFactor, scaleDish } from "./scale";
export { solveComplements, solveLinearProgram, type ComplementFood, type ComplementOptions, type ComplementResult, type LpConstraint } from "./complements";
export { amountBounds, judgeRanges, roundForUnit, verdictTotals, withoutSharedIngredients, type Range } from "./ranges";
export {
  compareDishes,
  type AnimalAdvantage,
  type Basis,
  type Comparison,
  type CompareOptions,
  type Conseil,
  type ConseilSource,
  type CriterionComparison,
  type Directions,
  type Group,
} from "./compare";
export {
  monetize,
  type MonetizationFactor,
  type MonetizationRule,
  type MonetizedValue,
  type MonetizeOptions,
} from "./monetize";
export {
  avoidedClimateCost,
  climateCostByYear,
  simulate,
  totalClimateCost,
  type Cumulative,
  type Simulation,
  type YearlyClimateCost,
} from "./simulate";
export {
  roundSignificant,
  scoreCategory,
  scoreIndicator,
  verdict,
  type CategoryScore,
  type CategoryWinner,
  type Direction,
  type IndicatorOutcome,
  type IndicatorScore,
  type IndicatorValues,
  type ScoreCategoryRule,
  type ScoreIndicatorRule,
  type ScoreOptions,
  type Verdict,
} from "./score";
export { proteinFamily, rankCandidates, type ProteinCandidate, type ProteinFamily, type ProteinTarget, type RankedCandidate } from "./proximity";
export { mainAnimalIngredient, substituteDish, type OtherRule, type SubstituteChange } from "./substitute";
