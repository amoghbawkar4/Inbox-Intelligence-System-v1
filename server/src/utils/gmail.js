export function decodeBase64Url(data = "") {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

export function getHeader(headers = [], name) {
  const header = headers.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

export function extractBody(payload) {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts || [];
  const preferred =
    parts.find((part) => part.mimeType === "text/html") ||
    parts.find((part) => part.mimeType === "text/plain");

  if (preferred?.body?.data) {
    return decodeBase64Url(preferred.body.data);
  }

  for (const part of parts) {
    const nested = extractBody(part);
    if (nested) return nested;
  }

  return "";
}

export function encodeRawEmail({ to, from, subject, text }) {
  const raw = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    text
  ].join("\r\n");

  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
