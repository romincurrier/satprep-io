// Compatibility export for callers that already import diagnostic-blueprint.js.
// The planner itself is pure and requires an explicit bank so server/runtime imports
// cannot pull committed diagnostic prompts or answer keys into the secure dependency graph.
export {buildDiagnosticPlan,validateDiagnosticPlan} from './diagnostic-plan-core.js';
