/**
 * API Route Testing Script
 * Tests the API route protection and response formats
 *
 * Run with: npx ts-node scripts/test-api.ts
 * Or add to package.json: "test:api": "ts-node scripts/test-api.ts"
 */

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  details: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail', details: string) {
  results.push({ name, status, details });
  const icon = status === 'pass' ? '✓' : '✗';
  console.log(`${icon} ${name}: ${details}`);
}

async function testEndpoint(
  method: string,
  path: string,
  headers?: Record<string, string>,
  body?: any
) {
  try {
    const url = `http://localhost:3000${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    throw error;
  }
}

async function runTests() {
  console.log('\n🧪 Testing API Route Protection\n');
  console.log('Make sure your development server is running on port 3000\n');

  // Test 1: GET /api/config without auth (should return 401)
  console.log('Test 1: GET /api/config without authentication');
  try {
    const result = await testEndpoint('GET', '/api/config');
    if (result.status === 401 && result.data.error === 'Unauthorized') {
      addResult(
        'Unauthenticated config GET',
        'pass',
        'Returned 401 Unauthorized'
      );
    } else {
      addResult(
        'Unauthenticated config GET',
        'fail',
        `Expected 401, got ${result.status}`
      );
    }
  } catch (error) {
    addResult(
      'Unauthenticated config GET',
      'fail',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Test 2: GET /api/shopify/collections without auth (should return 401)
  console.log('\nTest 2: GET /api/shopify/collections without authentication');
  try {
    const result = await testEndpoint('GET', '/api/shopify/collections');
    if (result.status === 401 && result.data.error === 'Sign in again to load your collections.') {
      addResult(
        'Unauthenticated collections GET',
        'pass',
        'Returned 401 Unauthorized'
      );
    } else {
      addResult(
        'Unauthenticated collections GET',
        'fail',
        `Expected 401, got ${result.status}`
      );
    }
  } catch (error) {
    addResult(
      'Unauthenticated collections GET',
      'fail',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Test 3: POST /api/config without auth (should return 401)
  console.log('\nTest 3: POST /api/config without authentication');
  try {
    const result = await testEndpoint('POST', '/api/config', {}, {});
    if (result.status === 401 && result.data.error === 'Unauthorized') {
      addResult('Unauthenticated config POST', 'pass', 'Returned 401 Unauthorized');
    } else {
      addResult(
        'Unauthenticated config POST',
        'fail',
        `Expected 401, got ${result.status}`
      );
    }
  } catch (error) {
    addResult(
      'Unauthenticated config POST',
      'fail',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => console.log(`  - ${r.name}: ${r.details}`));
  }

  return failed === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
