(function (global) {
  class UIManager {
    constructor(game) {
      this.game = game;
      this.leaderboardHighlightId = null;
      this.cache();
      this.bind();
      this.syncSettingsFromState();
      this.renderLeaderboard();
      this.refreshMainMenuStats();
      this.setMode("menu");
    }

    cache() {
      const byId = (id) => document.getElementById(id);
      this.els = {
        hud: byId("hud"),
        healthFill: byId("healthFill"),
        healthText: byId("healthText"),
        ammoText: byId("ammoText"),
        keycardText: byId("keycardText"),
        grenadeText: byId("grenadeText"),
        weaponText: byId("weaponText"),
        classText: byId("classText"),
        weatherText: byId("weatherText"),
        allyText: byId("allyText"),
        modulesText: byId("modulesText"),
        coinsText: byId("coinsText"),
        waveText: byId("waveText"),
        scoreText: byId("scoreText"),
        bonusStrip: byId("bonusStrip"),
        missionPanel: byId("missionPanel"),
        missionList: byId("missionList"),
        missionRewardText: byId("missionRewardText"),
        miniMapCanvas: byId("miniMapCanvas"),
        minimapInfo: byId("minimapInfo"),
        mapPanel: byId("mapPanel"),
        worldMapCanvas: byId("worldMapCanvas"),
        mapInfoText: byId("mapInfoText"),
        closeMapBtn: byId("closeMapBtn"),
        questsPanel: byId("questsPanel"),
        questsList: byId("questsList"),
        questsRewardText: byId("questsRewardText"),
        closeQuestsBtn: byId("closeQuestsBtn"),
        inventoryPanel: byId("inventoryPanel"),
        inventoryBody: byId("inventoryBody"),
        closeInventoryBtn: byId("closeInventoryBtn"),
        notifications: byId("notificationLayer"),
        mainMenu: byId("mainMenu"),
        startGameBtn: byId("startGameBtn"),
        openLeaderboardBtn: byId("openLeaderboardBtn"),
        openSettingsBtn: byId("openSettingsBtn"),
        modeButtons: byId("modeButtons"),
        modeDescription: byId("modeDescription"),
        classButtons: byId("classButtons"),
        classDescription: byId("classDescription"),
        closeLeaderboardBtn: byId("closeLeaderboardBtn"),
        closeSettingsBtn: byId("closeSettingsBtn"),
        leaderboardPanel: byId("leaderboardPanel"),
        leaderboardBody: byId("leaderboardBody"),
        settingsPanel: byId("settingsPanel"),
        playerNameInput: byId("playerNameInput"),
        gameModeInput: byId("gameModeInput"),
        soundVolumeInput: byId("soundVolumeInput"),
        musicVolumeInput: byId("musicVolumeInput"),
        screenShakeInput: byId("screenShakeInput"),
        bloodEffectsInput: byId("bloodEffectsInput"),
        bestScoreText: byId("bestScoreText"),
        tutorialPanel: byId("tutorialPanel"),
        startFirstWaveBtn: byId("startFirstWaveBtn"),
        tutorialModeText: byId("tutorialModeText"),
        shopPanel: byId("shopPanel"),
        shopGrid: byId("shopGrid"),
        traderText: byId("traderText"),
        startNextWaveBtn: byId("startNextWaveBtn"),
        waveCountdownText: byId("waveCountdownText"),
        gameOverPanel: byId("gameOverPanel"),
        finalScoreText: byId("finalScoreText"),
        finalWavesText: byId("finalWavesText"),
        finalKillsText: byId("finalKillsText"),
        finalAccuracyText: byId("finalAccuracyText"),
        finalHeadshotsText: byId("finalHeadshotsText"),
        scoreNameInput: byId("scoreNameInput"),
        saveScoreBtn: byId("saveScoreBtn"),
        playAgainBtn: byId("playAgainBtn"),
        mainMenuBtn: byId("mainMenuBtn"),
        touchControls: byId("touchControls"),
        movePad: byId("movePad"),
        moveThumb: byId("moveThumb"),
        fireBtn: byId("fireBtn"),
        grenadeBtn: byId("grenadeBtn"),
        dashBtn: byId("dashBtn"),
        reloadBtn: byId("reloadBtn")
      };
    }

    bind() {
      this.els.startGameBtn.addEventListener("click", () => this.game.startNewRun());
      this.els.startFirstWaveBtn.addEventListener("click", () => this.game.startFirstWave());
      this.els.openLeaderboardBtn.addEventListener("click", () => this.showLeaderboard());
      this.els.openSettingsBtn.addEventListener("click", () => this.showSettings());
      this.els.closeLeaderboardBtn.addEventListener("click", () => this.showMenu());
      this.els.closeSettingsBtn.addEventListener("click", () => this.showMenu());
      this.els.startNextWaveBtn.addEventListener("click", () => this.game.waveManager.skipCountdown());
      this.els.closeMapBtn.addEventListener("click", () => this.closeMap());
      this.els.closeQuestsBtn.addEventListener("click", () => this.closeQuests());
      this.els.closeInventoryBtn.addEventListener("click", () => this.closeInventory());
      this.els.saveScoreBtn.addEventListener("click", () => this.saveScore());
      this.els.playAgainBtn.addEventListener("click", () => this.game.startNewRun());
      this.els.mainMenuBtn.addEventListener("click", () => this.game.returnToMenu());

      const settingsInputs = [
        this.els.playerNameInput,
        this.els.gameModeInput,
        this.els.soundVolumeInput,
        this.els.musicVolumeInput,
        this.els.screenShakeInput,
        this.els.bloodEffectsInput
      ];

      settingsInputs.forEach((input) => {
        input.addEventListener("input", () => this.updateSettings());
        input.addEventListener("change", () => this.updateSettings());
      });

      this.els.modeButtons.querySelectorAll("[data-game-mode]").forEach((button) => {
        button.addEventListener("click", () => this.setGameMode(button.dataset.gameMode, true));
      });

      if (this.els.classButtons) {
        this.els.classButtons.querySelectorAll("[data-player-class]").forEach((button) => {
          button.addEventListener("click", () => this.setPlayerClass(button.dataset.playerClass, true));
        });
      }

      this.els.scoreNameInput.addEventListener("input", () => {
        this.game.settings.playerName = this.els.scoreNameInput.value.trim() || "Survivor";
      });

      this.els.touchControls.hidden = !this.game.isTouchDevice;
      this.bindTouchControls();
    }

    bindTouchControls() {
      const movePad = this.els.movePad;
      const thumb = this.els.moveThumb;
      const fireBtn = this.els.fireBtn;
      const grenadeBtn = this.els.grenadeBtn;
      const dashBtn = this.els.dashBtn;
      const reloadBtn = this.els.reloadBtn;

      const state = {
        active: false,
        pointerId: null,
        centerX: 0,
        centerY: 0,
        radius: 42
      };

      const updateThumb = (dx, dy) => {
        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      movePad.addEventListener("pointerdown", (event) => {
        if (!this.game.isTouchDevice) {
          return;
        }
        state.active = true;
        state.pointerId = event.pointerId;
        const rect = movePad.getBoundingClientRect();
        state.centerX = rect.left + rect.width / 2;
        state.centerY = rect.top + rect.height / 2;
        movePad.setPointerCapture(event.pointerId);
        this.game.input.touchMoveX = 0;
        this.game.input.touchMoveY = 0;
      });

      movePad.addEventListener("pointermove", (event) => {
        if (!state.active || state.pointerId !== event.pointerId) {
          return;
        }
        const dx = event.clientX - state.centerX;
        const dy = event.clientY - state.centerY;
        const length = Math.hypot(dx, dy) || 1;
        const clamped = Math.min(state.radius, length);
        const ratio = clamped / length;
        const moveX = dx * ratio / state.radius;
        const moveY = dy * ratio / state.radius;
        this.game.input.touchMoveX = moveX;
        this.game.input.touchMoveY = moveY;
        updateThumb(dx * ratio, dy * ratio);
      });

      const resetPad = () => {
        state.active = false;
        state.pointerId = null;
        this.game.input.touchMoveX = 0;
        this.game.input.touchMoveY = 0;
        updateThumb(0, 0);
      };

      movePad.addEventListener("pointerup", resetPad);
      movePad.addEventListener("pointercancel", resetPad);
      movePad.addEventListener("lostpointercapture", resetPad);

      const pressAction = (handler) => {
        return (event) => {
          event.preventDefault();
          if (!this.game.isTouchDevice) {
            return;
          }
          handler();
        };
      };

      fireBtn.addEventListener("pointerdown", pressAction(() => {
        this.game.input.fire = true;
      }));
      fireBtn.addEventListener("pointerup", pressAction(() => {
        this.game.input.fire = false;
      }));
      fireBtn.addEventListener("pointercancel", pressAction(() => {
        this.game.input.fire = false;
      }));
      fireBtn.addEventListener("pointerleave", pressAction(() => {
        this.game.input.fire = false;
      }));

      if (grenadeBtn) {
        grenadeBtn.addEventListener("pointerdown", pressAction(() => {
          this.game.input.grenadePressed = true;
        }));
      }

      dashBtn.addEventListener("pointerdown", pressAction(() => {
        this.game.player.startDash();
      }));

      reloadBtn.addEventListener("pointerdown", pressAction(() => {
        this.game.player.requestReload();
      }));
    }

    syncSettingsFromState() {
      const settings = this.game.settings;
      this.els.playerNameInput.value = settings.playerName || "Survivor";
      this.els.gameModeInput.value = this.game.getModeKey();
      this.els.soundVolumeInput.value = Math.round((settings.soundVolume ?? 0.7) * 100);
      this.els.musicVolumeInput.value = Math.round((settings.musicVolume ?? 0.35) * 100);
      this.els.screenShakeInput.checked = Boolean(settings.screenShake ?? true);
      this.els.bloodEffectsInput.checked = Boolean(settings.bloodEffects ?? true);
      this.els.scoreNameInput.value = settings.playerName || "Survivor";
      this.minimapCtx = this.els.miniMapCanvas ? this.els.miniMapCanvas.getContext("2d") : null;
      this.mapCtx = this.els.worldMapCanvas ? this.els.worldMapCanvas.getContext("2d") : null;
      this.mapOpen = false;
      this.questsOpen = false;
      this.inventoryOpen = false;
      this.renderModePicker();
      this.renderClassPicker();
    }

    updateSettings() {
      const settings = this.game.settings;
      settings.playerName = this.els.playerNameInput.value.trim() || "Survivor";
      settings.gameMode = this.els.gameModeInput.value in global.GAME_MODE_DEFS ? this.els.gameModeInput.value : "normal";
      settings.soundVolume = Number(this.els.soundVolumeInput.value) / 100;
      settings.musicVolume = Number(this.els.musicVolumeInput.value) / 100;
      settings.screenShake = Boolean(this.els.screenShakeInput.checked);
      settings.bloodEffects = Boolean(this.els.bloodEffectsInput.checked);
      this.game.saveSettings();
      this.game.audio.applySettings(settings);
      this.renderModePicker();
      this.renderClassPicker();
    }

    setGameMode(modeKey, notify = false) {
      if (!this.game.setGameMode(modeKey)) {
        return false;
      }
      this.els.gameModeInput.value = this.game.getModeKey();
      this.renderModePicker();
      if (notify) {
        this.game.audio.playSfx("ui");
      }
      return true;
    }

    renderModePicker() {
      const modes = global.GAME_MODE_DEFS || {};
      const mode = this.game.getModeSettings();
      this.els.modeButtons.querySelectorAll("[data-game-mode]").forEach((button) => {
        button.classList.toggle("mode-chip--active", button.dataset.gameMode === mode.key);
      });
      if (this.els.modeDescription) {
        this.els.modeDescription.textContent = mode.description;
      }
      if (this.els.tutorialModeText) {
        this.els.tutorialModeText.textContent = mode.tutorial;
      }
    }

    setPlayerClass(classKey, notify = false) {
      if (!this.game.setPlayerClass(classKey)) {
        return false;
      }
      this.renderClassPicker();
      if (notify) {
        this.game.audio.playSfx("ui");
      }
      return true;
    }

    renderClassPicker() {
      const classes = global.PLAYER_CLASS_DEFS || {};
      const classKey = this.game.getPlayerClassKey();
      if (this.els.classButtons) {
        this.els.classButtons.querySelectorAll("[data-player-class]").forEach((button) => {
          button.classList.toggle("mode-chip--active", button.dataset.playerClass === classKey);
        });
      }
      if (this.els.classDescription) {
        this.els.classDescription.textContent = (classes[classKey] || classes.assault)?.description || "";
      }
    }

    setMode(mode) {
      const hudVisible = mode === "playing" || mode === "intermission";
      this.els.hud.classList.toggle("hud--hidden", !hudVisible);
      this.els.touchControls.hidden = !(hudVisible && this.game.isTouchDevice);

      this.els.mainMenu.classList.toggle("panel--hidden", mode !== "menu");
      this.els.mainMenu.setAttribute("aria-hidden", mode !== "menu" ? "true" : "false");

      const hideModal = (panel) => {
        panel.classList.add("panel--hidden");
        panel.setAttribute("aria-hidden", "true");
      };

      hideModal(this.els.leaderboardPanel);
      hideModal(this.els.settingsPanel);
      hideModal(this.els.gameOverPanel);
      hideModal(this.els.mapPanel);
      hideModal(this.els.questsPanel);
      hideModal(this.els.inventoryPanel);
      hideModal(this.els.tutorialPanel);

      if (mode !== "intermission") {
        hideModal(this.els.shopPanel);
      }

      if (mode === "gameover") {
        this.els.gameOverPanel.classList.remove("panel--hidden");
        this.els.gameOverPanel.setAttribute("aria-hidden", "false");
      }

      if (mode === "intermission") {
        this.openShop();
      }

      if (mode === "tutorial") {
        this.renderModePicker();
        this.renderClassPicker();
        this.els.tutorialPanel.classList.remove("panel--hidden");
        this.els.tutorialPanel.setAttribute("aria-hidden", "false");
      }

      if (mode === "menu") {
        this.els.mainMenu.classList.remove("panel--hidden");
        this.renderClassPicker();
      }

      if (mode !== "playing" && mode !== "intermission") {
        this.mapOpen = false;
        this.questsOpen = false;
        this.inventoryOpen = false;
      }
    }

    showMenu() {
      this.game.state = "menu";
      this.setMode("menu");
      this.refreshMainMenuStats();
      this.renderLeaderboard();
    }

    showLeaderboard() {
      this.renderLeaderboard(this.leaderboardHighlightId);
      this.els.leaderboardPanel.classList.remove("panel--hidden");
      this.els.leaderboardPanel.setAttribute("aria-hidden", "false");
    }

    showSettings() {
      this.syncSettingsFromState();
      this.els.settingsPanel.classList.remove("panel--hidden");
      this.els.settingsPanel.setAttribute("aria-hidden", "false");
    }

    openShop() {
      this.renderShop();
      this.els.shopPanel.classList.remove("panel--hidden");
      this.els.shopPanel.setAttribute("aria-hidden", "false");
      this.setShopCountdown(this.game.waveManager.nextWaveDelay);
    }

    closeShop() {
      this.els.shopPanel.classList.add("panel--hidden");
      this.els.shopPanel.setAttribute("aria-hidden", "true");
    }

    openMap() {
      if (this.game.state !== "playing" && this.game.state !== "intermission") {
        return;
      }
      this.mapOpen = true;
      this.els.mapPanel.classList.remove("panel--hidden");
      this.els.mapPanel.setAttribute("aria-hidden", "false");
      this.renderWorldMap();
    }

    closeMap() {
      this.mapOpen = false;
      this.els.mapPanel.classList.add("panel--hidden");
      this.els.mapPanel.setAttribute("aria-hidden", "true");
    }

    toggleMap() {
      if (this.mapOpen) {
        this.closeMap();
      } else {
        this.openMap();
      }
    }

    openQuests() {
      if (this.game.state !== "playing" && this.game.state !== "intermission") {
        return;
      }
      this.questsOpen = true;
      this.els.questsPanel.classList.remove("panel--hidden");
      this.els.questsPanel.setAttribute("aria-hidden", "false");
      this.renderQuests();
    }

    closeQuests() {
      this.questsOpen = false;
      this.els.questsPanel.classList.add("panel--hidden");
      this.els.questsPanel.setAttribute("aria-hidden", "true");
    }

    toggleQuests() {
      if (this.questsOpen) {
        this.closeQuests();
      } else {
        this.openQuests();
      }
    }

    openInventory() {
      if (this.game.state !== "playing" && this.game.state !== "intermission") {
        return;
      }
      this.inventoryOpen = true;
      this.els.inventoryPanel.classList.remove("panel--hidden");
      this.els.inventoryPanel.setAttribute("aria-hidden", "false");
      this.renderInventory();
    }

    closeInventory() {
      this.inventoryOpen = false;
      this.els.inventoryPanel.classList.add("panel--hidden");
      this.els.inventoryPanel.setAttribute("aria-hidden", "true");
    }

    toggleInventory() {
      if (this.inventoryOpen) {
        this.closeInventory();
      } else {
        this.openInventory();
      }
    }

    setShopCountdown(value) {
      const seconds = Math.max(0, Math.ceil(value || 0));
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      this.els.waveCountdownText.textContent = `${mm}:${ss}`;
    }

    setWaveText(value) {
      this.els.waveText.textContent = `${value}`;
    }

    renderShop() {
      const categories = this.game.shop.getCategories();
      const allyItems = this.game.allies?.getShopItems() || [];
      if (this.els.traderText) {
        this.els.traderText.hidden = !this.game.isTraderWave?.();
      }
      const allyCategory = allyItems.length
        ? `
            <section class="shop-category shop-category--ally">
              <h3 class="shop-category__title">Ally Supply Drop</h3>
              <div class="shop-category__items">${allyItems.map((item) => `
                <article class="shop-card shop-card--supply">
                  <div class="shop-card__head">
                    <div>
                      <h3 class="shop-card__name">${item.name}</h3>
                      <div class="shop-card__meta">Rescued survivor stock</div>
                    </div>
                    <div class="shop-card__meta">${item.previewText}</div>
                  </div>
                  <p class="shop-card__desc">${item.description}</p>
                  <div class="shop-card__footer">
                    <span class="shop-card__cost">${item.cost} coins</span>
                    <button class="btn ${item.affordable ? "btn--primary" : ""}" data-ally-item-id="${item.id}" ${item.affordable ? "" : "disabled"}>
                      Buy Once
                    </button>
                  </div>
                </article>
              `).join("")}</div>
            </section>
          `
        : "";
      this.els.shopGrid.innerHTML = allyCategory + categories
        .map((category) => {
          const items = category.items
            .map((item) => {
              const isWeaponUnlock = item.kind === "weaponUnlock";
              const isModule = item.kind === "module";
              const isResource = item.kind === "resource";
              const isCraft = item.kind === "craftWeapon";
              const isSkill = item.kind === "skill";
              const actionLabel = isCraft ? "Craft" : isSkill ? "Learn" : isWeaponUnlock ? "Unlock" : isModule ? "Attach" : isResource ? (item.resourceKey === "grenade" ? "Take" : "Refill") : "Buy";
              const titleMeta = isWeaponUnlock
                ? "Weapon unlock"
                : isCraft
                  ? "Trader craft"
                : isSkill
                  ? "Skill tree"
                : isModule
                  ? `Affects ${this.game.player.getCurrentWeaponName()}`
                  : isResource
                    ? "Consumable supply"
                  : `Level ${item.level} / ${item.maxLevel}`;
              const subMeta = isWeaponUnlock
                ? "New weapon"
                : isCraft
                  ? item.previewText
                : isSkill
                  ? `Lv ${item.level}/${item.maxLevel}`
                : isResource
                  ? item.previewText
                  : isModule
                    ? item.previewText
                    : item.previewText;
              const costLabel = item.lockReason
                ? "LOCKED"
                : item.maxed
                  ? (isResource ? "FULL" : isSkill ? "LEARNED" : "MAX")
                  : isCraft
                    ? `${item.rareLootCost || 0} RC`
                    : isSkill
                      ? `${item.cost} SP`
                      : `${item.cost} coins`;
              const buttonDisabled = !item.affordable || item.maxed;
              return `
              <article class="shop-card ${item.maxed ? "shop-card--maxed" : ""} ${isWeaponUnlock || isCraft ? "shop-card--weapon" : ""} ${isResource ? "shop-card--supply" : ""} ${isModule ? "shop-card--module" : ""} ${isSkill ? "shop-card--skill" : ""}">
                <div class="shop-card__head">
                  <div>
                    <h3 class="shop-card__name">${item.name}</h3>
                    <div class="shop-card__meta">${titleMeta}</div>
                  </div>
                  <div class="shop-card__meta">${subMeta}</div>
                </div>
                <p class="shop-card__desc">${item.description}</p>
                ${isWeaponUnlock ? `<div class="shop-card__stats">${item.previewText}</div>` : ""}
                ${isCraft ? `<div class="shop-card__stats">${item.preview(item.level)} · ${item.previewText}</div>` : ""}
                ${isResource ? `<div class="shop-card__stats">${item.previewText}</div>` : ""}
                ${isModule ? `<div class="shop-card__stats">${item.previewText}</div>` : ""}
                ${isSkill ? `<div class="shop-card__stats">${item.previewText}${item.requirementText ? ` · ${item.requirementText}` : ""}</div>` : ""}
                <div class="shop-card__footer">
                  <span class="shop-card__cost">${costLabel}</span>
                  <button class="btn ${item.affordable && !item.maxed ? "btn--primary" : ""}" data-upgrade-id="${item.id}" ${buttonDisabled ? "disabled" : ""}>
                    ${item.lockReason ? "Locked" : item.maxed ? (isResource ? "Full" : isSkill ? "Learned" : "Owned") : actionLabel}
                  </button>
                </div>
              </article>
            `;
            })
            .join("");

          return `
            <section class="shop-category">
              <h3 class="shop-category__title">${category.name}</h3>
              <div class="shop-category__items">${items}</div>
            </section>
          `;
        })
        .join("");

      this.els.shopGrid.querySelectorAll("[data-upgrade-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const result = this.game.shop.buy(button.dataset.upgradeId);
          if (result.ok) {
            this.renderShop();
            this.updateHUD();
          } else {
            this.showNotification(result.reason || "Cannot buy upgrade", "danger", 1800);
          }
        });
      });

      this.els.shopGrid.querySelectorAll("[data-ally-item-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const result = this.game.allies.buyShopItem(button.dataset.allyItemId);
          if (result.ok) {
            this.renderShop();
            this.updateHUD();
          } else {
            this.showNotification(result.reason || "Cannot buy item", "danger", 1800);
          }
        });
      });
    }

    renderLeaderboard(highlightId = null) {
      const records = this.game.leaderboard.top(10);
      this.els.leaderboardBody.innerHTML = records
        .map((entry) => `
          <tr class="${highlightId && entry.id === highlightId ? "record" : ""}">
            <td>${entry.playerName}</td>
            <td>${entry.modeName || "Normal"}</td>
            <td>${entry.score.toLocaleString()}</td>
            <td>${entry.waves}</td>
            <td>${entry.kills}</td>
            <td>${this.game.leaderboard.formatDate(entry.date)}</td>
          </tr>
        `)
        .join("")
        || `<tr><td colspan="6">No records yet. Be the first survivor.</td></tr>`;

      const best = this.game.leaderboard.getBest();
      this.els.bestScoreText.textContent = best ? best.score.toLocaleString() : "0";
    }

    refreshMainMenuStats() {
      const best = this.game.leaderboard.getBest();
      this.els.bestScoreText.textContent = best ? best.score.toLocaleString() : "0";
    }

    updateHUD() {
      const player = this.game.player;
      const maxHp = Math.max(1, player.getMaxHp());
      const hp = Math.max(0, player.hp);
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

      this.els.healthFill.style.width = `${pct}%`;
      this.els.healthText.textContent = `${Math.round(hp)} / ${Math.round(maxHp)}`;
      this.els.ammoText.textContent = player.getAmmoText();
      if (this.els.keycardText) {
        this.els.keycardText.textContent = `${player.keycards || 0}`;
      }
      if (this.els.grenadeText) {
        this.els.grenadeText.textContent = player.getGrenadeText();
      }
      this.els.weaponText.textContent = player.getCurrentWeaponName();
      if (this.els.classText) {
        this.els.classText.textContent = this.game.getPlayerClassSettings().name;
      }
      if (this.els.weatherText) {
        this.els.weatherText.textContent = this.game.getWeatherSettings().label;
      }
      if (this.els.allyText) {
        const allyStatus = this.game.allies?.getStatusText() || "None";
        this.els.allyText.textContent = allyStatus;
        const allyCard = this.els.allyText.closest(".hud__card--ally");
        if (allyCard) {
          allyCard.classList.toggle("hud__card--dead", allyStatus === "Ally lost");
        }
      }
      if (this.els.modulesText) {
        this.els.modulesText.textContent = player.getWeaponModuleText();
      }
      this.els.coinsText.textContent = this.game.coins.toLocaleString();
      this.els.scoreText.textContent = this.game.stats.score.toLocaleString();
      this.els.waveText.textContent = `${this.game.waveManager.wave || 1}`;

      const bonuses = this.game.bonuses.getActiveBonuses();
      this.els.bonusStrip.innerHTML = bonuses
        .map((bonus) => `<span class="bonus-pill">${bonus.label}<span class="bonus-pill__time">${GameUtils.formatTime(bonus.remaining)}</span></span>`)
        .join("");

      this.renderMissions();
      if (this.questsOpen) {
        this.renderQuests();
      }
      if (this.inventoryOpen) {
        this.renderInventory();
      }
      this.renderMinimap();
      if (this.mapOpen) {
        this.renderWorldMap();
      }
    }

    renderMissions() {
      if (!this.els.missionPanel || !this.els.missionList || !this.game.missions) {
        return;
      }

      const missions = this.game.missions.getMissions();
      this.els.missionRewardText.textContent = this.game.missions.getClearedText();
      this.els.missionList.innerHTML = this.getMissionMarkup(missions);
    }

    renderQuests() {
      if (!this.els.questsPanel || !this.els.questsList || !this.game.missions) {
        return;
      }

      const missions = this.game.missions.getMissions();
      this.els.questsRewardText.textContent = this.game.missions.getClearedText();
      this.els.questsList.innerHTML = this.getMissionMarkup(missions, "quest");
    }

    getMissionMarkup(missions, variant = "mission") {
      return missions
        .map((mission) => `
          <article class="mission-item ${variant === "quest" ? "mission-item--large" : ""} ${mission.completed ? "mission-item--complete" : ""}">
            <div class="mission-item__top">
              <span class="mission-item__title">${mission.title}</span>
              <span class="mission-item__progress">${mission.progressText}</span>
            </div>
            <div class="mission-item__bar">
              <span class="mission-item__fill" style="width: ${Math.round(mission.pct)}%"></span>
            </div>
          </article>
        `)
        .join("");
    }

    renderInventory() {
      if (!this.els.inventoryBody) {
        return;
      }

      const player = this.game.player;
      const weapons = player.getOwnedWeaponKeys()
        .map((key) => {
          const def = global.WEAPON_DEFS?.[key] || {};
          const active = key === player.weaponKey;
          const modules = player.getWeaponModuleText(key);
          return `
            <article class="inventory-card ${active ? "inventory-card--active" : ""}">
              <span class="inventory-card__label">${active ? "Equipped" : "Weapon"}</span>
              <strong>${def.name || key}</strong>
              <span>${modules === "None" ? "No modules" : modules}</span>
            </article>
          `;
        })
        .join("");

      const activeBonuses = this.game.bonuses.getActiveBonuses();
      const bonusMarkup = activeBonuses.length
        ? activeBonuses.map((bonus) => `
          <article class="inventory-card inventory-card--bonus">
            <span class="inventory-card__label">Bonus</span>
            <strong>${bonus.label}</strong>
            <span>${GameUtils.formatTime(bonus.remaining)} left</span>
          </article>
        `).join("")
        : `<article class="inventory-card"><span class="inventory-card__label">Bonus</span><strong>None active</strong><span>Find loot in chests and safes.</span></article>`;

      const unopened = (this.game.worldLayout?.lootContainers || []).filter((container) => !container.opened).length;
      this.els.inventoryBody.innerHTML = `
        <section class="inventory-section">
          <h3 class="shop-category__title">Resources</h3>
          <div class="inventory-list">
            <article class="inventory-card"><span class="inventory-card__label">Coins</span><strong>${this.game.coins.toLocaleString()}</strong><span>Spend at shops and traders</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Rail Cores</span><strong>${this.game.rareLoot || 0}</strong><span>Craft Railgun at trader</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Skill Points</span><strong>${this.game.skillPoints || 0}</strong><span>Unlock skill tree nodes</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Ammo</span><strong>${player.getAmmoText()}</strong><span>Reserve and magazine</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Grenades</span><strong>${player.getGrenadeText()}</strong><span>Throw with H or right click</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Keycards</span><strong>${player.keycards || 0}</strong><span>Open security doors</span></article>
            <article class="inventory-card"><span class="inventory-card__label">Loot</span><strong>${unopened}</strong><span>Closed chests or safes nearby</span></article>
          </div>
        </section>
        <section class="inventory-section">
          <h3 class="shop-category__title">Weapons</h3>
          <div class="inventory-list">${weapons}</div>
        </section>
        <section class="inventory-section">
          <h3 class="shop-category__title">Active Bonuses</h3>
          <div class="inventory-list">${bonusMarkup}</div>
        </section>
      `;
    }

    renderMinimap() {
      if (!this.els.miniMapCanvas || !this.minimapCtx) {
        return;
      }

      const canvas = this.els.miniMapCanvas;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.max(120, Math.floor(rect.width || 0));
      const displayHeight = Math.max(120, Math.floor(rect.height || 0));
      const targetWidth = Math.floor(displayWidth * dpr);
      const targetHeight = Math.floor(displayHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const ctx = this.minimapCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const pad = 10;
      const mapWidth = Math.max(1, displayWidth - pad * 2);
      const mapHeight = Math.max(1, displayHeight - pad * 2);
      const scaleX = mapWidth / this.game.width;
      const scaleY = mapHeight / this.game.height;
      const toMini = (x, y) => ({
        x: pad + GameUtils.clamp(x, 0, this.game.width) * scaleX,
        y: pad + GameUtils.clamp(y, 0, this.game.height) * scaleY
      });

      const bg = ctx.createLinearGradient(0, 0, 0, displayHeight);
      bg.addColorStop(0, "rgba(10, 19, 14, 0.96)");
      bg.addColorStop(1, "rgba(3, 6, 4, 0.96)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.strokeStyle = "rgba(181, 255, 199, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i += 1) {
        const x = pad + (mapWidth / 4) * i;
        const y = pad + (mapHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, displayHeight - pad);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(displayWidth - pad, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(103, 240, 167, 0.26)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, mapWidth, mapHeight);

      this.drawMapStructures(ctx, toMini);
      this.drawAmmoBoxMarker(ctx, toMini, 3.4);
      this.drawLootContainerMarkers(ctx, toMini, 3.2);
      this.drawMapTraps(ctx, toMini, 0.62);

      for (const pickup of this.game.pickups) {
        if (!this.game.canDetectOnMap(pickup.x, pickup.y)) {
          continue;
        }
        const point = toMini(pickup.x, pickup.y);
        ctx.fillStyle = BONUS_DEFS[pickup.type]?.color || "#ffd34d";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const zombie of this.game.zombies) {
        if (!zombie.alive) {
          continue;
        }
        if (!this.game.canDetectOnMap(zombie.x, zombie.y)) {
          continue;
        }
        const point = toMini(zombie.x, zombie.y);
        const isBoss = zombie.isBoss?.();
        ctx.fillStyle = isBoss ? zombie.base.color : zombie.type === "shooter" ? "#c77dff" : zombie.type === "tank" ? "#d4b07d" : zombie.type === "exploder" ? "#ff8f62" : zombie.type === "runner" ? "#b8ffd8" : "#8bd48a";
        ctx.beginPath();
        ctx.arc(point.x, point.y, isBoss ? 4.3 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.game.allies?.captured?.alive) {
        const ally = this.game.allies.captured;
        const point = toMini(ally.x, ally.y);
        ctx.fillStyle = "#ffe38a";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.game.allies?.companion?.alive) {
        const ally = this.game.allies.companion;
        const point = toMini(ally.x, ally.y);
        ctx.fillStyle = "#8dc3ff";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const playerPoint = toMini(this.game.player.x, this.game.player.y);
      const aimPoint = toMini(this.game.input.aimX, this.game.input.aimY);

      ctx.strokeStyle = "rgba(103, 240, 167, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playerPoint.x, playerPoint.y);
      ctx.lineTo(aimPoint.x, aimPoint.y);
      ctx.stroke();

      ctx.fillStyle = "#67f0a7";
      ctx.beginPath();
      ctx.arc(playerPoint.x, playerPoint.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#02110b";
      ctx.beginPath();
      ctx.arc(playerPoint.x + 1, playerPoint.y, 1.6, 0, Math.PI * 2);
      ctx.fill();

      this.els.minimapInfo.textContent = `W${this.game.waveManager.wave || 1} - ${this.game.zombies.filter((zombie) => zombie.alive && this.game.canDetectOnMap(zombie.x, zombie.y)).length} zombies`;
    }

    renderWorldMap() {
      if (!this.els.worldMapCanvas || !this.mapCtx) {
        return;
      }

      const canvas = this.els.worldMapCanvas;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.max(240, Math.floor(rect.width || 0));
      const displayHeight = Math.max(240, Math.floor(rect.height || 0));
      const targetWidth = Math.floor(displayWidth * dpr);
      const targetHeight = Math.floor(displayHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const ctx = this.mapCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const pad = 24;
      const mapWidth = Math.max(1, displayWidth - pad * 2);
      const mapHeight = Math.max(1, displayHeight - pad * 2);
      const scaleX = mapWidth / this.game.width;
      const scaleY = mapHeight / this.game.height;
      const toMap = (x, y) => ({
        x: pad + GameUtils.clamp(x, 0, this.game.width) * scaleX,
        y: pad + GameUtils.clamp(y, 0, this.game.height) * scaleY
      });

      const bg = ctx.createLinearGradient(0, 0, displayWidth, displayHeight);
      bg.addColorStop(0, "rgba(8, 16, 11, 0.98)");
      bg.addColorStop(0.55, "rgba(3, 8, 5, 0.98)");
      bg.addColorStop(1, "rgba(1, 4, 2, 0.98)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.strokeStyle = "rgba(181, 255, 199, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i += 1) {
        const x = pad + (mapWidth / 8) * i;
        const y = pad + (mapHeight / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, displayHeight - pad);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(displayWidth - pad, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(103, 240, 167, 0.36)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, mapWidth, mapHeight);

      this.drawMapStructures(ctx, toMap);
      this.drawAmmoBoxMarker(ctx, toMap, 6);
      this.drawLootContainerMarkers(ctx, toMap, 5.6);
      this.drawMapTraps(ctx, toMap, 1);

      for (const pickup of this.game.pickups) {
        const point = toMap(pickup.x, pickup.y);
        ctx.fillStyle = BONUS_DEFS[pickup.type]?.color || "#ffd34d";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const zombie of this.game.zombies) {
        if (!zombie.alive) {
          continue;
        }
        if (!this.game.canDetectOnMap(zombie.x, zombie.y)) {
          continue;
        }
        const point = toMap(zombie.x, zombie.y);
        const isBoss = zombie.isBoss?.();
        ctx.fillStyle = isBoss ? zombie.base.color : zombie.type === "shooter" ? "#c77dff" : zombie.type === "tank" ? "#d4b07d" : zombie.type === "exploder" ? "#ff8f62" : zombie.type === "runner" ? "#b8ffd8" : "#8bd48a";
        ctx.beginPath();
        ctx.arc(point.x, point.y, isBoss ? 7 : 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const playerPoint = toMap(this.game.player.x, this.game.player.y);
      const aimPoint = toMap(this.game.input.aimX ?? this.game.player.x, this.game.input.aimY ?? this.game.player.y);

      ctx.strokeStyle = "rgba(103, 240, 167, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playerPoint.x, playerPoint.y);
      ctx.lineTo(aimPoint.x, aimPoint.y);
      ctx.stroke();

      ctx.fillStyle = "#67f0a7";
      ctx.beginPath();
      ctx.arc(playerPoint.x, playerPoint.y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#02110b";
      ctx.beginPath();
      ctx.arc(playerPoint.x + 1, playerPoint.y, 2.3, 0, Math.PI * 2);
      ctx.fill();

      const wave = this.game.waveManager.wave || 1;
      const aliveZombies = this.game.zombies.filter((zombie) => zombie.alive && this.game.canDetectOnMap(zombie.x, zombie.y)).length;
      const drops = this.game.pickups.length;
      const loot = (this.game.worldLayout?.lootContainers || []).filter((container) => !container.opened).length;
      const bossWave = this.game.waveManager.bossWave ? " - Boss wave" : "";
      this.els.mapInfoText.textContent = `Wave ${wave} - ${aliveZombies} zombies - ${drops} drops - ${loot} loot${bossWave}`;
    }

    drawMapStructures(ctx, toPoint) {
      const layout = this.game.worldLayout;
      if (!layout) {
        return;
      }

      ctx.save();
      for (const barricade of layout.barricades || []) {
        const start = toPoint(barricade.x, barricade.y);
        const end = toPoint(barricade.x + barricade.w, barricade.y + barricade.h);
        const width = Math.max(1, end.x - start.x);
        const height = Math.max(1, end.y - start.y);
        ctx.fillStyle = barricade.fill || "rgba(101, 76, 47, 0.9)";
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(start.x, start.y, width, height);
      }

      const door = layout.door;
      if (door) {
        const start = toPoint(door.x, door.y);
        const end = toPoint(door.x + door.w, door.y + door.h);
        const width = Math.max(1, end.x - start.x);
        const height = Math.max(1, end.y - start.y);
        ctx.fillStyle = door.open ? "rgba(103, 240, 167, 0.58)" : "rgba(255, 77, 77, 0.84)";
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeStyle = door.open ? "rgba(103, 240, 167, 0.95)" : "rgba(255, 211, 77, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(start.x, start.y, width, height);
      }

      const lever = layout.lever;
      if (lever && (this.game.leverReady || this.game.leverPulled)) {
        const start = toPoint(lever.x, lever.y);
        const end = toPoint(lever.x + lever.w, lever.y + lever.h);
        const width = Math.max(1, end.x - start.x);
        const height = Math.max(1, end.y - start.y);
        ctx.fillStyle = this.game.leverPulled ? "rgba(103, 240, 167, 0.7)" : "rgba(255, 211, 77, 0.82)";
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeStyle = this.game.leverPulled ? "rgba(103, 240, 167, 0.98)" : "rgba(255, 211, 77, 0.98)";
        ctx.lineWidth = 2;
        ctx.strokeRect(start.x, start.y, width, height);
        ctx.beginPath();
        ctx.moveTo(start.x + width * 0.5, start.y + height * 0.15);
        ctx.lineTo(start.x + width * 0.5, start.y + height * 0.85);
        ctx.stroke();
      }

      const trigger = layout.levelTrigger;
      if (trigger) {
        const start = toPoint(trigger.x, trigger.y);
        const end = toPoint(trigger.x + trigger.w, trigger.y + trigger.h);
        const width = Math.max(1, end.x - start.x);
        const height = Math.max(1, end.y - start.y);
        ctx.save();
        const armed = this.game.leverReady;
        ctx.globalAlpha = this.game.levelAdvanceReady ? 1 : armed ? 0.72 : 0.5;
        ctx.fillStyle = this.game.levelAdvanceReady ? "rgba(103, 240, 167, 0.28)" : armed ? "rgba(255, 211, 77, 0.22)" : "rgba(255, 211, 77, 0.16)";
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeStyle = this.game.levelAdvanceReady ? "rgba(103, 240, 167, 0.92)" : armed ? "rgba(255, 211, 77, 0.9)" : "rgba(255, 211, 77, 0.72)";
        ctx.lineWidth = 2;
        ctx.strokeRect(start.x, start.y, width, height);
        ctx.restore();
      }
      ctx.restore();
    }

    drawAmmoBoxMarker(ctx, toPoint, size) {
      const box = this.game.worldLayout?.ammoBox;
      if (!box) {
        return;
      }

      const point = toPoint(box.x + box.w * 0.5, box.y + box.h * 0.5);
      ctx.save();
      ctx.fillStyle = "rgba(255, 211, 77, 0.95)";
      ctx.strokeStyle = "rgba(3, 8, 6, 0.92)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(point.x - size, point.y - size, size * 2, size * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(3, 8, 6, 0.95)";
      ctx.font = `700 ${Math.max(8, size * 1.6)}px Bahnschrift, Trebuchet MS, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", point.x, point.y + 0.5);
      ctx.restore();
    }

    drawLootContainerMarkers(ctx, toPoint, size) {
      for (const container of this.game.worldLayout?.lootContainers || []) {
        const point = toPoint(container.x + container.w * 0.5, container.y + container.h * 0.5);
        ctx.save();
        ctx.globalAlpha = container.opened ? 0.38 : 1;
        ctx.fillStyle = container.kind === "safe" ? "rgba(216, 251, 255, 0.95)" : "rgba(255, 211, 77, 0.95)";
        ctx.strokeStyle = "rgba(3, 8, 6, 0.92)";
        ctx.lineWidth = 1.5;
        if (container.kind === "safe") {
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(point.x - size, point.y - size * 0.75, size * 2, size * 1.5);
          ctx.strokeRect(point.x - size, point.y - size * 0.75, size * 2, size * 1.5);
        }
        ctx.restore();
      }
    }

    drawMapTraps(ctx, toPoint, scale = 1) {
      for (const trap of this.game.traps || []) {
        ctx.save();
        if (trap.type === "wire") {
          const start = toPoint(trap.x, trap.y);
          const end = toPoint(trap.x + trap.w, trap.y + trap.h);
          ctx.fillStyle = "rgba(216, 251, 255, 0.24)";
          ctx.fillRect(start.x, start.y, Math.max(1, end.x - start.x), Math.max(1, end.y - start.y));
          ctx.strokeStyle = "rgba(216, 251, 255, 0.76)";
          ctx.strokeRect(start.x, start.y, Math.max(1, end.x - start.x), Math.max(1, end.y - start.y));
        } else {
          const point = toPoint(trap.x, trap.y);
          const radius = trap.type === "barrel" ? 4.2 * scale : trap.type === "turret" ? 4.8 * scale : 4.5 * scale;
          ctx.fillStyle = trap.spent
            ? "rgba(255,255,255,0.24)"
            : trap.type === "barrel"
              ? "#ff9f5a"
              : trap.type === "turret"
                ? "#8dc3ff"
                : "#98f0ff";
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.42)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    showNotification(text, type = "normal", duration = 3000) {
      const note = document.createElement("div");
      note.className = `notification${type === "danger" ? " notification--danger" : type === "accent" ? " notification--accent" : ""}`;
      note.textContent = text;
      this.els.notifications.appendChild(note);
      setTimeout(() => note.remove(), duration + 450);
    }

    showGameOver(stats) {
      this.els.finalScoreText.textContent = stats.score.toLocaleString();
      this.els.finalWavesText.textContent = `${stats.waves}`;
      this.els.finalKillsText.textContent = `${stats.kills}`;
      this.els.finalAccuracyText.textContent = `${stats.accuracy.toFixed(1)}%`;
      this.els.finalHeadshotsText.textContent = `${stats.headshots}`;
      this.els.scoreNameInput.value = this.game.settings.playerName || "Survivor";
      this.setMode("gameover");
    }

    saveScore() {
      const result = this.game.leaderboard.saveScore({
        playerName: this.els.scoreNameInput.value.trim() || this.game.settings.playerName || "Survivor",
        modeKey: this.game.getModeKey(),
        modeName: this.game.getModeSettings().name,
        score: this.game.stats.score,
        waves: this.game.waveManager.wavesCleared,
        kills: this.game.stats.kills,
        accuracy: this.game.stats.shotsFired > 0 ? (this.game.stats.hits / this.game.stats.shotsFired) * 100 : 0,
        headshots: this.game.stats.headshots,
        date: new Date().toISOString()
      });

      this.leaderboardHighlightId = result.entry.id;
      this.game.settings.playerName = result.entry.playerName;
      this.game.saveSettings();
      this.showNotification(result.isNewRecord ? "New record saved" : "Score saved", result.isNewRecord ? "accent" : "normal", 2400);
      this.refreshMainMenuStats();
      this.renderLeaderboard(result.entry.id);
    }
  }

  global.UIManager = UIManager;
})(window);
