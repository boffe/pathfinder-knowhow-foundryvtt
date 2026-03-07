import { KnowHowApp } from "./knowhow-app.js";
import { KnowHowAPI } from "./api-client.js";

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

// Chat commands: /knowhow, /kh, /kh ask, /kh save
Hooks.on("chatMessage", (_chatLog, message) => {
  const msg = message.trim();
  const lower = msg.toLowerCase();

  // /knowhow or bare /kh — open the window
  if (lower === "/knowhow" || lower === "/kh") {
    new KnowHowApp().render(true);
    return false;
  }

  // /kh ask [Category] question
  if (lower.startsWith("/kh ask ")) {
    const rest = msg.substring("/kh ask ".length).trim();
    if (!rest) return false;

    let category;
    let question = rest;
    const bracketMatch = rest.match(/^\[([^\]]+)\]\s*(.+)/s);
    if (bracketMatch) {
      category = bracketMatch[1];
      question = bracketMatch[2];
    }

    _handleAsk(question, category);
    return false;
  }

  // /kh save <content>
  if (lower.startsWith("/kh save ")) {
    const content = msg.substring("/kh save ".length).trim();
    if (!content) return false;

    _handleSave(content);
    return false;
  }
});

async function _handleAsk(question, category) {
  const api = new KnowHowAPI();
  try {
    const result = await api.query(question, category || undefined);
    const answer = result.answer || game.i18n.localize("KNOWHOW.Ask.NoAnswer");

    let html = `<div class="knowhow-chat"><strong>KnowHow</strong><p>${_escapeAndFormat(answer)}</p>`;
    if (result.sources?.length) {
      html += `<details><summary>${game.i18n.localize("KNOWHOW.Ask.Sources")} (${result.sources.length})</summary><ul>`;
      for (const s of result.sources) {
        const snippet = _escapeHTML(s.content).substring(0, 120);
        html += `<li><em>[${_escapeHTML(s.category)}]</em> ${snippet}${s.content.length > 120 ? "..." : ""}</li>`;
      }
      html += `</ul></details>`;
    }
    html += `</div>`;

    ChatMessage.create({
      content: html,
      whisper: [game.user.id],
      speaker: { alias: "KnowHow" },
    });
  } catch (err) {
    ui.notifications.error(err.message);
  }
}

async function _handleSave(rawContent) {
  const api = new KnowHowAPI();
  try {
    const detected = await api.detectAndFormat(rawContent);
    await api.saveEntry(detected.category, detected.formattedContent);

    ChatMessage.create({
      content: `<div class="knowhow-chat"><strong>KnowHow</strong><p>Entry saved as <em>${_escapeHTML(detected.category)}</em>.</p></div>`,
      whisper: [game.user.id],
      speaker: { alias: "KnowHow" },
    });
  } catch (err) {
    ui.notifications.error(err.message);
  }
}

function _escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function _escapeAndFormat(str) {
  return _escapeHTML(str).replace(/\n/g, "<br>");
}
