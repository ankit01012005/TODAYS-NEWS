import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/// eslint-config-next 16.x ships native flat-config arrays (see its
/// package.json `exports`) — no FlatCompat bridge needed. Using
/// FlatCompat.extends() on an already-flat config was the cause of a
/// "Converting circular structure to JSON" crash from @eslint/eslintrc's
/// legacy config validator, which doesn't expect a plugin object that
/// references itself in its own `configs`.
/// The Anvay design handoff (wireframes + their runtime) is a design
/// reference, not source — never linted, never built.
const eslintConfig = [
  { ignores: ["Anvay Frontend Wireframe3/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
