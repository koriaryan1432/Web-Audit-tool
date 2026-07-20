export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function formatScore(score: number): string {
  const grade = score >= 90 ? "Good" : score >= 50 ? "Needs Work" : "Poor";
  return `${score} / ${grade}`;
}
