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

// Add a button to open KnowHow in the token scene controls
Hooks.on("getSceneControlButtons", (controls) => {
  controls.tokens.tools.knowhow = {
    name: "knowhow",
    title: "KNOWHOW.ButtonTitle",
    icon: "fas fa-book-open",
    order: Object.keys(controls.tokens.tools).length,
    button: true,
    visible: true,
    onChange: () => new KnowHowApp().render(true),
  };
});

// Fallback: also add a chat command /knowhow
Hooks.on("chatMessage", (_chatLog, message) => {
  if (message.trim().toLowerCase() === "/knowhow") {
    new KnowHowApp().render(true);
    return false; // prevent the message from being sent
  }
});
