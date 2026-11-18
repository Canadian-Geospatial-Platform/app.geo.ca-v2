# Repository instructions

## Changes and implementation

- Make focused changes that address the request. Preserve unrelated work and avoid
  opportunistic refactoring.
- Prefer proper types and runtime guards over `any`, unsafe casts, or non-null assertions.
- Follow existing error-reporting patterns; do not silently swallow failures.
- Clean up subscriptions, timers, and event listeners when their owner is destroyed.
  Keep request-specific state isolated.
- Reuse existing helpers, dependencies, and tooling. Add dependencies only when justified.
- When changing UI, preserve accessible labels, keyboard interaction, focus handling,
  and loading/error feedback.

## Language and translations

- Follow the [developer guide translation conventions](../DEVELOPMENT.md#translations), including
  language-code distinctions, translation-variable naming, and catalogue structure.
  Keep the developer guide as the source of truth rather than duplicating those rules here.
- Reuse the existing [language helpers](../packages/web-app/src/lib/utils/language.ts)
  and [translation helpers](../packages/web-app/src/lib/i18n/index.ts). Do not introduce
  parallel language normalization or translation-selection logic.
- Preserve external field names and payload contracts when renaming local bindings.
- Preserve Svelte reactivity when changing language-dependent values. Do not write
  request-specific state into shared module-level stores during server rendering.
- When changing catalogue structure or helper contracts, find and update every
  affected consumer, test, and documentation reference. Check for remaining old usages.

## JSDoc and comments

- Add JSDoc to exported helpers and non-obvious contracts. Document relevant inputs,
  return values, side effects, and thrown errors without restating TypeScript types.
- Update JSDoc when signatures or behavior change.
- Use comments to explain intent, constraints, or surprising behavior, not obvious code.
  Avoid redundant comments, section headings, and trivial JSDoc.
- Remove or revise stale comments when changing nearby code.
- Make TODOs actionable by identifying the remaining work and linking a relevant
  issue when one exists.

## Validation and reporting

- Use the existing checks and focused tests described in the
  [test guide](../packages/web-app/src/lib/tests/README.md).
- Add focused regression tests for behavior introduced or fixed by a change; avoid
  tests that merely repeat implementation details.
- For translation changes, verify catalogue key/type/placeholder parity and relevant
  language-switching behavior using the existing tests.
- Report the checks actually run and any remaining warnings explicitly. Distinguish
  pre-existing warnings from new ones; a passing command does not mean there are no warnings.
- These instructions guide AI contributions; do not describe a convention as
  automatically enforced unless an existing lint rule or test actually enforces it.
