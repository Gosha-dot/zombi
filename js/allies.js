(function (global) {
  const ALLY_TYPES = {
    scout: {
      key: "scout",
      name: "Scout",
      color: "#8dc3ff",
      combat: true,
      shop: false
    },
    quartermaster: {
      key: "quartermaster",
      name: "Quartermaster",
      color: "#ffd34d",
      combat: false,
      shop: true
    },
    ranger: {
      key: "ranger",
      name: "Ranger",
      color: "#67f0a7",
      combat: true,
      shop: true
    }
  };

  const ALLY_SHOP_ITEMS = [
    {
      id: "ally.fieldMedkit",
      name: "Field Medkit",
      description: "Instantly restore 55% of your maximum HP.",
      cost: 95,
      preview: () => "Heal 55% max HP",
      apply: (game) => {
        const maxHp = game.player.getMaxHp();
        game.player.heal(maxHp * 0.55);
      }
    },
    {
      id: "ally.explosiveRounds",
      name: "Explosive Rounds",
      description: "All weapons deal +25% damage for the next wave.",
      cost: 120,
      preview: () => "+25% damage next wave",
      apply: (game) => {
        game.allyDamageBoost = 1.25;
        game.ui.showNotification("Explosive rounds loaded", "accent", 2200);
      }
    },
    {
      id: "ally.stimPack",
      name: "Stim Pack",
      description: "Activate rapid fire for 18 seconds.",
      cost: 110,
      preview: () => "Rapid fire 18s",
      apply: (game) => game.bonuses.applyTimed("rapidFire", 18)
    },
    {
      id: "ally.scrapCache",
      name: "Scrap Cache",
      description: "Convert salvaged parts into 140 coins.",
      cost: 75,
      preview: () => "+140 coins",
      apply: (game) => game.addCoins(140)
    },
    {
      id: "ally.turretKit",
      name: "Turret Kit",
      description: "Gain one deployable turret charge.",
      cost: 130,
      preview: () => "+1 turret charge",
      apply: (game) => {
        game.player.deployTurretCharges = (game.player.deployTurretCharges || 0) + 1;
        game.ui.showNotification("Turret kit acquired", "accent", 2000);
      }
    }
  ];

  class CapturedAlly {
    constructor(game, typeKey, x, y) {
      this.game = game;
      this.typeKey = typeKey in ALLY_TYPES ? typeKey : "scout";
      this.def = ALLY_TYPES[this.typeKey];
      this.x = x;
      this.y = y;
      this.radius = 16;
      this.hp = 55;
      this.maxHp = 55;
      this.pulse = Math.random() * Math.PI * 2;
      this.rescueRadius = 88;
      this.hitCooldown = 0;
      this.alive = true;
      this.rescued = false;
    }

    update(dt) {
      if (!this.alive || this.rescued) {
        return;
      }

      this.pulse += dt * 3.5;
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);

      for (const zombie of this.game.zombies) {
        if (!zombie.alive) {
          continue;
        }
        const dist = GameUtils.distance(this.x, this.y, zombie.x, zombie.y);
        if (dist <= this.radius + zombie.radius + 2 && this.hitCooldown <= 0) {
          this.hitCooldown = 0.75;
          this.takeDamage(zombie.damage * 0.55, zombie.x, zombie.y);
        }
      }
    }

    takeDamage(amount, sourceX = this.x, sourceY = this.y) {
      if (!this.alive || this.rescued) {
        return 0;
      }

      const damage = Math.max(1, amount);
      this.hp -= damage;
      this.game.floaters.add(`-${Math.round(damage)}`, this.x, this.y - 28, "#ff7878", {
        life: 0.7,
        scale: 0.85,
        velocityY: -22
      });

      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
        this.game.allies.onCapturedDeath(this);
      }

      return damage;
    }

    canRescue() {
      if (!this.alive || this.rescued) {
        return false;
      }
      const player = this.game.player;
      return GameUtils.distance(player.x, player.y, this.x, this.y) <= this.rescueRadius;
    }

    draw(ctx) {
      if (!this.alive || this.rescued) {
        return;
      }

      const pulseScale = 1 + Math.sin(this.pulse) * 0.08;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(pulseScale, pulseScale);

      ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
      ctx.beginPath();
      ctx.ellipse(0, 12, this.radius * 1.2, this.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 211, 77, 0.72)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const bodyGradient = ctx.createRadialGradient(-2, -4, 3, 0, 0, this.radius + 6);
      bodyGradient.addColorStop(0, "#fff4d8");
      bodyGradient.addColorStop(0.45, this.def.color);
      bodyGradient.addColorStop(1, "#142018");
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.24)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(-14, -this.radius - 14, 28, 4);
      ctx.fillStyle = hpPct > 0.35 ? "#67f0a7" : "#ff7878";
      ctx.fillRect(-14, -this.radius - 14, 28 * hpPct, 4);

      ctx.fillStyle = "#07100c";
      ctx.font = "700 10px Bahnschrift, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", 0, 0);
      ctx.restore();
    }
  }

  class AllyCompanion {
    constructor(game, typeKey, roles) {
      this.game = game;
      this.typeKey = typeKey in ALLY_TYPES ? typeKey : "scout";
      this.def = ALLY_TYPES[this.typeKey];
      this.roles = roles;
      this.x = game.player.x;
      this.y = game.player.y;
      this.radius = 15;
      this.hp = 70;
      this.maxHp = 70;
      this.alive = true;
      this.shootCooldown = 0;
      this.hitCooldown = 0;
      this.followDistance = 58;
      this.detectRange = 260;
      this.damage = 14;
      this.fireRate = 0.55;
      this.pulse = Math.random() * Math.PI * 2;
    }

    update(dt) {
      if (!this.alive) {
        return;
      }

      this.pulse += dt * 4;
      this.shootCooldown = Math.max(0, this.shootCooldown - dt);
      this.hitCooldown = Math.max(0, this.hitCooldown - dt);

      const player = this.game.player;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const targetDist = Math.max(this.followDistance, dist - 18);
      if (dist > this.followDistance + 6) {
        const speed = 180;
        this.x += (dx / dist) * speed * dt;
        this.y += (dy / dist) * speed * dt;
      }

      const margin = this.radius + 4;
      this.x = GameUtils.clamp(this.x, margin, this.game.width - margin);
      this.y = GameUtils.clamp(this.y, margin, this.game.height - margin);

      if (this.roles.combat) {
        this.tryShoot();
      }

      for (const zombie of this.game.zombies) {
        if (!zombie.alive) {
          continue;
        }
        const contact = GameUtils.distance(this.x, this.y, zombie.x, zombie.y);
        if (contact <= this.radius + zombie.radius && this.hitCooldown <= 0) {
          this.hitCooldown = 0.7;
          this.takeDamage(zombie.damage * 0.5, zombie.x, zombie.y);
        }
      }
    }

    tryShoot() {
      if (this.shootCooldown > 0) {
        return;
      }

      const target = this.game.zombies
        .filter((zombie) => zombie.alive && GameUtils.distance(this.x, this.y, zombie.x, zombie.y) <= this.detectRange)
        .sort((left, right) => GameUtils.distance(this.x, this.y, left.x, left.y) - GameUtils.distance(this.x, this.y, right.x, right.y))[0];

      if (!target) {
        return;
      }

      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      const speed = 920;
      this.shootCooldown = this.fireRate;
      this.game.spawnBullet({
        x: this.x + Math.cos(angle) * (this.radius + 4),
        y: this.y + Math.sin(angle) * (this.radius + 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5,
        damage: this.damage,
        color: this.def.color,
        pierce: 0,
        critChance: 0,
        angle,
        life: 0.75,
        weaponKey: "ally"
      });
      this.game.audio.playSfx("shoot");
    }

    takeDamage(amount) {
      if (!this.alive) {
        return 0;
      }

      const damage = Math.max(1, amount);
      this.hp -= damage;
      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
        this.game.allies.onCompanionDeath(this);
      }
      return damage;
    }

    draw(ctx) {
      if (!this.alive) {
        return;
      }

      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 11, this.radius * 1.15, this.radius * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(-2, -4, 3, 0, 0, this.radius + 5);
      bodyGradient.addColorStop(0, "#eefcf4");
      bodyGradient.addColorStop(0.4, this.def.color);
      bodyGradient.addColorStop(1, "#102018");
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(-12, -this.radius - 12, 24, 3);
      ctx.fillStyle = "#67f0a7";
      ctx.fillRect(-12, -this.radius - 12, 24 * hpPct, 3);
      ctx.restore();
    }
  }

  class AllyManager {
    constructor(game) {
      this.game = game;
      this.reset();
    }

    reset() {
      this.captured = null;
      this.companion = null;
      this.waveSpawnAttempted = false;
      this.shopAvailable = false;
      this.shopUsed = false;
      this.rescueNoticeShown = false;
    }

    onWaveStart() {
      this.waveSpawnAttempted = false;
      this.captured = null;
      this.rescueNoticeShown = false;
    }

    trySpawnCaptured() {
      if (this.waveSpawnAttempted || this.captured || this.companion) {
        return false;
      }

      this.waveSpawnAttempted = true;
      const wave = this.game.waveManager?.wave || 1;
      if (wave < 2 || Math.random() > 0.16) {
        return false;
      }

      const typeKeys = Object.keys(ALLY_TYPES);
      const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
      const spawn = this.game.getEdgeSpawnPoint(false);
      this.captured = new CapturedAlly(this.game, typeKey, spawn.x, spawn.y);
      this.game.ui.showNotification("Survivor spotted - press F to rescue", "accent", 2800);
      this.game.audio.playSfx("ui");
      return true;
    }

    update(dt) {
      if (this.captured && !this.captured.rescued) {
        this.captured.update(dt);
      }
      if (this.companion?.alive) {
        this.companion.update(dt);
      }
    }

    canRescue() {
      return Boolean(this.captured?.alive && this.captured.canRescue());
    }

    tryRescue() {
      if (!this.canRescue()) {
        return false;
      }

      const captured = this.captured;
      captured.rescued = true;
      captured.alive = false;

      const grantCombat = captured.def.combat && (Math.random() < 0.72 || !captured.def.shop);
      const grantShop = captured.def.shop && (Math.random() < 0.72 || !captured.def.combat);
      const roles = {
        combat: grantCombat || captured.typeKey === "scout" || captured.typeKey === "ranger",
        shop: grantShop || captured.typeKey === "quartermaster" || captured.typeKey === "ranger"
      };

      if (roles.combat) {
        this.companion = new AllyCompanion(this.game, captured.typeKey, roles);
      }

      if (roles.shop) {
        this.shopAvailable = true;
        this.shopUsed = false;
      }

      this.captured = null;
      const bonusParts = [];
      if (roles.combat) {
        bonusParts.push("combat support");
      }
      if (roles.shop) {
        bonusParts.push("special shop");
      }

      this.game.ui.showNotification(
        `${captured.def.name} rescued - ${bonusParts.join(" + ")}`,
        "accent",
        3200
      );
      this.game.audio.playSfx("pickup");
      this.game.floaters.add("RESCUED", this.game.player.x, this.game.player.y - 36, "#67f0a7", {
        life: 0.9,
        scale: 1,
        velocityY: -26
      });
      return true;
    }

    onCapturedDeath(ally) {
      this.captured = null;
      this.game.ui.showNotification(`${ally.def.name} died before rescue`, "danger", 2600);
    }

    onCompanionDeath(ally) {
      this.companion = null;
      this.game.ui.showNotification(`${ally.def.name} was overrun`, "danger", 2800);
    }

    getStatusText() {
      if (this.companion?.alive) {
        const parts = ["Alive"];
        if (this.companion.roles.combat) {
          parts.push("Combat");
        }
        if (this.companion.roles.shop && this.shopAvailable && !this.shopUsed) {
          parts.push("Shop");
        }
        return `${this.companion.def.name} - ${parts.join(" / ")}`;
      }

      if (this.captured?.alive) {
        return `Trapped ${this.captured.def.name} - Press F`;
      }

      if (this.companion && !this.companion.alive) {
        return "Ally lost";
      }

      return "None";
    }

    getShopItems() {
      if (!this.shopAvailable || this.shopUsed) {
        return [];
      }

      return ALLY_SHOP_ITEMS.map((item) => ({
        ...item,
        affordable: this.game.coins >= item.cost,
        maxed: false,
        lockReason: "",
        level: 0,
        previewText: item.preview()
      }));
    }

    buyShopItem(id) {
      const item = ALLY_SHOP_ITEMS.find((entry) => entry.id === id);
      if (!item || !this.shopAvailable || this.shopUsed) {
        return { ok: false, reason: "Unavailable" };
      }
      if (this.game.coins < item.cost) {
        return { ok: false, reason: "Not enough coins" };
      }

      this.game.coins -= item.cost;
      item.apply(this.game);
      this.shopUsed = true;
      this.shopAvailable = false;
      this.game.audio.playSfx("ui");
      return { ok: true, cost: item.cost };
    }

    draw(ctx) {
      if (this.captured && !this.captured.rescued) {
        this.captured.draw(ctx);
      }
      if (this.companion?.alive) {
        this.companion.draw(ctx);
      }
    }
  }

  global.AllyManager = AllyManager;
  global.ALLY_TYPES = ALLY_TYPES;
  global.ALLY_SHOP_ITEMS = ALLY_SHOP_ITEMS;
  global.CapturedAlly = CapturedAlly;
  global.AllyCompanion = AllyCompanion;
})(window);
