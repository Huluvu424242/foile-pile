const INDEX_URL = "index.json";
const SEARCH_DEBOUNCE_MS = 120;

const sortSelect = document.getElementById("sort-select");
const searchInput = document.getElementById("search-input");
const listElement = document.getElementById("presentation-list");
const statusElement = document.getElementById("status-message");
const resultSummaryElement = document.getElementById("result-summary");

let loadedPresentations = [];
let debounceTimerId = null;
const searchCache = new Map();

function showStatus(message) {
  statusElement.textContent = message;
  statusElement.hidden = false;
  resultSummaryElement.hidden = true;
  listElement.hidden = true;
}

function clearStatus() {
  statusElement.hidden = true;
}

function extractCategory(path) {
  if (typeof path !== "string" || !path.trim()) {
    return "Unbekannter Bereich";
  }

  const [category] = path.split("/");
  return category || "Unbekannter Bereich";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(rawQuery) {
  return normalizeText(rawQuery)
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function highlightMatches(text, tokens) {
  const escaped = escapeHtml(text);
  if (!tokens.length) {
    return escaped;
  }

  return tokens.reduce((current, token) => {
    if (!token) {
      return current;
    }

    const matcher = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "giu");
    return current.replace(matcher, '<mark class="search-highlight">$1</mark>');
  }, escaped);
}

function renderTags(tags, queryTokens) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '<span class="tag">Keine Tags</span>';
  }

  return tags.map((tag) => `<span class="tag">${highlightMatches(tag, queryTokens)}</span>`).join("");
}

function renderList(presentations, queryTokens) {
  if (!Array.isArray(presentations) || presentations.length === 0) {
    showStatus("Keine Treffer. Bitte passen Sie Ihre Suche an.");
    return;
  }

  clearStatus();

  listElement.innerHTML = presentations
    .map((presentation) => {
      const title = presentation.title || "Ohne Titel";
      const description = presentation.description || "Keine Kurzbeschreibung vorhanden.";
      const category = extractCategory(presentation.path);
      const viewerPath = presentation.files?.viewer || "#";

      return `
        <li class="presentation-card">
          <h2><a class="viewer-link" href="${viewerPath}">${highlightMatches(title, queryTokens)}</a></h2>
          <p>${highlightMatches(description, queryTokens)}</p>
          <p class="presentation-meta">Bereich/Kategorie: <strong>${highlightMatches(category, queryTokens)}</strong></p>
          <div class="tags">${renderTags(presentation.tags, queryTokens)}</div>
        </li>
      `;
    })
    .join("");

  listElement.hidden = false;
}

function sortPresentations(presentations, mode) {
  const copy = [...presentations];

  if (mode === "alphabet") {
    copy.sort((a, b) => (a.title || "").localeCompare(b.title || "", "de"));
    return copy;
  }

  return copy;
}

function updateSummary(resultCount, query) {
  if (!query) {
    resultSummaryElement.textContent = `${resultCount} Präsentationen verfügbar.`;
    resultSummaryElement.hidden = false;
    return;
  }

  resultSummaryElement.textContent = `${resultCount} Treffer für „${query}“.`;
  resultSummaryElement.hidden = false;
}

function filterPresentations(queryTokens) {
  if (!queryTokens.length) {
    return loadedPresentations;
  }

  const cacheKey = queryTokens.join("|");
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const filtered = loadedPresentations.filter((presentation) => {
    const haystack = normalizeText(
      presentation.searchText ||
        `${presentation.title || ""} ${presentation.description || ""} ${(presentation.tags || []).join(" ")}`
    );
    return queryTokens.every((token) => haystack.includes(token));
  });

  searchCache.set(cacheKey, filtered);
  return filtered;
}

function updateList() {
  const selectedSort = sortSelect.value;
  const rawQuery = searchInput.value.trim();
  const queryTokens = tokenizeQuery(rawQuery);
  const filtered = filterPresentations(queryTokens);
  const sorted = sortPresentations(filtered, selectedSort);
  updateSummary(sorted.length, rawQuery);
  renderList(sorted, queryTokens);
}

function onSearchInput() {
  window.clearTimeout(debounceTimerId);
  debounceTimerId = window.setTimeout(updateList, SEARCH_DEBOUNCE_MS);
}

async function loadPresentations() {
  showStatus("Präsentationen werden geladen …");

  try {
    const response = await fetch(INDEX_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    loadedPresentations = Array.isArray(data.presentations) ? data.presentations : [];
    searchCache.clear();
    updateList();
  } catch (error) {
    console.error(error);
    showStatus("Die Präsentationen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
  }
}

sortSelect.addEventListener("change", updateList);
searchInput.addEventListener("input", onSearchInput);
loadPresentations();
