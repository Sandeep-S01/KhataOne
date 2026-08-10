import type {
  GstIntegrationProvider,
  GstProviderRequest,
  GstProviderResult,
} from "@/lib/integrations/gst/types";

function blocked(operation: string, request: GstProviderRequest): GstProviderResult {
  return {
    status: "blocked",
    responseSummary: {
      operation,
      direct_filing_supported: false,
      reason:
        "GST provider integration is planned but not implemented or compliance-verified.",
      firm_id: request.firmId,
      client_id: request.clientId,
      gst_period_id: request.gstPeriodId,
      dry_run: request.dryRun,
    },
  };
}

export const plannedGstProvider: GstIntegrationProvider = {
  provider: "planned_gst_provider",
  async compareGstr1(request) {
    return blocked("gstr1_compare", request);
  },
  async compareGstr2b(request) {
    return blocked("gstr2b_compare", request);
  },
  async prepareFiling(request) {
    return blocked("filing_prepare", request);
  },
  async submitFiling(request) {
    return blocked("filing_submit", request);
  },
};
