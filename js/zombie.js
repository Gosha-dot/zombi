(function (global) {
  const ZOMBIE_DEFS = {
    walker: {
      key: "walker",
      name: "Walker",
      radius: 18,
      speed: 72,
      hp: 52,
      damage: 8,
      score: 35,
      coins: 8,
      color: "#8bd48a",
      eye: "#f2ff92",
      headScale: 0.36
    },
    runner: {
      key: "runner",
      name: "Runner",
      radius: 16,
      speed: 118,
      hp: 36,
      damage: 11,
      score: 45,
      coins: 10,
      color: "#b8ffd8",
      eye: "#d6ff7a",
      headScale: 0.34
    },
    crawler: {
      key: "crawler",
      name: "Crawler",
      radius: 13,
      speed: 154,
      hp: 28,
      damage: 9,
      score: 54,
      coins: 11,
      color: "#5f8c6f",
      eye: "#dcffea",
      headScale: 0.3
    },
    stalker: {
      key: "stalker",
      name: "Stalker",
      radius: 15,
      speed: 138,
      hp: 30,
      damage: 10,
      score: 58,
      coins: 12,
      color: "#c5ffd0",
      eye: "#7bffb5",
      headScale: 0.32
    },
    tank: {
      key: "tank",
      name: "Tank",
      radius: 24,
      speed: 47,
      hp: 180,
      damage: 18,
      score: 90,
      coins: 18,
      color: "#8e7c68",
      eye: "#ffd46c",
      headScale: 0.4
    },
    brute: {
      key: "brute",
      name: "Brute",
      radius: 26,
      speed: 42,
      hp: 230,
      damage: 22,
      score: 120,
      coins: 22,
      color: "#65735f",
      eye: "#f4df87",
      headScale: 0.4
    },
    exploder: {
      key: "exploder",
      name: "Exploder",
      radius: 19,
      speed: 92,
      hp: 46,
      damage: 28,
      score: 80,
      coins: 14,
      color: "#ff8f62",
      eye: "#fff2a0",
      headScale: 0.34
    },
    shooter: {
      key: "shooter",
      name: "Shooter",
      radius: 18,
      speed: 64,
      hp: 78,
      damage: 12,
      score: 70,
      coins: 16,
      color: "#b46cff",
      eye: "#f0d6ff",
      headScale: 0.34,
      projectileColor: "#d7b5ff",
      projectileSpeed: 330,
      projectileDamage: 12,
      fireCooldown: 1.25,
      preferredRange: 260
    },
    spitter: {
      key: "spitter",
      name: "Spitter",
      radius: 18,
      speed: 56,
      hp: 86,
      damage: 8,
      score: 85,
      coins: 17,
      color: "#73d47d",
      eye: "#f0ffd4",
      headScale: 0.34,
      projectileColor: "#8ef28c",
      projectileSpeed: 260,
      projectileDamage: 9,
      fireCooldown: 1.55,
      preferredRange: 320,
      splashRadius: 52,
      splashDamage: 12
    },
    harpooner: {
      key: "harpooner",
      name: "Harpooner",
      radius: 18,
      speed: 58,
      hp: 82,
      damage: 13,
      score: 88,
      coins: 18,
      color: "#7b97a0",
      eye: "#dff8ff",
      headScale: 0.34,
      projectileColor: "#bdefff",
      projectileSpeed: 345,
      projectileDamage: 12,
      fireCooldown: 1.4,
      preferredRange: 300
    },
    boss: {
      key: "boss",
      name: "Boss",
      radius: 36,
      speed: 58,
      hp: 680,
      damage: 28,
      score: 800,
      coins: 220,
      color: "#d84b4b",
      eye: "#ffffff",
      headScale: 0.42
    }
  };

  class Zombie {
    constructor(game, type = "walker", x, y, wave = 1, options = {}) {
      this.game = game;
      this.type = type in ZOMBIE_DEFS ? type : "walker";
      this.base = ZOMBIE_DEFS[this.type];
      this.x = x;
      this.y = y;
      this.radius = this.base.radius;
      this.hp = this.base.hp;
      this.maxHp = this.base.hp;
      this.speed = this.base.speed;
      this.damage = this.base.damage;
      this.scoreValue = this.base.score;
      this.coinValue = this.base.coins;
      this.angle = 0;
      this.wiggle = Math.random() * Math.PI * 2;
      this.attackCooldown = 0;
      this.rangedCooldown = 0;
      this.dashCooldown = 0;
      this.bossAttackTimer = this.type === "boss" ? 2.4 + Math.random() * 0.9 : 0;
      this.bossAttackIndex = this.type === "boss" ? Math.floor(Math.random() * 3) : 0;
      this.bossRushTime = 0;
      this.bossRushVector = { x: 0, y: 0 };
      this.alive = true;
      this.deathFlash = 0;
      this.hitFlash = 0;
      this.attackFlash = 0;
      this.spawnPulse = 0.42;
      this.animSeed = Math.random() * Math.PI * 2;
      this.pulseTimer = 2 + Math.random() * 2;
      this.exploded = false;
      this.spawnWave = wave;
      this.keyCarrier = Boolean(options.keyCarrier);

      const waveScale = 1 + Math.max(0, wave - 1) * 0.12;
      const speedScale = 1 + Math.max(0, wave - 1) * 0.015;
      const damageScale = 1 + Math.max(0, wave - 1) * 0.06;

      if (this.type === "runner") {
        this.maxHp = Math.round(this.base.hp * waveScale * 0.9);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 1.1;
        this.damage = Math.round(this.base.damage * damageScale * 1.05);
      } else if (this.type === "stalker") {
        this.maxHp = Math.round(this.base.hp * waveScale * 0.92);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 1.16;
        this.damage = Math.round(this.base.damage * damageScale * 1.02);
      } else if (this.type === "crawler") {
        this.maxHp = Math.round(this.base.hp * waveScale * 0.84);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 1.14;
        this.damage = Math.round(this.base.damage * damageScale * 0.96);
      } else if (this.type === "tank") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.18);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.88;
        this.damage = Math.round(this.base.damage * damageScale * 1.12);
      } else if (this.type === "brute") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.22);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.82;
        this.damage = Math.round(this.base.damage * damageScale * 1.18);
      } else if (this.type === "exploder") {
        this.maxHp = Math.round(this.base.hp * waveScale * 0.95);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale;
        this.damage = Math.round(this.base.damage * damageScale * 1.08);
      } else if (this.type === "boss") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.35);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.92;
        this.damage = Math.round(this.base.damage * damageScale * 1.18);
      } else if (this.type === "shooter") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.08);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.92;
        this.damage = Math.round(this.base.damage * damageScale * 0.92);
      } else if (this.type === "spitter") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.05);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.9;
        this.damage = Math.round(this.base.damage * damageScale * 0.9);
      } else if (this.type === "harpooner") {
        this.maxHp = Math.round(this.base.hp * waveScale * 1.04);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale * 0.92;
        this.damage = Math.round(this.base.damage * damageScale * 0.94);
      } else {
        this.maxHp = Math.round(this.base.hp * waveScale);
        this.hp = this.maxHp;
        this.speed = this.base.speed * speedScale;
        this.damage = Math.round(this.base.damage * damageScale);
      }

      const mode = this.game.getModeSettings?.() || {};
      this.maxHp = Math.max(1, Math.round(this.maxHp * (mode.enemyHpMult || 1)));
      this.hp = this.maxHp;
      this.speed *= mode.enemySpeedMult || 1;
      this.damage = Math.max(1, Math.round(this.damage * (mode.enemyDamageMult || 1)));
    }

    getHeadPosition() {
      const targetAngle = this.angle;
      const headDistance = this.radius * 0.32;
      return {
        x: this.x + Math.cos(targetAngle) * headDistance,
        y: this.y + Math.sin(targetAngle) * headDistance - this.radius * 0.18
      };
    }

    getHeadRadius() {
      return this.radius * this.base.headScale;
    }

    takeDamage(amount, meta = {}) {
      if (!this.alive) {
        return;
      }

      let finalDamage = amount;
      if (this.type === "brute") {
        finalDamage *= 0.62;
      } else if (this.type === "stalker") {
        finalDamage *= 1.02;
      }

      this.hp -= finalDamage;
      this.deathFlash = 0.18;
      this.hitFlash = 0.24;
      this.game.particles.blood(this.x, this.y, Math.max(4, Math.min(18, finalDamage * 0.28)), this.base.color);
      this.game.floaters.add(`-${Math.round(finalDamage)}`, this.x, this.y - this.radius - 12, meta.headshot ? "#ffd34d" : "#ffb1b1", {
        life: 0.7,
        scale: meta.headshot ? 1.08 : 1,
        velocityX: (Math.random() - 0.5) * 24,
        velocityY: -28
      });
      this.game.addShake(Math.min(2.5, finalDamage * 0.06));
      this.game.audio.playSfx(meta.headshot ? "ui" : meta.explosion ? "explode" : "zombieHit");

      if (this.hp <= 0) {
        this.die(meta);
      } else if (this.type === "exploder" && this.hp < this.maxHp * 0.18) {
        this.triggerExplosion(true);
      }
    }

    triggerExplosion(force = false) {
      if (this.exploded) {
        return;
      }
      this.exploded = true;
      const radius = this.type === "boss" ? 150 : 110;
      const damage = this.type === "boss" ? 34 : 26;
      this.game.spawnExplosion(this.x, this.y, radius, damage, this.type === "boss" ? "#ff6a6a" : "#ff8f62");
    }

    shootAtPlayer() {
      const player = this.game.player;
      const muzzle = this.getHeadPosition();
      const dx = player.x - muzzle.x;
      const dy = player.y - muzzle.y;
      const length = Math.hypot(dx, dy) || 1;
      const projectileSpeed = this.base.projectileSpeed || 320;
      const fireAngle = Math.atan2(dy, dx);
      const offset = this.radius * 0.7;
      const originX = muzzle.x + Math.cos(fireAngle) * offset;
      const originY = muzzle.y + Math.sin(fireAngle) * offset;

      this.game.spawnEnemyBullet({
        x: originX,
        y: originY,
        vx: (dx / length) * projectileSpeed,
        vy: (dy / length) * projectileSpeed,
        radius: this.type === "spitter" ? 5.4 : this.type === "harpooner" ? 5.1 : 4.2,
        damage: this.base.projectileDamage || this.damage,
        color: this.base.projectileColor || "#b46cff",
        glow: this.type === "spitter" ? "rgba(142, 242, 140, 0.72)" : this.type === "harpooner" ? "rgba(189, 239, 255, 0.76)" : "rgba(208, 176, 255, 0.72)",
        life: 3.2,
        sourceType: this.type,
        splashRadius: this.base.splashRadius || 0,
        splashDamage: this.base.splashDamage || 0
      });

      this.rangedCooldown = this.base.fireCooldown || 1.35;
      this.attackFlash = 0.2;
      this.game.particles.sparks(originX, originY, 4, this.base.projectileColor || "#b46cff");
      this.game.audio.playSfx("zombieShoot");
      this.game.addShake(1.2);
    }

    triggerBossAttack() {
      if (this.type !== "boss") {
        return;
      }

      const player = this.game.player;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const attack = this.bossAttackIndex % 3;

      if (attack === 0) {
        this.attackFlash = 0.4;
        this.game.addShake(5.5);
        this.game.particles.explosion(this.x, this.y, 18, "#ff6b6b");
        this.game.audio.playSfx("explode");
        for (const zombie of this.game.zombies) {
          if (zombie === this || !zombie.alive) {
            continue;
          }
          const nearby = GameUtils.distance(this.x, this.y, zombie.x, zombie.y);
          if (nearby < 190) {
            zombie.takeDamage(12, { explosion: true });
          }
        }
        if (distance < 270) {
          this.game.player.takeDamage(this.damage * 1.25, this.x, this.y);
        }
      } else if (attack === 1) {
        this.attackFlash = 0.3;
        this.game.addShake(3.5);
        this.game.audio.playSfx("bonus");
        this.game.particles.sparks(this.x, this.y, 16, "#ffd66e");
        const summonTypes = ["walker", "runner", "stalker"];
        for (let i = 0; i < 2; i += 1) {
          const angle = (Math.PI * 2 * i) / 2 + Math.random() * 0.6;
          const spawn = {
            x: this.x + Math.cos(angle) * (this.radius + 38),
            y: this.y + Math.sin(angle) * (this.radius + 38)
          };
          this.game.spawnZombie(summonTypes[(this.spawnWave + i) % summonTypes.length], spawn);
        }
      } else {
        this.attackFlash = 0.28;
        this.bossRushTime = 0.7;
        this.bossRushVector = { x: normalizedX, y: normalizedY };
        this.game.addShake(4);
        this.game.particles.sparks(this.x, this.y, 14, "#ffffff");
        this.game.audio.playSfx("zombieBite");
      }

      this.bossAttackIndex = (this.bossAttackIndex + 1) % 3;
      this.bossAttackTimer = this.type === "boss" ? 3.6 + Math.max(0, 5 - this.game.waveManager.wave) * 0.08 : 0;
    }

    die(meta = {}) {
      if (!this.alive) {
        return;
      }
      this.alive = false;
      this.triggerExplosion(this.type === "exploder");
      this.game.onZombieKilled(this, meta);
    }

    update(dt) {
      if (!this.alive) {
        return;
      }

      if (this.deathFlash > 0) {
        this.deathFlash -= dt;
      }
      if (this.hitFlash > 0) {
        this.hitFlash -= dt;
      }
      if (this.attackFlash > 0) {
        this.attackFlash -= dt;
      }
      if (this.spawnPulse > 0) {
        this.spawnPulse -= dt;
      }

      const player = this.game.player;
      const freezeFactor = this.game.bonuses.isActive("freeze") ? 0.24 : 1;
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt * freezeFactor;
      }

      if (this.rangedCooldown > 0) {
        this.rangedCooldown -= dt * freezeFactor;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const directionX = dx / dist;
      const directionY = dy / dist;
      this.angle = Math.atan2(dy, dx);

      const wobble = Math.sin(this.wiggle + this.game.worldTime * 2.2) * (this.type === "runner" ? 0.14 : 0.06);
      let moveX = directionX + (-directionY * wobble);
      let moveY = directionY + (directionX * wobble);
      let speed = this.speed * freezeFactor;
      if (this.trapSlowFactor) {
        speed *= GameUtils.clamp(this.trapSlowFactor, 0.28, 1);
        this.trapSlowFactor = 1;
      }

      if (this.type === "runner") {
        speed *= 1.08 + Math.sin(this.game.worldTime * 4 + this.wiggle) * 0.05;
      }

      if (this.type === "crawler") {
        speed *= 1.24;
        if (dist < 140) {
          speed *= 1.18;
        }
        moveX += -directionY * wobble * 0.25;
        moveY += directionX * wobble * 0.25;
      }

      if (this.type === "stalker") {
        if (this.dashCooldown <= 0 && dist < 220) {
          this.dashCooldown = 1.6;
          speed *= 1.45;
        } else if (this.dashCooldown > 0) {
          speed *= 1.14;
        }
      }

      if (this.type === "shooter") {
        const preferredRange = this.base.preferredRange || 260;
        const holdRange = preferredRange * 0.86;
        if (dist < holdRange) {
          moveX = -directionX + (-directionY * wobble * 0.8);
          moveY = -directionY + (directionX * wobble * 0.8);
          speed *= 1.08;
        } else if (dist < preferredRange) {
          moveX = -directionY * wobble * 1.8;
          moveY = directionX * wobble * 1.8;
          speed *= 0.32;
        } else {
          speed *= 0.88;
        }
      }

      if (this.type === "spitter") {
        const preferredRange = this.base.preferredRange || 320;
        const retreatRange = preferredRange * 0.8;
        if (dist < retreatRange) {
          moveX = -directionX + (-directionY * wobble * 0.9);
          moveY = -directionY + (directionX * wobble * 0.9);
          speed *= 1.1;
        } else if (dist < preferredRange) {
          moveX = -directionY * wobble * 1.6;
          moveY = directionX * wobble * 1.6;
          speed *= 0.42;
        } else {
          speed *= 0.9;
        }
      }

      if (this.type === "harpooner") {
        const preferredRange = this.base.preferredRange || 300;
        const retreatRange = preferredRange * 0.82;
        if (dist < retreatRange) {
          moveX = -directionX + (-directionY * wobble * 0.75);
          moveY = -directionY + (directionX * wobble * 0.75);
          speed *= 1.06;
        } else if (dist < preferredRange) {
          moveX = -directionY * wobble * 1.5;
          moveY = directionX * wobble * 1.5;
          speed *= 0.42;
        } else {
          speed *= 0.88;
        }
      }

      if (this.type === "boss" && this.hp < this.maxHp * 0.45) {
        speed *= 1.16;
      }

      if (this.type === "brute" && this.hp < this.maxHp * 0.35) {
        speed *= 1.08;
      }

      if (this.type === "boss" && this.bossRushTime > 0) {
        this.bossRushTime -= dt;
        moveX = this.bossRushVector.x;
        moveY = this.bossRushVector.y;
        speed *= 3.1;
        this.attackFlash = Math.max(this.attackFlash, 0.15);
      }

      this.x += moveX * speed * dt;
      this.y += moveY * speed * dt;

      const margin = this.radius + 6;
      this.x = GameUtils.clamp(this.x, margin, this.game.width - margin);
      this.y = GameUtils.clamp(this.y, margin, this.game.height - margin);
      this.game.resolveWorldCollisions(this);

      const contactRange = this.radius + this.game.player.radius - 4;
      if (dist <= contactRange && this.attackCooldown <= 0) {
        this.attackCooldown = this.type === "boss" ? 0.6 : 0.8;
        this.attackFlash = 0.16;
        this.game.player.takeDamage(this.damage, this.x, this.y);
        this.game.audio.playSfx("zombieBite");
      }

      if (this.type === "exploder" && dist < 74 && this.attackCooldown <= 0) {
        this.attackCooldown = 0.45;
        this.triggerExplosion();
        this.die({ explosion: true });
      }

      if (this.type === "shooter") {
        const preferredRange = this.base.preferredRange || 260;
        if (dist <= preferredRange * 1.25 && this.rangedCooldown <= 0) {
          this.shootAtPlayer();
        }
      }

      if (this.type === "spitter") {
        const preferredRange = this.base.preferredRange || 320;
        if (dist <= preferredRange * 1.3 && this.rangedCooldown <= 0) {
          this.shootAtPlayer();
        }
      }

      if (this.type === "harpooner") {
        const preferredRange = this.base.preferredRange || 300;
        if (dist <= preferredRange * 1.25 && this.rangedCooldown <= 0) {
          this.shootAtPlayer();
        }
      }

      if (this.type === "boss") {
        this.pulseTimer -= dt;
        if (this.pulseTimer <= 0) {
          this.pulseTimer = 4.5;
          this.attackFlash = 0.28;
          this.game.addShake(4);
          this.game.particles.explosion(this.x, this.y, 12, "#ff4c4c");
          if (dist < 240) {
            this.game.player.takeDamage(this.damage * 0.85, this.x, this.y);
          }
          this.game.audio.playSfx("explode");
        }

        this.bossAttackTimer -= dt;
        if (this.bossAttackTimer <= 0) {
          this.triggerBossAttack();
        }
      }

      if (this.type === "stalker" && this.dashCooldown > 0) {
        this.dashCooldown -= dt;
      }
    }

    draw(ctx) {
      if (!this.alive) {
        return;
      }

      const angle = this.angle;
      const spawnProgress = 1 - GameUtils.clamp(this.spawnPulse / 0.42, 0, 1);
      const pulse = this.type === "boss" ? 1 + Math.sin(this.game.worldTime * 3) * 0.04 + (this.bossRushTime > 0 ? 0.08 : 0) : 1;
      const bodyColor = this.base.color;
      const shadowAlpha = this.type === "boss" ? 0.6 : 0.35;
      const bodyRadius = this.radius * pulse;
      const bobAmplitude = this.type === "boss" ? 2.2 : this.type === "stalker" ? 1.4 : this.type === "spitter" ? 1 : 0.7;
      const bobSpeed = this.type === "boss" ? 2.4 : this.type === "stalker" ? 7 : this.type === "spitter" ? 3.2 : this.type === "runner" ? 4.8 : 3.6;
      const bob = Math.sin(this.game.worldTime * bobSpeed + this.animSeed) * bobAmplitude;
      const overallScale = (0.86 + spawnProgress * 0.14) * (1 + this.attackFlash * 0.05) * (this.hitFlash > 0 ? 1 + this.hitFlash * 0.08 : 1);

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.translate(0, bob);
      ctx.scale(overallScale, overallScale);

      if (this.type === "boss") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const aura = ctx.createRadialGradient(0, 0, bodyRadius * 0.5, 0, 0, bodyRadius * 2.6);
        aura.addColorStop(0, "rgba(255, 126, 126, 0.28)");
        aura.addColorStop(0.6, "rgba(255, 96, 96, 0.14)");
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius * 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.type === "spitter") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const aura = ctx.createRadialGradient(bodyRadius * 0.2, -bodyRadius * 0.1, bodyRadius * 0.3, 0, 0, bodyRadius * 2);
        aura.addColorStop(0, "rgba(120, 255, 138, 0.24)");
        aura.addColorStop(0.65, "rgba(120, 255, 138, 0.08)");
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(-2, bodyRadius * 0.78, bodyRadius * 1.12, bodyRadius * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(-bodyRadius * 0.2, -bodyRadius * 0.2, bodyRadius * 0.2, 0, 0, bodyRadius * 1.1);
      bodyGradient.addColorStop(0, "#f8fff3");
      bodyGradient.addColorStop(0.34, bodyColor);
      bodyGradient.addColorStop(1, "#1f261f");
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      ctx.stroke();

      const headPos = this.getHeadPosition();
      ctx.fillStyle = "#f4fff8";
      ctx.beginPath();
      ctx.arc(headPos.x - this.x, headPos.y - this.y, this.getHeadRadius(), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.base.eye;
      ctx.beginPath();
      ctx.arc(headPos.x - this.x + 3, headPos.y - this.y - 2, 2.6, 0, Math.PI * 2);
      ctx.arc(headPos.x - this.x + 8, headPos.y - this.y - 2, 2.6, 0, Math.PI * 2);
      ctx.fill();

      if (this.type === "stalker") {
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#d9ffe4";
        ctx.beginPath();
        ctx.ellipse(-bodyRadius * 0.68, bodyRadius * 0.06, bodyRadius * 0.74, bodyRadius * 0.48, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-bodyRadius * 0.5, -bodyRadius * 0.18, this.getHeadRadius() * 0.74, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(12, 15, 12, 0.92)";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-bodyRadius * 0.86, -bodyRadius * 0.05);
      ctx.lineTo(-bodyRadius * 1.42, bodyRadius * 0.38);
      ctx.moveTo(bodyRadius * 0.84, -bodyRadius * 0.02);
      ctx.lineTo(bodyRadius * 1.4, bodyRadius * 0.24);
      ctx.stroke();

      if (this.type === "boss") {
        ctx.strokeStyle = this.attackFlash > 0 ? "rgba(255, 232, 163, 0.92)" : "rgba(255, 103, 103, 0.8)";
        ctx.lineWidth = this.attackFlash > 0 ? 2.6 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.attackFlash > 0 ? "rgba(255, 232, 163, 0.16)" : "rgba(255, 111, 97, 0.2)";
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius + 12, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.type === "exploder") {
        ctx.fillStyle = "rgba(255, 212, 120, 0.82)";
        ctx.beginPath();
        ctx.arc(-4, 3, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.type === "shooter") {
        ctx.save();
        ctx.fillStyle = "#231726";
        ctx.fillRect(bodyRadius * 0.26, -5, bodyRadius * 1.02, 6);
        ctx.fillStyle = "#4f3454";
        ctx.fillRect(bodyRadius * 0.86, -7, 8, 11);
        ctx.fillStyle = "#160d1a";
        ctx.fillRect(bodyRadius * 0.94, -4, 18, 3);
        ctx.fillStyle = "rgba(208, 176, 255, 0.38)";
        ctx.fillRect(bodyRadius * 1.08, -3, 9, 2);
        ctx.restore();
      }

      if (this.type === "stalker") {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.beginPath();
        ctx.ellipse(bodyRadius * 0.1, -bodyRadius * 0.12, bodyRadius * 0.92, bodyRadius * 0.52, -0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(89, 188, 119, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bodyRadius * 0.45, -bodyRadius * 0.1);
        ctx.lineTo(bodyRadius * 0.55, bodyRadius * 0.08);
        ctx.stroke();
        ctx.restore();
      }

      if (this.type === "crawler") {
        ctx.save();
        ctx.translate(-bodyRadius * 0.08, bodyRadius * 0.14);
        ctx.scale(1.1, 0.78);
        ctx.fillStyle = "rgba(24, 37, 28, 0.7)";
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(103, 240, 167, 0.12)";
        ctx.beginPath();
        ctx.arc(bodyRadius * 0.18, -bodyRadius * 0.1, bodyRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.type === "brute") {
        ctx.save();
        ctx.fillStyle = "rgba(37, 49, 41, 0.72)";
        ctx.beginPath();
        ctx.arc(-bodyRadius * 0.08, -bodyRadius * 0.12, bodyRadius * 0.66, Math.PI * 0.18, Math.PI * 1.05);
        ctx.fill();
        ctx.fillStyle = "rgba(143, 156, 130, 0.82)";
        ctx.beginPath();
        ctx.moveTo(-bodyRadius * 0.42, -bodyRadius * 0.34);
        ctx.lineTo(bodyRadius * 0.12, -bodyRadius * 0.48);
        ctx.lineTo(bodyRadius * 0.54, -bodyRadius * 0.1);
        ctx.lineTo(bodyRadius * 0.08, bodyRadius * 0.06);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(18, 25, 20, 0.52)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.arc(-bodyRadius * 0.22, -bodyRadius * 0.28, bodyRadius * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.type === "spitter") {
        ctx.save();
        ctx.fillStyle = "rgba(75, 183, 84, 0.75)";
        ctx.beginPath();
        ctx.ellipse(bodyRadius * 0.7, -bodyRadius * 0.06, bodyRadius * 0.72, bodyRadius * 0.3, 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(37, 92, 41, 0.85)";
        ctx.fillRect(bodyRadius * 0.42, -6, bodyRadius * 0.68, 8);
        ctx.fillStyle = "rgba(185, 255, 188, 0.65)";
        ctx.fillRect(bodyRadius * 0.82, -2, bodyRadius * 0.58, 3);
        ctx.fillStyle = "rgba(205, 255, 206, 0.34)";
        ctx.beginPath();
        ctx.arc(bodyRadius * 0.9, 7, 2.5 + Math.sin(this.game.worldTime * 8 + this.animSeed) * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.type === "harpooner") {
        ctx.save();
        ctx.fillStyle = "rgba(190, 240, 255, 0.2)";
        ctx.beginPath();
        ctx.ellipse(bodyRadius * 0.25, -bodyRadius * 0.08, bodyRadius * 0.95, bodyRadius * 0.48, 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d6edf4";
        ctx.fillRect(bodyRadius * 0.45, -4, bodyRadius * 1.22, 4);
        ctx.fillStyle = "#8aa9b3";
        ctx.fillRect(bodyRadius * 1.45, -6, 6, 10);
        ctx.fillStyle = "#24343b";
        ctx.fillRect(bodyRadius * 1.44, -3, 11, 2);
        ctx.restore();
      }

      if (this.keyCarrier) {
        ctx.save();
        ctx.translate(0, -bodyRadius * 0.95);
        ctx.shadowBlur = 16;
        ctx.shadowColor = "rgba(255, 211, 77, 0.6)";
        ctx.fillStyle = "#ffd34d";
        ctx.strokeStyle = "#6f5416";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(-7, -5, 14, 10, 3);
        } else {
          ctx.rect(-7, -5, 14, 10);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2b1f05";
        ctx.fillRect(-2.5, -1.5, 5, 3);
        ctx.restore();
      }

      ctx.restore();

      if (this.hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = `rgba(255, 247, 181, ${this.hitFlash * 0.65})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (this.deathFlash > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 242, 142, ${this.deathFlash * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  global.ZOMBIE_DEFS = ZOMBIE_DEFS;
  global.Zombie = Zombie;
})(window);
