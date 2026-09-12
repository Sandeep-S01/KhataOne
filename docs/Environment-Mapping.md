# KhataOne Environment Mapping

The local `.env.local` file uses the current application variable names. Secret
values must stay local and must not be copied into docs or source control. The
table below is retained only as a reference for legacy deployment environments.

## Current App Mappings

| Old key | Current key | Used by |
| --- | --- | --- |
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | Supabase browser/server clients |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Admin writes, storage, exports, demo seed |
| `META_APP_SECRET` | `WHATSAPP_APP_SECRET` | WhatsApp webhook signature verification |
| `WA_VERIFY_TOKEN` | `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook challenge |
| `WA_TOKEN` | `WHATSAPP_ACCESS_TOKEN` | WhatsApp media download and outbound messages |
| `WA_PHONE_ID` | `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp outbound message endpoint |
| `APP_ORIGIN` | `NEXT_PUBLIC_APP_URL` | App origin configuration |
| `EXPORT_TOKEN_SECRET` | `JOB_RUNNER_SECRET` | Server job endpoint guard |
| `SMOKE_BASE_URL` | `SMOKE_BASE_URL` | Optional smoke-test target |

## Not Mapped To Runtime Features Yet

- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `EMAIL_WEBHOOK_SECRET`
- `JWT_SECRET`
- `SANDBOX_API_KEY`
- `SMOKE_CA_EMAIL`
- `SMOKE_CA_PASSWORD`

These keys are retained in `.env.local` for future migration work, but the
current KhataOne app does not read them directly.

## Required For Current AI Flow

The current AI extraction implementation expects `OPENAI_API_KEY` and
`OPENAI_EXTRACTION_MODEL` when OpenAI is enabled in the configured provider
order. A separate Gemini or Anthropic provider must not be assumed until it is
intentionally implemented.
