import { KnowHowApp } from "./knowhow-app.js";

const MODULE_ID = "pathfinder-knowhow";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "apiUrl", {
    name: game.i18n.localize("KNOWHOW.Settings.ApiUrl.Name"),
    hint: game.i18n.localize("KNOWHOW.Settings.ApiUrl.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MODULE_ID, "apiKey", {
    name: game.i18n.localize("KNOWHOW.Settings.ApiKey.Name"),
    hint: game.i18n.localize("KNOWHOW.Settings.ApiKey.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "",
  });
});

// Add a button to open KnowHow — try multiple approaches for compatibility
Hooks.on("getSceneControlButtons", (controls) => {
  // Foundry v12+: controls may be an array or an object
  if (Array.isArray(controls)) {
    controls.push({
      name: "knowhow",
      title: game.i18n.localize("KNOWHOW.ButtonTitle"),
      icon: "fas fa-book-open",
      layer: "controls",
      visible: true,
      tools: [{
        name: "open",
        title: game.i18n.localize("KNOWHOW.ButtonTitle"),
        icon: "fas fa-book-open",
        onClick: () => new KnowHowApp().render(true),
        button: true,
      }],
    });
  }
});

// Fallback: also add a chat command /knowhow
Hooks.on("chatMessage", (_chatLog, message) => {
  if (message.trim().toLowerCase() === "/knowhow") {
    new KnowHowApp().render(true);
    return false; // prevent the message from being sent
  }
});
