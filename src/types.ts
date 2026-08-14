export interface RankedUser {
  rank: number;
  login: string;
  id: number;
  name: string | null;
  type: "User" | "Organization";
  followers: number;
  following: number;
  publicRepos: number;
  location: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  provinceZh: string | null;
  company: string | null;
  blog: string | null;
  bio: string | null;
  createdAt: string;
}

export interface RankedRepo {
  rank: number;
  fullName: string;
  id: number;
  owner: string;
  ownerType: "User" | "Organization";
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  license: string | null;
  archived: boolean;
  createdAt: string;
  pushedAt: string;
}

export interface Shard {
  lo: number;
  hi: number;
  count: number;
  truncated: boolean;
}
