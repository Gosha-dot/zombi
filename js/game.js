(function (global) {
  const GameUtils = {
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    lerp(a, b, t) {
      return a + (b - a) * t;
    },
    rand(min, max) {
      return min + Math.random() * (max - min);
    },
    randInt(min, max) {
      return Math.floor(min + Math.random() * (max - min + 1));
    },
    distance(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    },
    formatTime(seconds) {
      const value = Math.max(0, seconds || 0);
      const whole = Math.ceil(value);
      const mm = String(Math.floor(whole / 60)).padStart(2, "0");
      const ss = String(whole % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    },
    formatNumber(value) {
      return Number(value || 0).toLocaleString();
    }
  };

  const GAME_MODE_DEFS = {
    easy: {
      key: "easy",
      name: "Easy",
      description: "Slower enemies, softer damage, and longer breaks between waves.",
      tutorial: "Easy mode gives you lighter enemy pressure and more time to learn the map.",
      enemyHpMult: 0.82,
      enemyDamageMult: 0.72,
      enemySpeedMult: 0.92,
      spawnCountMult: 0.82,
      spawnIntervalMult: 1.18,
      scoreMult: 0.85,
      coinMult: 1,
      intermissionDelay: 10,
      fogMult: 0.88,
      startCoins: 80
    },
    normal: {
      key: "normal",
      name: "Normal",
      description: "Balanced outbreak conditions.",
      tutorial: "Normal mode keeps enemies, rewards, and breaks balanced.",
      enemyHpMult: 1,
      enemyDamageMult: 1,
      enemySpeedMult: 1,
      spawnCountMult: 1,
      spawnIntervalMult: 1,
      scoreMult: 1,
      coinMult: 1,
      intermissionDelay: 8,
      fogMult: 1,
      startCoins: 0
    },
    hardcore: {
      key: "hardcore",
      name: "Hardcore",
      description: "Faster, tougher enemies with shorter shop windows and higher score rewards.",
      tutorial: "Hardcore mode pushes enemy damage, speed, and density for higher score rewards.",
      enemyHpMult: 1.25,
      enemyDamageMult: 1.35,
      enemySpeedMult: 1.08,
      spawnCountMult: 1.22,
      spawnIntervalMult: 0.86,
      scoreMult: 1.35,
      coinMult: 1.15,
      intermissionDelay: 6,
      fogMult: 1.08,
      startCoins: 0
    },
    oneHp: {
      key: "oneHp",
      name: "One HP",
      description: "One hit can end the run. Rewards are doubled.",
      tutorial: "One HP mode locks your health at 1, so movement and traps matter more than armor.",
      enemyHpMult: 0.9,
      enemyDamageMult: 1,
      enemySpeedMult: 1,
      spawnCountMult: 0.92,
      spawnIntervalMult: 1,
      scoreMult: 2,
      coinMult: 1.35,
      intermissionDelay: 8,
      fogMult: 1,
      oneHp: true,
      startCoins: 120
    },
    bossRush: {
      key: "bossRush",
      name: "Boss Rush",
      description: "Every wave opens with a boss and a smaller escort.",
      tutorial: "Boss Rush sends a boss every wave, so burst damage and trap timing are critical.",
      enemyHpMult: 1.08,
      enemyDamageMult: 1.18,
      enemySpeedMult: 1,
      spawnCountMult: 0.7,
      spawnIntervalMult: 0.92,
      scoreMult: 1.55,
      coinMult: 1.25,
      intermissionDelay: 8,
      fogMult: 1,
      bossEveryWave: true,
      startCoins: 180
    },
    endlessNight: {
      key: "endlessNight",
      name: "Endless Night",
      description: "Darker arenas, dense waves, and short recovery windows.",
      tutorial: "Endless Night deepens the fog, shortens breaks, and keeps the horde dense.",
      enemyHpMult: 1.08,
      enemyDamageMult: 1.12,
      enemySpeedMult: 1.04,
      spawnCountMult: 1.28,
      spawnIntervalMult: 0.78,
      scoreMult: 1.4,
      coinMult: 1.12,
      intermissionDelay: 4,
      fogMult: 1.38,
      startCoins: 60
    }
  };

  class AudioManager {
    constructor(game) {
      this.game = game;
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.unlocked = false;
      this.musicTimer = null;
      this.musicStep = 0;
    }

    ensureContext() {
      if (this.ctx) {
        return this.ctx;
      }
      const AudioContextClass = global.AudioContext || global.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applySettings(this.game.settings);
      return this.ctx;
    }

    unlock() {
      const ctx = this.ensureContext();
      if (!ctx) {
        return;
      }
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      this.unlocked = true;
    }

    applySettings(settings) {
      if (!this.ctx) {
        return;
      }
      this.sfxGain.gain.value = Math.max(0, settings.soundVolume ?? 0.7);
      this.musicGain.gain.value = Math.max(0, settings.musicVolume ?? 0.35);
      this.masterGain.gain.value = 0.95;
    }

    tone(options) {
      const ctx = this.ensureContext();
      if (!ctx || !this.unlocked) {
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = options.type || "sine";
      osc.frequency.setValueAtTime(options.freq || 440, ctx.currentTime);
      if (options.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.freqEnd), ctx.currentTime + (options.duration || 0.12));
      }
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime((options.volume || 0.15) * 0.0001 + (options.volume || 0.15), ctx.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (options.duration || 0.12));
      osc.connect(gain);
      gain.connect(options.music ? this.musicGain : this.sfxGain);
      osc.start();
      osc.stop(ctx.currentTime + (options.duration || 0.12) + 0.05);
    }

    noiseBurst(volume = 0.18, duration = 0.22, music = false) {
      const ctx = this.ensureContext();
      if (!ctx || !this.unlocked) {
        return;
      }
      const sampleRate = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.value = 880;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(music ? this.musicGain : this.sfxGain);
      source.start();
    }

    playSfx(kind) {
      if (!this.unlocked) {
        return;
      }

      switch (kind) {
        case "shoot":
          this.tone({ freq: 260 + Math.random() * 40, freqEnd: 180, duration: 0.08, volume: 0.12, type: "square" });
          break;
        case "shotgun":
          this.tone({ freq: 160, freqEnd: 90, duration: 0.12, volume: 0.18, type: "sawtooth" });
          this.noiseBurst(0.09, 0.16);
          break;
        case "reload":
          this.tone({ freq: 360, freqEnd: 240, duration: 0.08, volume: 0.08, type: "triangle" });
          this.tone({ freq: 240, freqEnd: 180, duration: 0.08, volume: 0.05, type: "triangle" });
          break;
        case "zombieHit":
          this.tone({ freq: 90, freqEnd: 60, duration: 0.08, volume: 0.07, type: "square" });
          break;
        case "zombieBite":
          this.tone({ freq: 70, freqEnd: 40, duration: 0.1, volume: 0.1, type: "sawtooth" });
          break;
        case "explode":
          this.noiseBurst(0.2, 0.3);
          this.tone({ freq: 55, freqEnd: 24, duration: 0.28, volume: 0.16, type: "triangle" });
          break;
        case "pickup":
          this.tone({ freq: 620, freqEnd: 820, duration: 0.08, volume: 0.09, type: "sine" });
          break;
        case "bonus":
          this.tone({ freq: 520, freqEnd: 780, duration: 0.12, volume: 0.11, type: "triangle" });
          break;
        case "playerHit":
          this.tone({ freq: 110, freqEnd: 70, duration: 0.14, volume: 0.18, type: "square" });
          break;
        case "zombieShoot":
          this.tone({ freq: 180, freqEnd: 120, duration: 0.09, volume: 0.12, type: "triangle" });
          this.noiseBurst(0.06, 0.09);
          break;
        case "ui":
          this.tone({ freq: 760, freqEnd: 980, duration: 0.06, volume: 0.07, type: "sine" });
          break;
        default:
          break;
      }
    }

    scheduleMusicBar() {
      const ctx = this.ensureContext();
      if (!ctx || !this.unlocked) {
        return;
      }

      const start = ctx.currentTime + 0.05;
      const beat = 0.42;
      const bass = [110, 98, 92.5, 110];
      const lead = [220, 246.94, 196, 174.61];
      const harmony = [164.81, 196, 174.61, 146.83];
      const step = this.musicStep % bass.length;

      [0, 1, 2, 3].forEach((index) => {
        const beatTime = start + index * beat;
        this.playMusicTone(lead[(step + index) % lead.length], beatTime, 0.13, 0.04, "triangle");
        if (index % 2 === 0) {
          this.playMusicTone(harmony[(step + index) % harmony.length], beatTime + 0.02, 0.18, 0.05, "sine");
        }
        this.playMusicTone(bass[(step + index) % bass.length], beatTime, 0.25, 0.06, "sawtooth");
      });

      this.musicStep += 1;
    }

    playMusicTone(freq, time, duration, volume, type) {
      const ctx = this.ctx;
      if (!ctx || !this.unlocked) {
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(volume, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      filter.type = "lowpass";
      filter.frequency.value = 900;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    }

    startMusic() {
      if (this.musicTimer) {
        return;
      }
      this.unlock();
      if (!this.ctx || !this.unlocked) {
        return;
      }
      this.scheduleMusicBar();
      this.musicTimer = setInterval(() => this.scheduleMusicBar(), 1680);
    }

    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }
  }

  class ParticleSystem {
    constructor(game) {
      this.game = game;
      this.particles = [];
    }

    clear() {
      this.particles.length = 0;
    }

    spawn(options) {
      const count = options.count || 10;
      for (let i = 0; i < count; i += 1) {
        this.particles.push({
          x: options.x,
          y: options.y,
          vx: (Math.random() - 0.5) * (options.speed || 130),
          vy: (Math.random() - 0.5) * (options.speed || 130),
          life: GameUtils.rand(options.lifeMin || 0.3, options.lifeMax || 0.8),
          size: GameUtils.rand(options.sizeMin || 2, options.sizeMax || 5),
          gravity: options.gravity || 0,
          drag: options.drag || 0.9,
          color: options.color || "#fff",
          type: options.type || "spark"
        });
      }
    }

    blood(x, y, count = 10, color = "#ff4c4c") {
      if (!this.game.settings.bloodEffects) {
        this.spawn({
          x,
          y,
          count,
          speed: 120,
          sizeMin: 1.5,
          sizeMax: 3,
          lifeMin: 0.25,
          lifeMax: 0.65,
          color,
          type: "spark"
        });
        return;
      }
      this.spawn({
        x,
        y,
        count,
        speed: 180,
        sizeMin: 2,
        sizeMax: 5,
        lifeMin: 0.35,
        lifeMax: 0.9,
        color,
        type: "blood"
      });
    }

    explosion(x, y, count = 18, color = "#ff9f5a") {
      this.spawn({
        x,
        y,
        count,
        speed: 280,
        sizeMin: 2,
        sizeMax: 8,
        lifeMin: 0.35,
        lifeMax: 1.1,
        color,
        type: "flare",
        gravity: 40,
        drag: 0.94
      });
    }

    sparks(x, y, count = 10, color = "#f1f7ff") {
      this.spawn({
        x,
        y,
        count,
        speed: 220,
        sizeMin: 1.5,
        sizeMax: 4,
        lifeMin: 0.18,
        lifeMax: 0.5,
        color,
        type: "spark"
      });
    }

    update(dt) {
      for (let index = this.particles.length - 1; index >= 0; index -= 1) {
        const particle = this.particles[index];
        particle.life -= dt;
        if (particle.life <= 0) {
          this.particles.splice(index, 1);
          continue;
        }
        particle.vy += particle.gravity * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= particle.drag;
        particle.vy *= particle.drag;
      }
    }

    render(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of this.particles) {
        const alpha = GameUtils.clamp(particle.life, 0, 1);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingTextManager {
    constructor(game) {
      this.game = game;
      this.texts = [];
    }

    clear() {
      this.texts.length = 0;
    }

    add(text, x, y, color = "#fff", options = {}) {
      this.texts.push({
        text,
        x,
        y,
        vx: options.velocityX ?? (Math.random() - 0.5) * 18,
        vy: options.velocityY ?? -22,
        life: options.life ?? 0.8,
        color,
        scale: options.scale ?? 1
      });
    }

    update(dt) {
      for (let index = this.texts.length - 1; index >= 0; index -= 1) {
        const text = this.texts[index];
        text.life -= dt;
        if (text.life <= 0) {
          this.texts.splice(index, 1);
          continue;
        }
        text.x += text.vx * dt;
        text.y += text.vy * dt;
        text.vy -= 14 * dt;
      }
    }

    render(ctx) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const text of this.texts) {
        ctx.globalAlpha = GameUtils.clamp(text.life / 0.8, 0, 1);
        ctx.fillStyle = text.color;
        ctx.font = `${Math.round(15 * text.scale)}px Bahnschrift, Trebuchet MS, sans-serif`;
        ctx.fillText(text.text, text.x, text.y);
      }
      ctx.restore();
    }
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.isTouchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
      this.settings = this.loadSettings();
      this.input = this.createInputState();
      this.worldTime = 0;
      this.state = "menu";
      this.coins = 0;
      this.stats = this.createStats();
      this.zombies = [];
      this.bullets = [];
      this.enemyBullets = [];
      this.grenades = [];
      this.pickups = [];
      this.traps = [];
      this.width = 1;
      this.height = 1;
      this.dpr = 1;
      this.shake = 0;
      this.shakeIntensity = 0;
      this.doorOpen = false;
      this.leverReady = false;
      this.leverPulled = false;
      this.levelAdvanceReady = false;
      this.levelAdvanceNotified = false;
      this.worldLayout = null;
      this.locations = this.createLocations();
      this.locationIndex = 0;
      this.pendingLocationName = null;
      this.nightVisionActive = false;
      this.nightVisionTimer = 0;
      this.nightVisionCooldown = 0;
      this.atmosphere = this.createAtmosphereState();
      this.lastFrame = performance.now();

      this.resize();
      this.audio = new AudioManager(this);
      this.particles = new ParticleSystem(this);
      this.floaters = new FloatingTextManager(this);
      this.leaderboard = new LeaderboardStore();
      this.bonuses = new BonusManager(this);
      this.shop = new ShopManager(this);
      this.player = new Player(this);
      this.waveManager = new WaveManager(this);
      this.missions = new MissionManager(this);
      this.ui = new UIManager(this);
      this.worldLayout = this.createWorldLayout();

      this.bindEvents();
      this.ui.refreshMainMenuStats();
      this.ui.updateHUD();
      requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    createInputState() {
      return {
        keys: {},
        fire: false,
        reloadPressed: false,
        grenadePressed: false,
        aimX: 0,
        aimY: 0,
        touchMoveX: 0,
        touchMoveY: 0
      };
    }

    createStats() {
      return {
        score: 0,
        kills: 0,
        shotsFired: 0,
        hits: 0,
        headshots: 0,
        waves: 0
      };
    }

    createLocations() {
      const locations = [
        {
          key: "city",
          name: "City",
          weather: "ash",
          fogDensity: 0.92,
          lootProfile: {
            baseChance: 0.24,
            count: 1,
            bonusBoosts: {
              grenadePack: 5,
              moduleRapid: 4,
              coinMultiplier: 3
            }
          },
          theme: {
            backdropTop: "#060c0a",
            backdropMid: "#020504",
            backdropBottom: "#010101",
            glowPrimary: "rgba(103,240,167,0.06)",
            glowSecondary: "rgba(255,111,97,0.035)",
            fogPrimary: "rgba(255,111,97,0.05)",
            fogSecondary: "rgba(103,240,167,0.05)",
            fogNeutral: "rgba(255,255,255,0.03)",
            wallFill: "rgba(88, 64, 42, 0.92)",
            steelFill: "rgba(52, 65, 58, 0.95)",
            structureGlow: "rgba(255, 211, 77, 0.15)"
          },
          build: (game, theme) => {
            const thickness = Math.max(20, Math.round(Math.min(game.width, game.height) * 0.03));
            const roomLeft = Math.round(game.width * 0.68);
            const roomRight = Math.round(game.width * 0.92);
            const roomTop = Math.round(game.height * 0.14);
            const roomBottom = Math.round(game.height * 0.39);
            const roomHeight = Math.max(120, roomBottom - roomTop);
            const availableDoorHeight = Math.max(72, roomHeight - thickness * 2 - 8);
            const doorHeight = Math.min(Math.max(80, Math.round(game.height * 0.17)), availableDoorHeight);
            const doorY = Math.round(roomTop + (roomHeight - doorHeight) * 0.5);
            const triggerWidth = Math.min(Math.max(72, Math.round(game.width * 0.09)), Math.max(72, roomRight - roomLeft - thickness - 52));
            const triggerHeight = Math.min(Math.max(72, Math.round(game.height * 0.13)), Math.max(72, doorHeight - 18));
            const triggerX = Math.round(roomLeft + thickness + 30);
            const triggerY = Math.round(doorY + (doorHeight - triggerHeight) * 0.5);
            const leverWidth = Math.max(16, Math.round(thickness * 0.7));
            const leverHeight = Math.max(34, Math.round(doorHeight * 0.38));
            const leverX = Math.round(roomRight - thickness + (thickness - leverWidth) * 0.5);
            const leverY = Math.round(roomTop + (roomHeight - leverHeight) * 0.5);

            return {
              barricades: [
                { x: Math.round(game.width * 0.12), y: Math.round(game.height * 0.22), w: Math.max(120, Math.round(game.width * 0.16)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.wallFill },
                { x: Math.round(game.width * 0.33), y: Math.round(game.height * 0.56), w: Math.max(22, Math.round(game.width * 0.03)), h: Math.max(110, Math.round(game.height * 0.18)), fill: theme.steelFill },
                { x: Math.round(game.width * 0.15), y: Math.round(game.height * 0.74), w: Math.max(140, Math.round(game.width * 0.18)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.wallFill },
                { x: roomLeft, y: roomTop, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomBottom - thickness, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomRight - thickness, y: roomTop, w: thickness, h: roomBottom - roomTop, fill: theme.steelFill },
                { x: roomLeft, y: roomTop + thickness, w: thickness, h: Math.max(0, doorY - (roomTop + thickness)), fill: theme.steelFill },
                { x: roomLeft, y: doorY + doorHeight, w: thickness, h: Math.max(0, roomBottom - thickness - (doorY + doorHeight)), fill: theme.steelFill }
              ],
              door: { x: roomLeft, y: doorY, w: thickness, h: doorHeight, open: game.doorOpen },
              lever: { x: leverX, y: leverY, w: leverWidth, h: leverHeight, wall: "right" },
              generator: { x: Math.round(game.width * 0.22), y: Math.round(game.height * 0.69), w: Math.max(36, Math.round(game.width * 0.045)), h: Math.max(24, Math.round(Math.max(36, Math.round(game.width * 0.045)) * 0.62)) },
              props: [
                { type: "car", x: Math.round(game.width * 0.24), y: Math.round(game.height * 0.31), w: 100, h: 44 },
                { type: "streetlight", x: Math.round(game.width * 0.47), y: Math.round(game.height * 0.18), w: 18, h: 110 }
              ],
              levelTrigger: { x: triggerX, y: triggerY, w: triggerWidth, h: triggerHeight }
            };
          }
        },
        {
          key: "laboratory",
          name: "Laboratory",
          weather: "fog",
          fogDensity: 1.28,
          lootProfile: {
            baseChance: 0.28,
            count: 1,
            bonusBoosts: {
              ammoPack: 8,
              moduleReload: 6,
              moduleOptic: 5,
              freeze: 5
            }
          },
          theme: {
            backdropTop: "#07120f",
            backdropMid: "#030806",
            backdropBottom: "#010302",
            glowPrimary: "rgba(184,255,231,0.08)",
            glowSecondary: "rgba(139,195,255,0.035)",
            fogPrimary: "rgba(184, 255, 231, 0.07)",
            fogSecondary: "rgba(139,195,255,0.05)",
            fogNeutral: "rgba(255,255,255,0.03)",
            wallFill: "rgba(52, 68, 63, 0.95)",
            steelFill: "rgba(46, 62, 69, 0.96)",
            structureGlow: "rgba(156, 255, 224, 0.16)"
          },
          build: (game, theme) => {
            const thickness = Math.max(20, Math.round(Math.min(game.width, game.height) * 0.028));
            const roomLeft = Math.round(game.width * 0.55);
            const roomRight = Math.round(game.width * 0.9);
            const roomTop = Math.round(game.height * 0.12);
            const roomBottom = Math.round(game.height * 0.36);
            const roomHeight = Math.max(120, roomBottom - roomTop);
            const availableDoorHeight = Math.max(72, roomHeight - thickness * 2 - 8);
            const doorHeight = Math.min(Math.max(76, Math.round(game.height * 0.16)), availableDoorHeight);
            const doorY = Math.round(roomTop + thickness + 8);
            const triggerWidth = Math.min(Math.max(76, Math.round(game.width * 0.1)), Math.max(72, roomRight - roomLeft - thickness - 52));
            const triggerHeight = Math.min(Math.max(74, Math.round(game.height * 0.12)), Math.max(72, doorHeight - 8));
            const triggerX = Math.round(roomLeft + 34);
            const triggerY = Math.round(roomBottom - triggerHeight - 26);
            const leverWidth = Math.max(16, Math.round(thickness * 0.74));
            const leverHeight = Math.max(34, Math.round(doorHeight * 0.42));
            const leverX = Math.round(roomLeft - thickness + (thickness - leverWidth) * 0.5);
            const leverY = Math.round(roomTop + (roomHeight - leverHeight) * 0.5);

            return {
              barricades: [
                { x: Math.round(game.width * 0.08), y: Math.round(game.height * 0.18), w: Math.max(120, Math.round(game.width * 0.22)), h: Math.max(20, Math.round(game.height * 0.025)), fill: theme.wallFill },
                { x: Math.round(game.width * 0.16), y: Math.round(game.height * 0.42), w: Math.max(22, Math.round(game.width * 0.028)), h: Math.max(140, Math.round(game.height * 0.22)), fill: theme.steelFill },
                { x: Math.round(game.width * 0.28), y: Math.round(game.height * 0.58), w: Math.max(160, Math.round(game.width * 0.24)), h: Math.max(22, Math.round(game.height * 0.028)), fill: theme.steelFill },
                { x: roomLeft, y: roomTop, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomBottom - thickness, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomRight - thickness, y: roomTop, w: thickness, h: roomBottom - roomTop, fill: theme.steelFill },
                { x: roomLeft, y: doorY + doorHeight, w: thickness, h: Math.max(0, roomBottom - thickness - (doorY + doorHeight)), fill: theme.steelFill }
              ],
              door: { x: roomLeft, y: doorY, w: thickness, h: doorHeight, open: game.doorOpen },
              lever: { x: leverX, y: leverY, w: leverWidth, h: leverHeight, wall: "left" },
              generator: { x: Math.round(game.width * 0.24), y: Math.round(game.height * 0.68), w: Math.max(40, Math.round(game.width * 0.05)), h: Math.max(26, Math.round(Math.max(40, Math.round(game.width * 0.05)) * 0.62)) },
              props: [
                { type: "labTank", x: Math.round(game.width * 0.14), y: Math.round(game.height * 0.3), w: 74, h: 86 },
                { type: "console", x: Math.round(game.width * 0.4), y: Math.round(game.height * 0.22), w: 82, h: 38 }
              ],
              levelTrigger: { x: triggerX, y: triggerY, w: triggerWidth, h: triggerHeight }
            };
          }
        },
        {
          key: "forest",
          name: "Forest",
          weather: "fog",
          fogDensity: 1.36,
          lootProfile: {
            baseChance: 0.26,
            count: 1,
            bonusBoosts: {
              healthPack: 7,
              shield: 6,
              modulePierce: 5
            }
          },
          theme: {
            backdropTop: "#06100a",
            backdropMid: "#020604",
            backdropBottom: "#010201",
            glowPrimary: "rgba(103,240,167,0.07)",
            glowSecondary: "rgba(255,211,77,0.035)",
            fogPrimary: "rgba(103,240,167,0.06)",
            fogSecondary: "rgba(180,220,140,0.04)",
            fogNeutral: "rgba(255,255,255,0.03)",
            wallFill: "rgba(56, 74, 46, 0.95)",
            steelFill: "rgba(40, 57, 43, 0.96)",
            structureGlow: "rgba(172, 220, 132, 0.16)"
          },
          build: (game, theme) => {
            const thickness = Math.max(20, Math.round(Math.min(game.width, game.height) * 0.031));
            const roomLeft = Math.round(game.width * 0.58);
            const roomRight = Math.round(game.width * 0.9);
            const roomTop = Math.round(game.height * 0.18);
            const roomBottom = Math.round(game.height * 0.46);
            const roomHeight = Math.max(120, roomBottom - roomTop);
            const availableDoorHeight = Math.max(72, roomHeight - thickness * 2 - 8);
            const doorHeight = Math.min(Math.max(82, Math.round(game.height * 0.18)), availableDoorHeight);
            const doorY = Math.round(roomBottom - doorHeight - 10);
            const triggerWidth = Math.min(Math.max(74, Math.round(game.width * 0.095)), Math.max(72, roomRight - roomLeft - thickness - 52));
            const triggerHeight = Math.min(Math.max(72, Math.round(game.height * 0.13)), Math.max(72, doorHeight - 18));
            const triggerX = Math.round(roomLeft + thickness + 28);
            const triggerY = Math.round(roomTop + 20);
            const leverWidth = Math.max(16, Math.round(thickness * 0.72));
            const leverHeight = Math.max(34, Math.round(doorHeight * 0.4));
            const leverX = Math.round(roomRight - thickness + (thickness - leverWidth) * 0.5);
            const leverY = Math.round(roomTop + (roomHeight - leverHeight) * 0.5);

            return {
              barricades: [
                { x: Math.round(game.width * 0.1), y: Math.round(game.height * 0.24), w: Math.max(150, Math.round(game.width * 0.2)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.wallFill },
                { x: Math.round(game.width * 0.26), y: Math.round(game.height * 0.48), w: Math.max(22, Math.round(game.width * 0.03)), h: Math.max(130, Math.round(game.height * 0.2)), fill: theme.steelFill },
                { x: Math.round(game.width * 0.14), y: Math.round(game.height * 0.76), w: Math.max(140, Math.round(game.width * 0.18)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.steelFill },
                { x: roomLeft, y: roomTop, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomBottom - thickness, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomTop + thickness, w: thickness, h: Math.max(0, roomBottom - thickness - (roomTop + thickness)), fill: theme.steelFill },
                { x: roomRight - thickness, y: roomTop, w: thickness, h: Math.max(0, doorY - roomTop), fill: theme.steelFill }
              ],
              door: { x: roomRight - thickness, y: doorY, w: thickness, h: doorHeight, open: game.doorOpen },
              lever: { x: leverX, y: leverY, w: leverWidth, h: leverHeight, wall: "right" },
              generator: { x: Math.round(game.width * 0.22), y: Math.round(game.height * 0.66), w: Math.max(40, Math.round(game.width * 0.05)), h: Math.max(26, Math.round(Math.max(40, Math.round(game.width * 0.05)) * 0.62)) },
              props: [
                { type: "tree", x: Math.round(game.width * 0.2), y: Math.round(game.height * 0.26), w: 74, h: 96 },
                { type: "fallenTree", x: Math.round(game.width * 0.43), y: Math.round(game.height * 0.26), w: 130, h: 28 }
              ],
              levelTrigger: { x: triggerX, y: triggerY, w: triggerWidth, h: triggerHeight }
            };
          }
        },
        {
          key: "warehouse",
          name: "Warehouse",
          weather: "ash",
          fogDensity: 0.92,
          lootProfile: {
            baseChance: 0.27,
            count: 1,
            bonusBoosts: {
              armorPlate: 8,
              ammoPack: 7,
              coinMultiplier: 7
            }
          },
          theme: {
            backdropTop: "#0a0d0b",
            backdropMid: "#050706",
            backdropBottom: "#010201",
            glowPrimary: "rgba(255,211,77,0.05)",
            glowSecondary: "rgba(255,211,77,0.03)",
            fogPrimary: "rgba(180,190,180,0.045)",
            fogSecondary: "rgba(255,211,77,0.04)",
            fogNeutral: "rgba(255,255,255,0.03)",
            wallFill: "rgba(65, 67, 58, 0.95)",
            steelFill: "rgba(46, 50, 48, 0.96)",
            structureGlow: "rgba(255, 211, 77, 0.13)"
          },
          build: (game, theme) => {
            const thickness = Math.max(20, Math.round(Math.min(game.width, game.height) * 0.03));
            const roomLeft = Math.round(game.width * 0.64);
            const roomRight = Math.round(game.width * 0.92);
            const roomTop = Math.round(game.height * 0.16);
            const roomBottom = Math.round(game.height * 0.43);
            const roomHeight = Math.max(120, roomBottom - roomTop);
            const doorHeight = Math.min(Math.max(80, Math.round(game.height * 0.17)), Math.max(72, roomHeight - thickness * 2 - 8));
            const doorY = Math.round(roomTop + (roomHeight - doorHeight) * 0.5);
            const triggerWidth = Math.min(Math.max(72, Math.round(game.width * 0.09)), Math.max(72, roomRight - roomLeft - thickness - 52));
            const triggerHeight = Math.min(Math.max(72, Math.round(game.height * 0.13)), Math.max(72, doorHeight - 18));
            const triggerX = Math.round(roomLeft + thickness + 28);
            const triggerY = Math.round(doorY + (doorHeight - triggerHeight) * 0.5);
            const leverWidth = Math.max(16, Math.round(thickness * 0.72));
            const leverHeight = Math.max(34, Math.round(doorHeight * 0.4));
            const leverX = Math.round(roomRight - thickness + (thickness - leverWidth) * 0.5);
            const leverY = Math.round(roomTop + (roomHeight - leverHeight) * 0.5);

            return {
              barricades: [
                { x: Math.round(game.width * 0.08), y: Math.round(game.height * 0.18), w: Math.max(140, Math.round(game.width * 0.18)), h: Math.max(24, Math.round(game.height * 0.032)), fill: theme.wallFill },
                { x: Math.round(game.width * 0.22), y: Math.round(game.height * 0.52), w: Math.max(22, Math.round(game.width * 0.028)), h: Math.max(120, Math.round(game.height * 0.2)), fill: theme.steelFill },
                { x: Math.round(game.width * 0.34), y: Math.round(game.height * 0.72), w: Math.max(150, Math.round(game.width * 0.22)), h: Math.max(22, Math.round(game.height * 0.028)), fill: theme.wallFill },
                { x: roomLeft, y: roomTop, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomBottom - thickness, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomRight - thickness, y: roomTop, w: thickness, h: roomBottom - roomTop, fill: theme.steelFill },
                { x: roomLeft, y: roomTop + thickness, w: thickness, h: Math.max(0, doorY - (roomTop + thickness)), fill: theme.steelFill },
                { x: roomLeft, y: doorY + doorHeight, w: thickness, h: Math.max(0, roomBottom - thickness - (doorY + doorHeight)), fill: theme.steelFill }
              ],
              door: { x: roomLeft, y: doorY, w: thickness, h: doorHeight, open: game.doorOpen },
              lever: { x: leverX, y: leverY, w: leverWidth, h: leverHeight, wall: "right" },
              generator: { x: Math.round(game.width * 0.2), y: Math.round(game.height * 0.68), w: Math.max(42, Math.round(game.width * 0.05)), h: Math.max(26, Math.round(Math.max(42, Math.round(game.width * 0.05)) * 0.62)) },
              props: [
                { type: "container", x: Math.round(game.width * 0.18), y: Math.round(game.height * 0.28), w: 120, h: 54 },
                { type: "shelf", x: Math.round(game.width * 0.45), y: Math.round(game.height * 0.19), w: 92, h: 64 },
                { type: "crate", x: Math.round(game.width * 0.55), y: Math.round(game.height * 0.31), w: 54, h: 54 }
              ],
              levelTrigger: { x: triggerX, y: triggerY, w: triggerWidth, h: triggerHeight }
            };
          }
        },
        {
          key: "hospital",
          name: "Hospital",
          weather: "fog",
          fogDensity: 1.55,
          lootProfile: {
            baseChance: 0.3,
            count: 1,
            bonusBoosts: {
              healthPack: 8,
              fullHeal: 6,
              shield: 6,
              ammoPack: 4
            }
          },
          theme: {
            backdropTop: "#091116",
            backdropMid: "#04070a",
            backdropBottom: "#010203",
            glowPrimary: "rgba(255,255,255,0.05)",
            glowSecondary: "rgba(103,240,167,0.03)",
            fogPrimary: "rgba(255,255,255,0.08)",
            fogSecondary: "rgba(173, 219, 255, 0.05)",
            fogNeutral: "rgba(255,255,255,0.04)",
            wallFill: "rgba(68, 75, 89, 0.96)",
            steelFill: "rgba(53, 61, 74, 0.97)",
            structureGlow: "rgba(255,255,255,0.16)"
          },
          build: (game, theme) => {
            const thickness = Math.max(20, Math.round(Math.min(game.width, game.height) * 0.029));
            const roomLeft = Math.round(game.width * 0.62);
            const roomRight = Math.round(game.width * 0.91);
            const roomTop = Math.round(game.height * 0.13);
            const roomBottom = Math.round(game.height * 0.4);
            const roomHeight = Math.max(120, roomBottom - roomTop);
            const doorHeight = Math.min(Math.max(78, Math.round(game.height * 0.16)), Math.max(72, roomHeight - thickness * 2 - 8));
            const doorY = Math.round(roomTop + thickness + 6);
            const triggerWidth = Math.min(Math.max(72, Math.round(game.width * 0.095)), Math.max(72, roomRight - roomLeft - thickness - 52));
            const triggerHeight = Math.min(Math.max(72, Math.round(game.height * 0.13)), Math.max(72, doorHeight - 18));
            const triggerX = Math.round(roomLeft + 28);
            const triggerY = Math.round(roomBottom - triggerHeight - 24);
            const leverWidth = Math.max(16, Math.round(thickness * 0.72));
            const leverHeight = Math.max(34, Math.round(doorHeight * 0.4));
            const leverX = Math.round(roomLeft - thickness + (thickness - leverWidth) * 0.5);
            const leverY = Math.round(roomTop + (roomHeight - leverHeight) * 0.5);

            return {
              barricades: [
                { x: Math.round(game.width * 0.1), y: Math.round(game.height * 0.2), w: Math.max(140, Math.round(game.width * 0.2)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.wallFill },
                { x: Math.round(game.width * 0.24), y: Math.round(game.height * 0.5), w: Math.max(22, Math.round(game.width * 0.03)), h: Math.max(120, Math.round(game.height * 0.2)), fill: theme.steelFill },
                { x: Math.round(game.width * 0.18), y: Math.round(game.height * 0.72), w: Math.max(150, Math.round(game.width * 0.2)), h: Math.max(22, Math.round(game.height * 0.03)), fill: theme.steelFill },
                { x: roomLeft, y: roomTop, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomLeft, y: roomBottom - thickness, w: roomRight - roomLeft, h: thickness, fill: theme.steelFill },
                { x: roomRight - thickness, y: roomTop, w: thickness, h: roomBottom - roomTop, fill: theme.steelFill },
                { x: roomLeft, y: roomTop + thickness, w: thickness, h: Math.max(0, doorY - (roomTop + thickness)), fill: theme.steelFill },
                { x: roomLeft, y: doorY + doorHeight, w: thickness, h: Math.max(0, roomBottom - thickness - (doorY + doorHeight)), fill: theme.steelFill }
              ],
              door: { x: roomLeft, y: doorY, w: thickness, h: doorHeight, open: game.doorOpen },
              lever: { x: leverX, y: leverY, w: leverWidth, h: leverHeight, wall: "left" },
              generator: { x: Math.round(game.width * 0.2), y: Math.round(game.height * 0.68), w: Math.max(40, Math.round(game.width * 0.048)), h: Math.max(26, Math.round(Math.max(40, Math.round(game.width * 0.048)) * 0.62)) },
              props: [
                { type: "bed", x: Math.round(game.width * 0.18), y: Math.round(game.height * 0.27), w: 88, h: 40 },
                { type: "gurney", x: Math.round(game.width * 0.42), y: Math.round(game.height * 0.22), w: 70, h: 34 }
              ],
              levelTrigger: { x: triggerX, y: triggerY, w: triggerWidth, h: triggerHeight }
            };
          }
        }
      ];

      const order = ["city", "hospital", "warehouse", "forest", "laboratory"];
      return order
        .map((key) => locations.find((location) => location.key === key))
        .filter(Boolean);
    }

    getCurrentLocation() {
      if (!this.locations.length) {
        return null;
      }
      return this.locations[this.locationIndex % this.locations.length];
    }

    getModeKey() {
      return this.settings.gameMode in GAME_MODE_DEFS ? this.settings.gameMode : "normal";
    }

    getModeSettings() {
      return GAME_MODE_DEFS[this.getModeKey()] || GAME_MODE_DEFS.normal;
    }

    setGameMode(modeKey) {
      if (!(modeKey in GAME_MODE_DEFS)) {
        return false;
      }

      this.settings.gameMode = modeKey;
      this.saveSettings();
      return true;
    }

    advanceLocation() {
      if (!this.locations.length) {
        this.pendingLocationName = null;
        return null;
      }

      this.locationIndex = (this.locationIndex + 1) % this.locations.length;
      const location = this.getCurrentLocation();
      this.pendingLocationName = location?.name || null;
      this.atmosphere = this.createAtmosphereState();
      return location;
    }

    createWorldLayout() {
      const location = this.getCurrentLocation();
      if (!location) {
        return null;
      }
      const layout = location.build(this, location.theme);
      return {
        ...layout,
        locationKey: location.key,
        locationName: location.name,
        weather: location.weather,
        theme: location.theme,
        lootProfile: location.lootProfile || null
      };
    }

    createTrapsForLocation(previous = []) {
      const locationKey = this.getCurrentLocation()?.key || "city";
      const priorById = new Map((previous || []).map((trap) => [trap.id, trap]));
      const shortSide = Math.min(this.width, this.height);
      const barrelRadius = Math.max(15, Math.round(shortSide * 0.022));
      const wireHeight = Math.max(18, Math.round(shortSide * 0.025));
      const wireWidth = Math.max(130, Math.round(this.width * 0.18));
      const traps = [];
      const addTrap = (trap) => {
        const previousTrap = priorById.get(trap.id);
        traps.push({
          cooldown: 0,
          flash: 0,
          pulse: Math.random() * Math.PI * 2,
          playerCooldown: 0,
          ...trap,
          hp: previousTrap?.hp ?? trap.hp,
          spent: previousTrap?.spent ?? false,
          cooldown: previousTrap?.cooldown ?? trap.cooldown ?? 0,
          flash: previousTrap?.flash ?? 0
        });
      };

      const locationSets = {
        city: [
          { id: "barrel-a", type: "barrel", x: this.width * 0.43, y: this.height * 0.44 },
          { id: "wire-a", type: "wire", x: this.width * 0.44, y: this.height * 0.68, w: wireWidth, h: wireHeight },
          { id: "turret-a", type: "turret", x: this.width * 0.73, y: this.height * 0.66 }
        ],
        hospital: [
          { id: "barrel-a", type: "barrel", x: this.width * 0.48, y: this.height * 0.58 },
          { id: "wire-a", type: "wire", x: this.width * 0.38, y: this.height * 0.42, w: wireWidth * 0.95, h: wireHeight },
          { id: "turret-a", type: "turret", x: this.width * 0.72, y: this.height * 0.61 }
        ],
        warehouse: [
          { id: "barrel-a", type: "barrel", x: this.width * 0.43, y: this.height * 0.44 },
          { id: "barrel-b", type: "barrel", x: this.width * 0.63, y: this.height * 0.58 },
          { id: "wire-a", type: "wire", x: this.width * 0.47, y: this.height * 0.64, w: wireWidth * 1.1, h: wireHeight }
        ],
        forest: [
          { id: "barrel-a", type: "barrel", x: this.width * 0.48, y: this.height * 0.4 },
          { id: "wire-a", type: "wire", x: this.width * 0.42, y: this.height * 0.63, w: wireWidth, h: wireHeight },
          { id: "turret-a", type: "turret", x: this.width * 0.7, y: this.height * 0.68 }
        ],
        laboratory: [
          { id: "barrel-a", type: "barrel", x: this.width * 0.46, y: this.height * 0.48 },
          { id: "wire-a", type: "wire", x: this.width * 0.36, y: this.height * 0.68, w: wireWidth * 1.05, h: wireHeight },
          { id: "turret-a", type: "turret", x: this.width * 0.7, y: this.height * 0.62 }
        ]
      };

      for (const trap of locationSets[locationKey] || locationSets.city) {
        if (trap.type === "barrel") {
          addTrap({
            ...trap,
            id: `${locationKey}-${trap.id}`,
            radius: barrelRadius,
            hp: 34,
            damage: 115,
            blastRadius: Math.max(108, Math.round(shortSide * 0.16))
          });
        } else if (trap.type === "wire") {
          addTrap({
            ...trap,
            id: `${locationKey}-${trap.id}`,
            damage: 10,
            slow: 0.46
          });
        } else if (trap.type === "turret") {
          addTrap({
            ...trap,
            id: `${locationKey}-${trap.id}`,
            radius: Math.max(17, Math.round(shortSide * 0.023)),
            range: Math.max(260, Math.round(shortSide * 0.42)),
            damage: 18,
            cooldown: 0.15,
            fireRate: 0.42
          });
        }
      }

      const generator = this.worldLayout?.generator;
      if (generator) {
        addTrap({
          id: `${locationKey}-generator`,
          type: "tesla",
          x: generator.x + generator.w * 0.5,
          y: generator.y + generator.h * 0.5,
          radius: Math.max(20, Math.round(shortSide * 0.028)),
          range: Math.max(132, Math.round(shortSide * 0.18)),
          damage: 24,
          cooldown: 0.7,
          fireRate: 2.3
        });
      }

      return traps;
    }

    getBlockingRects() {
      if (!this.worldLayout) {
        return [];
      }
      const rects = [...(this.worldLayout.barricades || [])];
      if (this.worldLayout.door && !this.worldLayout.door.open) {
        rects.push(this.worldLayout.door);
      }
      return rects;
    }

    resolveCircleRectCollision(entity, rect) {
      const radius = entity.radius || 0;
      const nearestX = GameUtils.clamp(entity.x, rect.x, rect.x + rect.w);
      const nearestY = GameUtils.clamp(entity.y, rect.y, rect.y + rect.h);
      const dx = entity.x - nearestX;
      const dy = entity.y - nearestY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared === 0) {
        const left = Math.abs(entity.x - rect.x);
        const right = Math.abs(rect.x + rect.w - entity.x);
        const top = Math.abs(entity.y - rect.y);
        const bottom = Math.abs(rect.y + rect.h - entity.y);
        const smallest = Math.min(left, right, top, bottom);
        if (smallest === left) {
          entity.x = rect.x - radius;
        } else if (smallest === right) {
          entity.x = rect.x + rect.w + radius;
        } else if (smallest === top) {
          entity.y = rect.y - radius;
        } else {
          entity.y = rect.y + rect.h + radius;
        }
        return true;
      }

      if (distanceSquared >= radius * radius) {
        return false;
      }

      const distance = Math.sqrt(distanceSquared) || 1;
      const overlap = radius - distance;
      entity.x += (dx / distance) * overlap;
      entity.y += (dy / distance) * overlap;
      return true;
    }

    resolveWorldCollisions(entity) {
      if (!entity || !this.worldLayout) {
        return;
      }

      const radius = entity.radius || 0;
      const margin = radius + 4;
      entity.x = GameUtils.clamp(entity.x, margin, this.width - margin);
      entity.y = GameUtils.clamp(entity.y, margin, this.height - margin);

      const rects = this.getBlockingRects();
      for (let pass = 0; pass < 2; pass += 1) {
        let moved = false;
        for (const rect of rects) {
          moved = this.resolveCircleRectCollision(entity, rect) || moved;
        }
        entity.x = GameUtils.clamp(entity.x, margin, this.width - margin);
        entity.y = GameUtils.clamp(entity.y, margin, this.height - margin);
        if (!moved) {
          break;
        }
      }
    }

    getDoorDistance() {
      if (!this.worldLayout?.door) {
        return Infinity;
      }
      const door = this.worldLayout.door;
      const centerX = door.x + door.w * 0.5;
      const centerY = door.y + door.h * 0.5;
      return GameUtils.distance(this.player.x, this.player.y, centerX, centerY);
    }

    getLeverDistance() {
      if (!this.worldLayout?.lever) {
        return Infinity;
      }
      const lever = this.worldLayout.lever;
      const centerX = lever.x + lever.w * 0.5;
      const centerY = lever.y + lever.h * 0.5;
      return GameUtils.distance(this.player.x, this.player.y, centerX, centerY);
    }

    createAtmosphereState() {
      const wave = this.waveManager?.wave || 1;
      const location = this.getCurrentLocation();
      const mode = this.getModeSettings?.() || GAME_MODE_DEFS.normal;
      const kind = location?.weather || (wave % 6 === 0 ? "rain" : wave % 3 === 0 ? "fog" : "ash");
      const fogDensity = (location?.fogDensity || 1) * (mode.fogMult || 1);
      return {
        kind,
        intensity: GameUtils.clamp((0.42 + wave * 0.025) * fogDensity, 0.38, 1),
        wind: 14 + wave * 1.4,
        flicker: Math.random() * Math.PI * 2,
        fogDensity
      };
    }

    spawnPlayerAtCenter() {
      const margin = this.player.radius + 4;
      this.player.x = GameUtils.clamp(this.width * 0.5, margin, this.width - margin);
      this.player.y = GameUtils.clamp(this.height * 0.5, margin, this.height - margin);
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.dashTime = 0;
      this.player.dashVector = { x: 0, y: 0 };
      this.player.shootFlash = 0;
      this.player.recoilKick = 0;
      this.input.aimX = this.player.x + 50;
      this.input.aimY = this.player.y;
      this.resolveWorldCollisions(this.player);
    }

    resetLevelState(spawnPlayer = true) {
      this.doorOpen = false;
      this.leverReady = false;
      this.leverPulled = false;
      this.levelAdvanceReady = false;
      this.levelAdvanceNotified = false;
      this.player.keycards = 0;
      this.atmosphere = this.createAtmosphereState();
      this.worldLayout = this.createWorldLayout();
      this.traps = this.createTrapsForLocation();
      if (spawnPlayer) {
        this.spawnPlayerAtCenter();
      }
    }

    canOpenDoor() {
      return Boolean(!this.doorOpen && this.player.keycards > 0 && this.getDoorDistance() < 96);
    }

    canPullLever() {
      return Boolean(this.leverReady && this.doorOpen && this.getLeverDistance() < 96);
    }

    tryPullLever() {
      if (!this.canPullLever()) {
        if (this.leverReady && !this.doorOpen && this.getDoorDistance() < 150) {
          this.ui.showNotification("Open the door first", "normal", 1600);
        } else if (this.leverReady && this.doorOpen && this.getLeverDistance() < 150) {
          this.ui.showNotification("Move closer to the lever", "normal", 1600);
        }
        return false;
      }

      this.leverReady = false;
      this.leverPulled = true;
      this.levelAdvanceReady = true;
      this.worldLayout = this.createWorldLayout();
      this.floaters.add("LEVER", this.worldLayout.lever.x + this.worldLayout.lever.w * 0.5, this.worldLayout.lever.y - 10, "#ffd34d", {
        life: 0.85,
        scale: 0.95,
        velocityY: -24
      });
      this.ui.showNotification("Lever pulled - trigger activated", "accent", 2400);
      this.audio.playSfx("ui");
      return true;
    }

    tryOpenDoor() {
      if (!this.canOpenDoor()) {
        if (!this.doorOpen && this.player.keycards > 0 && this.getDoorDistance() < 150) {
          this.ui.showNotification("Move closer to the door", "normal", 1600);
        }
        return false;
      }

      this.player.keycards = Math.max(0, (this.player.keycards || 0) - 1);
      this.doorOpen = true;
      this.worldLayout = this.createWorldLayout();
      this.ui.showNotification("Security door unlocked", "accent", 2600);
      this.audio.playSfx("ui");
      return true;
    }

    collectKeycard() {
      if (this.doorOpen) {
        return;
      }

      this.player.keycards = Math.min(1, (this.player.keycards || 0) + 1);
      this.missions.onKeycardCollected();
      this.floaters.add("KEYCARD", this.player.x, this.player.y - 36, "#ffd34d", {
        life: 0.9,
        scale: 1,
        velocityY: -26
      });
      this.ui.showNotification("Keycard collected", "accent", 2400);
    }

    armLevelAdvance() {
      if (this.levelAdvanceReady || this.leverReady) {
        return;
      }

      this.leverReady = true;
      this.leverPulled = false;
      this.levelAdvanceReady = false;
      if (!this.levelAdvanceNotified) {
        this.levelAdvanceNotified = true;
        this.ui.showNotification("Pull the lever behind the door", "accent", 2600);
      }
    }

    completeLevelAdvance() {
      if (!this.levelAdvanceReady) {
        return false;
      }

      this.levelAdvanceReady = false;
      this.leverReady = false;
      this.leverPulled = false;
      this.levelAdvanceNotified = false;
      this.advanceLocation();
      this.waveManager.completeWave();
      return true;
    }

    loadSettings() {
      const defaults = {
        playerName: "Survivor",
        gameMode: "normal",
        soundVolume: 0.7,
        musicVolume: 0.35,
        screenShake: true,
        bloodEffects: true
      };

      try {
        const raw = localStorage.getItem("zombie-apocalypse-settings");
        if (!raw) {
          return defaults;
        }
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          gameMode: parsed.gameMode in GAME_MODE_DEFS ? parsed.gameMode : defaults.gameMode,
          soundVolume: GameUtils.clamp(Number(parsed.soundVolume ?? defaults.soundVolume), 0, 1),
          musicVolume: GameUtils.clamp(Number(parsed.musicVolume ?? defaults.musicVolume), 0, 1)
        };
      } catch (error) {
        return defaults;
      }
    }

    saveSettings() {
      try {
        localStorage.setItem("zombie-apocalypse-settings", JSON.stringify(this.settings));
      } catch (error) {
        // localStorage can be unavailable in private browsing or strict file contexts.
      }
    }

    bindEvents() {
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.audio.stopMusic();
        } else if (this.state === "playing" || this.state === "intermission") {
          this.audio.startMusic();
        }
      });

      window.addEventListener("keydown", (event) => {
        this.input.keys[event.code] = true;

        if (this.state === "menu" && (event.code === "Enter" || event.code === "Space")) {
          event.preventDefault();
          this.startNewRun();
          return;
        }

        if (this.state === "tutorial" && (event.code === "Enter" || event.code === "Space")) {
          event.preventDefault();
          this.startFirstWave();
          return;
        }

        if (this.state !== "playing" && this.state !== "intermission") {
          return;
        }

        switch (event.code) {
          case "KeyR":
            this.input.reloadPressed = true;
            break;
          case "KeyH":
            if (!event.repeat) {
              this.input.grenadePressed = true;
            }
            break;
          case "ShiftLeft":
          case "ShiftRight":
            this.player.startDash();
            break;
          case "Digit1":
            this.player.setWeaponByIndex(0);
            break;
          case "Digit2":
            this.player.setWeaponByIndex(1);
            break;
          case "Digit3":
            this.player.setWeaponByIndex(2);
            break;
          case "Digit4":
            this.player.setWeaponByIndex(3);
            break;
          case "Digit5":
            this.player.setWeaponByIndex(4);
            break;
          case "Digit6":
            this.player.setWeaponByIndex(5);
            break;
          case "Digit7":
            this.player.setWeaponByIndex(6);
            break;
          case "KeyQ":
            this.player.switchWeapon(-1);
            break;
          case "KeyE":
            this.player.switchWeapon(1);
            break;
          case "KeyF":
            event.preventDefault();
            if (!this.tryPullLever()) {
              this.tryOpenDoor();
            }
            break;
          case "KeyG":
            event.preventDefault();
            this.ui.toggleMap();
            break;
          case "KeyN":
            event.preventDefault();
            this.toggleNightVision();
            break;
          default:
            break;
        }
      });

      window.addEventListener("keyup", (event) => {
        this.input.keys[event.code] = false;
      });

      this.canvas.addEventListener("mousemove", (event) => {
        this.input.aimX = event.clientX;
        this.input.aimY = event.clientY;
      });

      this.canvas.addEventListener("mousedown", (event) => {
        if (event.button === 2 && (this.state === "playing" || this.state === "intermission")) {
          event.preventDefault();
          this.input.grenadePressed = true;
        } else if (event.button === 0 && (this.state === "playing" || this.state === "intermission")) {
          this.input.fire = true;
        }
      });

      this.canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      });

      window.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
          this.input.fire = false;
        }
      });

      this.canvas.addEventListener("mouseleave", () => {
        this.input.fire = false;
      });

      this.canvas.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") {
          this.input.aimX = event.clientX;
          this.input.aimY = event.clientY;
        }
      });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(320, Math.floor(rect.width || window.innerWidth));
      this.height = Math.max(480, Math.floor(rect.height || window.innerHeight));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (!this.input.aimX || !this.input.aimY) {
        this.input.aimX = this.width * 0.6;
        this.input.aimY = this.height * 0.45;
      }
      if (this.player) {
        this.player.x = GameUtils.clamp(this.player.x, this.player.radius + 4, this.width - this.player.radius - 4);
        this.player.y = GameUtils.clamp(this.player.y, this.player.radius + 4, this.height - this.player.radius - 4);
      }
      if (this.worldLayout) {
        this.worldLayout = this.createWorldLayout();
        this.traps = this.createTrapsForLocation(this.traps);
      }
    }

    loop(timestamp) {
      const dt = Math.min(0.033, (timestamp - this.lastFrame) / 1000 || 0.016);
      this.lastFrame = timestamp;
      this.update(dt);
      this.render();
      requestAnimationFrame((next) => this.loop(next));
    }

    update(dt) {
      this.worldTime += dt;
      this.particles.update(dt);
      this.floaters.update(dt);
      this.bonuses.update(dt);
      this.updateNightVision(dt);

      if (this.state === "menu") {
        this.ui.updateHUD();
        this.ui.refreshMainMenuStats();
        return;
      }

      if (this.state === "playing" || this.state === "intermission") {
        this.player.update(dt, this.state === "playing");
        this.updateBullets(dt);
        this.updateEnemyBullets(dt);
        this.updateGrenades(dt);
        this.updateTraps(dt);
        this.updateZombies(dt);
        this.updatePickups(dt);
        this.missions.update(dt);
        this.waveManager.update(dt);
        this.checkLevelTrigger();
        this.updateShake(dt);
      }

      this.ui.updateHUD();
    }

    updateShake(dt) {
      return dt;
    }

    updateNightVision(dt) {
      if (this.nightVisionCooldown > 0) {
        this.nightVisionCooldown = Math.max(0, this.nightVisionCooldown - dt);
      }
      if (this.nightVisionActive) {
        this.nightVisionTimer = Math.max(0, this.nightVisionTimer - dt);
        if (this.nightVisionTimer <= 0) {
          this.nightVisionActive = false;
          this.nightVisionCooldown = 14;
          this.ui.showNotification("Night vision faded", "normal", 1600);
        }
      }
    }

    toggleNightVision() {
      if (this.state !== "playing" && this.state !== "intermission") {
        return false;
      }

      if (this.nightVisionActive) {
        return false;
      }

      if (this.nightVisionCooldown > 0) {
        this.ui.showNotification(`Night vision recharging ${GameUtils.formatTime(this.nightVisionCooldown)}`, "normal", 1600);
        return false;
      }

      this.nightVisionActive = true;
      this.nightVisionTimer = 7;
      this.ui.showNotification("Night vision engaged", "accent", 1800);
      this.audio.playSfx("bonus");
      return true;
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawBackdrop(ctx);

      ctx.save();

      this.drawGroundFog(ctx);
      this.drawStructures(ctx);
      this.drawEntities(ctx);
      this.particles.render(ctx);
      this.floaters.render(ctx);

      if (this.state === "playing" || this.state === "intermission") {
        this.drawCrosshair(ctx);
      }

      ctx.restore();

      this.drawOverlays(ctx);
    }

    drawBackdrop(ctx) {
      const theme = this.worldLayout?.theme || this.locations[0]?.theme;
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, theme?.backdropTop || "#060c0a");
      gradient.addColorStop(0.45, theme?.backdropMid || "#020504");
      gradient.addColorStop(1, theme?.backdropBottom || "#010101");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      const centerGlow = ctx.createRadialGradient(this.width * 0.46, this.height * 0.42, 50, this.width * 0.5, this.height * 0.45, Math.max(this.width, this.height) * 0.55);
      centerGlow.addColorStop(0, theme?.glowPrimary || "rgba(103,240,167,0.06)");
      centerGlow.addColorStop(0.55, theme?.glowSecondary || "rgba(255,111,97,0.035)");
      centerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = theme?.fogSecondary || "rgba(129, 255, 188, 0.16)";
      ctx.lineWidth = 1;
      const spacing = 52;
      const offset = Math.sin(this.worldTime * 0.4) * 12;
      for (let x = -spacing; x <= this.width + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, this.height);
        ctx.stroke();
      }
      for (let y = -spacing; y <= this.height + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset * 0.4);
        ctx.lineTo(this.width, y + offset * 0.4);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawGroundFog(ctx) {
      const theme = this.worldLayout?.theme || this.locations[0]?.theme;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const drifts = [
        { x: this.width * 0.2, y: this.height * 0.8, r: 220, c: theme?.fogPrimary || "rgba(255,111,97,0.05)" },
        { x: this.width * 0.74, y: this.height * 0.28, r: 260, c: theme?.fogSecondary || "rgba(103,240,167,0.05)" },
        { x: this.width * 0.55, y: this.height * 0.62, r: 180, c: theme?.fogNeutral || "rgba(255,255,255,0.03)" }
      ];
      for (const drift of drifts) {
        const pulse = 1 + Math.sin(this.worldTime * 0.7 + drift.x * 0.001) * 0.06;
        const gradient = ctx.createRadialGradient(drift.x, drift.y, 10, drift.x, drift.y, drift.r * pulse);
        gradient.addColorStop(0, drift.c);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(drift.x, drift.y, drift.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawWeather(ctx) {
      if (!this.atmosphere) {
        return;
      }

      const { kind, intensity, wind } = this.atmosphere;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      if (kind === "rain") {
        const count = Math.round(90 * intensity);
        for (let i = 0; i < count; i += 1) {
          const seed = i * 97.13;
          const x = ((seed * 17.3 + this.worldTime * (wind * 7)) % (this.width + 200)) - 100;
          const y = ((seed * 29.1 + this.worldTime * 520) % (this.height + 220)) - 110;
          const length = 16 + (i % 5) * 4;
          ctx.strokeStyle = `rgba(165, 210, 255, ${0.04 + intensity * 0.05})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - wind * 0.18, y + length);
          ctx.stroke();
        }
      } else if (kind === "fog") {
        const fogDensity = this.worldLayout?.fogDensity || 1;
        const count = Math.round(12 * intensity * fogDensity);
        for (let i = 0; i < count; i += 1) {
          const seed = i * 142.7;
          const x = ((seed * 11.4 + this.worldTime * wind * 12) % (this.width + 260)) - 130;
          const y = ((seed * 17.8 + this.worldTime * wind * 6) % (this.height + 220)) - 110;
          const radius = 52 + (i % 4) * 22;
          const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
          gradient.addColorStop(0, `rgba(201, 233, 255, ${0.06 * intensity})`);
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const fogDensity = this.worldLayout?.fogDensity || 1;
        const count = Math.round(54 * intensity * fogDensity);
        for (let i = 0; i < count; i += 1) {
          const seed = i * 61.9;
          const x = ((seed * 9.2 + this.worldTime * wind * 5) % (this.width + 140)) - 70;
          const y = ((seed * 27.4 + this.worldTime * 48) % (this.height + 160)) - 80;
          const size = 1.2 + (i % 3) * 0.7;
          ctx.fillStyle = `rgba(209, 244, 221, ${0.04 + intensity * 0.04})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    drawStructures(ctx) {
      if (!this.worldLayout) {
        return;
      }

      const theme = this.worldLayout.theme || {};
      ctx.save();
      for (const structure of this.worldLayout.barricades || []) {
        const gradient = ctx.createLinearGradient(structure.x, structure.y, structure.x + structure.w, structure.y + structure.h);
        gradient.addColorStop(0, structure.fill || "rgba(88, 64, 42, 0.92)");
        gradient.addColorStop(1, "rgba(28, 22, 17, 0.96)");
        ctx.fillStyle = gradient;
        ctx.fillRect(structure.x, structure.y, structure.w, structure.h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(structure.x, structure.y, structure.w, structure.h);

        if (structure.w > structure.h) {
          ctx.strokeStyle = theme.structureGlow || "rgba(255, 211, 77, 0.15)";
          ctx.beginPath();
          ctx.moveTo(structure.x + 8, structure.y + structure.h * 0.5);
          ctx.lineTo(structure.x + structure.w - 8, structure.y + structure.h * 0.5);
          ctx.stroke();
        } else {
          ctx.strokeStyle = theme.structureGlow || "rgba(255, 211, 77, 0.15)";
          ctx.beginPath();
          ctx.moveTo(structure.x + structure.w * 0.5, structure.y + 8);
          ctx.lineTo(structure.x + structure.w * 0.5, structure.y + structure.h - 8);
          ctx.stroke();
        }
      }

      for (const prop of this.worldLayout.props || []) {
        ctx.save();
        ctx.translate(prop.x, prop.y);
        switch (prop.type) {
          case "car":
            ctx.fillStyle = "rgba(31, 39, 34, 0.95)";
            ctx.fillRect(0, 8, prop.w, prop.h * 0.55);
            ctx.fillStyle = "rgba(69, 83, 94, 0.95)";
            ctx.fillRect(8, 0, prop.w - 16, prop.h * 0.62);
            ctx.fillStyle = "rgba(20, 24, 28, 0.95)";
            ctx.fillRect(12, prop.h * 0.18, prop.w - 24, prop.h * 0.22);
            break;
          case "streetlight":
            ctx.fillStyle = "rgba(18, 24, 20, 0.95)";
            ctx.fillRect(prop.w * 0.4, 0, 4, prop.h);
            ctx.fillRect(prop.w * 0.12, 4, prop.w * 0.76, 4);
            ctx.fillStyle = "rgba(255, 211, 77, 0.78)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.62, 12, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "train":
            ctx.fillStyle = "rgba(28, 38, 49, 0.96)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            ctx.fillStyle = "rgba(103, 240, 167, 0.16)";
            ctx.fillRect(8, 8, prop.w - 16, 10);
            break;
          case "pillar":
            ctx.fillStyle = "rgba(58, 69, 88, 0.96)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            ctx.strokeStyle = "rgba(173, 219, 255, 0.18)";
            ctx.strokeRect(0, 0, prop.w, prop.h);
            break;
          case "labTank":
            ctx.fillStyle = "rgba(12, 20, 18, 0.96)";
            ctx.fillRect(prop.w * 0.18, 0, prop.w * 0.64, prop.h);
            ctx.fillStyle = "rgba(126, 244, 218, 0.22)";
            ctx.fillRect(prop.w * 0.24, prop.h * 0.08, prop.w * 0.52, prop.h * 0.78);
            ctx.strokeStyle = "rgba(184, 255, 231, 0.55)";
            ctx.lineWidth = 2;
            ctx.strokeRect(prop.w * 0.18, 0, prop.w * 0.64, prop.h);
            ctx.fillStyle = "rgba(184, 255, 231, 0.7)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.5, prop.h * 0.5, Math.min(prop.w, prop.h) * 0.16, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "console":
            ctx.fillStyle = "rgba(18, 25, 24, 0.96)";
            ctx.fillRect(0, prop.h * 0.18, prop.w, prop.h * 0.7);
            ctx.fillStyle = "rgba(184, 255, 231, 0.75)";
            ctx.fillRect(prop.w * 0.1, prop.h * 0.28, prop.w * 0.34, prop.h * 0.18);
            ctx.fillStyle = "rgba(139, 195, 255, 0.65)";
            ctx.fillRect(prop.w * 0.52, prop.h * 0.28, prop.w * 0.36, prop.h * 0.18);
            ctx.fillStyle = "rgba(255, 211, 77, 0.72)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.24, prop.h * 0.68, 3, 0, Math.PI * 2);
            ctx.arc(prop.w * 0.5, prop.h * 0.68, 3, 0, Math.PI * 2);
            ctx.arc(prop.w * 0.76, prop.h * 0.68, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "tent":
            ctx.fillStyle = "rgba(42, 61, 49, 0.96)";
            ctx.beginPath();
            ctx.moveTo(0, prop.h);
            ctx.lineTo(prop.w * 0.5, 0);
            ctx.lineTo(prop.w, prop.h);
            ctx.closePath();
            ctx.fill();
            break;
          case "floodlight":
            ctx.fillStyle = "rgba(29, 38, 34, 0.96)";
            ctx.fillRect(prop.w * 0.3, 0, prop.w * 0.4, prop.h * 0.78);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.5, prop.h * 0.2, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "tree":
            ctx.fillStyle = "rgba(39, 28, 18, 0.96)";
            ctx.fillRect(prop.w * 0.42, prop.h * 0.34, prop.w * 0.16, prop.h * 0.58);
            ctx.fillStyle = "rgba(48, 92, 54, 0.95)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.5, prop.h * 0.3, prop.w * 0.34, 0, Math.PI * 2);
            ctx.arc(prop.w * 0.34, prop.h * 0.44, prop.w * 0.24, 0, Math.PI * 2);
            ctx.arc(prop.w * 0.66, prop.h * 0.44, prop.w * 0.24, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(172, 220, 132, 0.18)";
            ctx.strokeRect(prop.w * 0.42, prop.h * 0.34, prop.w * 0.16, prop.h * 0.58);
            break;
          case "fallenTree":
            ctx.fillStyle = "rgba(62, 48, 30, 0.96)";
            ctx.fillRect(0, prop.h * 0.28, prop.w, prop.h * 0.44);
            ctx.strokeStyle = "rgba(172, 220, 132, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, prop.h * 0.5);
            ctx.lineTo(prop.w - 10, prop.h * 0.5);
            ctx.stroke();
            ctx.fillStyle = "rgba(48, 92, 54, 0.9)";
            ctx.beginPath();
            ctx.arc(prop.w * 0.16, prop.h * 0.22, prop.h * 0.28, 0, Math.PI * 2);
            ctx.arc(prop.w * 0.78, prop.h * 0.78, prop.h * 0.24, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "container":
            ctx.fillStyle = "rgba(44, 71, 96, 0.96)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.strokeRect(0, 0, prop.w, prop.h);
            break;
          case "crate":
            ctx.fillStyle = "rgba(92, 68, 42, 0.96)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.strokeRect(0, 0, prop.w, prop.h);
            break;
          case "shelf":
            ctx.fillStyle = "rgba(44, 48, 46, 0.96)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.strokeRect(0, 0, prop.w, prop.h);
            ctx.fillStyle = "rgba(255, 211, 77, 0.12)";
            ctx.fillRect(6, prop.h * 0.28, prop.w - 12, 4);
            ctx.fillRect(6, prop.h * 0.58, prop.w - 12, 4);
            ctx.fillStyle = "rgba(92, 68, 42, 0.95)";
            ctx.fillRect(prop.w * 0.12, prop.h * 0.08, prop.w * 0.22, prop.h * 0.16);
            ctx.fillRect(prop.w * 0.58, prop.h * 0.38, prop.w * 0.26, prop.h * 0.16);
            break;
          case "bed":
            ctx.fillStyle = "rgba(196, 206, 220, 0.96)";
            ctx.fillRect(0, prop.h * 0.25, prop.w, prop.h * 0.36);
            ctx.fillStyle = "rgba(80, 88, 102, 0.96)";
            ctx.fillRect(0, 0, prop.w * 0.18, prop.h);
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillRect(prop.w * 0.22, prop.h * 0.08, prop.w * 0.6, prop.h * 0.12);
            break;
          case "gurney":
            ctx.fillStyle = "rgba(170, 182, 198, 0.96)";
            ctx.fillRect(0, prop.h * 0.28, prop.w, prop.h * 0.28);
            ctx.fillStyle = "rgba(76, 88, 104, 0.96)";
            ctx.fillRect(prop.w * 0.12, 0, prop.w * 0.12, prop.h);
            ctx.fillRect(prop.w * 0.76, 0, prop.w * 0.12, prop.h);
            break;
          default:
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fillRect(0, 0, prop.w, prop.h);
            break;
        }
        ctx.restore();
      }

      const door = this.worldLayout.door;
      if (door) {
        ctx.save();
        const doorGradient = ctx.createLinearGradient(door.x, door.y, door.x + door.w, door.y + door.h);
        if (door.open) {
          doorGradient.addColorStop(0, "rgba(103, 240, 167, 0.96)");
          doorGradient.addColorStop(1, "rgba(36, 98, 67, 0.98)");
        } else {
          doorGradient.addColorStop(0, "rgba(255, 195, 77, 0.96)");
          doorGradient.addColorStop(1, "rgba(126, 59, 38, 0.98)");
        }
        ctx.fillStyle = doorGradient;
        ctx.fillRect(door.x, door.y, door.w, door.h);
        ctx.strokeStyle = door.open ? "rgba(103, 240, 167, 0.95)" : "rgba(255, 211, 77, 0.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x, door.y, door.w, door.h);

        ctx.fillStyle = "rgba(5, 11, 7, 0.72)";
        ctx.fillRect(door.x + 5, door.y + 10, door.w - 10, Math.max(0, door.h - 20));

        ctx.fillStyle = door.open ? "#eafff3" : "#fff0b5";
        ctx.font = "700 12px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(door.open ? "OPEN" : "LOCK", door.x + door.w * 0.5, door.y + door.h * 0.5 - 12);
        ctx.fillStyle = door.open ? "#06120c" : "#321d03";
        ctx.fillText("KC", door.x + door.w * 0.5, door.y + door.h * 0.5 + 4);

        ctx.fillStyle = door.open ? "rgba(103, 240, 167, 0.22)" : "rgba(255, 77, 77, 0.22)";
        ctx.beginPath();
        ctx.arc(door.x + door.w * 0.5, door.y + door.h - 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const lever = this.worldLayout.lever;
      if (lever && (this.leverReady || this.leverPulled)) {
        ctx.save();
        const armed = this.leverReady;
        const pulled = this.leverPulled;
        const wallSide = lever.wall || "right";
        const centerX = lever.x + lever.w * 0.5;
        const centerY = lever.y + lever.h * 0.5;
        ctx.translate(centerX, centerY);

        const leverGradient = ctx.createLinearGradient(-lever.w * 0.5, -lever.h * 0.5, lever.w * 0.5, lever.h * 0.5);
        leverGradient.addColorStop(0, pulled ? "rgba(103, 240, 167, 0.96)" : "rgba(255, 211, 77, 0.96)");
        leverGradient.addColorStop(1, pulled ? "rgba(34, 89, 59, 0.98)" : "rgba(110, 77, 28, 0.98)");

        ctx.fillStyle = "rgba(9, 12, 11, 0.72)";
        ctx.fillRect(-lever.w * 0.58, -lever.h * 0.5, lever.w * 1.16, lever.h);
        ctx.fillStyle = "rgba(34, 40, 36, 0.9)";
        ctx.fillRect(-lever.w * 0.5, -lever.h * 0.5, lever.w, lever.h);
        ctx.fillStyle = leverGradient;
        ctx.fillRect(-lever.w * 0.42, -lever.h * 0.44, lever.w * 0.84, lever.h * 0.88);
        ctx.strokeStyle = pulled ? "rgba(103, 240, 167, 0.95)" : "rgba(255, 211, 77, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-lever.w * 0.42, -lever.h * 0.44, lever.w * 0.84, lever.h * 0.88);

        ctx.fillStyle = "rgba(5, 10, 7, 0.62)";
        ctx.fillRect(wallSide === "right" ? lever.w * 0.1 : -lever.w * 0.2, -lever.h * 0.42, lever.w * 0.22, lever.h * 0.84);

        ctx.save();
        ctx.translate(wallSide === "right" ? lever.w * 0.16 : -lever.w * 0.16, 0);
        ctx.rotate(pulled ? 0.95 : -0.35);
        ctx.strokeStyle = "rgba(8, 12, 9, 0.96)";
        ctx.lineWidth = Math.max(3, lever.w * 0.22);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -lever.h * 0.46);
        ctx.stroke();
        ctx.fillStyle = pulled ? "#eafff3" : "#fff0b5";
        ctx.beginPath();
        ctx.arc(0, -lever.h * 0.52, Math.max(3, lever.w * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = pulled ? "#eafff3" : "#fff0b5";
        ctx.font = "700 10px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pulled ? "ARMED" : "PULL", 0, -lever.h * 0.68);
        ctx.fillText(pulled ? "TRIGGER" : "LEVER", 0, lever.h * 0.7);

        if (armed) {
          ctx.fillStyle = "rgba(255, 211, 77, 0.22)";
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(lever.w, lever.h) * 0.72, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      const generator = this.worldLayout.generator;
      if (generator) {
        ctx.save();
        const flicker = 0.8 + Math.sin(this.worldTime * 12 + (this.atmosphere?.flicker || 0)) * 0.15;
        const x = generator.x;
        const y = generator.y;
        const w = generator.w;
        const h = generator.h;
        const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, 6, x + w * 0.5, y + h * 0.5, 140);
        glow.addColorStop(0, `rgba(255, 220, 130, ${0.26 * flicker})`);
        glow.addColorStop(0.45, `rgba(103, 240, 167, ${0.12 * flicker})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.5, 140, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(12, 18, 14, 0.96)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(255, 220, 130, 0.34)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "rgba(103, 240, 167, 0.9)";
        ctx.fillRect(x + 5, y + 5, w - 10, Math.max(4, h * 0.26));
        ctx.fillStyle = "rgba(255, 220, 130, 0.85)";
        ctx.fillRect(x + 7, y + h * 0.43, w - 14, 3);
        ctx.fillStyle = "rgba(90, 110, 98, 0.95)";
        ctx.fillRect(x + 2, y + h - 6, w - 4, 4);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(x + w * 0.68, y + h * 0.32, 2 + flicker * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this.drawTraps(ctx);

      const trigger = this.worldLayout.levelTrigger;
      if (trigger) {
        ctx.save();
        const active = this.levelAdvanceReady;
        const armed = this.leverReady;
        const pulse = 1 + Math.sin(this.worldTime * 5) * 0.06;
        ctx.globalAlpha = active ? 1 : armed ? 0.72 : 0.45;
        const triggerGradient = ctx.createRadialGradient(
          trigger.x + trigger.w * 0.5,
          trigger.y + trigger.h * 0.5,
          8,
          trigger.x + trigger.w * 0.5,
          trigger.y + trigger.h * 0.5,
          Math.max(trigger.w, trigger.h) * 0.75 * pulse
        );
        triggerGradient.addColorStop(0, active ? "rgba(103, 240, 167, 0.96)" : armed ? "rgba(255, 211, 77, 0.92)" : "rgba(255, 211, 77, 0.84)");
        triggerGradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = triggerGradient;
        ctx.beginPath();
        ctx.ellipse(
          trigger.x + trigger.w * 0.5,
          trigger.y + trigger.h * 0.5,
          trigger.w * 0.52 * pulse,
          trigger.h * 0.52 * pulse,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = active ? "rgba(103, 240, 167, 0.95)" : armed ? "rgba(255, 211, 77, 0.9)" : "rgba(255, 211, 77, 0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(trigger.x, trigger.y, trigger.w, trigger.h);

        ctx.fillStyle = active ? "#eafff3" : "#fff0b5";
        ctx.font = "700 11px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(active ? "NEXT" : "WAIT", trigger.x + trigger.w * 0.5, trigger.y + trigger.h * 0.5 - 8);
        ctx.fillText("LEVEL", trigger.x + trigger.w * 0.5, trigger.y + trigger.h * 0.5 + 6);
        ctx.restore();
      }

      ctx.restore();
    }

    circleIntersectsRect(entity, rect) {
      const radius = entity.radius || 0;
      const nearestX = GameUtils.clamp(entity.x, rect.x, rect.x + rect.w);
      const nearestY = GameUtils.clamp(entity.y, rect.y, rect.y + rect.h);
      const dx = entity.x - nearestX;
      const dy = entity.y - nearestY;
      return dx * dx + dy * dy <= radius * radius;
    }

    checkLevelTrigger() {
      if (!this.levelAdvanceReady || this.state !== "playing" || !this.worldLayout?.levelTrigger) {
        return;
      }

      if (this.doorOpen && this.circleIntersectsRect(this.player, this.worldLayout.levelTrigger)) {
        this.completeLevelAdvance();
      }
    }

    updateTraps(dt) {
      if (!this.traps?.length) {
        return;
      }

      for (const trap of this.traps) {
        trap.cooldown = Math.max(0, (trap.cooldown || 0) - dt);
        trap.flash = Math.max(0, (trap.flash || 0) - dt);
        trap.playerCooldown = Math.max(0, (trap.playerCooldown || 0) - dt);
        trap.pulse = (trap.pulse || 0) + dt * 3;
        if (trap.arcs?.length) {
          trap.arcs = trap.arcs
            .map((arc) => ({ ...arc, life: arc.life - dt }))
            .filter((arc) => arc.life > 0);
        }

        if (trap.spent) {
          continue;
        }

        if (trap.type === "wire") {
          this.applyWireTrap(trap, dt);
        } else if (trap.type === "tesla" && trap.cooldown <= 0) {
          this.triggerTeslaTrap(trap);
        } else if (trap.type === "turret" && trap.cooldown <= 0) {
          this.fireTurretTrap(trap);
        }
      }
    }

    applyWireTrap(trap, dt) {
      for (const zombie of this.zombies) {
        if (!zombie.alive || !this.circleIntersectsRect(zombie, trap)) {
          continue;
        }

        zombie.trapSlowFactor = Math.min(zombie.trapSlowFactor || 1, trap.slow || 0.5);
        zombie.wireDamageCooldown = Math.max(0, (zombie.wireDamageCooldown || 0) - dt);
        if (zombie.wireDamageCooldown <= 0) {
          zombie.wireDamageCooldown = 0.55;
          zombie.takeDamage(trap.damage || 8, { trap: true });
          this.particles.sparks(zombie.x, zombie.y, 3, "#d8fbff");
        }
      }

      if (this.player.hp > 0 && trap.playerCooldown <= 0 && this.circleIntersectsRect(this.player, trap)) {
        trap.playerCooldown = 0.8;
        this.player.takeDamage(5, trap.x + trap.w * 0.5, trap.y + trap.h * 0.5);
      }
    }

    triggerTeslaTrap(trap) {
      const targets = this.zombies
        .filter((zombie) => zombie.alive && GameUtils.distance(trap.x, trap.y, zombie.x, zombie.y) <= trap.range)
        .sort((left, right) => GameUtils.distance(trap.x, trap.y, left.x, left.y) - GameUtils.distance(trap.x, trap.y, right.x, right.y))
        .slice(0, 3);

      if (!targets.length) {
        trap.cooldown = 0.18;
        return;
      }

      trap.cooldown = trap.fireRate || 2.2;
      trap.flash = 0.32;
      trap.arcs = targets.map((target) => ({ x: target.x, y: target.y, life: 0.18 }));
      this.particles.sparks(trap.x, trap.y, 8, "#98f0ff");
      this.audio.playSfx("bonus");
      this.addShake(1.6);

      for (const target of targets) {
        target.trapSlowFactor = Math.min(target.trapSlowFactor || 1, 0.55);
        target.takeDamage(trap.damage || 20, { trap: true });
      }
    }

    fireTurretTrap(trap) {
      const target = this.zombies
        .filter((zombie) => zombie.alive && GameUtils.distance(trap.x, trap.y, zombie.x, zombie.y) <= trap.range)
        .sort((left, right) => GameUtils.distance(trap.x, trap.y, left.x, left.y) - GameUtils.distance(trap.x, trap.y, right.x, right.y))[0];

      if (!target) {
        trap.cooldown = 0.12;
        return;
      }

      const angle = Math.atan2(target.y - trap.y, target.x - trap.x);
      const speed = 980;
      trap.angle = angle;
      trap.cooldown = trap.fireRate || 0.42;
      trap.flash = 0.14;
      this.spawnBullet({
        x: trap.x + Math.cos(angle) * (trap.radius + 8),
        y: trap.y + Math.sin(angle) * (trap.radius + 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.7,
        damage: trap.damage || 16,
        color: "#8dc3ff",
        pierce: 0,
        critChance: 0,
        angle,
        life: 0.8,
        weaponKey: "turret"
      });
      this.particles.sparks(trap.x + Math.cos(angle) * trap.radius, trap.y + Math.sin(angle) * trap.radius, 3, "#8dc3ff");
      this.audio.playSfx("shoot");
    }

    hitTrapWithBullet(bullet) {
      for (const trap of this.traps || []) {
        if (trap.type !== "barrel" || trap.spent) {
          continue;
        }

        const distance = GameUtils.distance(bullet.x, bullet.y, trap.x, trap.y);
        if (distance <= (trap.radius || 16) + (bullet.radius || 2)) {
          this.damageTrap(trap, bullet.damage || 10);
          this.particles.sparks(bullet.x, bullet.y, 6, "#ffca63");
          return true;
        }
      }
      return false;
    }

    damageTrap(trap, amount) {
      if (!trap || trap.spent || trap.type !== "barrel") {
        return false;
      }

      trap.hp -= amount;
      trap.flash = 0.16;
      if (trap.hp <= 0) {
        this.detonateTrap(trap);
      }
      return true;
    }

    detonateTrap(trap) {
      if (!trap || trap.spent) {
        return false;
      }

      trap.spent = true;
      trap.hp = 0;
      trap.flash = 0.5;
      this.floaters.add("BOOM", trap.x, trap.y - 22, "#ffca63", {
        life: 0.75,
        scale: 1,
        velocityY: -24
      });
      this.spawnExplosion(trap.x, trap.y, trap.blastRadius || 112, trap.damage || 100, "#ff9f5a");
      return true;
    }

    drawTraps(ctx) {
      if (!this.traps?.length) {
        return;
      }

      for (const trap of this.traps) {
        if (trap.type === "wire") {
          this.drawWireTrap(ctx, trap);
        } else if (trap.type === "barrel") {
          this.drawBarrelTrap(ctx, trap);
        } else if (trap.type === "tesla") {
          this.drawTeslaTrap(ctx, trap);
        } else if (trap.type === "turret") {
          this.drawTurretTrap(ctx, trap);
        }
      }
    }

    drawWireTrap(ctx, trap) {
      ctx.save();
      const pulse = 0.65 + Math.sin(this.worldTime * 6 + trap.pulse) * 0.18;
      ctx.fillStyle = "rgba(20, 26, 23, 0.82)";
      ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
      ctx.strokeStyle = `rgba(216, 251, 255, ${0.34 + pulse * 0.18})`;
      ctx.lineWidth = 2;
      for (let y = trap.y + 5; y < trap.y + trap.h; y += 7) {
        ctx.beginPath();
        ctx.moveTo(trap.x + 6, y);
        ctx.lineTo(trap.x + trap.w - 6, y + Math.sin(this.worldTime * 8 + y) * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255, 211, 77, 0.45)";
      ctx.lineWidth = 1.5;
      for (let x = trap.x + 10; x < trap.x + trap.w - 8; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, trap.y + 3);
        ctx.lineTo(x + 7, trap.y + trap.h - 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawBarrelTrap(ctx, trap) {
      ctx.save();
      ctx.translate(trap.x, trap.y);
      const radius = trap.radius || 16;
      if (trap.spent) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(11, 9, 8, 0.86)";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 159, 90, 0.22)";
        ctx.stroke();
        ctx.restore();
        return;
      }

      const flash = trap.flash || 0;
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * (3.2 + flash * 8));
      glow.addColorStop(0, `rgba(255, 159, 90, ${0.28 + flash})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (3.2 + flash * 8), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      const gradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
      gradient.addColorStop(0, "#ffca63");
      gradient.addColorStop(0.5, "#b83d2e");
      gradient.addColorStop(1, "#32130d");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(5, 8, 6, 0.8)";
      ctx.fillRect(-radius * 0.54, -radius * 0.18, radius * 1.08, radius * 0.28);
      ctx.fillStyle = "#fff0b5";
      ctx.font = "700 10px Bahnschrift, Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EXP", 0, 1);
      ctx.restore();
    }

    drawTeslaTrap(ctx, trap) {
      ctx.save();
      const pulse = 0.5 + Math.sin(this.worldTime * 8 + trap.pulse) * 0.18 + (trap.flash || 0);
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(trap.x, trap.y, 8, trap.x, trap.y, trap.range * 0.9);
      glow.addColorStop(0, `rgba(152, 240, 255, ${0.18 + pulse * 0.08})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(trap.x, trap.y, trap.range * 0.9, 0, Math.PI * 2);
      ctx.fill();

      for (const arc of trap.arcs || []) {
        ctx.strokeStyle = `rgba(152, 240, 255, ${GameUtils.clamp(arc.life * 5, 0, 1)})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(trap.x, trap.y);
        const midX = (trap.x + arc.x) * 0.5 + Math.sin(this.worldTime * 30 + arc.x) * 16;
        const midY = (trap.y + arc.y) * 0.5 + Math.cos(this.worldTime * 26 + arc.y) * 16;
        ctx.quadraticCurveTo(midX, midY, arc.x, arc.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawTurretTrap(ctx, trap) {
      ctx.save();
      ctx.translate(trap.x, trap.y);
      const radius = trap.radius || 18;
      const angle = trap.angle ?? Math.sin(this.worldTime * 0.9 + trap.pulse) * 0.8;
      const flash = trap.flash || 0;

      ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.7, radius * 1.15, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(angle);
      ctx.fillStyle = "#25343b";
      ctx.fillRect(-radius * 0.3, -5, radius * 1.65, 10);
      ctx.fillStyle = "#8dc3ff";
      ctx.fillRect(radius * 0.85, -2, radius * 0.55, 4);
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 241, 181, ${GameUtils.clamp(flash * 6, 0, 0.9)})`;
        ctx.beginPath();
        ctx.arc(radius * 1.55, 0, radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(-angle);

      const base = ctx.createRadialGradient(-radius * 0.2, -radius * 0.3, 3, 0, 0, radius * 1.2);
      base.addColorStop(0, "#d8fbff");
      base.addColorStop(0.42, "#4f6c76");
      base.addColorStop(1, "#11191d");
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(141, 195, 255, 0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    drawEntities(ctx) {
      const entities = [
        ...this.pickups,
        ...this.grenades,
        ...this.zombies,
        this.player
      ].filter(Boolean);
      entities.sort((a, b) => (a.y || 0) - (b.y || 0));

      for (const entity of entities) {
        if (entity instanceof BonusPickup) {
          entity.draw(ctx);
        } else if (entity instanceof Zombie) {
          entity.draw(ctx);
        } else if (entity instanceof Player) {
          entity.draw(ctx);
        } else if (entity.type === "grenade") {
          this.drawGrenade(ctx, entity);
        }
      }

      for (const bullet of this.bullets) {
        this.drawBullet(ctx, bullet);
      }

      for (const bullet of this.enemyBullets) {
        this.drawEnemyBullet(ctx, bullet);
      }
    }

    drawBullet(ctx, bullet) {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, bullet.radius * 6);
      glow.addColorStop(0, bullet.color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawEnemyBullet(ctx, bullet) {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, bullet.radius * 7);
      glow.addColorStop(0, bullet.glow || bullet.color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.38;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius * 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawGrenade(ctx, grenade) {
      ctx.save();
      ctx.translate(grenade.x, grenade.y);

      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, grenade.radius * 7);
      glow.addColorStop(0, grenade.color || "#ffca63");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.38;
      ctx.beginPath();
      ctx.arc(0, 0, grenade.radius * 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#1a1f1a";
      ctx.beginPath();
      ctx.arc(0, 0, grenade.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = grenade.color || "#ffca63";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, grenade.radius, 0, Math.PI * 2);
      ctx.stroke();

      const fuseProgress = Math.max(0, Math.min(1, grenade.fuse / grenade.maxFuse));
      ctx.fillStyle = `rgba(255, 211, 77, ${0.4 + fuseProgress * 0.4})`;
      ctx.beginPath();
      ctx.arc(grenade.radius * 0.55, -grenade.radius * 0.9, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, grenade.radius + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawCrosshair(ctx) {
      const x = this.input.aimX;
      const y = this.input.aimY;
      const dist = GameUtils.distance(this.player.x, this.player.y, x, y);
      const scale = GameUtils.clamp(dist / 400, 0.6, 1.4);

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "rgba(103,240,167,0.86)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18 * scale, 0);
      ctx.lineTo(-8 * scale, 0);
      ctx.moveTo(8 * scale, 0);
      ctx.lineTo(18 * scale, 0);
      ctx.moveTo(0, -18 * scale);
      ctx.lineTo(0, -8 * scale);
      ctx.moveTo(0, 8 * scale);
      ctx.lineTo(0, 18 * scale);
      ctx.stroke();
      ctx.restore();
    }

    drawOverlays(ctx) {
      if (this.player.damageFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 48, 48, ${this.player.damageFlash * 0.2})`;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
      }

      if (this.bonuses.isActive("freeze")) {
        ctx.save();
        ctx.fillStyle = "rgba(123, 210, 255, 0.08)";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
      }

      if ((this.state === "playing" || this.state === "intermission") && this.worldLayout?.locationName) {
        ctx.save();
        ctx.fillStyle = "rgba(230, 246, 236, 0.9)";
        ctx.font = "700 16px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(this.worldLayout.locationName, 20, 18);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "500 11px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.fillText(`Level ${this.waveManager.wave}`, 20, 38);
        ctx.restore();
      }

      ctx.save();
      const fogTheme = this.worldLayout?.theme || {};
      const fogDensity = this.worldLayout?.fogDensity || 1;
      const worldFog = ctx.createLinearGradient(0, 0, 0, this.height);
      worldFog.addColorStop(0, fogTheme.backdropTop || "rgba(6, 12, 10, 0.78)");
      worldFog.addColorStop(0.45, fogTheme.backdropMid || "rgba(2, 4, 5, 0.82)");
      worldFog.addColorStop(1, fogTheme.backdropBottom || "rgba(1, 1, 1, 0.9)");
      ctx.globalAlpha = GameUtils.clamp(0.82 + fogDensity * 0.08, 0.82, 0.98);
      ctx.fillStyle = worldFog;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.globalCompositeOperation = "destination-out";
      const visibilityRadius = this.nightVisionActive ? 260 : 180;
      const visionHole = ctx.createRadialGradient(this.player.x, this.player.y, 18, this.player.x, this.player.y, visibilityRadius);
      visionHole.addColorStop(0, "rgba(0,0,0,1)");
      visionHole.addColorStop(0.6, "rgba(0,0,0,0.96)");
      visionHole.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = visionHole;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, visibilityRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "lighter";
      const playerGlow = ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, this.nightVisionActive ? 220 : 140);
      playerGlow.addColorStop(0, this.nightVisionActive ? "rgba(183,255,209,0.24)" : "rgba(255,255,255,0.18)");
      playerGlow.addColorStop(0.45, this.nightVisionActive ? "rgba(103,240,167,0.12)" : "rgba(255,255,255,0.08)");
      playerGlow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.nightVisionActive ? 220 : 140, 0, Math.PI * 2);
      ctx.fill();

      if (this.nightVisionActive) {
        ctx.fillStyle = "rgba(103, 240, 167, 0.05)";
        ctx.fillRect(0, 0, this.width, this.height);
      }

      ctx.restore();

      this.drawWeather(ctx);

      if (this.player.lastDamageAngle !== 0 && this.player.hp > 0 && this.player.damageFlash > 0) {
        const alpha = GameUtils.clamp(this.player.damageFlash * 1.6, 0, 1);
        const angle = this.player.lastDamageAngle;
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(255, 72, 72, 0.9)";
        ctx.beginPath();
        ctx.moveTo(this.width * 0.38, 0);
        ctx.lineTo(this.width * 0.32, -14);
        ctx.lineTo(this.width * 0.32, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (this.levelAdvanceReady) {
        ctx.save();
        ctx.fillStyle = "rgba(103, 240, 167, 0.92)";
        ctx.font = "700 18px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Reach the glowing pad behind the door", this.width * 0.5, this.height - 18);
        ctx.restore();
      } else if (this.leverReady) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 211, 77, 0.95)";
        ctx.font = "700 18px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(this.doorOpen ? "Pull the lever behind the door" : "Open the door, then pull the lever", this.width * 0.5, this.height - 18);
        ctx.restore();
      }

      if (this.nightVisionActive || this.nightVisionCooldown > 0) {
        ctx.save();
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.font = this.nightVisionActive ? "700 14px Bahnschrift, Trebuchet MS, sans-serif" : "600 12px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.fillStyle = this.nightVisionActive ? "rgba(183,255,209,0.96)" : "rgba(255,255,255,0.58)";
        const label = this.nightVisionActive
          ? `Night Vision ${GameUtils.formatTime(this.nightVisionTimer)}`
          : `NV cooldown ${GameUtils.formatTime(this.nightVisionCooldown)}`;
        ctx.fillText(label, this.width - 20, 18);
        ctx.restore();
      }

      if (this.leverReady && this.doorOpen && this.canPullLever()) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 211, 77, 0.95)";
        ctx.font = "700 16px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Press F to pull the lever", this.width * 0.5, this.height - 44);
        ctx.restore();
      } else if (this.canOpenDoor()) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 211, 77, 0.95)";
        ctx.font = "700 18px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Press F to open the security door", this.width * 0.5, this.height - 18);
        ctx.restore();
      } else if (!this.doorOpen && this.player.keycards > 0 && this.getDoorDistance() < 150) {
        ctx.save();
        ctx.fillStyle = "rgba(103, 240, 167, 0.9)";
        ctx.font = "700 15px Bahnschrift, Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Move closer to use the keycard", this.width * 0.5, this.height - 18);
        ctx.restore();
      }
    }

    spawnBullet(data) {
      this.bullets.push({
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        radius: data.radius || 3,
        damage: data.damage || 10,
        color: data.color || "#fff",
        pierce: data.pierce || 0,
        weaponKey: data.weaponKey || "pistol",
        critChance: data.critChance || 0,
        critMultiplier: data.critMultiplier || 1.5,
        headshotMultiplier: data.headshotMultiplier || 1.8,
        angle: data.angle || 0,
        life: data.life || 1.8
      });
    }

    spawnEnemyBullet(data) {
      this.enemyBullets.push({
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        radius: data.radius || 4,
        damage: data.damage || 10,
        color: data.color || "#b46cff",
        sourceType: data.sourceType || "shooter",
        life: data.life || 3,
        glow: data.glow || "rgba(180, 108, 255, 0.7)"
      });
    }

    spawnGrenade(data) {
      this.grenades.push({
        type: "grenade",
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        radius: data.radius || 7,
        color: data.color || "#ffca63",
        fuse: data.fuse || 1.1,
        maxFuse: data.fuse || 1.1,
        damage: data.damage || 90,
        blastRadius: data.blastRadius || 112,
        gravity: data.gravity || 760,
        drag: data.drag || 0.985
      });
    }

    updateBullets(dt) {
      for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
        const bullet = this.bullets[index];
        bullet.life -= dt;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        if (
          bullet.life <= 0 ||
          bullet.x < -30 ||
          bullet.x > this.width + 30 ||
          bullet.y < -30 ||
          bullet.y > this.height + 30
        ) {
          this.bullets.splice(index, 1);
          continue;
        }

        if (this.hitTrapWithBullet(bullet)) {
          this.bullets.splice(index, 1);
          continue;
        }

        let hit = false;
        for (let zombieIndex = this.zombies.length - 1; zombieIndex >= 0; zombieIndex -= 1) {
          const zombie = this.zombies[zombieIndex];
          if (!zombie.alive) {
            continue;
          }

          const bodyDistance = GameUtils.distance(bullet.x, bullet.y, zombie.x, zombie.y);
          const hitRadius = zombie.radius + bullet.radius;
          if (bodyDistance <= hitRadius) {
            const head = zombie.getHeadPosition();
            const headDistance = GameUtils.distance(bullet.x, bullet.y, head.x, head.y);
            const headshot = headDistance <= zombie.getHeadRadius();
            const crit = !headshot && Math.random() < bullet.critChance;
            let damage = bullet.damage;
            if (headshot) {
              damage *= bullet.headshotMultiplier;
            } else if (crit) {
              damage *= bullet.critMultiplier;
            }

            if (headshot) {
              this.stats.headshots += 1;
            }

            this.stats.hits += 1;
            zombie.takeDamage(damage, {
              headshot,
              crit,
              bullet
            });
            this.particles.sparks(bullet.x, bullet.y, headshot ? 8 : 5, headshot ? "#ffd34d" : "#e5fff1");
            this.floaters.add(
              `${headshot ? "HEADSHOT " : crit ? "CRIT " : ""}${Math.round(damage)}`,
              bullet.x,
              bullet.y - 8,
              headshot ? "#ffd34d" : crit ? "#ff6f61" : "#f6fff7",
              {
                life: 0.7,
                scale: headshot ? 1.08 : 1,
                velocityY: -20
              }
            );
            this.addShake(headshot ? 4 : 2);
            bullet.pierce -= 1;
            hit = true;
            if (bullet.pierce < 0) {
              this.bullets.splice(index, 1);
              break;
            }
          }
        }

        if (hit && bullet.pierce < 0) {
          continue;
        }
      }
    }

    updateEnemyBullets(dt) {
      for (let index = this.enemyBullets.length - 1; index >= 0; index -= 1) {
        const bullet = this.enemyBullets[index];
        bullet.life -= dt;
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        if (
          bullet.life <= 0 ||
          bullet.x < -30 ||
          bullet.x > this.width + 30 ||
          bullet.y < -30 ||
          bullet.y > this.height + 30
        ) {
          this.enemyBullets.splice(index, 1);
          continue;
        }

        let blocked = false;
        for (const rect of this.getBlockingRects()) {
          if (this.circleIntersectsRect(bullet, rect)) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          this.particles.sparks(bullet.x, bullet.y, 4, bullet.color);
          if (bullet.sourceType === "spitter" && bullet.splashRadius) {
            this.spawnExplosion(bullet.x, bullet.y, bullet.splashRadius, bullet.splashDamage || Math.round(bullet.damage * 0.75), bullet.color);
          }
          this.enemyBullets.splice(index, 1);
          continue;
        }

        const hitDistance = GameUtils.distance(bullet.x, bullet.y, this.player.x, this.player.y);
        if (hitDistance <= bullet.radius + this.player.radius - 2) {
          this.player.takeDamage(bullet.damage, bullet.x, bullet.y);
          this.particles.sparks(bullet.x, bullet.y, 6, bullet.color);
          this.floaters.add(`-${Math.round(bullet.damage)}`, bullet.x, bullet.y - 8, bullet.color, {
            life: 0.65,
            scale: 0.95,
            velocityY: -18
          });
          this.addShake(1.5);
          if (bullet.sourceType === "spitter" && bullet.splashRadius) {
            this.spawnExplosion(bullet.x, bullet.y, bullet.splashRadius, bullet.splashDamage || Math.round(bullet.damage * 0.75), bullet.color);
          }
          this.enemyBullets.splice(index, 1);
        }
      }
    }

    updateGrenades(dt) {
      for (let index = this.grenades.length - 1; index >= 0; index -= 1) {
        const grenade = this.grenades[index];
        grenade.fuse -= dt;
        grenade.vy += grenade.gravity * dt;
        grenade.x += grenade.vx * dt;
        grenade.y += grenade.vy * dt;
        grenade.vx *= grenade.drag;
        grenade.vy *= grenade.drag;

        const explodedByBounds =
          grenade.x < -40 ||
          grenade.x > this.width + 40 ||
          grenade.y < -40 ||
          grenade.y > this.height + 40;

        const blocked = this.getBlockingRects().some((rect) => this.circleIntersectsRect(grenade, rect));
        if (grenade.fuse <= 0 || blocked || explodedByBounds) {
          this.grenades.splice(index, 1);
          this.spawnExplosion(grenade.x, grenade.y, grenade.blastRadius, grenade.damage, grenade.color || "#ffca63");
        }
      }
    }

    updateZombies(dt) {
      for (let index = this.zombies.length - 1; index >= 0; index -= 1) {
        const zombie = this.zombies[index];
        zombie.update(dt);
        if (!zombie.alive) {
          this.zombies.splice(index, 1);
        }
      }
    }

    updatePickups(dt) {
      for (let index = this.pickups.length - 1; index >= 0; index -= 1) {
        const pickup = this.pickups[index];
        pickup.update(dt);
        if (pickup.collected || pickup.life <= 0) {
          this.pickups.splice(index, 1);
        }
      }
    }

    spawnZombie(type, spawn, options = {}) {
      const zombie = new Zombie(this, type, spawn.x, spawn.y, this.waveManager.wave, options);
      this.zombies.push(zombie);
      this.particles.explosion(zombie.x, zombie.y, zombie.type === "boss" ? 20 : zombie.type === "brute" ? 12 : 8, zombie.base.color);
      this.particles.sparks(zombie.x, zombie.y, zombie.type === "boss" ? 12 : 6, zombie.base.eye);
      return zombie;
    }

    getEdgeSpawnPoint(forceEdge = false) {
      const buffer = forceEdge ? 90 : 50;
      const edge = GameUtils.randInt(0, 3);
      switch (edge) {
        case 0:
          return { x: -buffer, y: GameUtils.rand(0, this.height) };
        case 1:
          return { x: this.width + buffer, y: GameUtils.rand(0, this.height) };
        case 2:
          return { x: GameUtils.rand(0, this.width), y: -buffer };
        default:
          return { x: GameUtils.rand(0, this.width), y: this.height + buffer };
      }
    }

    addShake(amount) {
      return amount;
    }

    addCoins(amount) {
      const mode = this.getModeSettings?.() || GAME_MODE_DEFS.normal;
      const total = Math.max(0, Math.round(amount * this.bonuses.getCoinMultiplier() * (mode.coinMult || 1)));
      this.coins += total;
      return total;
    }

    addGrenades(amount, options = {}) {
      const added = this.player.addGrenades(amount);
      if (added > 0) {
        if (options.floaters !== false) {
          this.floaters.add(`+${added} GR`, this.player.x, this.player.y - 34, "#ffd34d", {
            life: 0.8,
            scale: 0.95,
            velocityY: -24
          });
        }
        if (options.notify !== false) {
          this.ui.showNotification(added > 1 ? `Grenades +${added}` : "Grenade added", "accent", 1800);
        }
      }
      return added;
    }

    collectWeaponModule(moduleKey, sourceWeaponKey = this.player.weaponKey) {
      const moduleDefinition = WEAPON_MODULE_DEFS[moduleKey];
      if (!moduleDefinition) {
        return { ok: false, reason: "Missing module" };
      }

      const result = this.player.addWeaponModule(moduleKey, sourceWeaponKey);
      if (!result.ok) {
        this.ui.showNotification(`${moduleDefinition.name} maxed for ${WEAPON_DEFS[sourceWeaponKey]?.name || "current weapon"}`, "normal", 1800);
        return result;
      }

      const weaponName = WEAPON_DEFS[sourceWeaponKey]?.name || "Current weapon";
      this.floaters.add(`${moduleDefinition.short}${result.level}`, this.player.x, this.player.y - 34, moduleDefinition.color, {
        life: 0.85,
        scale: 0.95,
        velocityY: -24
      });
      this.ui.showNotification(`${moduleDefinition.name} attached to ${weaponName}`, "accent", 2200);
      this.audio.playSfx("bonus");
      return {
        ok: true,
        level: result.level,
        maxLevel: result.maxLevel,
        weaponKey: sourceWeaponKey
      };
    }

    spawnExplosion(x, y, radius, damage, color = "#ff8f62") {
      this.particles.explosion(x, y, Math.round(radius / 7) + 10, color);
      this.audio.playSfx("explode");
      this.addShake(radius > 120 ? 10 : 6);

      for (let i = this.zombies.length - 1; i >= 0; i -= 1) {
        const zombie = this.zombies[i];
        const distance = GameUtils.distance(x, y, zombie.x, zombie.y);
        if (distance <= radius) {
          const falloff = 1 - distance / radius;
          zombie.takeDamage(damage * (0.5 + falloff * 0.8), { bullet: null, explosion: true });
        }
      }

      if (GameUtils.distance(x, y, this.player.x, this.player.y) <= radius) {
        const falloff = 1 - GameUtils.distance(x, y, this.player.x, this.player.y) / radius;
        this.player.takeDamage(damage * (0.4 + falloff * 0.6), x, y);
      }

      for (const trap of this.traps || []) {
        if (trap.type === "barrel" && !trap.spent && GameUtils.distance(x, y, trap.x, trap.y) <= radius + (trap.radius || 16)) {
          this.detonateTrap(trap);
        }
      }
    }

    nukeZombies() {
      this.ui.showNotification("Nuke cleared the horde", "danger", 2200);
      this.spawnExplosion(this.player.x, this.player.y, Math.max(this.width, this.height) * 0.9, 120, "#ffb96b");
      const remaining = [...this.zombies];
      for (const zombie of remaining) {
        zombie.takeDamage(zombie.hp + 9999, { explosion: true, nuke: true });
      }
      this.zombies.length = 0;
      this.enemyBullets.length = 0;
      this.grenades.length = 0;
      if (this.waveManager.state === "active" && this.waveManager.spawned >= this.waveManager.totalToSpawn) {
        this.armLevelAdvance();
      }
    }

    onZombieKilled(zombie, meta = {}) {
      this.stats.kills += 1;
      this.missions.onZombieKilled();
      const scoreMult = this.getModeSettings().scoreMult || 1;
      const baseScore = zombie.scoreValue + this.waveManager.wave * 9;
      const headshotBonus = meta.headshot ? 35 : 0;
      const killScore = Math.round((zombie.type === "boss" ? baseScore + 350 : baseScore + headshotBonus) * scoreMult);
      this.stats.score += killScore;

      const coins = zombie.coinValue + Math.round(this.waveManager.wave * 1.8) + (zombie.type === "boss" ? 90 : 0);
      const awardedCoins = this.addCoins(coins);

      this.floaters.add(`+${killScore}`, zombie.x, zombie.y - 34, "#67f0a7", {
        life: 0.9,
        scale: 1.05,
        velocityY: -30
      });
      this.floaters.add(`+${awardedCoins}c`, zombie.x + 12, zombie.y - 18, "#ffd34d", {
        life: 0.8,
        scale: 0.95,
        velocityY: -24
      });

      if (zombie.keyCarrier && !this.doorOpen && (this.player.keycards || 0) === 0) {
        this.pickups.push(new BonusPickup(this, "keycard", zombie.x, zombie.y - 8));
        this.ui.showNotification("Keycard dropped", "accent", 2200);
      }

      const drops = this.bonuses.rollDrop(zombie);
      for (const pickup of drops) {
        this.pickups.push(pickup);
      }

      if (zombie.type === "boss") {
        this.ui.showNotification("Boss eliminated", "danger", 2600);
        this.stats.score += Math.round(500 * scoreMult);
        this.addCoins(120);
      }

      if (this.waveManager.state === "active" && this.zombies.length === 0 && this.waveManager.spawned >= this.waveManager.totalToSpawn) {
        this.armLevelAdvance();
      }
    }

    onPlayerDeath() {
      if (this.state === "gameover") {
        return;
      }
      this.state = "gameover";
      this.audio.stopMusic();
      const accuracy = this.stats.shotsFired > 0 ? (this.stats.hits / this.stats.shotsFired) * 100 : 0;
      this.ui.showGameOver({
        score: this.stats.score,
        waves: this.waveManager.wavesCleared,
        kills: this.stats.kills,
        accuracy,
        headshots: this.stats.headshots
      });
      this.ui.showNotification("You were overrun", "danger", 2800);
      this.audio.playSfx("explode");
    }

    startNewRun() {
      this.audio.unlock();
      this.audio.startMusic();
      this.settings.playerName = this.settings.playerName || "Survivor";
      this.saveSettings();
      this.resetRun();
      this.state = "tutorial";
      this.ui.setMode("tutorial");
      this.audio.playSfx("ui");
      this.input.fire = false;
      this.input.reloadPressed = false;
      this.input.touchMoveX = 0;
      this.input.touchMoveY = 0;
    }

    startFirstWave() {
      if (this.state !== "tutorial") {
        return false;
      }

      this.audio.unlock();
      this.audio.startMusic();
      this.waveManager.startRun();
      this.state = "playing";
      this.ui.setMode("playing");
      this.ui.showNotification(`${this.getModeSettings().name} mode`, "accent", 1800);
      this.audio.playSfx("ui");
      return true;
    }

    resetRun() {
      const mode = this.getModeSettings();
      this.coins = mode.startCoins || 0;
      this.stats = this.createStats();
      this.zombies.length = 0;
      this.bullets.length = 0;
      this.enemyBullets.length = 0;
      this.grenades.length = 0;
      this.pickups.length = 0;
      this.shake = 0;
      this.shakeIntensity = 0;
      this.locationIndex = 0;
      this.pendingLocationName = null;
      this.nightVisionActive = false;
      this.nightVisionTimer = 0;
      this.nightVisionCooldown = 0;
      this.player.reset();
      this.player.hp = this.player.getMaxHp();
      this.bonuses.reset();
      this.missions.reset();
      this.waveManager.reset();
      this.resetLevelState(true);
      this.input.aimX = this.player.x + 50;
      this.input.aimY = this.player.y;
      this.particles.clear();
      this.floaters.clear();
    }

    returnToMenu() {
      this.state = "menu";
      this.audio.stopMusic();
      this.waveManager.reset();
      this.locationIndex = 0;
      this.pendingLocationName = null;
      this.nightVisionActive = false;
      this.nightVisionTimer = 0;
      this.nightVisionCooldown = 0;
      this.player.reset();
      this.player.hp = this.player.getMaxHp();
      this.bonuses.reset();
      this.missions.reset();
      this.coins = 0;
      this.stats = this.createStats();
      this.resetLevelState(false);
      this.ui.setMode("menu");
      this.ui.refreshMainMenuStats();
      this.ui.renderLeaderboard(this.ui.leaderboardHighlightId);
      this.particles.clear();
      this.floaters.clear();
      this.zombies.length = 0;
      this.bullets.length = 0;
      this.enemyBullets.length = 0;
      this.grenades.length = 0;
      this.pickups.length = 0;
      this.input.fire = false;
      this.input.reloadPressed = false;
      this.input.grenadePressed = false;
      this.input.touchMoveX = 0;
      this.input.touchMoveY = 0;
    }
  }

  global.GameUtils = GameUtils;
  global.GAME_MODE_DEFS = GAME_MODE_DEFS;
  global.AudioManager = AudioManager;
  global.ParticleSystem = ParticleSystem;
  global.FloatingTextManager = FloatingTextManager;
  global.Game = Game;

  function boot() {
    global.zombieApocalypseGame = new Game();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
