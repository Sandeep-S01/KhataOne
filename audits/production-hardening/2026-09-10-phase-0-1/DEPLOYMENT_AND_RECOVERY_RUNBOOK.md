# Deployment And Recovery Runbook

## Migration Preflight

1. Apply `supabase/migrations/20260910160000_atomic_transaction_approval.sql` first to staging.
2. The migration intentionally aborts if duplicate `ledger_entries.transaction_id` rows already exist.
3. If it aborts, reconcile duplicates manually with CA/product-owner review. Do not delete financial rows automatically.
4. The same duplicate check can be run before migration application:

```text
KHATAONE_MIGRATION_ALLOW_NON_PROD=true
KHATAONE_MIGRATION_TARGET_LABEL=non-production
npm.cmd run preflight:approval-migration
```

## Staging Verification

1. Seed or create two firms with owner/admin/staff/viewer/revoked users.
2. Configure the RLS harness variables:

```text
KHATAONE_RLS_ALLOW_NON_PROD=true
KHATAONE_RLS_TARGET_LABEL=non-production
KHATAONE_RLS_FIRM_A_CLIENT_ID=...
KHATAONE_RLS_FIRM_B_CLIENT_ID=...
KHATAONE_RLS_FIRM_A_TRANSACTION_ID=...
KHATAONE_RLS_FIRM_B_TRANSACTION_ID=...
KHATAONE_RLS_FIRM_A_OWNER_EMAIL=...
KHATAONE_RLS_FIRM_A_OWNER_PASSWORD=...
KHATAONE_RLS_FIRM_A_VIEWER_EMAIL=...
KHATAONE_RLS_FIRM_A_VIEWER_PASSWORD=...
KHATAONE_RLS_FIRM_A_REVOKED_EMAIL=...
KHATAONE_RLS_FIRM_A_REVOKED_PASSWORD=...
```

3. Run:

```text
npm.cmd run test:rls-access
```

4. Manually verify normal approval, retry after response loss, double click and two-reviewer concurrency against staging.
5. After applying the approval RPC migration, run the dedicated RPC concurrency check against a disposable approvable transaction:

```text
KHATAONE_APPROVAL_RPC_ALLOW_NON_PROD=true
KHATAONE_APPROVAL_RPC_TARGET_LABEL=non-production
KHATAONE_APPROVAL_RPC_TRANSACTION_ID=...
KHATAONE_APPROVAL_RPC_OWNER_EMAIL=...
KHATAONE_APPROVAL_RPC_OWNER_PASSWORD=...
KHATAONE_APPROVAL_RPC_VIEWER_EMAIL=...
KHATAONE_APPROVAL_RPC_VIEWER_PASSWORD=...
npm.cmd run test:approval-rpc
```

## Rollback/Forward Repair

- If the migration fails before creating the unique index/function, no application code should be deployed against it.
- If application code is deployed before the migration, approval attempts may fail because the RPC is missing.
- Preferred recovery is forward-fix: apply the migration after resolving duplicate handoffs.
- Do not drop ledger/audit/transaction data to roll back.

## Operating Limits

No new production operating limits are certified by this phase. Keep the prior launch verdicts until staging RLS and approval concurrency verification pass.
