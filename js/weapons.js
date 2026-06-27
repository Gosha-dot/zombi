(function (global) {
  const WEAPON_DEFS = {
    pistol: {
      key: "pistol",
      name: "Pistol",
      damage: 24,
      fireRate: 4,
      reloadTime: 1.15,
      magazineSize: 12,
      bulletSpeed: 1120,
      spread: 0.018,
      pellets: 1,
      critChance: 0.12,
      critMultiplier: 1.7,
      headshotMultiplier: 1.95,
      pierce: 0,
      projectileRadius: 3,
      color: "#ffd76a",
      recoil: 1.2
    },
    shotgun: {
      key: "shotgun",
      name: "Shotgun",
      damage: 11,
      fireRate: 1.15,
      reloadTime: 1.85,
      magazineSize: 6,
      bulletSpeed: 920,
      spread: 0.16,
      pellets: 7,
      critChance: 0.08,
      critMultiplier: 1.45,
      headshotMultiplier: 2.1,
      pierce: 0,
      projectileRadius: 2.7,
      color: "#ffb34f",
      recoil: 2.4
    },
    assault: {
      key: "assault",
      name: "Assault Rifle",
      damage: 15,
      fireRate: 10,
      reloadTime: 1.5,
      magazineSize: 30,
      bulletSpeed: 1260,
      spread: 0.04,
      pellets: 1,
      critChance: 0.1,
      critMultiplier: 1.55,
      headshotMultiplier: 2.0,
      pierce: 0,
      projectileRadius: 2.6,
      color: "#8fffd0",
      recoil: 1.05
    },
    sniper: {
      key: "sniper",
      name: "Sniper Rifle",
      damage: 80,
      fireRate: 0.72,
      reloadTime: 2.25,
      magazineSize: 5,
      bulletSpeed: 1680,
      spread: 0.008,
      pellets: 1,
      critChance: 0.18,
      critMultiplier: 2.0,
      headshotMultiplier: 2.7,
      pierce: 1,
      projectileRadius: 3.6,
      color: "#d8fbff",
      recoil: 3.1
    },
    minigun: {
      key: "minigun",
      name: "Minigun",
      damage: 8,
      fireRate: 18,
      reloadTime: 2.35,
      magazineSize: 70,
      bulletSpeed: 1320,
      spread: 0.075,
      pellets: 1,
      critChance: 0.06,
      critMultiplier: 1.45,
      headshotMultiplier: 1.72,
      pierce: 0,
      projectileRadius: 2.3,
      color: "#b8ff63",
      recoil: 0.65
    },
    flamethrower: {
      key: "flamethrower",
      name: "Flamethrower",
      damage: 5,
      fireRate: 15.5,
      reloadTime: 2.1,
      magazineSize: 45,
      bulletSpeed: 860,
      spread: 0.24,
      pellets: 2,
      critChance: 0.04,
      critMultiplier: 1.35,
      headshotMultiplier: 1.18,
      pierce: 0,
      projectileRadius: 2.15,
      color: "#ff8f3d",
      recoil: 0.45
    },
    crossbow: {
      key: "crossbow",
      name: "Crossbow",
      damage: 46,
      fireRate: 1.25,
      reloadTime: 1.95,
      magazineSize: 5,
      bulletSpeed: 1580,
      spread: 0.01,
      pellets: 1,
      critChance: 0.22,
      critMultiplier: 2.1,
      headshotMultiplier: 2.85,
      pierce: 2,
      projectileRadius: 3.4,
      color: "#92f3ff",
      recoil: 2.5
    },
    revolver: {
      key: "revolver",
      name: "Revolver",
      damage: 42,
      fireRate: 2.2,
      reloadTime: 1.45,
      magazineSize: 8,
      bulletSpeed: 1460,
      spread: 0.012,
      pellets: 1,
      critChance: 0.18,
      critMultiplier: 2.05,
      headshotMultiplier: 2.45,
      pierce: 0,
      projectileRadius: 3.1,
      color: "#ffe28f",
      recoil: 1.8
    },
    smg: {
      key: "smg",
      name: "SMG",
      damage: 10,
      fireRate: 14.5,
      reloadTime: 1.8,
      magazineSize: 36,
      bulletSpeed: 1280,
      spread: 0.058,
      pellets: 1,
      critChance: 0.08,
      critMultiplier: 1.45,
      headshotMultiplier: 1.9,
      pierce: 0,
      projectileRadius: 2.35,
      color: "#9dffcf",
      recoil: 0.85
    },
    railgun: {
      key: "railgun",
      name: "Railgun",
      damage: 92,
      fireRate: 0.58,
      reloadTime: 2.4,
      magazineSize: 4,
      bulletSpeed: 1980,
      spread: 0.004,
      pellets: 1,
      critChance: 0.22,
      critMultiplier: 2.35,
      headshotMultiplier: 3.1,
      pierce: 3,
      projectileRadius: 3.8,
      color: "#b6f8ff",
      recoil: 3.6
    }
  };

  const WEAPON_MODULE_DEFS = {
    damage: {
      key: "damage",
      name: "Damage Chip",
      short: "DMG",
      icon: "DM",
      color: "#ff7f6f",
      maxLevel: 3,
      description: "Increase weapon damage by 12% per level.",
      effects: {
        damageMult: 0.12
      }
    },
    rapid: {
      key: "rapid",
      name: "Cycler Module",
      short: "RPD",
      icon: "RF",
      color: "#67f0a7",
      maxLevel: 3,
      description: "Increase fire rate by 10% per level and smooth recoil.",
      effects: {
        fireRateMult: 0.1,
        recoilMult: -0.05
      }
    },
    magazine: {
      key: "magazine",
      name: "Drum Module",
      short: "MAG",
      icon: "MG",
      color: "#ffd34d",
      maxLevel: 3,
      description: "Add 3 rounds to the magazine per level.",
      effects: {
        magazineBonus: 3
      }
    },
    reload: {
      key: "reload",
      name: "Loader Module",
      short: "RLD",
      icon: "RL",
      color: "#8dc3ff",
      maxLevel: 3,
      description: "Reduce reload time by 12% per level.",
      effects: {
        reloadTimeMult: -0.12
      }
    },
    optic: {
      key: "optic",
      name: "Optic Module",
      short: "OPT",
      icon: "OP",
      color: "#d8fbff",
      maxLevel: 3,
      description: "Tighten spread and improve critical headshots.",
      effects: {
        spreadMult: -0.15,
        critChanceBonus: 0.03,
        headshotMultBonus: 0.08
      }
    },
    pierce: {
      key: "pierce",
      name: "Penetrator Module",
      short: "PRC",
      icon: "PI",
      color: "#c77dff",
      maxLevel: 2,
      description: "Add extra pierce to bullets that can punch through targets.",
      effects: {
        pierceBonus: 1
      }
    },
    legendary: {
      key: "legendary",
      name: "Legendary Core",
      short: "LGC",
      icon: "LG",
      color: "#ffe38a",
      maxLevel: 1,
      description: "A rare masterwork module that boosts damage, fire rate, reload, crits, and pierce.",
      effects: {
        damageMult: 0.18,
        fireRateMult: 0.08,
        reloadTimeMult: -0.1,
        critChanceBonus: 0.04,
        headshotMultBonus: 0.12,
        pierceBonus: 1,
        bulletSpeedMult: 0.08,
        recoilMult: -0.08
      }
    }
  };

  const WEAPON_KEYS = Object.keys(WEAPON_DEFS);
  const WEAPON_MODULE_KEYS = Object.keys(WEAPON_MODULE_DEFS);

  function getWeaponModuleEffects(player, weaponKey) {
    const effects = {
      damageMult: 0,
      fireRateMult: 0,
      reloadTimeMult: 0,
      magazineBonus: 0,
      spreadMult: 0,
      critChanceBonus: 0,
      headshotMultBonus: 0,
      pierceBonus: 0,
      bulletSpeedMult: 0,
      recoilMult: 0
    };

    const moduleLevels = player?.weaponModules?.[weaponKey] || {};
    for (const [moduleKey, level] of Object.entries(moduleLevels)) {
      const definition = WEAPON_MODULE_DEFS[moduleKey];
      if (!definition || !level) {
        continue;
      }

      for (const [effectKey, value] of Object.entries(definition.effects || {})) {
        effects[effectKey] = (effects[effectKey] || 0) + value * level;
      }
    }

    return effects;
  }

  function getWeaponStats(key, player) {
    const base = WEAPON_DEFS[key] || WEAPON_DEFS.pistol;
    const upgrades = player?.upgrades || {};
    const doubleDamage = Boolean(player?.game?.bonuses?.isActive("doubleDamage"));
    const rapidFire = Boolean(player?.game?.bonuses?.isActive("rapidFire"));
    const moduleEffects = getWeaponModuleEffects(player, key);

    const skills = player?.skills || {};
    const classKey = player?.getClassKey?.() || player?.classKey;
    const classDef = global.PLAYER_CLASS_DEFS?.[classKey];
    const assaultWeaponBonus = classKey === "assault" && global.ASSAULT_WEAPON_KEYS?.has(key)
      ? (classDef?.damageMult || 1)
      : 1;
    const classFireRateMult = classKey === "assault" ? (classDef?.fireRateMult || 1) : 1;
    const classReloadMult = classKey === "assault" ? (classDef?.reloadMult || 1) : 1;

    const allyBoost = player?.game?.allyDamageBoost || 1;

    const damageMult = (1 + (upgrades.weaponDamage || 0) * 0.12 + (skills.weaponsmith || 0) * 0.08) * (doubleDamage ? 2 : 1) * (1 + moduleEffects.damageMult) * assaultWeaponBonus * allyBoost;
    const fireRateMult = (1 + (upgrades.fireRate || 0) * 0.08) * (rapidFire ? 1.45 : 1) * (1 + moduleEffects.fireRateMult) * classFireRateMult;
    const reloadMult = Math.max(0.35, Math.max(0.45, 1 - (upgrades.reload || 0) * 0.08) * (1 + moduleEffects.reloadTimeMult) * classReloadMult);
    const spreadMult = Math.max(0.25, 1 + moduleEffects.spreadMult);
    const recoilMult = Math.max(0.35, 1 + moduleEffects.recoilMult);

    return {
      ...base,
      damage: base.damage * damageMult,
      fireRate: base.fireRate * fireRateMult,
      reloadTime: Math.max(0.38, base.reloadTime * reloadMult),
      magazineSize: Math.max(1, Math.round(base.magazineSize + (upgrades.magazine || 0) * 2 + moduleEffects.magazineBonus)),
      bulletSpeed: base.bulletSpeed * (1 + moduleEffects.bulletSpeedMult),
      spread: Math.max(0.002, base.spread * spreadMult),
      pellets: base.pellets,
      critChance: Math.min(0.5, base.critChance + moduleEffects.critChanceBonus + (skills.overcharge || 0) * 0.025),
      critMultiplier: base.critMultiplier,
      headshotMultiplier: base.headshotMultiplier + moduleEffects.headshotMultBonus,
      pierce: base.pierce + moduleEffects.pierceBonus,
      projectileRadius: base.projectileRadius,
      color: base.color,
      recoil: base.recoil * recoilMult
    };
  }

  global.WEAPON_DEFS = WEAPON_DEFS;
  global.WEAPON_KEYS = WEAPON_KEYS;
  global.WEAPON_MODULE_DEFS = WEAPON_MODULE_DEFS;
  global.WEAPON_MODULE_KEYS = WEAPON_MODULE_KEYS;
  global.getWeaponModuleEffects = getWeaponModuleEffects;
  global.getWeaponStats = getWeaponStats;
})(window);
