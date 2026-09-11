# Verification Results

## Environment

- Repository: `D:\P\KhataOne`
- Branch: `main`
- Base commit observed before work: `e7f0f7aa982069ecff4a1f343b4564b552b52e4e`
- Node.js: `v26.5.1`
- npm: `11.17.0`
- Next.js: `16.3.0`

## Executed Local Commands

```text
npm.cmd run test:hardening
PASS: OK phase 1 hardening checks passed

npm.cmd run lint
PASS

npm.cmd run typecheck
PASS

npm.cmd run test:performance
PASS: OK dashboard query semantics checks passed

npm.cmd run build
PASS
```

## Fail-Closed Checks

```text
npm.cmd run preflight:approval-migration
BLOCKED as designed: refused to run without KHATAONE_MIGRATION_ALLOW_NON_PROD=true and KHATAONE_MIGRATION_TARGET_LABEL=non-production.

npm.cmd run test:approval-rpc
BLOCKED as designed: refused to run without KHATAONE_APPROVAL_RPC_ALLOW_NON_PROD=true and KHATAONE_APPROVAL_RPC_TARGET_LABEL=non-production.

npm.cmd run test:rls-access
BLOCKED as designed: refused to run without KHATAONE_RLS_ALLOW_NON_PROD=true and KHATAONE_RLS_TARGET_LABEL=non-production.
```

This is the expected safety behavior because no authorized test Supabase project, two-firm fixture IDs, or test-role credentials were supplied.

## Latest Verification After Staging Harness Additions

```text
npm.cmd run verify
PASS

npm.cmd run test:hardening
PASS: OK phase 1 hardening checks passed

git diff --check
PASS
```

## Not Executed

- Supabase migration application.
- Concurrent approval runtime test.
- Restricted-principal RLS runtime test.
- Spreadsheet round-trip CSV opening in Excel/Sheets.
- Live WhatsApp, OpenAI or load tests.
