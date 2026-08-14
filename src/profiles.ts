import { graphql } from "./github.js";

export interface Profile {
  login: string;
  id: number;
  type: "User" | "Organization";
  name: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
}

const BATCH = 80;

interface OwnerNode {
  __typename: "User" | "Organization";
  login: string;
  databaseId: number;
  name: string | null;
  location: string | null;
  websiteUrl: string | null;
  createdAt: string;
  company?: string | null;
  bio?: string | null;
  followers?: { totalCount: number };
  following?: { totalCount: number };
  repositories?: { totalCount: number };
  membersWithRole?: { totalCount: number };
}

function buildQuery(logins: string[]): string {
  const fields = logins
    .map((login, i) => `a${i}: repositoryOwner(login: ${JSON.stringify(login)}) { ...owner }`)
    .join("\n");

  return `
    fragment owner on RepositoryOwner {
      __typename
      login
      ... on User {
        databaseId
        name location company bio websiteUrl createdAt
        followers { totalCount }
        following { totalCount }
        repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
      }
      ... on Organization {
        databaseId
        name location websiteUrl createdAt
        repositories(privacy: PUBLIC) { totalCount }
        membersWithRole { totalCount }
      }
    }
    query { ${fields} }
  `;
}

function toProfile(node: OwnerNode): Profile {
  return {
    login: node.login,
    id: node.databaseId,
    type: node.__typename,
    name: node.name,
    location: node.location,
    company: node.company ?? null,
    blog: node.websiteUrl || null,
    bio: node.bio ? node.bio.slice(0, 120) : null,
    followers: node.followers?.totalCount ?? 0,
    following: node.following?.totalCount ?? 0,
    publicRepos: node.repositories?.totalCount ?? 0,
    createdAt: node.createdAt,
  };
}

async function fetchBatch(logins: string[]): Promise<Profile[]> {
  try {
    const data = await graphql<Record<string, OwnerNode | null>>(buildQuery(logins));
    return Object.values(data).filter((n): n is OwnerNode => n !== null).map(toProfile);
  } catch (error) {
    if (logins.length === 1) {
      console.warn(`  跳过 ${logins[0]}：${(error as Error).message}`);
      return [];
    }
    const mid = Math.floor(logins.length / 2);
    return [
      ...await fetchBatch(logins.slice(0, mid)),
      ...await fetchBatch(logins.slice(mid)),
    ];
  }
}

export async function fetchProfiles(
  logins: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Profile[]> {
  const profiles: Profile[] = [];
  for (let i = 0; i < logins.length; i += BATCH) {
    profiles.push(...await fetchBatch(logins.slice(i, i + BATCH)));
    onProgress?.(Math.min(i + BATCH, logins.length), logins.length);
  }
  return profiles;
}
