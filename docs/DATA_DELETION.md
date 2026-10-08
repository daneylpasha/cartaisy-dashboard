# Data deletion

Public pages say Cartaisy keeps personal information only while it is needed for the service and for legal obligations, then deletes or anonymizes it. They do not publish a retention deadline. A copy of data Cartaisy holds, and requests to access, correct, or delete personal information, are made through the contact form or email. There is no self-serve export download in that public rule. This file records what the dashboard code actually contains. It is not a public page, and nothing here was executed against production.

## Shopper record in the merchant dashboard

This path is for a store customer shown in the dashboard. It is not a procedure for deleting the merchant’s own Cartaisy account, a fit check, or a contact message.

1. The customer page at `app/dashboard/customers/[id]/page.tsx` opens `components/compliance/DeleteCustomerDataModal.tsx`.
2. The modal asks for the customer’s email. If it matches, `lib/api/compliance.ts` `requestCustomerDataDeletion` sends `POST /stores/:storeId/compliance/delete/customer/:customerId` on the backend API, with JSON `{ confirmEmail }`. The dashboard does not delete the row itself.
3. The button copy says order history will be anonymized and retained, and that the action cannot be fully undone after 30 days. That sentence is dashboard UI. This repo does not show a job that enforces the 30 days, and this change did not call the endpoint.

The compliance settings screen, `app/dashboard/settings/compliance/page.tsx`, displays `dataRetentionDays`. If `GET /stores/:storeId/compliance/settings` is not successful, `getComplianceSettings` returns a client-side fallback of 365 days and says inactive customer records are automatically anonymized. That fallback is not evidence that a deletion job exists.

The same screens also offer customer and bulk export downloads through backend compliance export routes. Those controls remain in the product. They were not removed, and they were not run. They are separate from the public statement that Cartaisy does not provide a self-serve export of data Cartaisy holds.

## Unverified gaps

- No production write was made, and no deletion request was sent.
- This repo has no runbook for deleting a merchant account, a `ProspectLead`, or a `ContactSubmission`.
- The 365-day fallback and the 30-day undo sentence are unverified against the backend.
- Mailbox delivery for `support@cartaisy.com` and `privacy@cartaisy.com` was not tested here.
