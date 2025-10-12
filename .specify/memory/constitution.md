<!--
SYNC IMPACT REPORT
==================
Version Change: [template] → 1.0.0
Type: INITIAL CONSTITUTION

Principles Defined:
- I. Code Quality Standards (new)
- II. Testing Standards (new)
- III. User Experience Consistency (new)
- IV. Performance Requirements (new)

Sections Added:
- Core Principles (4 principles defined)
- Development Workflow
- Quality Gates
- Governance

Templates Status:
- .specify/templates/plan-template.md: ✅ Updated - Constitution Check section now includes specific principle checklist
- .specify/templates/spec-template.md: ✅ Reviewed - User scenarios support UX consistency principle
- .specify/templates/tasks-template.md: ✅ Reviewed - Test-first phases align with Testing Standards principle
- .specify/templates/checklist-template.md: ✅ Reviewed - Generic template, no changes needed
- .specify/templates/agent-file-template.md: ✅ Reviewed - Generic template, no changes needed

Follow-up TODOs:
- None (all placeholders filled)

Rationale:
- Initial constitution creation (1.0.0)
- Four focused principles covering code quality, testing, UX, and performance
- Today (2025-10-11) used for both ratification and amendment dates
-->

# New Metra Constitution

## Core Principles

### I. Code Quality Standards

All code MUST meet the following quality requirements:

- **Readability First**: Code MUST be self-documenting with clear naming conventions. Comments explain "why", not "what".
- **Single Responsibility**: Functions and modules MUST have one clear purpose. If it does multiple things, it must be refactored.
- **DRY (Don't Repeat Yourself)**: Duplicate logic MUST be extracted into reusable functions or modules.
- **Type Safety**: Projects using typed languages MUST leverage type systems fully. No `any` types or unchecked casts without explicit justification.
- **Linting & Formatting**: All code MUST pass automated linting and formatting checks before commit. No exceptions.
- **Code Review**: All changes MUST be reviewed by at least one other developer before merging.

**Rationale**: High code quality reduces bugs, improves maintainability, and accelerates development velocity over time. Poor quality code creates technical debt that compounds exponentially.

### II. Testing Standards (NON-NEGOTIABLE)

Testing is mandatory and MUST follow these standards:

- **Test-First Development**: For new features, tests MUST be written before implementation. Tests must fail first, then pass after implementation (Red-Green-Refactor).
- **Coverage Requirements**:
  - Critical paths (authentication, payment, data integrity): MUST have 100% coverage
  - Business logic: MUST have ≥80% coverage
  - UI components: MUST have integration tests for primary user journeys
- **Test Pyramid**:
  - Unit tests (70%): Fast, isolated tests for individual functions/methods
  - Integration tests (20%): Test interactions between modules/services
  - E2E tests (10%): Test complete user workflows
- **Test Quality**: Tests MUST be deterministic (no flaky tests), fast (<5s for unit tests), and maintainable (clear arrange-act-assert structure).
- **CI/CD Integration**: All tests MUST run automatically on every commit. Failing tests block merges.

**Rationale**: Comprehensive testing catches bugs early, enables confident refactoring, serves as living documentation, and reduces production incidents. Test-first development ensures testability by design.

### III. User Experience Consistency

All user-facing features MUST maintain consistency:

- **Design System Compliance**: All UI components MUST use the established design system. No one-off styles without explicit design approval.
- **Accessibility Standards**: MUST meet WCAG 2.1 Level AA requirements:
  - Keyboard navigation for all interactive elements
  - Screen reader compatibility
  - Sufficient color contrast (4.5:1 for text)
  - Clear focus indicators
- **Responsive Design**: All interfaces MUST work seamlessly across desktop, tablet, and mobile viewports.
- **Error Handling UX**:
  - Users MUST receive clear, actionable error messages (no technical jargon)
  - Loading states MUST be shown for operations >200ms
  - Success feedback MUST be provided for all user actions
- **User Journey Testing**: Each feature MUST have documented user journeys with acceptance criteria tested before release.

**Rationale**: Consistent UX builds user trust, reduces support burden, improves accessibility for all users, and creates a professional product experience.

### IV. Performance Requirements

All features MUST meet these performance standards:

- **Response Time Targets**:
  - API endpoints: p95 <200ms for reads, <500ms for writes
  - Page load time: Initial load <2s, interactive <3s
  - UI interactions: Feedback within 100ms (perceived as instant)
- **Resource Constraints**:
  - Memory: No memory leaks; monitor and optimize for <100MB overhead
  - Bundle size: Frontend bundles <500KB gzipped (excluding heavy assets)
  - Database queries: N+1 queries prohibited; use eager loading and indexing
- **Scalability**:
  - Services MUST handle 10x current load without degradation
  - Implement pagination for lists >100 items
  - Use caching strategies for frequently accessed data
- **Performance Monitoring**:
  - All critical paths MUST have performance metrics tracked
  - Alerts MUST fire for p95 latency exceeding targets
  - Performance regressions MUST be caught in CI before merge

**Rationale**: Performance directly impacts user satisfaction, conversion rates, and operational costs. Performance problems are exponentially harder to fix after launch than during development.

## Development Workflow

### Branch Strategy
- `main` branch MUST always be deployable
- Feature branches: `feature/###-description` (### = issue/ticket number)
- Hotfix branches: `hotfix/###-description`
- All branches MUST be short-lived (<3 days before merge or rebase)

### Commit Standards
- Commits MUST follow Conventional Commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Commit messages MUST be clear and descriptive (explain the "why")

### Pull Request Requirements
- PR description MUST link to issue/ticket and explain changes
- All CI checks MUST pass (tests, linting, type checking, performance benchmarks)
- At least one approved review required
- No merge conflicts
- Branch MUST be up-to-date with `main`

## Quality Gates

Before any feature is considered complete, it MUST pass these gates:

1. **Code Quality Gate**:
   - All linting and formatting checks pass
   - No code smells flagged by static analysis
   - Code review approved

2. **Testing Gate**:
   - All tests pass (unit, integration, E2E)
   - Coverage requirements met
   - No flaky tests introduced

3. **UX Gate**:
   - Design system compliance verified
   - Accessibility audit passed
   - User journeys tested and documented

4. **Performance Gate**:
   - Response time targets met
   - Resource constraints satisfied
   - Performance metrics within bounds

5. **Documentation Gate**:
   - User-facing features documented
   - API changes reflected in documentation
   - README updated if setup/usage changes

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guidelines. When conflicts arise, the constitution takes precedence.

### Amendment Process
1. Amendments MUST be proposed via written proposal explaining:
   - Current problem with existing principles
   - Proposed change and rationale
   - Impact on existing projects
   - Migration plan if backward incompatible
2. Amendments require approval from project leads/architecture team
3. Version MUST be bumped according to semantic versioning:
   - MAJOR: Backward incompatible changes (removing/redefining principles)
   - MINOR: Adding new principles or expanding guidance
   - PATCH: Clarifications, wording improvements, typo fixes
4. All dependent templates and documentation MUST be updated

### Compliance Review
- All pull requests MUST verify compliance with constitutional principles
- Violations MUST be justified in writing and approved by project leads
- Recurring violations trigger architecture review and potential refactoring

### Complexity Justification
Any deviation from these principles MUST be explicitly justified:
- Document the specific constraint or requirement necessitating the deviation
- Explain why simpler alternatives following principles were rejected
- Get explicit approval from project leads
- Add technical debt ticket to revisit and potentially refactor

**Version**: 1.0.0 | **Ratified**: 2025-10-11 | **Last Amended**: 2025-10-11
