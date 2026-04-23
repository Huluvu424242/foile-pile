const INDEX_URL = "index.json";
const SEARCH_DEBOUNCE_MS = 120;
const SLIDES_FILE_NAME = "slides.json";
const VIEWER_BASE_URL = "https://huluvu424242.github.io/sld-slideshow-viewer/";

const sortSelect = document.getElementById("sort-select");
const searchInput = document.getElementById("search-input");
const listElement = document.getElementById("presentation-list");
const statusElement = document.getElementById("status-message");
const resultSummaryElement = document.getElementById("result-summary");
const tagFiltersElement = document.getElementById("tag-filters");
const languageFiltersElement = document.getElementById("language-filters");
const categoryFiltersElement = document.getElementById("category-filters");
const activeFiltersContainerElement = document.getElementById("active-filters");
const activeFilterChipsElement = document.getElementById("active-filter-chips");

let loadedPresentations = [];
let debounceTimerId = null;
const searchCache = new Map();
const selectedFilters = {
  tags: new Set(),
  languages: new Set(),
  categories: new Set(),
};

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

function getCategoryLabel(presentation) {
  return extractCategory(presentation.path);
}

function getLanguageLabel(languageCode) {
  if (languageCode === "de") {
    return "Deutsch";
  }
  if (languageCode === "en") {
    return "Englisch";
  }
  return languageCode || "Unbekannt";
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

function buildViewerContract(presentation) {
  const files = presentation?.files;
  if (!files || typeof files !== "object") {
    return { isValid: false, reason: "Fehlende Dateiliste im Suchindex." };
  }

  const slidesPath = typeof files.slides === "string" ? files.slides.trim() : "";
  if (!slidesPath) {
    return { isValid: false, reason: "Fehlende Foliendatei (slides.json)." };
  }
  if (!slidesPath.endsWith(SLIDES_FILE_NAME)) {
    return { isValid: false, reason: "Ungültige Foliendatei im Suchindex." };
  }

  const manifestPath = typeof files.manifest === "string" ? files.manifest.trim() : "";
  if (!manifestPath || !manifestPath.endsWith("manifest.json")) {
    return { isValid: false, reason: "Ungültiges oder fehlendes Manifest im Suchindex." };
  }

  try {
    const slidesUrl = new URL(slidesPath, window.location.href).href;
    const viewerUrl = new URL(VIEWER_BASE_URL);
    viewerUrl.searchParams.set("url", slidesUrl);

    return {
      isValid: true,
      viewerHref: viewerUrl.href,
      slidesUrl,
      manifestUrl: new URL(manifestPath, window.location.href).href,
    };
  } catch (_error) {
    return { isValid: false, reason: "Ungültiger Dateipfad im Suchindex." };
  }
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
      const viewerContract = buildViewerContract(presentation);
      const viewAction = viewerContract.isValid
        ? `
          <a
            class="view-action"
            href="${escapeHtml(viewerContract.viewerHref)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(title)} im Viewer ansehen"
            data-slides-url="${escapeHtml(viewerContract.slidesUrl)}"
            data-manifest-url="${escapeHtml(viewerContract.manifestUrl)}"
          >
            Ansehen
          </a>
        `
        : `
          <button class="view-action view-action--disabled" type="button" disabled aria-disabled="true">
            Ansehen nicht verfügbar
          </button>
        `;
      const viewError = viewerContract.isValid
        ? ""
        : `<p class="viewer-error" role="status">${escapeHtml(viewerContract.reason)}</p>`;

      return `
        <li class="presentation-card">
          <h2>${highlightMatches(title, queryTokens)}</h2>
          <p>${highlightMatches(description, queryTokens)}</p>
          <p class="presentation-meta">Bereich/Kategorie: <strong>${highlightMatches(category, queryTokens)}</strong></p>
          <div class="tags">${renderTags(presentation.tags, queryTokens)}</div>
          <div class="presentation-actions">
            ${viewAction}
          </div>
          ${viewError}
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
  const hasQuery = Boolean(query);
  const hasFacets =
    selectedFilters.tags.size > 0 || selectedFilters.languages.size > 0 || selectedFilters.categories.size > 0;

  if (!hasQuery && !hasFacets) {
    resultSummaryElement.textContent = `${resultCount} Präsentationen verfügbar.`;
    resultSummaryElement.hidden = false;
    return;
  }

  if (hasQuery) {
    resultSummaryElement.textContent = `${resultCount} Treffer für „${query}“.`;
    resultSummaryElement.hidden = false;
    return;
  }

  resultSummaryElement.textContent = `${resultCount} Treffer mit aktiven Filtern.`;
  resultSummaryElement.hidden = false;
}

function filterPresentations(queryTokens) {
  const cacheKey = [
    queryTokens.join("|"),
    [...selectedFilters.tags].sort().join("|"),
    [...selectedFilters.languages].sort().join("|"),
    [...selectedFilters.categories].sort().join("|"),
  ].join("::");
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const filtered = loadedPresentations.filter((presentation) => {
    const matchesSearch = !queryTokens.length
      ? true
      : queryTokens.every((token) =>
          normalizeText(
            presentation.searchText ||
              `${presentation.title || ""} ${presentation.description || ""} ${(presentation.tags || []).join(" ")}`
          ).includes(token)
        );
    const matchesTags =
      selectedFilters.tags.size === 0 ||
      [...selectedFilters.tags].every((tag) => (presentation.tags || []).includes(tag));
    const matchesLanguage =
      selectedFilters.languages.size === 0 || selectedFilters.languages.has(presentation.language || "unbekannt");
    const matchesCategory =
      selectedFilters.categories.size === 0 || selectedFilters.categories.has(getCategoryLabel(presentation));

    return matchesSearch && matchesTags && matchesLanguage && matchesCategory;
  });

  searchCache.set(cacheKey, filtered);
  return filtered;
}

function createFilterCheckbox(name, value, label, count) {
  return `
    <label class="filter-option">
      <input type="checkbox" name="${name}" value="${escapeHtml(value)}" />
      <span>${escapeHtml(label)} <small>(${count})</small></span>
    </label>
  `;
}

function renderFilterOptions() {
  const tagCounter = new Map();
  const languageCounter = new Map();
  const categoryCounter = new Map();

  loadedPresentations.forEach((presentation) => {
    (presentation.tags || []).forEach((tag) => {
      tagCounter.set(tag, (tagCounter.get(tag) || 0) + 1);
    });

    const language = presentation.language || "unbekannt";
    languageCounter.set(language, (languageCounter.get(language) || 0) + 1);

    const category = getCategoryLabel(presentation);
    categoryCounter.set(category, (categoryCounter.get(category) || 0) + 1);
  });

  const tagOptions = [...tagCounter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([tag, count]) => createFilterCheckbox("tag", tag, tag, count))
    .join("");
  tagFiltersElement.innerHTML = tagOptions || '<p class="filter-empty">Keine Tags verfügbar.</p>';

  const languageOptions = [...languageCounter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([language, count]) => createFilterCheckbox("language", language, getLanguageLabel(language), count))
    .join("");
  languageFiltersElement.innerHTML = languageOptions || '<p class="filter-empty">Keine Sprachen verfügbar.</p>';

  const categoryOptions = [...categoryCounter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([category, count]) => createFilterCheckbox("category", category, category, count))
    .join("");
  categoryFiltersElement.innerHTML = categoryOptions || '<p class="filter-empty">Keine Bereiche verfügbar.</p>';

  syncFilterSelections();
}

function syncFilterSelections() {
  tagFiltersElement.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selectedFilters.tags.has(input.value);
  });
  languageFiltersElement.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selectedFilters.languages.has(input.value);
  });
  categoryFiltersElement.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selectedFilters.categories.has(input.value);
  });
}

function renderActiveFilters() {
  const chips = [];

  selectedFilters.tags.forEach((tag) => {
    chips.push({ type: "tag", value: tag, label: `Tag: ${tag}` });
  });
  selectedFilters.languages.forEach((language) => {
    chips.push({ type: "language", value: language, label: `Sprache: ${getLanguageLabel(language)}` });
  });
  selectedFilters.categories.forEach((category) => {
    chips.push({ type: "category", value: category, label: `Bereich: ${category}` });
  });

  if (!chips.length) {
    activeFiltersContainerElement.hidden = true;
    activeFilterChipsElement.innerHTML = "";
    return;
  }

  activeFilterChipsElement.innerHTML = chips
    .map(
      (chip) => `
      <button class="active-filter-chip" type="button" data-filter-type="${chip.type}" data-filter-value="${escapeHtml(chip.value)}">
        <span>${escapeHtml(chip.label)}</span>
        <span aria-hidden="true">×</span>
      </button>
    `
    )
    .join("");

  activeFiltersContainerElement.hidden = false;
}

function setFilterValue(filterType, value, isEnabled) {
  const mapping = {
    tag: selectedFilters.tags,
    language: selectedFilters.languages,
    category: selectedFilters.categories,
  };
  const targetSet = mapping[filterType];
  if (!targetSet) {
    return;
  }

  if (isEnabled) {
    targetSet.add(value);
  } else {
    targetSet.delete(value);
  }
}

function onFilterChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
    return;
  }

  setFilterValue(target.name, target.value, target.checked);
  searchCache.clear();
  syncFilterSelections();
  renderActiveFilters();
  updateList();
}

function onActiveFilterClick(event) {
  const button = event.target.closest(".active-filter-chip");
  if (!button) {
    return;
  }

  const filterType = button.getAttribute("data-filter-type");
  const filterValue = button.getAttribute("data-filter-value");
  if (!filterType || !filterValue) {
    return;
  }

  setFilterValue(filterType, filterValue, false);
  searchCache.clear();
  syncFilterSelections();
  renderActiveFilters();
  updateList();
}

function onSearchInput() {
  window.clearTimeout(debounceTimerId);
  debounceTimerId = window.setTimeout(updateList, SEARCH_DEBOUNCE_MS);
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
    renderFilterOptions();
    renderActiveFilters();
    updateList();
  } catch (error) {
    console.error(error);
    showStatus("Die Präsentationen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
  }
}

sortSelect.addEventListener("change", updateList);
searchInput.addEventListener("input", onSearchInput);
tagFiltersElement.addEventListener("change", onFilterChange);
languageFiltersElement.addEventListener("change", onFilterChange);
categoryFiltersElement.addEventListener("change", onFilterChange);
activeFilterChipsElement.addEventListener("click", onActiveFilterClick);
loadPresentations();
