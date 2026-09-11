const formulaLeadingCharacters = new Set(["=", "+", "-", "@", "\t", "\r"]);

function startsLikeSpreadsheetFormula(value: string) {
  const trimmedStart = value.replace(/^[\u0000-\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/u, "");
  const first = trimmedStart.at(0);

  return first ? formulaLeadingCharacters.has(first) : false;
}

export function csvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "\"\"";
  }

  const text = String(value);
  const safeText = startsLikeSpreadsheetFormula(text) ? `'${text}` : text;

  return `"${safeText.replaceAll("\"", "\"\"")}"`;
}

export function csvRows(
  headers: string[],
  rows: Array<Array<string | number | null>>,
) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}
