/**
 * API client for Pathfinder KnowHow.
 * Reads connection settings from Foundry module settings.
 */
export class KnowHowAPI {
  get #baseUrl() {
    const url = game.settings.get("pathfinder-knowhow", "apiUrl");
    return url.replace(/\/+$/, "");
  }

  get #apiKey() {
    return game.settings.get("pathfinder-knowhow", "apiKey");
  }

  #validate() {
    if (!this.#baseUrl) throw new Error(game.i18n.localize("KNOWHOW.Errors.NoUrl"));
    if (!this.#apiKey) throw new Error(game.i18n.localize("KNOWHOW.Errors.NoKey"));
  }

  async #fetch(path, options = {}) {
    this.#validate();
    const url = `${this.#baseUrl}${path}`;
    let res;
    try {
      res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.#apiKey,
          ...options.headers,
        },
      });
    } catch {
      throw new Error(game.i18n.localize("KNOWHOW.Errors.NetworkError"));
    }
    if (!res.ok) {
      throw new Error(game.i18n.format("KNOWHOW.Errors.ServerError", { status: res.status }));
    }
    return res.json();
  }

  /**
   * Ask a question against campaign notes.
   * @param {string} question
   * @param {string} [category] - optional category filter
   * @returns {Promise<{answer: string, sources: Array}>}
   */
  async query(question, category) {
    const body = { question };
    if (category) body.category = category;
    return this.#fetch("/api/query", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Save a new entry.
   * @param {string} category
   * @param {string} content
   * @returns {Promise<object>}
   */
  async saveEntry(category, content) {
    return this.#fetch("/api/entries", {
      method: "POST",
      body: JSON.stringify({ category, content }),
    });
  }

  /**
   * Auto-detect category and format content.
   * @param {string} content
   * @returns {Promise<{category: string, content: string}>}
   */
  async detectAndFormat(content) {
    return this.#fetch("/api/detect-and-format", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }
}
