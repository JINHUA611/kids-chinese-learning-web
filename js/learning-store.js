export const STORAGE_KEY = 'little-hanzi-learning-v1';

const emptyData = () => ({ version: 1, records: {} });

export function createLearningStore(storage, now = () => new Date()) {
  function load() {
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY));
      if (saved?.version === 1 && saved.records && typeof saved.records === 'object') return saved;
    } catch {
      // 损坏或旧格式的数据不阻止孩子继续使用。
    }
    return emptyData();
  }

  function save(data) {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function mark(characterId, status) {
    if (!['known', 'learning'].includes(status)) throw new Error('Unknown learning status');
    const data = load();
    const timestamp = now().toISOString();
    const previous = data.records[characterId] ?? {
      status: 'unseen', firstLearnedAt: timestamp, lastLearnedAt: timestamp,
      studyCount: 0, knownCount: 0, learningCount: 0
    };
    data.records[characterId] = {
      ...previous,
      status,
      firstLearnedAt: previous.firstLearnedAt || timestamp,
      lastLearnedAt: timestamp,
      studyCount: previous.studyCount + 1,
      knownCount: previous.knownCount + (status === 'known' ? 1 : 0),
      learningCount: previous.learningCount + (status === 'learning' ? 1 : 0)
    };
    save(data);
    return data.records[characterId];
  }

  function getRecord(characterId) {
    return load().records[characterId] ?? null;
  }

  function getStats(characterList) {
    const records = load().records;
    const known = characterList.filter(({ id }) => records[id]?.status === 'known').length;
    const learning = characterList.filter(({ id }) => records[id]?.status === 'learning').length;
    const total = characterList.length;
    return { total, known, learning, unseen: total - known - learning, percent: total ? Math.round((known / total) * 100) : 0 };
  }

  function isLibraryComplete(characterList) {
    const stats = getStats(characterList);
    return stats.total > 0 && stats.known === stats.total;
  }

  function getTodayCount(characterList) {
    const today = localDateKey(now());
    return characterList.filter(({ id }) => {
      const value = load().records[id]?.lastLearnedAt;
      return value && localDateKey(new Date(value)) === today;
    }).length;
  }

  function getRecent(characterList, limit = 5) {
    const records = load().records;
    return characterList.filter(({ id }) => records[id]).sort((a, b) =>
      new Date(records[b.id].lastLearnedAt) - new Date(records[a.id].lastLearnedAt)
    ).slice(0, limit);
  }

  function getReviewQueue(characterList) {
    const records = load().records;
    return characterList.filter(({ id }) => records[id]?.status === 'learning')
      .sort((a, b) => new Date(records[a.id].lastLearnedAt) - new Date(records[b.id].lastLearnedAt));
  }

  // 今日识字在全部字都学过后仍沿用原有兜底顺序，不影响“复习一下”的范围。
  function getPracticeQueue(characterList) {
    const records = load().records;
    const learning = getReviewQueue(characterList);
    const known = characterList.filter(({ id }) => records[id]?.status === 'known')
      .sort((a, b) => new Date(records[a.id].lastLearnedAt) - new Date(records[b.id].lastLearnedAt));
    return [...learning, ...known];
  }

  return { load, mark, getRecord, getStats, isLibraryComplete, getTodayCount, getRecent, getReviewQueue, getPracticeQueue };
}

function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
