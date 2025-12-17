# Push Notification Diagnostic Report - Dashboard

## Overview

This document provides a complete analysis of the push notification implementation in the Cartaisy Dashboard.

---

## 1. File Inventory

### UI Components
| File | Purpose |
|------|---------|
| `components/notifications/SendNotificationForm.tsx` | Main form for composing notifications |
| `components/notifications/NotificationHistoryTable.tsx` | Displays notification history |
| `components/notifications/NotificationStats.tsx` | Shows push notification statistics |
| `components/notifications/NotificationDetailModal.tsx` | Modal for viewing notification details |

### API Client
| File | Purpose |
|------|---------|
| `lib/api/notifications.ts` | Client-side API functions for notifications |
| `lib/api/mutator/custom-instance.ts` | Token storage and auth management |

### Next.js API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/notifications/broadcast/route.ts` | POST | Proxy for sending notifications |
| `/api/notifications/segments/route.ts` | GET | Fetch customer segments |
| `/api/notifications/stats/route.ts` | GET | Fetch notification statistics |
| `/api/notifications/history/route.ts` | GET | Fetch notification history |
| `/api/notifications/history/[id]/route.ts` | GET | Fetch single notification detail |
| `/api/notifications/recipients/route.ts` | GET | Fetch recipients list |
| `/api/notifications/test/route.ts` | POST | Send test notification |

### Pages
| File | Route |
|------|-------|
| `app/dashboard/marketing/push-notifications/page.tsx` | `/dashboard/marketing/push-notifications` |
| `app/dashboard/notifications-test/page.tsx` | `/dashboard/notifications-test` (diagnostic) |

---

## 2. Send Notification UI

### Location
- **Page**: `app/dashboard/marketing/push-notifications/page.tsx`
- **Form Component**: `components/notifications/SendNotificationForm.tsx`

### Form Fields
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `title` | string | Max 100 chars | Yes |
| `body` | string | Max 500 chars | Yes |
| `segment` | select | Must be valid segment ID | Yes (default: 'all') |
| `imageUrl` | string | Valid URL format | No |

### Submit Handler Flow
1. User clicks "Send Notification" button
2. Form validates all fields (`validate()` function)
3. Calls `notificationApi.broadcast()` with payload
4. On success: Shows success message, resets form, triggers `onSuccess` callback
5. On error: Shows error message

---

## 3. API Layer

### `lib/api/notifications.ts`

#### `notificationApi.broadcast()`
```typescript
async broadcast(payload: SendNotificationPayload): Promise<{
  success: boolean;
  message: string;
  sentCount: number;
}>
```

**Flow:**
1. Gets token from `tokenStorage.getToken()` (localStorage)
2. Gets user/storeId from `tokenStorage.getUser()`
3. Calls backend directly: `POST ${API_URL}/notifications/stores/${storeId}/broadcast`
4. Headers: `Authorization: Bearer ${token}`, `Content-Type: application/json`

**Important:** This function calls the **backend API directly**, not the Next.js proxy route.

### Token Storage (`lib/api/mutator/custom-instance.ts`)
```typescript
tokenStorage.getToken()     // From localStorage key: 'cartaisy_token'
tokenStorage.getUser()      // From localStorage key: 'cartaisy_user'
tokenStorage.setTokens()    // Stores in localStorage AND cookie
```

---

## 4. API Routes (Next.js)

### `/api/notifications/broadcast` (POST)

**Purpose**: Alternative route that uses server-side session instead of client token.

**Flow:**
1. Gets token via `getAuthToken()` (from cookie)
2. Gets session via `getServerSession()`
3. Validates `storeId` exists in session
4. Proxies request to: `${BACKEND_URL}/notifications/stores/${storeId}/broadcast`
5. Falls back to mock response if backend fails

**Note**: The form component does NOT use this route - it calls the backend directly.

---

## 5. Environment Configuration

### Current Values (from `.env.local`)
```
NEXT_PUBLIC_API_URL=https://cartaisy-backend-production.up.railway.app/api/v1
BACKEND_URL=https://cartaisy-backend-production.up.railway.app/api/v1
```

### Usage
- `NEXT_PUBLIC_API_URL` - Used by client-side code (`lib/api/notifications.ts`)
- `BACKEND_URL` - Used by Next.js API routes (server-side)

---

## 6. Authentication Flow

### Client-Side (Form → API Client)
1. Token stored in localStorage when user logs in
2. `tokenStorage.getToken()` retrieves from `localStorage.cartaisy_token`
3. Token sent as `Authorization: Bearer ${token}` header

### Server-Side (Next.js Routes)
1. Token stored in cookie: `cartaisy_token`
2. `getAuthToken()` reads from cookies
3. `getServerSession()` calls backend `/auth/profile` to validate

### User Data Structure
```typescript
{
  id: string;
  email: string;
  storeId: string;  // Required for notification endpoints
  // ... other fields
}
```

---

