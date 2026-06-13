(function (global) {
  const MISSION_DEFS = [
    {
      id: "kill20",
      title: "Kill 20 zombies",
      target: 20,
      kind: "count",
      rewardCoins: 120,
      rewardScore: 260
    },
    {
      id: "survive90",
      title: "Survive 90 seconds",
      target: 90,
      kind: "time",
      rewardCoins: 140,
      rewardScore: 320
    },
    {
      id: "findKeycard",
      title: "Find a keycard",
      target: 1,
      kind: "count",
      rewardCoins: 90,
      rewardScore: 220
    },
    {
      id: "noDamage30",
      title: "No damage for 30 seconds",
      target: 30,
      kind: "time",
      rewardCoins: 160,
      rewardScore: 360
    }
  ];

  class MissionManager {
    constructor(game) {
      this.game = game;
      this.reset();
    }

    reset() {
      this.completedCount = 0;
      this.damageResetNoticeCooldown = 0;
      this.missions = MISSION_DEFS.map((mission) => ({
        ...mission,
        progress: 0,
        completed: false
      }));
    }

    update(dt) {
      this.damageResetNoticeCooldown = Math.max(0, this.damageResetNoticeCooldown - dt);
      if (!this.canTrackActivePlay()) {
        return;
      }

      this.addProgress("survive90", dt);
      this.addProgress("noDamage30", dt);
    }

    canTrackActivePlay() {
      return Boolean(
        this.game.state === "playing" &&
        this.game.waveManager?.state === "active" &&
        this.game.player?.hp > 0
      );
    }

    onZombieKilled() {
      this.addProgress("kill20", 1);
    }

    onKeycardCollected() {
      this.addProgress("findKeycard", 1);
    }

    onPlayerDamaged(amount) {
      if (amount <= 0) {
        return;
      }

      const mission = this.getMission("noDamage30");
      if (!mission || mission.completed || mission.progress <= 0) {
        return;
      }

      const lostProgress = mission.progress;
      mission.progress = 0;
      if (lostProgress >= 5 && this.damageResetNoticeCooldown <= 0) {
        this.game.ui.showNotification("No-damage mission reset", "danger", 1400);
        this.damageResetNoticeCooldown = 2.5;
      }
    }

    addProgress(id, amount) {
      const mission = this.getMission(id);
      if (!mission || mission.completed) {
        return false;
      }

      mission.progress = Math.min(mission.target, mission.progress + Math.max(0, amount));
      if (mission.progress >= mission.target) {
        this.completeMission(mission);
      }
      return true;
    }

    completeMission(mission) {
      if (mission.completed) {
        return;
      }

      mission.completed = true;
      mission.progress = mission.target;
      this.completedCount += 1;

      const awardedCoins = this.game.addCoins(mission.rewardCoins);
      this.game.stats.score += mission.rewardScore;
      this.game.floaters.add("MISSION", this.game.player.x, this.game.player.y - 46, "#67f0a7", {
        life: 0.95,
        scale: 1.05,
        velocityY: -26
      });
      this.game.floaters.add(`+${awardedCoins}c`, this.game.player.x + 12, this.game.player.y - 28, "#ffd34d", {
        life: 0.85,
        scale: 0.95,
        velocityY: -24
      });
      this.game.ui.showNotification(`${mission.title} complete`, "accent", 2400);
      this.game.audio.playSfx("bonus");
    }

    getMission(id) {
      return this.missions.find((mission) => mission.id === id);
    }

    getMissions() {
      return this.missions.map((mission) => ({
        ...mission,
        pct: mission.target > 0 ? Math.min(100, (mission.progress / mission.target) * 100) : 0,
        progressText: this.formatProgress(mission)
      }));
    }

    getClearedText() {
      return `${this.completedCount} / ${this.missions.length} cleared`;
    }

    formatProgress(mission) {
      if (mission.completed) {
        return "Complete";
      }

      if (mission.kind === "time") {
        return `${this.formatTime(mission.progress)} / ${this.formatTime(mission.target)}`;
      }

      return `${Math.floor(mission.progress)} / ${mission.target}`;
    }

    formatTime(seconds) {
      const whole = Math.max(0, Math.ceil(seconds || 0));
      const mm = String(Math.floor(whole / 60)).padStart(2, "0");
      const ss = String(whole % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  global.MissionManager = MissionManager;
  global.MISSION_DEFS = MISSION_DEFS;
})(window);
