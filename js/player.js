(function (global) {
  class Player {
    constructor(game) {
      this.game = game;
      this.radius = 18;
      this.bodyRadius = 18;
      this.weaponStates = {};
      this.upgrades = {};
      this.reset();
    }

    reset() {
      this.x = this.game.width * 0.5;
      this.y = this.game.height * 0.5;
      this.vx = 0;
      this.vy = 0;
      this.aimX = this.x + 1;
      this.aimY = this.y;
      this.weaponIndex = 0;
      this.weaponKey = WEAPON_KEYS[this.weaponIndex];
      this.reloadTimer = 0;
      this.shootCooldown = 0;
      this.shootFlash = 0;
      this.recoilKick = 0;
      this.dashCooldown = 0;
      this.dashTime = 0;
      this.dashVector = { x: 0, y: 0 };
      this.invulnTimer = 0;
      this.damageFlash = 0;
      this.lastDamageAngle = 0;
      this.lastHitBy = null;
      this.ammoReserve = 100;
      this.grenadeCount = 2;
      this.maxGrenades = 3;
      this.keycards = 0;
      this.ownedWeapons = new Set(WEAPON_KEYS.slice(0, 4));
      this.weaponStates = {};
      this.weaponModules = {};
      this.upgrades = {
        health: 0,
        regen: 0,
        weaponDamage: 0,
        reload: 0,
        fireRate: 0,
        magazine: 0,
        speed: 0,
        dash: 0,
        armor: 0,
        reduction: 0
      };
      this.hp = this.getMaxHp();

      for (const key of WEAPON_KEYS) {
        const weapon = getWeaponStats(key, this);
        this.weaponStates[key] = {
          mag: weapon.magazineSize
        };
        this.weaponModules[key] = {};
      }
    }

    getMaxHp() {
      return 100 + this.upgrades.health * 20;
    }

    getRegenRate() {
      return this.upgrades.regen * 0.45;
    }

    getMoveSpeed() {
      return 250 + this.upgrades.speed * 22;
    }

    getArmor() {
      return this.upgrades.armor * 2;
    }

    getDamageReduction() {
      return Math.min(0.5, this.upgrades.reduction * 0.04);
    }

    getDashData() {
      const level = this.upgrades.dash || 0;
      return {
        unlocked: level > 0,
        cooldown: Math.max(0.8, 2.2 - level * 0.18),
        duration: 0.14 + level * 0.01,
        speed: 650 + level * 60
      };
    }

    getCurrentWeaponStats() {
      return getWeaponStats(this.weaponKey, this);
    }

    refillAmmo() {
      for (const key of this.getOwnedWeaponKeys()) {
        const weapon = getWeaponStats(key, this);
        if (!this.weaponStates[key]) {
          this.weaponStates[key] = { mag: weapon.magazineSize };
        }
        this.weaponStates[key].mag = weapon.magazineSize;
      }
      this.ammoReserve = 100;
      return this.ammoReserve;
    }

    addAmmo(amount) {
      const before = this.ammoReserve;
      this.ammoReserve = Math.min(100, Math.max(0, this.ammoReserve + Math.max(0, amount)));
      return this.ammoReserve - before;
    }

    addGrenades(amount) {
      const before = this.grenadeCount;
      this.grenadeCount = Math.min(this.maxGrenades, Math.max(0, this.grenadeCount + Math.max(0, amount)));
      return this.grenadeCount - before;
    }

    getGrenadeText() {
      return `${Math.max(0, Math.ceil(this.grenadeCount))} / ${Math.max(0, Math.ceil(this.maxGrenades))}`;
    }

    getWeaponModuleLevel(weaponKey, moduleKey) {
      return this.weaponModules?.[weaponKey]?.[moduleKey] || 0;
    }

    getWeaponModuleSummary(weaponKey = this.weaponKey) {
      const levels = this.weaponModules?.[weaponKey] || {};
      return WEAPON_MODULE_KEYS
        .map((moduleKey) => {
          const level = levels[moduleKey] || 0;
          if (!level) {
            return null;
          }
          const definition = WEAPON_MODULE_DEFS[moduleKey];
          if (!definition) {
            return null;
          }
          return {
            key: moduleKey,
            level,
            short: definition.short || definition.icon || moduleKey.toUpperCase(),
            name: definition.name
          };
        })
        .filter(Boolean);
    }

    getWeaponModuleText(weaponKey = this.weaponKey) {
      const modules = this.getWeaponModuleSummary(weaponKey);
      if (!modules.length) {
        return "None";
      }
      return modules.map((module) => `${module.short}${module.level}`).join(" ");
    }

    addWeaponModule(moduleKey, weaponKey = this.weaponKey) {
      const definition = WEAPON_MODULE_DEFS[moduleKey];
      if (!definition || !this.ownedWeapons.has(weaponKey)) {
        return { ok: false, reason: "Unavailable" };
      }

      if (!this.weaponModules[weaponKey]) {
        this.weaponModules[weaponKey] = {};
      }

      const currentLevel = this.weaponModules[weaponKey][moduleKey] || 0;
      if (currentLevel >= definition.maxLevel) {
        return { ok: false, reason: "Max level" };
      }

      this.weaponModules[weaponKey][moduleKey] = currentLevel + 1;
      const stats = getWeaponStats(weaponKey, this);
      if (this.weaponStates[weaponKey]) {
        this.weaponStates[weaponKey].mag = Math.min(this.weaponStates[weaponKey].mag, stats.magazineSize);
      }
      return { ok: true, level: currentLevel + 1, maxLevel: definition.maxLevel };
    }

    getOwnedWeaponKeys() {
      return WEAPON_KEYS.filter((key) => this.ownedWeapons.has(key));
    }

    hasWeapon(key) {
      return this.ownedWeapons.has(key);
    }

    unlockWeapon(key, autoEquip = true) {
      const weapon = WEAPON_DEFS[key];
      if (!weapon || this.ownedWeapons.has(key)) {
        return false;
      }

      this.ownedWeapons.add(key);
      if (!this.weaponStates[key]) {
        this.weaponStates[key] = { mag: getWeaponStats(key, this).magazineSize };
      }
      this.weaponStates[key].mag = getWeaponStats(key, this).magazineSize;
      this.weaponModules[key] = this.weaponModules[key] || {};

      if (autoEquip) {
        this.selectWeapon(key, false);
      }

      return true;
    }

    selectWeapon(key, playSound = true) {
      if (!this.ownedWeapons.has(key)) {
        return false;
      }

      const keys = this.getOwnedWeaponKeys();
      const index = keys.indexOf(key);
      if (index < 0) {
        return false;
      }

      this.weaponIndex = index;
      this.weaponKey = key;
      if (playSound) {
        this.game.audio.playSfx("ui");
      }
      return true;
    }

    getAmmoText() {
      const state = this.weaponStates[this.weaponKey];
      return `${Math.max(0, Math.ceil(state.mag))} / ${Math.max(0, Math.ceil(this.ammoReserve))}`;
    }

    getCurrentWeaponName() {
      return (WEAPON_DEFS[this.weaponKey] || WEAPON_DEFS.pistol).name;
    }

    setWeaponByIndex(index) {
      const keys = this.getOwnedWeaponKeys();
      if (index < 0 || index >= keys.length) {
        return false;
      }
      this.weaponIndex = index;
      this.weaponKey = keys[index];
      this.game.audio.playSfx("ui");
      return true;
    }

    switchWeapon(delta) {
      const keys = this.getOwnedWeaponKeys();
      if (!keys.length) {
        return false;
      }
      const normalized = ((this.weaponIndex + delta) % keys.length + keys.length) % keys.length;
      return this.setWeaponByIndex(normalized);
    }

    startDash() {
      const dashData = this.getDashData();
      if (!dashData.unlocked || this.dashCooldown > 0 || this.dashTime > 0) {
        return false;
      }

      const move = this.getMoveVector();
      const aim = this.getAimVector();
      const direction = move.x || move.y ? move : aim;
      const length = Math.hypot(direction.x, direction.y) || 1;

      this.dashVector = {
        x: direction.x / length,
        y: direction.y / length
      };
      this.dashTime = dashData.duration;
      this.dashCooldown = dashData.cooldown;
      this.invulnTimer = Math.max(this.invulnTimer, dashData.duration * 0.95);
      this.game.audio.playSfx("ui");
      this.game.addShake(2);
      return true;
    }

    requestReload() {
      const stats = this.getCurrentWeaponStats();
      const state = this.weaponStates[this.weaponKey];
      if (this.reloadTimer > 0 || state.mag >= stats.magazineSize || this.ammoReserve <= 0) {
        return false;
      }
      this.reloadTimer = stats.reloadTime;
      this.game.audio.playSfx("reload");
      return true;
    }

    completeReload() {
      const stats = this.getCurrentWeaponStats();
      const state = this.weaponStates[this.weaponKey];
      const needed = Math.max(0, stats.magazineSize - state.mag);
      const loaded = Math.min(needed, this.ammoReserve);
      state.mag += loaded;
      this.ammoReserve -= loaded;
    }

    tryThrowGrenade() {
      if (this.grenadeCount <= 0 || this.hp <= 0) {
        if (this.grenadeCount <= 0) {
          this.game.ui.showNotification("No grenades left", "normal", 1400);
        }
        return false;
      }

      const aim = this.getAimVector();
      const offset = this.radius + 6;
      const speed = 520;
      const spread = (Math.random() - 0.5) * 0.14;
      const angle = Math.atan2(aim.y, aim.x) + spread;
      const originX = this.x + Math.cos(angle) * offset;
      const originY = this.y + Math.sin(angle) * offset;

      this.grenadeCount = Math.max(0, this.grenadeCount - 1);
      this.game.spawnGrenade({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 160,
        radius: 7.5,
        fuse: 1.15,
        damage: 92,
        blastRadius: 112,
        color: "#ffca63"
      });
      this.game.floaters.add("GRENADE", originX, originY - 14, "#ffd34d", {
        life: 0.6,
        scale: 0.9,
        velocityY: -20
      });
      this.game.audio.playSfx("grenadeThrow");
      this.game.addShake(2.5);
      return true;
    }

    getMoveVector() {
      const keys = this.game.input.keys;
      let x = 0;
      let y = 0;
      if (keys.ArrowLeft || keys.KeyA) x -= 1;
      if (keys.ArrowRight || keys.KeyD) x += 1;
      if (keys.ArrowUp || keys.KeyW) y -= 1;
      if (keys.ArrowDown || keys.KeyS) y += 1;
      x += this.game.input.touchMoveX;
      y += this.game.input.touchMoveY;
      const len = Math.hypot(x, y);
      if (len > 1) {
        return { x: x / len, y: y / len };
      }
      return { x, y };
    }

    getAimVector() {
      const dx = this.aimX - this.x;
      const dy = this.aimY - this.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    }

    update(dt, active = true) {
      const game = this.game;
      const maxHp = this.getMaxHp();
      if (this.hp == null) {
        this.hp = maxHp;
      }

      if (this.reloadTimer > 0) {
        this.reloadTimer -= dt;
        if (this.reloadTimer <= 0) {
          this.completeReload();
        }
      }

      if (this.shootCooldown > 0) {
        this.shootCooldown -= dt;
      }

      if (this.dashCooldown > 0) {
        this.dashCooldown -= dt;
      }

      if (this.dashTime > 0) {
        this.dashTime -= dt;
      }

      if (this.invulnTimer > 0) {
        this.invulnTimer -= dt;
      }

      if (this.damageFlash > 0) {
        this.damageFlash -= dt;
      }
      if (this.shootFlash > 0) {
        this.shootFlash -= dt;
      }
      if (this.recoilKick > 0) {
        this.recoilKick -= dt;
      }

      this.aimX = game.input.aimX;
      this.aimY = game.input.aimY;

      const currentWeapon = this.weaponStates[this.weaponKey];
      const weaponStats = this.getCurrentWeaponStats();
      currentWeapon.mag = Math.min(currentWeapon.mag, weaponStats.magazineSize);

      if (active) {
        const move = this.getMoveVector();
        const speed = this.getMoveSpeed();
        let vx = move.x * speed;
        let vy = move.y * speed;

        if (this.dashTime > 0) {
          vx = this.dashVector.x * this.getDashData().speed;
          vy = this.dashVector.y * this.getDashData().speed;
        }

        this.x += vx * dt;
        this.y += vy * dt;

        const margin = this.radius + 4;
        this.x = GameUtils.clamp(this.x, margin, game.width - margin);
        this.y = GameUtils.clamp(this.y, margin, game.height - margin);
        this.game.resolveWorldCollisions(this);

        if (this.game.input.fire) {
          this.tryShoot();
        } else if (currentWeapon.mag <= 0 && this.reloadTimer <= 0) {
          this.requestReload();
        }

        if (this.game.input.grenadePressed) {
          this.game.input.grenadePressed = false;
          this.tryThrowGrenade();
        }

        if (this.game.input.reloadPressed) {
          this.game.input.reloadPressed = false;
          this.requestReload();
        }
      }

      const regen = this.getRegenRate();
      if (regen > 0 && this.hp > 0 && this.hp < maxHp) {
        this.hp = Math.min(maxHp, this.hp + regen * dt);
      }
    }

    tryShoot() {
      if (this.reloadTimer > 0 || this.shootCooldown > 0 || this.hp <= 0) {
        return false;
      }

      const stats = this.getCurrentWeaponStats();
      const state = this.weaponStates[this.weaponKey];
      if (state.mag <= 0) {
        this.requestReload();
        return false;
      }

      const baseAngle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
      const originX = this.x + Math.cos(baseAngle) * (this.radius + 4);
      const originY = this.y + Math.sin(baseAngle) * (this.radius + 4);
      const pellets = stats.pellets || 1;

      for (let i = 0; i < pellets; i += 1) {
        const spread = (Math.random() - 0.5) * stats.spread * 2;
        const angle = baseAngle + spread;
        const speed = stats.bulletSpeed;
        this.game.spawnBullet({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: stats.projectileRadius,
          damage: stats.damage,
          color: stats.color,
          pierce: stats.pierce,
          weaponKey: this.weaponKey,
          critChance: stats.critChance,
          critMultiplier: stats.critMultiplier,
          headshotMultiplier: stats.headshotMultiplier,
          angle
        });
      }

      state.mag -= 1;
      this.shootCooldown = 1 / stats.fireRate;
      this.game.stats.shotsFired += pellets;
      this.game.audio.playSfx(this.weaponKey === "shotgun" ? "shotgun" : "shoot");
      this.game.addShake(stats.recoil || 1);
      this.shootFlash = 0.12;
      this.recoilKick = 0.18 + Math.min(0.1, stats.recoil * 0.03);

      if (state.mag <= 0 && this.ammoReserve > 0) {
        this.requestReload();
      }
      return true;
    }

    takeDamage(amount, sourceX = this.x, sourceY = this.y) {
      if (this.invulnTimer > 0 || this.hp <= 0) {
        return 0;
      }

      let damage = amount * (1 - this.getDamageReduction()) - this.getArmor();
      if (this.game.bonuses.isActive("shield")) {
        damage *= 0.4;
      }
      damage = Math.max(1, damage);

      this.hp -= damage;
      this.damageFlash = 0.5;
      this.invulnTimer = 0.14;
      this.lastDamageAngle = Math.atan2(sourceY - this.y, sourceX - this.x);
      this.lastHitBy = { x: sourceX, y: sourceY };

      this.game.audio.playSfx("playerHit");
      this.game.addShake(6);
      this.game.floaters.add(`-${Math.round(damage)}`, this.x, this.y - 32, "#ff7878", {
        life: 0.8,
        velocityX: (Math.random() - 0.5) * 30,
        velocityY: -36
      });
      this.game.missions.onPlayerDamaged(damage);

      if (this.hp <= 0) {
        this.hp = 0;
        this.game.onPlayerDeath();
      }

      return damage;
    }

    heal(amount, forceFull = false) {
      const maxHp = this.getMaxHp();
      if (forceFull || amount === Infinity) {
        this.hp = maxHp;
        this.game.floaters.add("FULL HEAL", this.x, this.y - 34, "#b7ffcf", {
          life: 0.9,
          scale: 1.1,
          velocityY: -26
        });
        return;
      }

      const before = this.hp;
      this.hp = Math.min(maxHp, this.hp + amount);
      const gained = this.hp - before;
      if (gained > 0) {
        this.game.floaters.add(`+${Math.round(gained)}`, this.x, this.y - 34, "#b7ffcf", {
          life: 0.9,
          scale: 1.05,
          velocityY: -26
        });
      }
    }

    applyUpgrade(id) {
      switch (id) {
        case "health.maxHp":
          this.upgrades.health += 1;
          this.hp = Math.min(this.getMaxHp(), this.hp + 20);
          break;
        case "health.regen":
          this.upgrades.regen += 1;
          break;
        case "weapons.damage":
          this.upgrades.weaponDamage += 1;
          break;
        case "weapons.reload":
          this.upgrades.reload += 1;
          break;
        case "weapons.fireRate":
          this.upgrades.fireRate += 1;
          break;
        case "weapons.magazine":
          this.upgrades.magazine += 1;
          break;
        case "movement.speed":
          this.upgrades.speed += 1;
          break;
        case "movement.dash":
          this.upgrades.dash += 1;
          break;
        case "defense.armor":
          this.upgrades.armor += 1;
          break;
        case "defense.reduction":
          this.upgrades.reduction += 1;
          break;
        default:
          break;
      }
    }

    draw(ctx) {
      if (this.hp <= 0) {
        return;
      }

      const weaponAngle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
      const alpha = this.dashTime > 0 ? 0.88 : 1;
      const recoilOffset = this.recoilKick > 0 ? this.recoilKick * 10 : 0;
      const muzzleFlash = this.shootFlash > 0;
      const flashScale = muzzleFlash ? 1 + this.shootFlash * 2.8 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (this.dashTime > 0) {
        ctx.shadowBlur = 24;
        ctx.shadowColor = "rgba(103, 240, 167, 0.42)";
      }

      ctx.translate(this.x, this.y);
      ctx.rotate(weaponAngle);

      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(-2, 10, this.radius + 10, this.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(-3, -5, 4, 0, 0, this.radius + 8);
      bodyGradient.addColorStop(0, "#dff8e9");
      bodyGradient.addColorStop(0.35, "#64f0a4");
      bodyGradient.addColorStop(1, "#0d2517");
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#f4fff8";
      ctx.beginPath();
      ctx.arc(12, -8, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0a1310";
      ctx.beginPath();
      ctx.arc(14, -8, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(20, 42, 29, 0.95)";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(this.radius + 10 - recoilOffset, 0);
      ctx.stroke();

      ctx.fillStyle = "#1e5a3d";
      ctx.fillRect(-12, -18, 22, 12);

      if (muzzleFlash) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255, 219, 102, ${0.35 + this.shootFlash * 0.45})`;
        ctx.beginPath();
        ctx.arc(this.radius + 12 - recoilOffset, 0, 5 * flashScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 248, 201, ${0.28 + this.shootFlash * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(this.radius + 9 - recoilOffset, 0);
        ctx.lineTo(this.radius + 18 - recoilOffset, -4 * flashScale);
        ctx.lineTo(this.radius + 18 - recoilOffset, 4 * flashScale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      if (this.damageFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 60, 60, ${this.damageFlash * 0.25})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  global.Player = Player;
})(window);
