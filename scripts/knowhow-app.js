import { KnowHowAPI } from "./api-client.js";

const CATEGORIES = [
  "NPC", "Location", "Event", "Equipment",
  "Faction", "Lore", "Spell", "Feat", "Session Notes",
];

const CATEGORY_COLORS = {
  NPC:            { bg: "#7c2d12", text: "#fdba74", border: "#c2410c" },
  Location:       { bg: "#14532d", text: "#86efac", border: "#15803d" },
  Event:          { bg: "#4c1d95", text: "#c4b5fd", border: "#6d28d9" },
  Equipment:      { bg: "#78350f", text: "#fcd34d", border: "#a16207" },
  Faction:        { bg: "#1e3a5f", text: "#93c5fd", border: "#2563eb" },
  Lore:           { bg: "#4a1942", text: "#f0abfc", border: "#86198f" },
  Spell:          { bg: "#0c4a6e", text: "#7dd3fc", border: "#0369a1" },
  Feat:           { bg: "#365314", text: "#bef264", border: "#4d7c0f" },
  "Session Notes":{ bg: "#44403c", text: "#d6d3d1", border: "#78716c" },
};

export class KnowHowApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "knowhow-window",
      title: game.i18n.localize("KNOWHOW.Title"),
      template: `modules/pathfinder-knowhow/templates/knowhow.html`,
      width: 480,
      height: 560,
      resizable: true,
      classes: ["knowhow-window"],
    });
  }

  constructor(...args) {
    super(...args);
    this.api = new KnowHowAPI();
    this._activeTab = "ask";
  }

  getData() {
    return {
      categories: CATEGORIES,
      categoryColors: CATEGORY_COLORS,
      activeTab: this._activeTab,
      i18n: {
        ask: game.i18n.localize("KNOWHOW.Tabs.Ask"),
        save: game.i18n.localize("KNOWHOW.Tabs.Save"),
        askPlaceholder: game.i18n.localize("KNOWHOW.Ask.Placeholder"),
        allCategories: game.i18n.localize("KNOWHOW.Ask.AllCategories"),
        categoryLabel: game.i18n.localize("KNOWHOW.Ask.Category"),
        askSubmit: game.i18n.localize("KNOWHOW.Ask.Submit"),
        sources: game.i18n.localize("KNOWHOW.Ask.Sources"),
        savePlaceholder: game.i18n.localize("KNOWHOW.Save.ContentPlaceholder"),
        saveCategoryLabel: game.i18n.localize("KNOWHOW.Save.Category"),
        autoDetect: game.i18n.localize("KNOWHOW.Save.AutoDetect"),
        saveSubmit: game.i18n.localize("KNOWHOW.Save.Submit"),
      },
    };
  }

  /**
   * We render inline HTML instead of using a template file,
   * to keep the module self-contained without needing a templates/ dir.
   */
  async _renderInner(data) {
    const html = document.createElement("div");
    html.innerHTML = this._buildHTML(data);
    return $(html.children);
  }

  _buildHTML(data) {
    const categoryOptions = data.categories
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    return `
      <div class="knowhow-tabs">
        <button class="knowhow-tab ${data.activeTab === "ask" ? "active" : ""}" data-tab="ask">${data.i18n.ask}</button>
        <button class="knowhow-tab ${data.activeTab === "save" ? "active" : ""}" data-tab="save">${data.i18n.save}</button>
      </div>

      <div class="knowhow-panel" data-panel="ask" ${data.activeTab !== "ask" ? 'style="display:none"' : ""}>
        <div class="knowhow-form-group">
          <input type="text" class="knowhow-ask-input" placeholder="${data.i18n.askPlaceholder}" />
        </div>
        <div class="knowhow-form-row">
          <select class="knowhow-ask-category">
            <option value="">${data.i18n.allCategories}</option>
            ${categoryOptions}
          </select>
          <button class="knowhow-btn knowhow-ask-submit">${data.i18n.askSubmit}</button>
        </div>
        <div class="knowhow-answer-area"></div>
      </div>

      <div class="knowhow-panel" data-panel="save" ${data.activeTab !== "save" ? 'style="display:none"' : ""}>
        <div class="knowhow-form-group">
          <textarea class="knowhow-save-content" rows="8" placeholder="${data.i18n.savePlaceholder}"></textarea>
        </div>
        <div class="knowhow-form-row">
          <button class="knowhow-btn knowhow-save-submit">${data.i18n.saveSubmit}</button>
        </div>
        <div class="knowhow-save-status"></div>
      </div>
    `;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find(".knowhow-tab").on("click", (ev) => {
      const tab = ev.currentTarget.dataset.tab;
      this._activeTab = tab;
      html.find(".knowhow-tab").removeClass("active");
      $(ev.currentTarget).addClass("active");
      html.find(".knowhow-panel").hide();
      html.find(`[data-panel="${tab}"]`).show();
    });

    // Ask submit
    html.find(".knowhow-ask-submit").on("click", () => this._onAsk(html));
    html.find(".knowhow-ask-input").on("keydown", (ev) => {
      if (ev.key === "Enter") this._onAsk(html);
    });

    // Save submit
    html.find(".knowhow-save-submit").on("click", () => this._onSave(html));
  }

  async _onAsk(html) {
    const input = html.find(".knowhow-ask-input");
    const question = input.val().trim();
    if (!question) return;

    const btn = html.find(".knowhow-ask-submit");
    const area = html.find(".knowhow-answer-area");
    const category = html.find(".knowhow-ask-category").val();

    btn.prop("disabled", true).text(game.i18n.localize("KNOWHOW.Ask.Asking"));
    area.html('<div class="knowhow-loading">...</div>');

    try {
      const result = await this.api.query(question, category || undefined);
      area.html(this._renderAnswer(result));
    } catch (err) {
      area.html(`<div class="knowhow-error">${err.message}</div>`);
      ui.notifications.error(err.message);
    } finally {
      btn.prop("disabled", false).text(game.i18n.localize("KNOWHOW.Ask.Submit"));
    }
  }

  _renderAnswer(result) {
    const answer = result.answer || game.i18n.localize("KNOWHOW.Ask.NoAnswer");
    const answerHtml = `<div class="knowhow-answer-text">${this._escapeAndFormat(answer)}</div>`;

    if (!result.sources?.length) return answerHtml;

    const sourcesLabel = game.i18n.localize("KNOWHOW.Ask.Sources");
    const sourceCards = result.sources
      .map((s) => {
        const colors = CATEGORY_COLORS[s.category] || CATEGORY_COLORS["Session Notes"];
        const snippet = this._escapeHTML(s.content).substring(0, 150);
        return `
          <div class="knowhow-source-card">
            <span class="knowhow-badge" style="background:${colors.bg};color:${colors.text};border-color:${colors.border}">${this._escapeHTML(s.category)}</span>
            <span class="knowhow-source-snippet">${snippet}${s.content.length > 150 ? "..." : ""}</span>
          </div>`;
      })
      .join("");

    return `${answerHtml}<div class="knowhow-sources"><h4>${sourcesLabel}</h4>${sourceCards}</div>`;
  }

  async _onSave(html) {
    const contentEl = html.find(".knowhow-save-content");
    const content = contentEl.val().trim();
    if (!content) return;

    const btn = html.find(".knowhow-save-submit");
    const status = html.find(".knowhow-save-status");

    btn.prop("disabled", true).text(game.i18n.localize("KNOWHOW.Save.Saving"));
    status.html("").removeClass("knowhow-error knowhow-success");

    try {
      const detected = await this.api.detectAndFormat(content);
      await this.api.saveEntry(detected.category, detected.content);

      status.addClass("knowhow-success").text(game.i18n.localize("KNOWHOW.Save.Success"));
      ui.notifications.info(game.i18n.localize("KNOWHOW.Save.Success"));
      contentEl.val("");
    } catch (err) {
      status.addClass("knowhow-error").text(err.message);
      ui.notifications.error(err.message);
    } finally {
      btn.prop("disabled", false).text(game.i18n.localize("KNOWHOW.Save.Submit"));
    }
  }

  _escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  _escapeAndFormat(str) {
    return this._escapeHTML(str).replace(/\n/g, "<br>");
  }
}
