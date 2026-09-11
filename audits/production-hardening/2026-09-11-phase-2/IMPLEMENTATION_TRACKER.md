# Production Hardening Phase 2 Implementation Tracker

Date: 2026-09-11

## Scope

Phase 2 implements the safe local portion of the post-audit hardening plan:

- Media-aware OpenAI extraction input preparation for private WhatsApp image, PDF, and audio media.
- Durable queued export generation instead of synchronous request-path CSV/PDF generation.
- Static regression checks for Phase 2 architecture boundaries.
- Documentation updates for backend schema and project tracker.

No production deployment, production migration, paid provider traffic, or customer-data test was performed.

## Application Changes

- `src/lib/ai/media-input.ts`: added bounded media download and OpenAI input preparation from private `whatsapp-media-raw` storage.
- `src/lib/ai/extraction-providers.ts`: OpenAI extraction now uses prepared text/image/PDF/audio-derived input and preserves input provenance.
- `src/lib/ai/extraction-processor.ts`: extraction records store `input_provenance`; generated audio transcripts can be persisted as `documents.source_text`.
- `src/app/actions/exports.ts`: export requests now create queued `exports` rows and `processing_jobs` instead of generating files in the server action.
- `src/lib/exports/generator.ts`: added worker-side CSV/PDF generation, private storage upload, and `export.generated` audit logging.
- `src/lib/exports/worker.ts`: added claim/process/finalize loop for export generation jobs.
- `src/app/api/jobs/exports/run-queued/route.ts`: added protected worker endpoint using runner secrets and rate limiting.
- `supabase/migrations/20260910170000_export_generation_jobs.sql`: added export job uniqueness, insert policy, and service-role claim function.
- `vercel.json`: added the export-generation cron route.
- `.env.example`: added media byte limits and `OPENAI_TRANSCRIPTION_MODEL`.
- `scripts/test-phase2-hardening.mjs`: added static Phase 2 regression coverage.

## Out Of Scope

- Applying Supabase migrations.
- Running OpenAI image/PDF/audio extraction.
- Verifying Supabase Storage upload/download against a real non-production project.
- Running k6/browser load tests against an authorized staging deployment.
- Certifying 10,000 or 20,000 DAU capacity.
