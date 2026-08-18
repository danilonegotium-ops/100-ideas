export interface Site {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
}

export const CATEGORIES = [
  "tools",
  "art",
  "science",
  "weird",
  "music",
  "learning",
] as const;
