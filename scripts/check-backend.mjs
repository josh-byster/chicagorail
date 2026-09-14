import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const base = (process.argv[2] || 'https://api.chicagorail.app/api').replace(/\/$/, '');
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

async function get(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15_000) });
  assert(response.ok, `${path} returned HTTP ${response.status}`);
  assert(response.headers.get('content-type')?.includes('application/json'), `${path} did not return JSON`);
  return response.json();
}

// The health endpoint alone also succeeds on old deployments. Exercise the
// feature endpoint in both directions to catch a frontend/backend mismatch.
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    assert.equal((await get('/health')).status, 'ok');
    for (const field of ['from', 'to']) {
      const result = await get(`/stops/NBROOK/connections?field=${field}&date=${date}`);
      assert.equal(result.stop?.stop_id, 'NBROOK');
      assert(Array.isArray(result.stops) && result.stops.length > 0, 'Missing station list');
      assert(Array.isArray(result.eligibleStopIds), 'Missing eligibility list');
      const ids = new Set(result.stops.map(stop => stop.stop_id));
      assert(result.eligibleStopIds.every(id => typeof id === 'string' && ids.has(id) && id !== 'NBROOK'), 'Invalid eligible station');
      console.log(`${field}: verified ${result.stops.length} stations and ${result.eligibleStopIds.length} connections`);
    }
    console.log('Production backend health and station connections verified.');
    break;
  } catch (error) {
    console.error(`Verification attempt ${attempt}/6: ${error.message}`);
    if (attempt === 6) throw error;
    await setTimeout(5_000);
  }
}
