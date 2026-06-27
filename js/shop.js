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

  function createRailgunCraftItem() {
    const weapon = WEAPON_DEFS.railgun;
    return {
      id: "craft.railgun",
      category: "Trader Crafting",
      kind: "craftWeapon",
      weaponKey: "railgun",
      traderOnly: true,
      rareLootCost: 3,
      name: "Craft Railgun",
      description: "Assemble the Railgun from rare Rail Cores. Only the trader has the tools for this weapon.",
      baseCost: 0,
      growth: 1,
      maxLevel: 1,
      preview: () => `DMG ${Math.round(weapon.damage)} · RATE ${weapon.fireRate.toFixed(1)}/s · MAG ${weapon.magazineSize}`,
      apply: (player) => player.unlockWeapon("railgun")
    };
  }

  function createSkillItem(skillKey, config) {
    return {
      id: `skill.${skillKey}`,
      category: "Skill Tree",
      kind: "skill",
      skillKey,
      name: config.name,
      description: config.description,
      skillCost: config.skillCost || 1,
      maxLevel: config.maxLevel || 1,
      requires: config.requires || null,
      preview: config.preview,
      apply: (player) => player.applySkill(skillKey)
    };
  }

  const SKILL_NAMES = {
    vitality: "Vitality",
    agility: "Agility",
    weaponsmith: "Weaponsmith",
    armorSmith: "Armor Smith",
    scavenger: "Scavenger",
    overcharge: "Overcharge"
  };

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
    createRailgunCraftItem(),
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
      id: "engineer.deployTurret",
      category: "Field Gear",
      kind: "deployTurret",
      name: "Deploy Turret",
      description: "Place a temporary auto-turret near your position. Engineers get stronger and cheaper turrets.",
      baseCost: 145,
      growth: 1.18,
      maxLevel: 4,
      preview: (level) => `Charges +1 (${level + 1} bought)`,
      apply: (player) => {
        player.deployTurretCharges = (player.deployTurretCharges || 0) + 1;
        return 1;
      }
    },
    {
      id: "engineer.trapBoost",
      category: "Field Gear",
      kind: "trapBoost",
      name: "Trap Overcharge",
      description: "Boost trap and generator damage for the next wave.",
      baseCost: 160,
      growth: 1.35,
      maxLevel: 3,
      preview: (level) => `Trap damage +${Math.round((level + 1) * 12)}% next wave`,
      apply: () => true
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
    },
    createSkillItem("vitality", {
      name: "Vitality",
      description: "Root survival skill: adds max HP and unlocks defensive branches.",
      maxLevel: 3,
      skillCost: 1,
      preview: (level) => `+${(level + 1) * 15} max HP`
    }),
    createSkillItem("agility", {
      name: "Agility",
      description: "Move faster and reposition before the horde closes in.",
      maxLevel: 3,
      skillCost: 1,
      requires: { skillKey: "vitality", level: 1 },
      preview: (level) => `+${(level + 1) * 14} move speed`
    }),
    createSkillItem("weaponsmith", {
      name: "Weaponsmith",
      description: "Tune every weapon for stronger base damage.",
      maxLevel: 3,
      skillCost: 1,
      requires: { skillKey: "vitality", level: 1 },
      preview: (level) => `+${(level + 1) * 8}% weapon damage`
    }),
    createSkillItem("armorSmith", {
      name: "Armor Smith",
      description: "Reinforce armor with flat block and extra damage reduction.",
      maxLevel: 2,
      skillCost: 2,
      requires: { skillKey: "vitality", level: 2 },
      preview: (level) => `Armor branch Lv ${level + 1}`
    }),
    createSkillItem("scavenger", {
      name: "Scavenger",
      description: "Improve rare loot and legendary module chances from chests and safes.",
      maxLevel: 2,
      skillCost: 2,
      requires: { skillKey: "agility", level: 2 },
      preview: (level) => `Loot chance Lv ${level + 1}`
    }),
    createSkillItem("overcharge", {
      name: "Overcharge",
      description: "Boost critical chance after mastering weaponsmithing.",
      maxLevel: 2,
      skillCost: 2,
      requires: { skillKey: "weaponsmith", level: 2 },
      preview: (level) => `+${Math.round((level + 1) * 2.5)}% crit chance`
    })
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
      if (item?.kind === "craftWeapon") {
        return player.hasWeapon(item.weaponKey) ? 1 : 0;
      }
      if (item?.kind === "module") {
        return player.getWeaponModuleLevel(player.weaponKey, item.moduleKey);
      }
      if (item?.kind === "skill") {
        return player.getSkillLevel(item.skillKey);
      }
      if (item?.kind === "deployTurret") {
        return this.game.deployTurretPurchases || 0;
      }
      if (item?.kind === "trapBoost") {
        return this.game.trapBoostLevel || 0;
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
      if (item.kind === "skill") {
        return item.skillCost || 1;
      }
      const level = this.getLevel(item.id);
      let cost = Math.round(item.baseCost * Math.pow(item.growth, level));
      const classKey = this.game.player?.getClassKey?.();
      const classDef = global.PLAYER_CLASS_DEFS?.[classKey];
      if (classKey === "assault" && item.id === "supplies.ammo" && classDef?.ammoUpgradeCostMult) {
        cost = Math.round(cost * classDef.ammoUpgradeCostMult);
      }
      if (classKey === "engineer" && (item.kind === "deployTurret" || item.kind === "trapBoost") && classDef?.trapCostMult) {
        cost = Math.round(cost * classDef.trapCostMult);
      }
      return cost;
    }

    isLockedByMode(item) {
      return Boolean(this.game.getModeSettings?.().oneHp && [
        "health.maxHp",
        "health.regen",
        "defense.armor",
        "defense.reduction"
      ].includes(item.id));
    }

    getRequirementText(item) {
      if (!item.requires) {
        return "";
      }
      const name = SKILL_NAMES[item.requires.skillKey] || item.requires.skillKey;
      return `Requires ${name} Lv ${item.requires.level}`;
    }

    meetsSkillRequirement(item) {
      if (!item.requires) {
        return true;
      }
      return this.game.player.getSkillLevel(item.requires.skillKey) >= item.requires.level;
    }

    getLockReason(item) {
      if (this.isLockedByMode(item)) {
        return "Locked in One HP";
      }
      if (item.traderOnly && !this.game.isTraderWave?.()) {
        return "Trader only";
      }
      if (item.kind === "skill" && !this.meetsSkillRequirement(item)) {
        return this.getRequirementText(item);
      }
      return "";
    }

    isMaxed(item, level = this.getLevel(item.id)) {
      if (item.kind === "trapBoost") {
        return (this.game.trapBoostLevel || 0) >= item.maxLevel;
      }
      if (item.kind === "deployTurret") {
        return (this.game.deployTurretPurchases || 0) >= item.maxLevel;
      }
      if (item.kind === "resource") {
        return item.resourceKey === "ammo"
          ? this.game.player.ammoReserve >= 100
          : this.game.player.grenadeCount >= this.game.player.maxGrenades;
      }
      return level >= item.maxLevel;
    }

    canBuy(item) {
      if (this.getLockReason(item)) {
        return false;
      }
      const level = this.getLevel(item.id);
      if (this.isMaxed(item, level)) {
        return false;
      }
      const cost = this.getCost(item);
      if (item.kind === "skill") {
        return this.game.skillPoints >= cost;
      }
      if (item.kind === "craftWeapon") {
        return this.game.rareLoot >= (item.rareLootCost || 0) && this.game.coins >= cost;
      }
      return this.game.coins >= cost;
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

      if (this.isLockedByMode(item)) {
        return { ok: false, reason: "Locked in One HP" };
      }

      const lockReason = this.getLockReason(item);
      if (lockReason) {
        return { ok: false, reason: lockReason };
      }

      const cost = this.getCost(item);
      if (item.kind === "skill") {
        if (this.game.skillPoints < cost) {
          return { ok: false, reason: "Not enough SP" };
        }
        const applied = item.apply(this.game.player);
        if (!applied) {
          return { ok: false, reason: "Skill unavailable" };
        }
        this.game.skillPoints -= cost;
        this.game.audio.playSfx("ui");
        this.game.ui.showNotification(`${item.name} learned`, "accent", 2200);
        return { ok: true, cost, level: this.getLevel(id) };
      }

      if (item.kind === "craftWeapon") {
        if (this.game.player.hasWeapon(item.weaponKey)) {
          return { ok: false, reason: "Already owned" };
        }
        if (this.game.rareLoot < (item.rareLootCost || 0)) {
          return { ok: false, reason: "Need more Rail Cores" };
        }
        if (this.game.coins < cost) {
          return { ok: false, reason: "Not enough coins" };
        }
        const applied = item.apply(this.game.player);
        if (!applied) {
          return { ok: false, reason: "Already owned" };
        }
        this.game.rareLoot -= item.rareLootCost || 0;
        this.game.coins -= cost;
        this.game.audio.playSfx("ui");
        this.game.ui.showNotification(`${item.name} completed`, "accent", 2400);
        return { ok: true, cost, level: this.getLevel(id) };
      }

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
      if (item.kind === "deployTurret") {
        if (!applied) {
          return { ok: false, reason: "Unavailable" };
        }
        this.game.deployTurretPurchases = (this.game.deployTurretPurchases || 0) + 1;
      } else if (item.kind === "trapBoost") {
        this.game.trapBoostLevel = (this.game.trapBoostLevel || 0) + 1;
        this.game.trapBoostMult = 1 + this.game.trapBoostLevel * 0.12;
      } else if (item.kind === "weaponUnlock" && !applied) {
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
              const lockReason = this.getLockReason(item);
              const maxed = lockReason ? false : this.isMaxed(item, level);
              return {
                ...item,
                level,
                cost,
                lockedByMode: Boolean(lockReason),
                lockReason,
                affordable: this.canBuy(item),
                maxed,
                previewText: lockReason
                  ? lockReason
                  : item.kind === "resource"
                  ? item.resourceKey === "ammo"
                    ? `Reserve ${Math.ceil(this.game.player.ammoReserve)}/100`
                    : `Grenades ${Math.ceil(this.game.player.grenadeCount)}/${this.game.player.maxGrenades}`
                  : item.kind === "craftWeapon"
                    ? `${this.game.rareLoot}/${item.rareLootCost || 0} Rail Cores`
                  : item.kind === "skill"
                    ? `${item.preview(level)} · SP ${this.game.skillPoints}`
                  : isModule
                    ? `Lv ${level}/${item.maxLevel}`
                    : item.preview(level),
                weaponUnlock: item.kind === "weaponUnlock",
                isModule,
                isCraft: item.kind === "craftWeapon",
                isSkill: item.kind === "skill",
                requirementText: this.getRequirementText(item)
              };
            })
        });
      }

      return categories;
    }
  }

  global.ShopManager = ShopManager;
})(window);
