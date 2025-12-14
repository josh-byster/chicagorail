# Testing Quick Start Guide

## Quick Commands

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode (auto-rerun on file changes)
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run with verbose output
pnpm test:verbose
```

## Test Structure

```
__tests__/
├── fixtures/
│   └── gtfs/                    # Real Metra GTFS snapshot data
├── setup/
│   └── testApp.ts               # Test Express app
├── utils/
│   └── testHelpers.ts           # Test utilities
├── unit/                        # Unit tests
│   ├── gtfsService.test.ts
│   ├── searchUtils.test.ts
│   └── timeUtils.test.ts
└── integration/                 # Integration tests
    ├── routes.test.ts
    ├── stops.test.ts
    └── health.test.ts
```

## Current Status

✅ **121 tests passing**
✅ **82% code coverage**
✅ **0 failing tests**

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import { YourService } from '../../src/services/yourService.js';

describe('YourService', () => {
  describe('yourMethod', () => {
    it('should do something', () => {
      const result = YourService.yourMethod();
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/testApp.js';

describe('Your API Endpoint', () => {
  const app = createTestApp();

  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/your-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## Key Testing Patterns

### Using Real GTFS Fixtures

```typescript
beforeAll(async () => {
  gtfsService = GTFSService.getInstance();
  (gtfsService as any).GTFS_DIR = GTFS_FIXTURES_DIR;
  await gtfsService.loadData();
});
```

### Testing with Fake Timers

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should format relative time', () => {
  jest.setSystemTime(new Date('2024-12-14T10:00:00Z'));
  // ... your test
});
```

### HTTP Testing with Supertest

```typescript
const response = await request(app)
  .get('/api/endpoint')
  .query({ param: 'value' })
  .expect('Content-Type', /json/)
  .expect(200);
```

## Common Issues

### Tests fail after code changes
1. Check if the change broke functionality
2. Update tests if behavior intentionally changed
3. Run with verbose: `pnpm test:verbose`

### GTFS data issues
1. Verify fixtures exist: `ls __tests__/fixtures/gtfs/`
2. Re-download if corrupted (see README.md)

### ESM module errors
1. Ensure imports use `.js` extension
2. Check `jest.config.js` has ESM settings
3. Verify `package.json` has `"type": "module"`

## Coverage Goals

- **Minimum**: 70% statement coverage
- **Target**: 80%+ statement coverage
- **Current**: 82.31% ✅

Run `pnpm test:coverage` to see detailed coverage report.

## CI/CD

Tests run automatically in CI/CD pipelines:
- No external dependencies
- Uses local GTFS fixtures
- Fast execution (~7 seconds)

## Before Committing

```bash
# Always run tests before committing
pnpm test

# Check coverage hasn't decreased
pnpm test:coverage
```

## Need Help?

- See `__tests__/README.md` for detailed documentation
- See `TEST_SUMMARY.md` for comprehensive overview
- Check existing tests for examples

## Test Files by Feature

| Feature | Unit Tests | Integration Tests |
|---------|-----------|-------------------|
| GTFS Service | `unit/gtfsService.test.ts` | - |
| Search | `unit/searchUtils.test.ts` | `integration/stops.test.ts` |
| Time Utils | `unit/timeUtils.test.ts` | - |
| Routes API | - | `integration/routes.test.ts` |
| Stops API | - | `integration/stops.test.ts` |
| Health Check | - | `integration/health.test.ts` |

## Pro Tips

1. **Use watch mode** during development: `pnpm test:watch`
2. **Run specific test file**: `pnpm test gtfsService`
3. **Filter tests by name**: `pnpm test -t "should return routes"`
4. **Update snapshots** if needed: `pnpm test -u`
5. **Debug tests** in VS Code with Jest extension

Happy testing! 🧪
