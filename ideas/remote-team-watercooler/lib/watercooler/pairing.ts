/**
 * Pure pairing algorithm — no DB/network access, safe to unit test with
 * plain `node`. Randomly groups member ids into pairs (or a group of 3 if
 * the count is odd), trying to avoid repeating a pair from last week's
 * groups when a better arrangement exists.
 *
 * "Avoid where possible" is implemented as: try several random shuffles
 * (bounded by `maxAttempts`), score each by how many pairs repeat a pair
 * from `previousGroups`, and keep the best-scoring attempt. With small
 * team sizes this reliably finds a zero-repeat arrangement when one
 * exists; if every arrangement repeats at least one pair (e.g. a 3-person
 * team has no other option), it returns the least-bad one it found.
 */

export function generatePairing(
  memberIds: string[],
  previousGroups: string[][] = [],
  rng: () => number = Math.random,
  maxAttempts = 30,
): string[][] {
  if (memberIds.length === 0) return [];
  if (memberIds.length === 1) return [memberIds.slice()];

  const previousPairKeys = buildPairKeySet(previousGroups);

  let best: string[][] = groupIntoPairs(shuffle(memberIds, rng));
  let bestRepeatCount = countRepeats(best, previousPairKeys);

  for (let attempt = 1; attempt < maxAttempts && bestRepeatCount > 0; attempt++) {
    const candidate = groupIntoPairs(shuffle(memberIds, rng));
    const repeatCount = countRepeats(candidate, previousPairKeys);
    if (repeatCount < bestRepeatCount) {
      best = candidate;
      bestRepeatCount = repeatCount;
    }
  }

  return best;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function buildPairKeySet(groups: string[][]): Set<string> {
  const keys = new Set<string>();
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        keys.add(pairKey(group[i], group[j]));
      }
    }
  }
  return keys;
}

function countRepeats(groups: string[][], previousPairKeys: Set<string>): number {
  let count = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (previousPairKeys.has(pairKey(group[i], group[j]))) count++;
      }
    }
  }
  return count;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Splits a shuffled id list into groups of 2, except when the count is
 * odd — then exactly one group gets a 3rd member (the last group).
 */
function groupIntoPairs(ids: string[]): string[][] {
  const isOdd = ids.length % 2 === 1;
  const pairCount = isOdd ? (ids.length - 3) / 2 : ids.length / 2;
  const groups: string[][] = [];
  let i = 0;
  for (let p = 0; p < pairCount; p++) {
    groups.push([ids[i], ids[i + 1]]);
    i += 2;
  }
  if (isOdd) {
    groups.push([ids[i], ids[i + 1], ids[i + 2]]);
  }
  return groups;
}
