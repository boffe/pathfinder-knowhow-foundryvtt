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
    this._saveState = "input"; // "input" | "preview"
    this._previewCategory = "";
    this._previewContent = "";
  }

  getData() {
    return {
      categories: CATEGORIES,
      categoryColors: CATEGORY_COLORS,
      activeTab: this._activeTab,
    };
  }

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
        <button class="knowhow-tab ${data.activeTab === "ask" ? "active" : ""}" data-tab="ask">${game.i18n.localize("KNOWHOW.Tabs.Ask")}</button>
        <button class="knowhow-tab ${data.activeTab === "save" ? "active" : ""}" data-tab="save">${game.i18n.localize("KNOWHOW.Tabs.Save")}</button>
      </div>

      <div class="knowhow-panel" data-panel="ask" ${data.activeTab !== "ask" ? 'style="display:none"' : ""}>
        <div class="knowhow-form-group">
          <input type="text" class="knowhow-ask-input" placeholder="${game.i18n.localize("KNOWHOW.Ask.Placeholder")}" />
        </div>
        <div class="knowhow-form-row">
          <select class="knowhow-ask-category">
            <option value="">${game.i18n.localize("KNOWHOW.Ask.AllCategories")}</option>
            ${categoryOptions}
          </select>
          <button class="knowhow-btn knowhow-ask-submit">${game.i18n.localize("KNOWHOW.Ask.Submit")}</button>
        </div>
        <div class="knowhow-answer-area"></div>
      </div>

      <div class="knowhow-panel" data-panel="save" ${data.activeTab !== "save" ? 'style="display:none"' : ""}>
        <div class="knowhow-save-input-view">
          <div class="knowhow-form-group">
            <textarea class="knowhow-save-content" rows="10" placeholder="${game.i18n.localize("KNOWHOW.Save.ContentPlaceholder")}"></textarea>
          </div>
          <div class="knowhow-form-row">
            <button class="knowhow-btn knowhow-detect-submit">${game.i18n.localize("KNOWHOW.Save.DetectFormat")}</button>
          </div>
          <div class="knowhow-save-status"></div>
        </div>

        <div class="knowhow-save-preview-view" style="display:none">
          <div class="knowhow-preview-header">
            <h4>${game.i18n.localize("KNOWHOW.Save.ReviewEntry")}</h4>
          </div>
          <div class="knowhow-form-group">
            <label class="knowhow-label">${game.i18n.localize("KNOWHOW.Save.DetectedCategory")}</label>
            <select class="knowhow-preview-category">
              ${categoryOptions}
            </select>
            <span class="knowhow-format-hint" style="display:none">${game.i18n.localize("KNOWHOW.Save.NoFormatHint")}</span>
          </div>
          <div class="knowhow-form-group knowhow-preview-content-group">
            <label class="knowhow-label">${game.i18n.localize("KNOWHOW.Save.Content")}</label>
            <textarea class="knowhow-preview-content" rows="10"></textarea>
          </div>
          <div class="knowhow-save-status knowhow-preview-status"></div>
          <div class="knowhow-form-row knowhow-preview-actions">
            <button class="knowhow-btn knowhow-save-submit">${game.i18n.localize("KNOWHOW.Save.Submit")}</button>
            <button class="knowhow-btn-secondary knowhow-preview-cancel">${game.i18n.localize("KNOWHOW.Save.Cancel")}</button>
          </div>
        </div>
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

    // Save: Detect & Format
    html.find(".knowhow-detect-submit").on("click", () => this._onDetectAndFormat(html));

    // Save: confirm save from preview
    html.find(".knowhow-save-submit").on("click", () => this._onSave(html));

    // Save: cancel preview, go back to input
    html.find(".knowhow-preview-cancel").on("click", () => this._showSaveInput(html));
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

  async _onDetectAndFormat(html) {
    const contentEl = html.find(".knowhow-save-content");
    const content = contentEl.val().trim();
    if (!content) return;

    const btn = html.find(".knowhow-detect-submit");
    const status = html.find(".knowhow-save-input-view .knowhow-save-status");

    btn.prop("disabled", true).text(game.i18n.localize("KNOWHOW.Save.Detecting"));
    status.html("").removeClass("knowhow-error");

    try {
      const result = await this.api.detectAndFormat(content);

      this._previewCategory = result.category;
      this._previewContent = result.formattedContent;

      html.find(".knowhow-preview-category").val(result.category);
      html.find(".knowhow-preview-content").val(result.formattedContent);
      html.find(".knowhow-format-hint").toggle(!result.formatted);

      this._showSavePreview(html);
    } catch (err) {
      status.addClass("knowhow-error").text(err.message);
      ui.notifications.error(err.message);
    } finally {
      btn.prop("disabled", false).text(game.i18n.localize("KNOWHOW.Save.DetectFormat"));
    }
  }

  async _onSave(html) {
    const category = html.find(".knowhow-preview-category").val();
    const content = html.find(".knowhow-preview-content").val().trim();
    if (!content) return;

    const btn = html.find(".knowhow-save-submit");
    const status = html.find(".knowhow-preview-status");

    btn.prop("disabled", true).text(game.i18n.localize("KNOWHOW.Save.Saving"));
    status.html("").removeClass("knowhow-error knowhow-success");

    try {
      await this.api.saveEntry(category, content);

      status.addClass("knowhow-success").text(game.i18n.localize("KNOWHOW.Save.Success"));
      ui.notifications.info(game.i18n.localize("KNOWHOW.Save.Success"));

      // Reset after short delay so user sees the success message
      setTimeout(() => {
        html.find(".knowhow-save-content").val("");
        this._showSaveInput(html);
        status.html("").removeClass("knowhow-success");
      }, 1500);
    } catch (err) {
      status.addClass("knowhow-error").text(err.message);
      ui.notifications.error(err.message);
    } finally {
      btn.prop("disabled", false).text(game.i18n.localize("KNOWHOW.Save.Submit"));
    }
  }

  _showSaveInput(html) {
    this._saveState = "input";
    html.find(".knowhow-save-input-view").show();
    html.find(".knowhow-save-preview-view").hide();
  }

  _showSavePreview(html) {
    this._saveState = "preview";
    html.find(".knowhow-save-input-view").hide();
    html.find(".knowhow-save-preview-view").show();
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