## 7. Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DIRECT API FLOW                              │
│         (Used by SendNotificationForm - Current Implementation)      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks "Send"                                                 │
│        ↓                                                            │
│  SendNotificationForm.handleSubmit()                                │
│        ↓                                                            │
│  notificationApi.broadcast(payload)                                 │
│        ↓                                                            │
│  tokenStorage.getToken() → localStorage                             │
│  tokenStorage.getUser() → { storeId: "xxx" }                        │
│        ↓                                                            │
│  fetch(POST ${API_URL}/notifications/stores/${storeId}/broadcast)   │
│  Headers: Authorization: Bearer ${token}                            │
│        ↓                                                            │
│  Backend processes request                                          │
│        ↓                                                            │
│  Response → Dashboard shows success/error                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS PROXY FLOW                              │
│              (Alternative - Not used by form currently)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Client calls /api/notifications/broadcast                          │
│        ↓                                                            │
│  Next.js route handler                                              │
│        ↓                                                            │
│  getAuthToken() → cookie (cartaisy_token)                           │
│  getServerSession() → validates with backend                        │
│        ↓                                                            │
│  fetch(POST ${BACKEND_URL}/notifications/stores/${storeId}/...)     │
│        ↓                                                            │
│  Backend processes request                                          │
│        ↓                                                            │
│  Response → Client                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Logging Locations

### SendNotificationForm.tsx (lines 75-117)
- Step 1: Form submit triggered
- Step 2: API call initiated
- Step 3: Response received

### lib/api/notifications.ts (lines 142-199)
- Step 2a-2f: Token, user, endpoint, payload logging
- Step 3a-3d: Response status, headers, data logging

### /api/notifications/broadcast/route.ts (lines 17-94)
- Token and session logging
- Request body logging
- Backend call and response logging

---

## 9. Potential Issues

### Issue 1: Dual Path Confusion
The form uses **direct API calls** but there's also a **Next.js proxy route**. If the backend expects requests only from certain origins, the direct client call might fail.

### Issue 2: Token Sync
Token is stored in both:
- `localStorage.cartaisy_token` (client-side)
- Cookie `cartaisy_token` (server-side)

If one expires/clears and not the other, behavior may be inconsistent.

### Issue 3: StoreId Dependency
Both paths require `storeId`:
- Client: `tokenStorage.getUser().storeId`
- Server: `session.user.storeId`

If user data doesn't include `storeId`, the request will fail.

### Issue 4: Mock Fallback
The Next.js routes fall back to **mock data** if backend is unavailable. This can mask real backend errors during development.

---

## 10. Testing Checklist

### Pre-flight Checks
- [ ] User is logged in
- [ ] Token exists in localStorage (`cartaisy_token`)
- [ ] User data has `storeId` property
- [ ] Cookie `cartaisy_token` is set

### API Tests
- [ ] Backend health endpoint responds
- [ ] Auth profile endpoint validates token
- [ ] Segments endpoint returns data
- [ ] Stats endpoint returns data
- [ ] Broadcast endpoint accepts requests

### UI Tests
- [ ] Form displays all segments
- [ ] Validation shows errors for empty fields
- [ ] Success message shows after send
- [ ] Error message shows on failure

---

## 11. Test Page

A diagnostic test page has been created at:
```
/dashboard/notifications-test
```

This page provides buttons to:
1. **Run Full Diagnostic** - Tests token, user, endpoints
2. **Send Test (Direct API)** - Tests the exact flow the form uses
3. **Send Test (Next.js Route)** - Tests the proxy route alternative

---

## 12. Quick Fixes

### If notifications aren't sending:

1. **Check browser console** for logged steps
2. **Verify token exists**:
   ```javascript
   localStorage.getItem('cartaisy_token')
   ```
3. **Verify user has storeId**:
   ```javascript
   JSON.parse(localStorage.getItem('cartaisy_user'))
   ```
4. **Test backend directly**:
   ```bash
   curl -X POST "https://cartaisy-backend-production.up.railway.app/api/v1/notifications/stores/YOUR_STORE_ID/broadcast" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","body":"Test message","segment":"all"}'
   ```

### If mock data appears instead of real data:
- Check backend URL is correct
- Verify backend is running and accessible
- Check network tab for actual API responses

---

## 13. Backend Endpoint Requirements

The dashboard expects these backend endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/notifications/stores/{storeId}/broadcast` | POST | Bearer | Send broadcast notification |
| `/api/v1/notifications/stores/{storeId}/segments` | GET | Bearer | Get customer segments |
| `/api/v1/notifications/stores/{storeId}/stats` | GET | Bearer | Get notification statistics |
| `/api/v1/notifications/stores/{storeId}/history` | GET | Bearer | Get notification history |
| `/api/v1/notifications/stores/{storeId}/recipients` | GET | Bearer | Get recipients list |
| `/api/v1/notifications/test` | POST | Bearer | Send test notification |
| `/api/v1/auth/profile` | GET | Bearer | Validate token and get user |

---

## 14. Summary

The push notification implementation has two possible paths:

1. **Direct API (current)**: Form → `notificationApi.broadcast()` → Backend API
2. **Proxy Route (unused)**: Form → `/api/notifications/broadcast` → Backend API

Both rely on:
- Valid JWT token
- User object with `storeId`
- Backend endpoint availability

Use the diagnostic test page at `/dashboard/notifications-test` to identify specific failure points.
