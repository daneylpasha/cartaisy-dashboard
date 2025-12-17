'use client';

import { useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

export default function NotificationTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => setResults([]);

  const runDiagnostic = async () => {
    clearLogs();
    setLoading(true);

    try {
      // Step 1: Check token storage
      addLog('=== Step 1: Checking Token Storage ===');
      const token = tokenStorage.getToken();
      const user = tokenStorage.getUser<{ storeId?: string; id?: string; email?: string }>();

      addLog(`Token exists: ${!!token}`);
      if (token) {
        addLog(`Token preview: ${token.substring(0, 40)}...`);
        addLog(`Token length: ${token.length} chars`);
      } else {
        addLog('ERROR: No token found in localStorage');
      }

      addLog(`User data exists: ${!!user}`);
      if (user) {
        addLog(`User: ${JSON.stringify(user, null, 2)}`);
        addLog(`Store ID: ${user.storeId || 'MISSING'}`);
      } else {
        addLog('ERROR: No user data found in localStorage');
      }

      // Step 2: Check environment
      addLog('');
      addLog('=== Step 2: Environment Configuration ===');
      addLog(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'NOT SET (using default)'}`);
      addLog(`Resolved API_URL: ${API_URL}`);

      // Step 3: Test cookie
      addLog('');
      addLog('=== Step 3: Cookie Check ===');
      const cookies = document.cookie.split(';').map(c => c.trim());
      const cartaisyCookie = cookies.find(c => c.startsWith('cartaisy_token='));
      addLog(`Cookie exists: ${!!cartaisyCookie}`);
      if (cartaisyCookie) {
        addLog(`Cookie preview: ${cartaisyCookie.substring(0, 50)}...`);
      }

      if (!token || !user?.storeId) {
        addLog('');
        addLog('ERROR: Cannot proceed without token and storeId');
        setLoading(false);
        return;
      }

      // Step 4: Test backend connectivity
      addLog('');
      addLog('=== Step 4: Backend Connectivity ===');
      try {
        const healthResponse = await fetch(`${API_URL.replace('/api/v1', '')}/health`, {
          method: 'GET',
        });
        addLog(`Health endpoint status: ${healthResponse.status}`);
        if (healthResponse.ok) {
          const healthData = await healthResponse.text();
          addLog(`Health response: ${healthData.substring(0, 200)}`);
        }
      } catch (healthError: unknown) {
        const error = healthError as Error;
        addLog(`Health check error: ${error.message}`);
      }

      // Step 5: Test auth profile endpoint
      addLog('');
      addLog('=== Step 5: Auth Profile Verification ===');
      try {
        const profileResponse = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        addLog(`Profile endpoint status: ${profileResponse.status}`);
        const profileData = await profileResponse.json();
        addLog(`Profile response: ${JSON.stringify(profileData, null, 2)}`);
      } catch (profileError: unknown) {
        const error = profileError as Error;
        addLog(`Profile check error: ${error.message}`);
      }

      // Step 6: Test segments endpoint (via Next.js route)
      addLog('');
      addLog('=== Step 6: Segments Endpoint (Next.js Route) ===');
      try {
        const segmentsResponse = await fetch('/api/notifications/segments');
        addLog(`Segments status: ${segmentsResponse.status}`);
        const segmentsData = await segmentsResponse.json();
        addLog(`Segments response: ${JSON.stringify(segmentsData, null, 2).substring(0, 500)}`);
      } catch (segmentsError: unknown) {
        const error = segmentsError as Error;
        addLog(`Segments error: ${error.message}`);
      }

      // Step 7: Test segments endpoint (direct to backend)
      addLog('');
      addLog('=== Step 7: Segments Endpoint (Direct Backend) ===');
      try {
        const directSegmentsResponse = await fetch(
          `${API_URL}/notifications/stores/${user.storeId}/segments`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        addLog(`Direct segments status: ${directSegmentsResponse.status}`);
        const directSegmentsData = await directSegmentsResponse.json();
        addLog(`Direct segments response: ${JSON.stringify(directSegmentsData, null, 2).substring(0, 500)}`);
      } catch (directSegmentsError: unknown) {
        const error = directSegmentsError as Error;
        addLog(`Direct segments error: ${error.message}`);
      }

      // Step 8: Test stats endpoint
      addLog('');
      addLog('=== Step 8: Stats Endpoint ===');
      try {
        const statsResponse = await fetch('/api/notifications/stats');
        addLog(`Stats status: ${statsResponse.status}`);
        const statsData = await statsResponse.json();
        addLog(`Stats response: ${JSON.stringify(statsData, null, 2).substring(0, 500)}`);
      } catch (statsError: unknown) {
        const error = statsError as Error;
        addLog(`Stats error: ${error.message}`);
      }

      addLog('');
      addLog('=== Diagnostic Complete ===');

    } catch (error: unknown) {
      const err = error as Error;
      addLog(`FATAL ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    addLog('');
    addLog('=== Sending Test Notification ===');
    setLoading(true);

    try {
      const token = tokenStorage.getToken();
      const user = tokenStorage.getUser<{ storeId?: string }>();

      if (!token || !user?.storeId) {
        addLog('ERROR: Missing token or storeId');
        setLoading(false);
        return;
      }

      const endpoint = `${API_URL}/notifications/stores/${user.storeId}/broadcast`;
      const payload = {
        title: 'Test Notification',
        body: `Test from dashboard diagnostic at ${new Date().toLocaleTimeString()}`,
        segment: 'all'
      };

      addLog(`Endpoint: ${endpoint}`);
      addLog(`Payload: ${JSON.stringify(payload)}`);
      addLog(`Token: ${token.substring(0, 30)}...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      addLog(`Response status: ${response.status}`);
      addLog(`Response ok: ${response.ok}`);

      const data = await response.json();
      addLog(`Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog('SUCCESS: Test notification sent!');
      } else {
        addLog(`FAILED: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`Send ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNextJsBroadcastRoute = async () => {
    addLog('');
    addLog('=== Testing Next.js Broadcast Route ===');
    setLoading(true);

    try {
      const payload = {
        title: 'Test via Next.js Route',
        body: `Test at ${new Date().toLocaleTimeString()}`,
        segment: 'all'
      };

      addLog(`Endpoint: /api/notifications/broadcast`);
      addLog(`Payload: ${JSON.stringify(payload)}`);

      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      addLog(`Response status: ${response.status}`);

      const data = await response.json();
      addLog(`Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog('SUCCESS via Next.js route!');
      } else {
        addLog(`FAILED: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      addLog(`Route ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Push Notification Diagnostic</h1>
      <p className="text-slate-500 mb-6">
        Test the complete push notification flow from dashboard to backend
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Running...' : 'Run Full Diagnostic'}
        </button>
        <button
          onClick={sendTestNotification}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          Send Test (Direct API)
        </button>
        <button
          onClick={testNextJsBroadcastRoute}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
        >
          Send Test (Next.js Route)
        </button>
        <button
          onClick={clearLogs}
          disabled={loading}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-[600px] overflow-y-auto whitespace-pre-wrap">
        {results.length === 0 ? (
          <p className="text-slate-500">Click &quot;Run Full Diagnostic&quot; to start...</p>
        ) : (
          results.map((log, i) => (
            <div
              key={i}
              className={
                log.includes('ERROR') ? 'text-red-400' :
                log.includes('SUCCESS') ? 'text-green-400' :
                log.includes('===') ? 'text-yellow-400 font-bold mt-2' :
                'text-slate-300'
              }
            >
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-slate-100 rounded-lg">
        <h3 className="font-semibold mb-2">Flow Overview:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
          <li><strong>UI Form</strong> → <code>SendNotificationForm.tsx</code> collects title, body, segment</li>
          <li><strong>API Client</strong> → <code>lib/api/notifications.ts</code> broadcast() calls backend directly</li>
          <li><strong>Token</strong> → Retrieved from localStorage via <code>tokenStorage.getToken()</code></li>
          <li><strong>StoreId</strong> → Retrieved from localStorage user object</li>
          <li><strong>Endpoint</strong> → <code>POST {API_URL}/notifications/stores/[storeId]/broadcast</code></li>
          <li><strong>Alternative</strong> → Next.js route <code>/api/notifications/broadcast</code> (uses session)</li>
        </ol>
      </div>
    </div>
  );
}
