const internationalPhonePattern = /^[1-9]\d{7,14}$/;

/** Store client WhatsApp numbers in the same format regardless of input spacing. */
export function normalizeWhatsAppPhone(value: string): string | null {
  const input = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(input)) {
    return null;
  }

  const digits = input.replace(/\D/g, "");
  if (!internationalPhonePattern.test(digits)) {
    return null;
  }

  // Without +, a short number does not tell us which country it belongs to.
  if (!input.startsWith("+") && digits.length < 11) {
    return null;
  }

  return `+${digits}`;
}

/** Meta sends the international number as digits; older records may omit +. */
export function whatsappSenderCandidates(sender: string): string[] {
  const digits = sender.replace(/\D/g, "");
  if (!internationalPhonePattern.test(digits)) {
    return [];
  }

  return [`+${digits}`, digits];
}
