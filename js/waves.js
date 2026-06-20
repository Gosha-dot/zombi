(function (global) {
  class WaveManager {
    constructor(game) {
      this.game = game;
      this.reset();
    }

    reset() {
      this.wave = 0;
      this.nextWaveDelay = 0;
      this.spawnTimer = 0;
      this.spawned = 0;
      this.totalToSpawn = 0;
      this.bossWave = false;
      this.keyCarrierAssigned = false;
      this.state = "idle";
      this.wavesCleared = 0;
    }

    startRun() {
      this.reset();
      this.beginWave();
    }

    beginWave() {
      const mode = this.game.getModeSettings?.() || {};
      this.wave += 1;
      this.state = "active";
      this.bossWave = Boolean(mode.bossEveryWave) || this.wave % 5 === 0;
      this.keyCarrierAssigned = false;
      this.game.resetLevelState(true);
      this.game.pendingLocationName = null;
      this.spawned = 0;
      const baseTotal = this.bossWave ? Math.max(5, Math.round(4 + this.wave * 0.4)) : Math.round(7 + this.wave * 2.6);
      this.totalToSpawn = Math.max(this.bossWave ? 3 : 4, Math.round(baseTotal * (mode.spawnCountMult || 1)));
      this.spawnTimer = this.bossWave ? 0.9 : 0.45;

      this.game.player.refillAmmo();
      this.game.addGrenades(1, { notify: false, floaters: false });

      const locationName = this.game.getCurrentLocation()?.name || "Unknown Zone";
      this.game.ui.showNotification(
        this.bossWave ? `Boss wave ${this.wave} incoming - ${locationName}` : `Wave ${this.wave} started - ${locationName}`,
        "accent",
        2600
      );
      this.game.ui.setShopCountdown(0);
      this.game.ui.setWaveText(this.wave);
      this.game.audio.playSfx("ui");
    }

    beginIntermission() {
      this.state = "intermission";
      const mode = this.game.getModeSettings?.() || {};
      this.nextWaveDelay = mode.intermissionDelay ?? 8;
      this.game.state = "intermission";
      this.game.ui.setMode("intermission");
      const locationName = this.game.pendingLocationName ? ` - next: ${this.game.pendingLocationName}` : "";
      this.game.ui.showNotification(`Wave ${this.wave} cleared${locationName}`, "accent", 2600);
      this.game.ui.openShop();
      this.game.audio.playSfx("ui");
      this.game.addCoins(60 + this.wave * 20);
      this.game.stats.score += Math.round((120 + this.wave * 45) * (this.game.getModeSettings?.().scoreMult || 1));
      this.game.stats.waves = this.wavesCleared;
    }

    skipCountdown() {
      if (this.state !== "intermission") {
        return;
      }
      this.nextWaveDelay = 0;
      this.finishIntermission();
    }

    finishIntermission() {
      this.game.ui.closeShop();
      this.beginWave();
      this.game.state = "playing";
      this.game.ui.setMode("playing");
    }

    completeWave() {
      this.state = "completed";
      this.wavesCleared += 1;
      this.beginIntermission();
    }

    getRemainingEnemies() {
      return this.game.zombies.length + Math.max(0, this.totalToSpawn - this.spawned);
    }

    chooseType() {
      if (this.bossWave && this.spawned === 0) {
        const bossTypes = this.wave < 10
          ? ["boss", "plagueBoss"]
          : ["boss", "plagueBoss", "juggernautBoss", "screamerBoss"];
        return bossTypes[(Math.floor(this.wave / 5) + Math.floor(Math.random() * bossTypes.length)) % bossTypes.length];
      }

      const wave = this.wave;
      const roll = Math.random();
      const locationKey = this.game.worldLayout?.locationKey;
      const pickWeighted = (entries) => {
        const total = entries.reduce((sum, entry) => sum + entry[1], 0);
        let cursor = Math.random() * total;
        for (const [type, weight] of entries) {
          cursor -= weight;
          if (cursor <= 0) {
            return type;
          }
        }
        return entries[entries.length - 1][0];
      };

      if (locationKey === "laboratory") {
        if (wave < 4) {
          return pickWeighted([
            ["walker", 52],
            ["runner", 14],
            ["crawler", 24],
            ["exploder", 10]
          ]);
        }
        if (wave < 8) {
          return pickWeighted([
            ["walker", 26],
            ["runner", 18],
            ["crawler", 22],
            ["exploder", 14],
            ["tank", 12],
            ["stalker", 8]
          ]);
        }
        return pickWeighted([
          ["walker", 18],
          ["runner", 16],
          ["crawler", 20],
          ["shooter", 10],
          ["exploder", 12],
          ["tank", 12],
          ["brute", 6],
          ["spitter", 6]
        ]);
      }

      if (locationKey === "hospital") {
        if (wave < 4) {
          return pickWeighted([
            ["walker", 48],
            ["runner", 14],
            ["crawler", 20],
            ["spitter", 10],
            ["shooter", 8]
          ]);
        }
        if (wave < 8) {
          return pickWeighted([
            ["walker", 22],
            ["runner", 14],
            ["crawler", 16],
            ["shooter", 16],
            ["spitter", 18],
            ["exploder", 8],
            ["stalker", 6]
          ]);
        }
        return pickWeighted([
          ["walker", 12],
          ["runner", 12],
          ["crawler", 16],
          ["shooter", 16],
          ["spitter", 18],
          ["exploder", 8],
          ["tank", 8],
          ["harpooner", 10]
        ]);
      }

      if (locationKey === "warehouse") {
        if (wave < 4) {
          return pickWeighted([
            ["walker", 44],
            ["runner", 12],
            ["crawler", 16],
            ["exploder", 14],
            ["tank", 14]
          ]);
        }
        if (wave < 8) {
          return pickWeighted([
            ["walker", 22],
            ["runner", 12],
            ["crawler", 12],
            ["exploder", 18],
            ["tank", 18],
            ["shooter", 10],
            ["brute", 8]
          ]);
        }
        return pickWeighted([
          ["walker", 12],
          ["crawler", 12],
          ["exploder", 18],
          ["tank", 18],
          ["shooter", 10],
          ["brute", 16],
          ["spitter", 8],
          ["harpooner", 6]
        ]);
      }

      if (locationKey === "forest") {
        if (wave < 4) {
          return pickWeighted([
            ["walker", 44],
            ["runner", 24],
            ["crawler", 18],
            ["stalker", 14]
          ]);
        }
        if (wave < 8) {
          return pickWeighted([
            ["walker", 20],
            ["runner", 22],
            ["crawler", 16],
            ["stalker", 18],
            ["exploder", 10],
            ["spitter", 8],
            ["tank", 6]
          ]);
        }
        return pickWeighted([
          ["walker", 12],
          ["runner", 18],
          ["crawler", 14],
          ["stalker", 18],
          ["spitter", 12],
          ["harpooner", 10],
          ["brute", 8],
          ["tank", 8]
        ]);
      }

      if (wave < 4) {
        if (roll < 0.78) return "walker";
        if (roll < 0.95) return "runner";
        return "exploder";
      }
      if (wave < 8) {
        if (roll < 0.55) return "walker";
        if (roll < 0.77) return "runner";
        if (roll < 0.9) return "exploder";
        if (roll < 0.96) return "shooter";
        return "tank";
      }
      if (wave < 12) {
        if (roll < 0.35) return "walker";
        if (roll < 0.58) return "runner";
        if (roll < 0.7) return "shooter";
        if (roll < 0.8) return "exploder";
        if (roll < 0.88) return "tank";
        if (roll < 0.94) return "stalker";
        return "spitter";
      }
      if (roll < 0.22) return "walker";
      if (roll < 0.4) return "runner";
      if (roll < 0.52) return "shooter";
      if (roll < 0.65) return "exploder";
      if (roll < 0.78) return "tank";
      if (roll < 0.88) return "stalker";
      if (roll < 0.95) return "spitter";
      return "brute";
    }

    spawnZombie() {
      const type = this.chooseType();
      const isBoss = ZOMBIE_DEFS[type]?.isBoss;
      const spawn = this.game.getEdgeSpawnPoint(isBoss);
      const shouldCarryKeycard = !this.game.doorOpen && this.game.player.keycards === 0 && !this.keyCarrierAssigned && !isBoss;
      this.game.spawnZombie(type, spawn, { keyCarrier: shouldCarryKeycard });
      if (shouldCarryKeycard) {
        this.keyCarrierAssigned = true;
      }
      this.spawned += 1;
      if (isBoss) {
        this.game.ui.showNotification(`${ZOMBIE_DEFS[type]?.name || "Boss"} deployed`, "danger", 2200);
      }
    }

    update(dt) {
      if (this.state === "intermission") {
        this.nextWaveDelay -= dt;
        this.game.ui.setShopCountdown(this.nextWaveDelay);
        if (this.nextWaveDelay <= 0) {
          this.finishIntermission();
        }
        return;
      }

      if (this.state !== "active") {
        return;
      }

      this.spawnTimer -= dt;
      const mode = this.game.getModeSettings?.() || {};
      const intervalMult = mode.spawnIntervalMult || 1;
      const spawnInterval = (this.bossWave ? Math.max(0.32, 0.82 - this.wave * 0.02) : Math.max(0.28, 0.95 - this.wave * 0.03)) * intervalMult;

      while (this.spawnTimer <= 0 && this.spawned < this.totalToSpawn) {
        this.spawnZombie();
        this.spawnTimer += spawnInterval;
      }

      if (this.spawned >= this.totalToSpawn && this.game.zombies.length === 0) {
        this.game.armLevelAdvance();
      }

      this.game.ui.setWaveText(this.wave);
    }
  }

  global.WaveManager = WaveManager;
})(window);
