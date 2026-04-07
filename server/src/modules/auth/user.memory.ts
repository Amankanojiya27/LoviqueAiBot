import { PersistentMemory } from './auth.types';
import { IUserMemoryEntry } from './user.model';

const MAX_USER_MEMORY_ITEMS = 12;
const MAX_PROMPT_MEMORY_ITEMS = 8;
const MAX_PROMPT_MEMORY_CHARS = 960;

type MemoryCandidate = {
  id: string;
  fact: string;
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

const truncateText = (value: string, maxChars: number): string => {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const slugify = (value: string): string => {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const parsed = new Date(typeof value === 'string' ? value : Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const cleanCapturedValue = (value: string, maxChars = 90): string => {
  return truncateText(
    value
      .replace(/^[\s"'`]+|[\s"'`]+$/g, '')
      .replace(/[.?!,:;]+$/g, '')
      .trim(),
    maxChars,
  );
};

const sentenceCase = (value: string): string => {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

const addCandidate = (candidates: MemoryCandidate[], id: string, fact: string): void => {
  const memoryId = slugify(id);
  const memoryFact = sentenceCase(cleanCapturedValue(fact, 120));

  if (!memoryId || !memoryFact) {
    return;
  }

  const duplicate = candidates.some(
    (candidate) =>
      candidate.id === memoryId || candidate.fact.toLowerCase() === memoryFact.toLowerCase(),
  );

  if (!duplicate) {
    candidates.push({
      id: memoryId,
      fact: memoryFact,
    });
  }
};

const extractUserMemoryCandidates = (message: string): MemoryCandidate[] => {
  const normalized = normalizeWhitespace(message);

  if (!normalized) {
    return [];
  }

  const candidates: MemoryCandidate[] = [];

  const rememberMatch = normalized.match(/\bremember(?:\s+(?:that|this))?\s+(.{3,160})$/i);
  if (rememberMatch) {
    const note = cleanCapturedValue(rememberMatch[1], 120);
    addCandidate(candidates, `note-${note}`, `Remember: ${note}`);
  }

  const preferredNameMatch = normalized.match(/\b(?:call me|my name is)\s+([a-z][a-z\s'-]{1,40})\b/i);
  if (preferredNameMatch) {
    addCandidate(candidates, 'preferred-name', `Prefers to be called ${preferredNameMatch[1]}`);
  }

  const favoriteMatch = normalized.match(
    /\bmy favorite\s+([a-z][a-z\s-]{1,20})\s+is\s+([^.?!]+)/i,
  );
  if (favoriteMatch) {
    const subject = cleanCapturedValue(favoriteMatch[1], 24).toLowerCase();
    const value = cleanCapturedValue(favoriteMatch[2]);
    addCandidate(candidates, `favorite-${subject}`, `Favorite ${subject} is ${value}`);
  }

  const birthdayMatch = normalized.match(/\bmy birthday is\s+([^.?!]+)/i);
  if (birthdayMatch) {
    addCandidate(candidates, 'birthday', `Birthday is ${cleanCapturedValue(birthdayMatch[1])}`);
  }

  const locationMatch = normalized.match(/\b(?:i live in|i am from|i'm from)\s+([^.?!]+)/i);
  if (locationMatch) {
    addCandidate(candidates, 'location', `Lives in ${cleanCapturedValue(locationMatch[1])}`);
  }

  const workAsMatch = normalized.match(/\bi work as\s+(?:an?\s+)?([^.?!]+)/i);
  if (workAsMatch) {
    addCandidate(candidates, 'work-role', `Works as ${cleanCapturedValue(workAsMatch[1])}`);
  }

  const workInMatch = normalized.match(/\bi work in\s+([^.?!]+)/i);
  if (workInMatch) {
    addCandidate(candidates, 'work-field', `Works in ${cleanCapturedValue(workInMatch[1])}`);
  }

  const jobMatch = normalized.match(/\bmy job is\s+([^.?!]+)/i);
  if (jobMatch) {
    addCandidate(candidates, 'work-role', `Works as ${cleanCapturedValue(jobMatch[1])}`);
  }

  const studyMatch = normalized.match(/\b(?:i study|i'm studying|i am studying)\s+([^.?!]+)/i);
  if (studyMatch) {
    addCandidate(candidates, 'studies', `Studies ${cleanCapturedValue(studyMatch[1])}`);
  }

  const preferMatch = normalized.match(/\bi prefer\s+([^.?!]+)/i);
  if (preferMatch) {
    const value = cleanCapturedValue(preferMatch[1]);
    addCandidate(candidates, `prefers-${value}`, `Prefers ${value}`);
  }

  const likeMatch = normalized.match(/\bi (love|like|enjoy)\s+([^.?!]+)/i);
  if (likeMatch) {
    const verb = likeMatch[1].toLowerCase();
    const value = cleanCapturedValue(likeMatch[2]);
    const memoryVerb = verb === 'love' ? 'Loves' : verb === 'enjoy' ? 'Enjoys' : 'Likes';
    addCandidate(candidates, `likes-${value}`, `${memoryVerb} ${value}`);
  }

  const dislikeMatch = normalized.match(/\bi (?:don't like|do not like|dislike|hate)\s+([^.?!]+)/i);
  if (dislikeMatch) {
    const value = cleanCapturedValue(dislikeMatch[1]);
    addCandidate(candidates, `dislikes-${value}`, `Dislikes ${value}`);
  }

  const petMatch = normalized.match(
    /\bi have\s+(?:a|an)\s+([a-z][^.?!]{0,50}?)\s+named\s+([a-z][a-z\s'-]{1,40})\b/i,
  );
  if (petMatch) {
    addCandidate(
      candidates,
      `pet-${petMatch[2]}`,
      `Has a ${cleanCapturedValue(petMatch[1], 40)} named ${cleanCapturedValue(petMatch[2], 30)}`,
    );
  }

  const identityMatch = normalized.match(
    /\bi(?:'m| am)\s+(vegetarian|vegan|introverted|extroverted|a night owl|an early riser)\b/i,
  );
  if (identityMatch) {
    addCandidate(candidates, `identity-${identityMatch[1]}`, `Is ${cleanCapturedValue(identityMatch[1])}`);
  }

  return candidates;
};

export const normalizeUserMemories = (value: unknown): IUserMemoryEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Partial<IUserMemoryEntry>;
      const id = typeof record.id === 'string' ? slugify(record.id) : '';
      const fact = typeof record.fact === 'string' ? sentenceCase(cleanCapturedValue(record.fact, 120)) : '';

      if (!id || !fact) {
        return null;
      }

      return {
        id,
        fact,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      } satisfies IUserMemoryEntry;
    })
    .filter((entry): entry is IUserMemoryEntry => Boolean(entry))
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, MAX_USER_MEMORY_ITEMS);
};

export const mergeUserMemories = (
  existingMemories: unknown,
  message: string,
): { memories: IUserMemoryEntry[]; changed: boolean } => {
  const currentMemories = normalizeUserMemories(existingMemories);
  const candidates = extractUserMemoryCandidates(message);

  if (candidates.length === 0) {
    return {
      memories: currentMemories,
      changed: false,
    };
  }

  const memoryMap = new Map(currentMemories.map((entry) => [entry.id, entry]));
  let changed = false;
  const now = new Date();

  for (const candidate of candidates) {
    const existingEntry = memoryMap.get(candidate.id);

    if (!existingEntry) {
      memoryMap.set(candidate.id, {
        id: candidate.id,
        fact: candidate.fact,
        createdAt: now,
        updatedAt: now,
      });
      changed = true;
      continue;
    }

    if (existingEntry.fact !== candidate.fact) {
      memoryMap.set(candidate.id, {
        ...existingEntry,
        fact: candidate.fact,
        updatedAt: now,
      });
      changed = true;
    }
  }

  const mergedMemories = Array.from(memoryMap.values())
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, MAX_USER_MEMORY_ITEMS);

  if (mergedMemories.length !== currentMemories.length) {
    changed = true;
  }

  return {
    memories: mergedMemories,
    changed,
  };
};

export const buildPersistentMemoryBlock = (value: unknown): string => {
  const lines = normalizeUserMemories(value)
    .slice(0, MAX_PROMPT_MEMORY_ITEMS)
    .map((entry) => `- ${truncateText(entry.fact, 140)}`);

  if (lines.length === 0) {
    return '';
  }

  return truncateText(lines.join('\n'), MAX_PROMPT_MEMORY_CHARS);
};

export const serializePersistentMemories = (value: unknown): PersistentMemory[] => {
  return normalizeUserMemories(value).map((entry) => ({
    id: entry.id,
    fact: entry.fact,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));
};
