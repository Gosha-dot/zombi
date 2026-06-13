(function (global) {
  function createWeaponUnlockItem(weaponKey, config) {
    const weapon = WEAPON_DEFS[weaponKey];
    return {
      id: `weapon.${weaponKey}`,
      category: "Weapons",
      kind: "weaponUnlock",
      weaponKey,
      name: config.name || weapon.name,
      description: config.description,
      baseCost: config.baseCost,
      growth: 1,
      maxLevel: 1,
      preview: () => `DMG ${Math.round(weapon.damage)} · RATE ${weapon.fireRate.toFixed(1)}/s · MAG ${weapon.magazineSize}`,
      apply: (player) => player.unlockWeapon(weaponKey)
    };
  }

  function createWeaponModuleItem(moduleKey, config = {}) {
    const moduleDefinition = WEAPON_MODULE_DEFS[moduleKey];
    return {
      id: `module.${moduleKey}`,
      category: "Weapon Modules",
      kind: "module",
      moduleKey,
      name: config.name || moduleDefinition.name,
      description: config.description || moduleDefinition.description,
      baseCost: config.baseCost,
      growth: config.growth || 1.28,
      maxLevel: config.maxLevel || moduleDefinition.maxLevel,
      preview: (level) => `Level ${Math.min(level + 1, moduleDefinition.maxLevel)} / ${moduleDefinition.maxLevel}`,
      apply: (player) => player.addWeaponModule(moduleKey)
    };
  }

  const SHOP_UPGRADES = [
    {
      id: "health.maxHp",
      category: "Health",
      name: "Max HP +",
      description: "Increase maximum health by 20 and recover part of it immediately.",
      baseCost: 90,
      growth: 1.45,
      maxLevel: 10,
      preview: (level) => `+${20 * (level + 1)} max HP`,
      apply: (player) => player.applyUpgrade("health.maxHp")
    },
    {
      id: "health.regen",
      category: "Health",
      name: "Regeneration",
      description: "Passive healing that triggers every second during the fight.",
      baseCost: 120,
      growth: 1.5,
      maxLevel: 8,
      preview: (level) => `${((level + 1) * 0.45).toFixed(2)} HP/sec`,
      apply: (player) => player.applyUpgrade("health.regen")
    },
    {
      id: "weapons.damage",
      category: "Weapons",
      name: "Damage +",
      description: "Multiply all weapon damage for stronger takedowns.",
      baseCost: 135,
      growth: 1.58,
      maxLevel: 10,
      preview: (level) => `+${Math.round((1 + (level + 1) * 0.12) * 100 - 100)}% damage`,
      apply: (player) => player.applyUpgrade("weapons.damage")
    },
    {
      id: "weapons.reload",
      category: "Weapons",
      name: "Reload Speed +",
      description: "Reduce all reload times and get back into the fight faster.",
      baseCost: 115,
      growth: 1.55,
      maxLevel: 8,
      preview: (level) => `-${Math.round((level + 1) * 8)}% reload time`,
      apply: (player) => player.applyUpgrade("weapons.reload")
    },
    {
      id: "weapons.fireRate",
      category: "Weapons",
      name: "Fire Rate +",
      description: "Increase the rate of fire on every weapon.",
      baseCost: 140,
      growth: 1.55,
      maxLevel: 10,
      preview: (level) => `+${Math.round((level + 1) * 8)}% fire rate`,
      apply: (player) => player.applyUpgrade("weapons.fireRate")
    },
    {
      id: "weapons.magazine",
      category: "Weapons",
      name: "Magazine Size +",
      description: "Add rounds to every magazine so you reload less often.",
      baseCost: 125,
      growth: 1.52,
      maxLevel: 8,
      preview: (level) => `+${(level + 1) * 2} bullets / mag`,
      apply: (player) => player.applyUpgrade("weapons.magazine")
    },
    createWeaponUnlockItem("minigun", {
      name: "Minigun",
      description: "A torrent of high-speed rounds that turns crowds into mulch.",
      baseCost: 360
    }),
    createWeaponUnlockItem("flamethrower", {
      name: "Flamethrower",
      description: "A close-range cone of fire that melts packed zombies fast.",
      baseCost: 330
    }),
    createWeaponUnlockItem("crossbow", {
      name: "Crossbow",
      description: "Silent piercing bolts built for long-range headshots.",
      baseCost: 390
    }),
    createWeaponUnlockItem("revolver", {
      name: "Revolver",
      description: "Hard-hitting sidearm with crisp recoil and heavy headshot damage.",
      baseCost: 275
    }),
    createWeaponUnlockItem("smg", {
      name: "SMG",
      description: "Fast spray weapon for shredding runners and smaller packs.",
      baseCost: 300
    }),
    createWeaponUnlockItem("railgun", {
      name: "Railgun",
      description: "A piercing high-energy weapon that punches through multiple zombies.",
      baseCost: 460
    }),
    createWeaponModuleItem("damage", {
      baseCost: 140
    }),
    createWeaponModuleItem("rapid", {
      baseCost: 150
    }),
    createWeaponModuleItem("magazine", {
      baseCost: 135
    }),
    createWeaponModuleItem("reload", {
      baseCost: 145
    }),
    createWeaponModuleItem("optic", {
      baseCost: 155
    }),
    createWeaponModuleItem("pierce", {
      baseCost: 165
    }),
    {
      id: "supplies.grenade",
      category: "Explosives",
      kind: "resource",
      resourceKey: "grenade",
      name: "Grenade Pack",
      description: "Add one frag grenade to your combat loadout.",
      baseCost: 95,
      growth: 1,
      maxLevel: 3,
      preview: () => "Adds +1 grenade",
      apply: (player) => player.addGrenades(1)
    },
    {
      id: "supplies.ammo",
      category: "Supplies",
      kind: "resource",
      resourceKey: "ammo",
      name: "Ammo Pack",
      description: "Refill your reserve ammo before the next wave.",
      baseCost: 85,
      growth: 1,
      maxLevel: 1,
      preview: () => "Refills reserve to 100",
      apply: (player) => player.addAmmo(100)
    },
    {
      id: "movement.speed",
      category: "Movement",
      name: "Speed +",
      description: "Move faster around the arena and dodge bite chains more easily.",
      baseCost: 110,
      growth: 1.5,
      maxLevel: 10,
      preview: (level) => `+${(level + 1) * 22} move speed`,
      apply: (player) => player.applyUpgrade("movement.speed")
    },
    {
      id: "movement.dash",
      category: "Movement",
      name: "Dash",
      description: "Unlock and improve a short invulnerable burst of movement.",
      baseCost: 160,
      growth: 1.75,
      maxLevel: 6,
      preview: (level) => level === 0 ? "Unlock dash" : `Dash level ${level + 1}`,
      apply: (player) => player.applyUpgrade("movement.dash")
    },
    {
      id: "defense.armor",
      category: "Defense",
      name: "Armor +",
      description: "Flat damage reduction against zombie bites and explosions.",
      baseCost: 130,
      growth: 1.5,
      maxLevel: 10,
      preview: (level) => `+${(level + 1) * 2} armor`,
      apply: (player) => player.applyUpgrade("defense.armor")
    },
    {
      id: "defense.reduction",
      category: "Defense",
      name: "Damage Reduction +",
      description: "Reduce a percentage of incoming damage from every hit.",
      baseCost: 160,
      growth: 1.6,
      maxLevel: 8,
      preview: (level) => `-${Math.min(50, (level + 1) * 4)}% damage taken`,
      apply: (player) => player.applyUpgrade("defense.reduction")
    }
  ];

  class ShopManager {
    constructor(game) {
      this.game = game;
      this.items = SHOP_UPGRADES;
    }

    reset() {}

    getItem(id) {
      return this.items.find((item) => item.id === id) || null;
    }

    getLevel(id) {
      const player = this.game.player;
      const item = this.getItem(id);
      if (item?.kind === "weaponUnlock") {
        return player.hasWeapon(item.weaponKey) ? 1 : 0;
      }
      if (item?.kind === "module") {
        return player.getWeaponModuleLevel(player.weaponKey, item.moduleKey);
      }
      if (item?.kind === "resource") {
        if (item.resourceKey === "ammo") {
          return player.ammoReserve >= 100 ? 1 : 0;
        }
        if (item.resourceKey === "grenade") {
          return player.grenadeCount;
        }
      }
      switch (id) {
        case "health.maxHp":
          return player.upgrades.health;
        case "health.regen":
          return player.upgrades.regen;
        case "weapons.damage":
          return player.upgrades.weaponDamage;
        case "weapons.reload":
          return player.upgrades.reload;
        case "weapons.fireRate":
          return player.upgrades.fireRate;
        case "weapons.magazine":
          return player.upgrades.magazine;
        case "movement.speed":
          return player.upgrades.speed;
        case "movement.dash":
          return player.upgrades.dash;
        case "defense.armor":
          return player.upgrades.armor;
        case "defense.reduction":
          return player.upgrades.reduction;
        default:
          return 0;
      }
    }

    getCost(item) {
      const level = this.getLevel(item.id);
      return Math.round(item.baseCost * Math.pow(item.growth, level));
    }

    canBuy(item) {
      const level = this.getLevel(item.id);
      if (level >= item.maxLevel) {
        return false;
      }
      if (item.kind === "resource") {
        if (item.resourceKey === "ammo" && this.game.player.ammoReserve >= 100) {
          return false;
        }
        if (item.resourceKey === "grenade" && this.game.player.grenadeCount >= this.game.player.maxGrenades) {
          return false;
        }
      }
      return this.game.coins >= this.getCost(item);
    }

    buy(id) {
      const item = this.getItem(id);
      if (!item) {
        return { ok: false, reason: "Missing upgrade" };
      }

      const level = this.getLevel(id);
      if (level >= item.maxLevel) {
        return { ok: false, reason: "Max level" };
      }

      const cost = this.getCost(item);
      if (this.game.coins < cost) {
        return { ok: false, reason: "Not enough coins" };
      }

      if (item.kind === "weaponUnlock" && this.game.player.hasWeapon(item.weaponKey)) {
        return { ok: false, reason: "Already owned" };
      }
      if (item.kind === "resource") {
        if (item.resourceKey === "ammo" && this.game.player.ammoReserve >= 100) {
          return { ok: false, reason: "Ammo full" };
        }
        if (item.resourceKey === "grenade" && this.game.player.grenadeCount >= this.game.player.maxGrenades) {
          return { ok: false, reason: "Grenades full" };
        }
      }

      const applied = item.apply(this.game.player);
      if (item.kind === "weaponUnlock" && !applied) {
        return { ok: false, reason: "Already owned" };
      }
      if (item.kind === "module" && (!applied || !applied.ok)) {
        return { ok: false, reason: applied?.reason || "Max level" };
      }
      if (item.kind === "resource" && applied <= 0) {
        return { ok: false, reason: item.resourceKey === "ammo" ? "Ammo full" : "Grenades full" };
      }

      this.game.coins -= cost;
      this.game.audio.playSfx("ui");
      this.game.ui.showNotification(
        item.kind === "weaponUnlock"
          ? `${item.name} unlocked`
          : item.kind === "module"
            ? `${item.name} attached`
            : `${item.name} purchased`,
        "accent",
        2200
      );
      return { ok: true, cost, level: this.getLevel(id) };
    }

    getCategories() {
      const categories = [];
      const grouped = new Map();

      for (const item of this.items) {
        if (!grouped.has(item.category)) {
          grouped.set(item.category, []);
        }
        grouped.get(item.category).push(item);
      }

      for (const [name, list] of grouped.entries()) {
        categories.push({
          name,
          items: list
            .slice()
            .sort((left, right) => {
              const weaponUnlockDelta = Number(right.kind === "weaponUnlock") - Number(left.kind === "weaponUnlock");
              if (weaponUnlockDelta !== 0) {
                return weaponUnlockDelta;
              }
              return left.name.localeCompare(right.name);
            })
            .map((item) => {
              const level = this.getLevel(item.id);
              const cost = this.getCost(item);
              const isModule = item.kind === "module";
              return {
                ...item,
                level,
                cost,
                affordable: this.game.coins >= cost && !(item.kind === "resource" && (
                  (item.resourceKey === "ammo" && this.game.player.ammoReserve >= 100) ||
                  (item.resourceKey === "grenade" && this.game.player.grenadeCount >= this.game.player.maxGrenades)
                )),
                maxed: item.kind === "resource"
                  ? (item.resourceKey === "ammo"
                    ? this.game.player.ammoReserve >= 100
                    : this.game.player.grenadeCount >= this.game.player.maxGrenades)
                  : level >= item.maxLevel,
                previewText: item.kind === "resource"
                  ? item.resourceKey === "ammo"
                    ? `Reserve ${Math.ceil(this.game.player.ammoReserve)}/100`
                    : `Grenades ${Math.ceil(this.game.player.grenadeCount)}/${this.game.player.maxGrenades}`
                  : isModule
                    ? `Lv ${level}/${item.maxLevel}`
                    : item.preview(level),
                weaponUnlock: item.kind === "weaponUnlock",
                isModule
              };
            })
        });
      }

      return categories;
    }
  }

  global.ShopManager = ShopManager;
})(window);
