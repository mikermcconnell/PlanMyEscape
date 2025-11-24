# User-Generated Content Reporting Workflow

PlanMyEscape supports collaborative trip planning. To comply with Google Play's UGC and safety policies we provide an in-app reporting control and documented response process.

## In-App Entry Point
- Shipped a ReportContentButton component in the global footer (src/components/layout/Layout.tsx).
- Users can open a modal explaining what to report and submit details via a pre-populated email to support@planmyescape.app.
- Reports are acknowledged within 24 hours; abusive content and accounts are reviewed and removed/suspended as necessary.

## Operational Process
1. Incoming reports are routed to the shared support mailbox.
2. Support verifies the reporter owns/has access to the affected trip.
3. Engineering uses Supabase admin tools to audit and remove offending data if necessary.
4. Final response is sent to the reporter with resolution summary.
5. Serious incidents are tracked in the security log for audit.

Update this document if the reporting channel or escalation path changes.
