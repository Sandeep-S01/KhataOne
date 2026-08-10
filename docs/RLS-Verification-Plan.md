# KhataOne RLS Verification Plan

Use this plan after connecting a live Supabase project.

## Required Setup

- Create two Supabase Auth users.
- Create Firm A with User A as owner.
- Create Firm B with User B as owner.
- Seed or create one client, transaction, GST summary, export, audit log, and processing job per firm.

## Checks

- User A can read Firm A records.
- User A cannot read Firm B records from:
  - `firms`
  - `firm_users`
  - `clients`
  - `whatsapp_messages`
  - `documents`
  - `ai_extractions`
  - `transactions`
  - `ledger_entries`
  - `gst_periods`
  - `gst_summaries`
  - `exports`
  - `audit_logs`
  - `processing_jobs`
- User B cannot read Firm A records.
- Viewer role can read allowed dashboard data.
- Viewer role cannot mutate clients, transactions, ledger entries, GST summaries, or exports once role-specific mutation checks are finalized.
- Export download route refuses an export ID from another firm.

## Evidence To Capture

- SQL/API request used.
- Auth user ID.
- Firm IDs tested.
- Expected result.
- Actual result.
- Screenshot or command output.
- Date and tester.
