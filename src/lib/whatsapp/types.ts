export type WhatsAppMediaType = "image" | "document" | "audio" | "video" | "sticker";

export type WhatsAppInboundMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: {
    body?: string;
  };
  image?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    filename?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  audio?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    voice?: boolean;
  };
  video?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  sticker?: {
    id?: string;
    mime_type?: string;
    sha256?: string;
  };
};

export type WhatsAppChangeValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: {
      name?: string;
    };
    wa_id?: string;
  }>;
  messages?: WhatsAppInboundMessage[];
  statuses?: unknown[];
};

export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: WhatsAppChangeValue;
    }>;
  }>;
};
