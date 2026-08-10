export type GstIntegrationOperation =
  | "gstr1_compare"
  | "gstr2b_compare"
  | "filing_prepare"
  | "filing_submit";

export type GstIntegrationStatus =
  | "planned"
  | "sandbox"
  | "success"
  | "failed"
  | "blocked";

export type GstProviderRequest = {
  firmId: string;
  clientId: string;
  gstPeriodId: string;
  operation: GstIntegrationOperation;
  dryRun: boolean;
};

export type GstProviderResult = {
  status: GstIntegrationStatus;
  requestReference?: string;
  responseSummary: Record<string, unknown>;
};

export interface GstIntegrationProvider {
  readonly provider: string;
  compareGstr1?(request: GstProviderRequest): Promise<GstProviderResult>;
  compareGstr2b?(request: GstProviderRequest): Promise<GstProviderResult>;
  prepareFiling?(request: GstProviderRequest): Promise<GstProviderResult>;
  submitFiling?(request: GstProviderRequest): Promise<GstProviderResult>;
}
