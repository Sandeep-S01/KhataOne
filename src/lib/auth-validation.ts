export type AuthFieldName =
  | "full_name"
  | "firm_name"
  | "email"
  | "password";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailAddress(value: string) {
  return emailPattern.test(value.trim());
}

export function validateAuthField(
  field: AuthFieldName,
  rawValue: string,
): string | undefined {
  const value = rawValue.trim();

  switch (field) {
    case "full_name":
      return value.length >= 2 ? undefined : "Use 2 or more characters.";
    case "firm_name":
      return value.length >= 2 ? undefined : "Use 2 or more characters.";
    case "email":
      return isEmailAddress(value) ? undefined : "Enter a valid work email.";
    case "password":
      return value.length >= 8 ? undefined : "Use at least 8 characters.";
  }
}

export function validateAuthFields(
  values: Partial<Record<AuthFieldName, string>>,
  fields: AuthFieldName[],
) {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const error = validateAuthField(field, values[field] ?? "");

    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}
