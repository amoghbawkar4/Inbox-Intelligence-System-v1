import { htmlToText } from "html-to-text";

const FOOTER_PATTERNS = [
  /unsubscribe/i,
  /manage (your )?preferences/i,
  /view (this )?email in (your )?browser/i,
  /privacy policy/i,
  /you are receiving this/i,
  /sponsored by/i,
  /advertisement/i
];

export function cleanEmailContent(rawContent = "") {
  const text = htmlToText(rawContent, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "img", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" }
    ]
  });

  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !FOOTER_PATTERNS.some((pattern) => pattern.test(line)));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function isLowValueEmail({ subject = "", sender = "", content = "" }) {
  const compact = content.replace(/\s+/g, " ").trim();
  const haystack = `${subject} ${sender} ${compact}`.toLowerCase();

  if (compact.length < 350) return true;

  const promotionalSignals = [
    "sale",
    "discount",
    "coupon",
    "limited time",
    "black friday",
    "cyber monday",
    "free shipping",
    "deal ends",
    "promo",
    "offer expires"
  ];

  const signalCount = promotionalSignals.filter((signal) =>
    haystack.includes(signal)
  ).length;

  return signalCount >= 2;
}

export function truncateForModel(content, maxChars = 6000) {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}\n\n[Content truncated for cost control]`;
}
