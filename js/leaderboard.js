(function (global) {
  const STORAGE_KEY = "zombie-apocalypse-leaderboard";

  function safeReadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function safeWriteStorage(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      return false;
    }
    return true;
  }

  class LeaderboardStore {
    load() {
      const list = safeReadStorage();
      return Array.isArray(list) ? list : [];
    }

    top(limit = 10) {
      return this.load()
        .slice()
        .sort(this.sorter)
        .slice(0, limit);
    }

    getBest() {
      return this.top(1)[0] || null;
    }

    sorter(a, b) {
      const scoreDelta = (b.score || 0) - (a.score || 0);
      if (scoreDelta !== 0) return scoreDelta;
      const waveDelta = (b.waves || 0) - (a.waves || 0);
      if (waveDelta !== 0) return waveDelta;
      const killDelta = (b.kills || 0) - (a.kills || 0);
      if (killDelta !== 0) return killDelta;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }

    saveScore(entry) {
      const current = this.load();
      const savedEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerName: entry.playerName || "Survivor",
        modeKey: entry.modeKey || "normal",
        modeName: entry.modeName || "Normal",
        score: Math.round(entry.score || 0),
        waves: Math.round(entry.waves || 0),
        kills: Math.round(entry.kills || 0),
        accuracy: Math.round((entry.accuracy || 0) * 10) / 10,
        headshots: Math.round(entry.headshots || 0),
        date: entry.date || new Date().toISOString()
      };

      current.push(savedEntry);
      current.sort(this.sorter);
      const top = current.slice(0, 10);
      safeWriteStorage(top);

      const rank = top.findIndex((item) => item.id === savedEntry.id);
      return {
        entry: savedEntry,
        rank,
        isNewRecord: rank === 0
      };
    }

    formatDate(dateValue) {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    }
  }

  global.LeaderboardStore = LeaderboardStore;
})(window);
