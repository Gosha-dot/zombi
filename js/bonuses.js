(function (global) {
  const BONUS_DEFS = {
    healthPack: {
      key: "healthPack",
      label: "Health Pack",
      icon: "HP",
      color: "#67f0a7",
      kind: "instant"
    },
    fullHeal: {
      key: "fullHeal",
      label: "Full Heal",
      icon: "FH",
      color: "#f8fff5",
      kind: "instant"
    },
    keycard: {
      key: "keycard",
      label: "Keycard",
      icon: "KC",
      color: "#ffd34d",
      kind: "quest"
    },
    grenadePack: {
      key: "grenadePack",
      label: "Grenade Pack",
      icon: "GR",
      color: "#ffca63",
      kind: "instant"
    },
    ammoPack: {
      key: "ammoPack",
      label: "Ammo Pack",
      icon: "AM",
      color: "#9dffcf",
      kind: "instant"
    },
    armorPlate: {
      key: "armorPlate",
      label: "Armor Plate",
      icon: "AR",
      color: "#c4d5ff",
      kind: "instant"
    },
    moduleDamage: {
      key: "moduleDamage",
      label: "Damage Chip",
      icon: "DM",
      color: "#ff7f6f",
      kind: "module",
      moduleKey: "damage"
    },
    moduleRapid: {
      key: "moduleRapid",
      label: "Cycler Module",
      icon: "RF",
      color: "#67f0a7",
      kind: "module",
      moduleKey: "rapid"
    },
    moduleMagazine: {
      key: "moduleMagazine",
      label: "Drum Module",
      icon: "MG",
      color: "#ffd34d",
      kind: "module",
      moduleKey: "magazine"
    },
    moduleReload: {
      key: "moduleReload",
      label: "Loader Module",
      icon: "RL",
      color: "#8dc3ff",
      kind: "module",
      moduleKey: "reload"
    },
    moduleOptic: {
      key: "moduleOptic",
      label: "Optic Module",
      icon: "OP",
      color: "#d8fbff",
      kind: "module",
      moduleKey: "optic"
    },
    modulePierce: {
      key: "modulePierce",
      label: "Penetrator Module",
      icon: "PI",
      color: "#c77dff",
      kind: "module",
      moduleKey: "pierce"
    },
    doubleDamage: {
      key: "doubleDamage",
      label: "Double Damage",
      icon: "2x",
      color: "#ff6f61",
      kind: "timed",
      duration: 10
    },
    rapidFire: {
      key: "rapidFire",
      label: "Rapid Fire",
      icon: "RF",
      color: "#ffd34d",
      kind: "timed",
      duration: 10
    },
    shield: {
      key: "shield",
      label: "Shield",
      icon: "SH",
      color: "#8dc3ff",
      kind: "timed",
      duration: 12
    },
    coinMultiplier: {
      key: "coinMultiplier",
      label: "Coin Multiplier",
      icon: "CM",
      color: "#f1d96b",
      kind: "timed",
      duration: 14
    },
    freeze: {
      key: "freeze",
      label: "Freeze Zombies",
      icon: "FR",
      color: "#98f0ff",
      kind: "timed",
      duration: 5
    },
    nuke: {
      key: "nuke",
      label: "Nuke",
      icon: "NU",
      color: "#ff9f5a",
      kind: "instant"
    }
  };

  class BonusPickup {
    constructor(game, type, x, y) {
      this.game = game;
      this.type = type in BONUS_DEFS ? type : "healthPack";
      this.def = BONUS_DEFS[this.type];
      this.x = x;
      this.y = y;
      this.radius = 14;
      this.life = 18;
      this.pulse = Math.random() * Math.PI * 2;
      this.vx = (Math.random() - 0.5) * 18;
      this.vy = -18 - Math.random() * 18;
      this.collected = false;
    }

    update(dt) {
      if (this.collected) {
        return;
      }

      this.life -= dt;
      this.pulse += dt * 4;

      const player = this.game.player;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < 160) {
        const pull = 120 + (160 - dist) * 2.2;
        this.vx += (dx / dist) * pull * dt;
        this.vy += (dy / dist) * pull * dt;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.94;
      this.vy *= 0.94;

      if (dist < this.radius + player.radius + 10) {
        this.collect();
      }
    }

    collect() {
      if (this.collected) {
        return;
      }

      this.collected = true;
      this.game.bonuses.applyPickup(this.type);
      this.game.particles.explosion(this.x, this.y, 8, this.def.color);
      this.game.audio.playSfx("pickup");
    }

    draw(ctx) {
      if (this.collected) {
        return;
      }

      const pulseScale = 1 + Math.sin(this.pulse) * 0.1;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(pulseScale, pulseScale);

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 12, this.radius * 1.3, this.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 2.2);
      glow.addColorStop(0, this.def.color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#07100c";
      ctx.font = "700 11px Bahnschrift, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.def.icon, 0, 0);
      ctx.restore();
    }
  }

  class BonusManager {
    constructor(game) {
      this.game = game;
      this.timers = {};
      this.reset();
    }

    reset() {
      this.timers = {
        doubleDamage: 0,
        rapidFire: 0,
        shield: 0,
        coinMultiplier: 0,
        freeze: 0
      };
    }

    update(dt) {
      for (const key of Object.keys(this.timers)) {
        if (this.timers[key] > 0) {
          this.timers[key] = Math.max(0, this.timers[key] - dt);
        }
      }
    }

    isActive(type) {
      return Boolean(this.timers[type] > 0);
    }

    getCoinMultiplier() {
      return this.isActive("coinMultiplier") ? 2 : 1;
    }

    getActiveBonuses() {
      return Object.keys(this.timers)
        .filter((key) => this.timers[key] > 0)
        .map((key) => ({
          key,
          label: BONUS_DEFS[key].label,
          remaining: this.timers[key]
        }));
    }

    applyTimed(type, duration) {
      const def = BONUS_DEFS[type];
      this.timers[type] = Math.max(this.timers[type] || 0, duration || def.duration || 0);
      this.game.ui.showNotification(`${def.label} activated`, "accent", 2400);
      this.game.audio.playSfx("bonus");
    }

    applyPickup(type) {
      const def = BONUS_DEFS[type];
      if (!def) {
        return;
      }

      switch (type) {
        case "healthPack":
          this.game.player.heal(40 + this.game.waveManager.wave * 2);
          this.game.ui.showNotification("Health Pack collected", "accent", 2200);
          break;
        case "fullHeal":
          this.game.player.heal(Infinity, true);
          this.game.ui.showNotification("Full Heal collected", "accent", 2200);
          break;
        case "ammoPack":
          this.game.player.addAmmo(35);
          this.game.ui.showNotification("Ammo Pack collected", "accent", 2200);
          break;
        case "armorPlate":
          this.game.player.applyUpgrade("defense.armor");
          this.game.ui.showNotification("Armor Plate collected", "accent", 2200);
          break;
        case "keycard":
          this.game.collectKeycard();
          break;
        case "grenadePack":
          this.game.addGrenades(1);
          break;
        case "moduleDamage":
        case "moduleRapid":
        case "moduleMagazine":
        case "moduleReload":
        case "moduleOptic":
        case "modulePierce":
          this.game.collectWeaponModule(def.moduleKey);
          break;
        case "doubleDamage":
        case "rapidFire":
        case "shield":
        case "coinMultiplier":
        case "freeze":
          this.applyTimed(type, def.duration);
          if (type === "freeze") {
            this.game.addShake(2);
          }
          break;
        case "nuke":
          this.game.ui.showNotification("Nuke detonated", "danger", 2200);
          this.game.nukeZombies();
          break;
        default:
          break;
      }
    }

    rollDrop(zombie) {
      const wave = this.game.waveManager.wave;
      const locationProfile = this.game.worldLayout?.lootProfile || {};
      const dropCeiling = locationProfile.baseChance || 0.24;
      const isBoss = zombie.isBoss?.();
      const baseChance = isBoss
        ? 1
        : Math.min(dropCeiling, 0.14 + wave * 0.004 + (locationProfile.chanceBonus || 0));
      if (Math.random() > baseChance) {
        return [];
      }

      const defaultWeights = [
        ["healthPack", isBoss ? 20 : 24],
        ["fullHeal", isBoss ? 8 : 2],
        ["ammoPack", isBoss ? 16 : 8],
        ["armorPlate", isBoss ? 10 : 4],
        ["doubleDamage", 18],
        ["rapidFire", 16],
        ["shield", 15],
        ["coinMultiplier", 12],
        ["freeze", 11],
        ["nuke", isBoss ? 14 : 4],
        ["grenadePack", isBoss ? 16 : 7],
        ["moduleDamage", isBoss ? 13 : 6],
        ["moduleRapid", isBoss ? 12 : 5],
        ["moduleMagazine", isBoss ? 12 : 5],
        ["moduleReload", isBoss ? 11 : 5],
        ["moduleOptic", isBoss ? 10 : 4],
        ["modulePierce", isBoss ? 9 : 3]
      ];
      const weights = (locationProfile.weights || defaultWeights).map(([type, weight]) => {
        const bonus = locationProfile.bonusBoosts?.[type] || 0;
        return [type, weight + bonus];
      });

      const pickWeighted = () => {
        const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
        let roll = Math.random() * total;
        for (const [type, weight] of weights) {
          roll -= weight;
          if (roll <= 0) {
            return type;
          }
        }
        return "healthPack";
      };

      const count = isBoss ? 2 : locationProfile.count || 1;
      const drops = [];
      for (let i = 0; i < count; i += 1) {
        const type = pickWeighted();
        drops.push(new BonusPickup(this.game, type, zombie.x + (Math.random() - 0.5) * 18, zombie.y + (Math.random() - 0.5) * 18));
      }
      return drops;
    }
  }

  global.BonusManager = BonusManager;
  global.BonusPickup = BonusPickup;
  global.BONUS_DEFS = BONUS_DEFS;
})(window);
