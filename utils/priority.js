// utils/priority.js
// Automatically assigns a priority level by scanning the complaint's own
// words for danger/urgency signals — students no longer pick priority
// themselves, which avoids every complaint getting marked "High" by default.
//
// This is a simple, transparent keyword system (easy to explain in an
// interview: "here's exactly why it classified this as Emergency").
// A production system would likely use a trained text-classification model
// instead — see the README's "next steps" section.

const EMERGENCY_KEYWORDS = [
  "fire", "smoke", "burning smell", "gas leak", "gas smell", "lpg leak",
  "electric shock", "electrocut", "short circuit", "sparks", "exposed wire",
  "live wire", "flooding", "flood", "ceiling collapse", "wall collapse",
  "collapsed", "trapped", "stuck in lift", "stuck in elevator",
  "unconscious", "not breathing", "bleeding heavily", "medical emergency",
  "intruder", "break-in", "break in", "assault", "weapon", "suicide",
  "self harm", "snake", "gas cylinder leak",
];

const HIGH_KEYWORDS = [
  "no water", "no electricity", "power outage", "power cut",
  "water leak", "leaking", "broken lock", "door not locking",
  "door won't lock", "security", "theft", "stolen", "harassment",
  "no internet during exam", "rat infestation", "mice", "pest infestation",
  "broken window", "glass broken", "mold", "sewage",
];

const LOW_KEYWORDS = [
  "minor", "cosmetic", "paint peeling", "suggestion", "request",
  "would be nice", "when convenient", "no rush", "small issue",
];

function matchesAny(text, keywords) {
  return keywords.some((kw) => text.includes(kw));
}

function classifyPriority(description) {
  const text = description.toLowerCase();

  if (matchesAny(text, EMERGENCY_KEYWORDS)) return "Emergency";
  if (matchesAny(text, HIGH_KEYWORDS)) return "High";
  if (matchesAny(text, LOW_KEYWORDS)) return "Low";
  return "Medium"; // safe default — most day-to-day complaints land here
}

// Used in SQL ORDER BY and in the frontend to sort consistently.
const PRIORITY_RANK = { Emergency: 0, High: 1, Medium: 2, Low: 3 };

module.exports = { classifyPriority, PRIORITY_RANK };
