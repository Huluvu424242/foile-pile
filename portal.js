const INDEX_URL = "index.json";
const SEARCH_DEBOUNCE_MS = 120;
const SLIDES_FILE_NAME = "slides.json";
const MANIFEST_FILE_NAME = "manifest.json";
const VIEWER_BASE_URL = "https://huluvu424242.github.io/sld-slideshow-viewer/";
const EXTRA_FOLDER_NAME = ".extra";

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
const crc32Table = createCrc32Table();

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

function buildDownloadContract(presentation) {
  const files = presentation?.files;
  const basePath = typeof presentation?.path === "string" ? presentation.path.trim() : "";
  const slug = basePath.split("/").filter(Boolean).pop();
  if (!basePath || !slug) {
    return { isValid: false, reason: "Fehlender Präsentationspfad im Suchindex." };
  }

  const manifestPath = typeof files?.manifest === "string" ? files.manifest.trim() : "";
  const slidesPath = typeof files?.slides === "string" ? files.slides.trim() : "";
  if (!manifestPath.endsWith(MANIFEST_FILE_NAME) || !slidesPath.endsWith(SLIDES_FILE_NAME)) {
    return { isValid: false, reason: "Download nicht verfügbar (fehlende Kern-Dateien im Suchindex)." };
  }

  try {
    return {
      isValid: true,
      slug,
      basePath,
      manifestUrl: new URL(manifestPath, window.location.href).href,
      slidesUrl: new URL(slidesPath, window.location.href).href,
    };
  } catch (_error) {
    return { isValid: false, reason: "Download nicht verfügbar (ungültige Dateipfade)." };
  }
}

function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc >>> 0;
  }
  return table;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function normalizeRelativePath(path, basePath) {
  if (typeof path !== "string" || !path.trim()) {
    return null;
  }
  if (path.includes("://")) {
    return null;
  }

  const cleaned = path.replace(/\\/g, "/").trim();
  const absolute = cleaned.startsWith("/")
    ? cleaned.slice(1)
    : cleaned.startsWith(`${basePath}/`) || cleaned === basePath
      ? cleaned
      : `${basePath}/${cleaned}`;
  const normalizedSegments = [];
  absolute.split("/").forEach((segment) => {
    if (!segment || segment === ".") {
      return;
    }
    if (segment === "..") {
      normalizedSegments.pop();
      return;
    }
    normalizedSegments.push(segment);
  });

  const normalized = normalizedSegments.join("/");
  return normalized.startsWith(basePath) ? normalized : null;
}

function isPathExcludedFromExport(path, basePath) {
  const prefix = `${basePath}/`;
  if (typeof path !== "string" || !path.startsWith(prefix)) {
    return false;
  }

  const relativePath = path.slice(prefix.length);
  return relativePath.split("/").includes(EXTRA_FOLDER_NAME);
}

function collectSlideReferences(slidesData, basePath) {
  const refs = new Set();
  const slides = Array.isArray(slidesData?.slides) ? slidesData.slides : [];

  slides.forEach((slide) => {
    if (!slide || typeof slide !== "object") {
      return;
    }
    Object.values(slide).forEach((value) => {
      if (typeof value !== "string") {
        return;
      }
      const normalized = normalizeRelativePath(value, basePath);
      if (normalized) {
        refs.add(normalized);
      }
    });
  });

  return refs;
}

async function fetchJson(url, purpose) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${purpose}: HTTP ${response.status}`);
  }
  return response.json();
}

function formatValidationIssues(title, issues) {
  if (!issues.length) {
    return title;
  }
  return `${title}\n${issues.map((issue) => `- ${issue}`).join("\n")}`;
}

function resolveChecksumEntries(manifest, basePath) {
  const source = manifest?.checksums || manifest?.integrity;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return new Map();
  }

  const checksums = new Map();
  Object.entries(source).forEach(([rawPath, rawChecksum]) => {
    if (typeof rawChecksum !== "string" || !rawChecksum.trim()) {
      return;
    }

    const normalizedPath = normalizeRelativePath(rawPath, basePath);
    if (!normalizedPath) {
      return;
    }

    const parsed = rawChecksum.trim().match(/^(?:(sha256):)?([a-f0-9]{64})$/i);
    if (!parsed) {
      return;
    }

    checksums.set(normalizedPath, parsed[2].toLowerCase());
  });

  return checksums;
}

async function sha256Hex(data) {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

async function createPresentationZip(downloadContract, presentation) {
  const manifest = await fetchJson(downloadContract.manifestUrl, "Manifest laden fehlgeschlagen");
  const slides = await fetchJson(downloadContract.slidesUrl, "Slides laden fehlgeschlagen");
  const basePath = downloadContract.basePath;

  const fileSet = new Set();
  const exportList = Array.isArray(presentation.files?.export) ? presentation.files.export : [];
  exportList.forEach((path) => {
    const normalized = normalizeRelativePath(path, basePath);
    if (normalized && !isPathExcludedFromExport(normalized, basePath)) {
      fileSet.add(normalized);
    }
  });

  if (fileSet.size === 0) {
    fileSet.add(`${basePath}/${MANIFEST_FILE_NAME}`);
    fileSet.add(`${basePath}/${SLIDES_FILE_NAME}`);
    collectSlideReferences(slides, basePath).forEach((path) => {
      if (!isPathExcludedFromExport(path, basePath)) {
        fileSet.add(path);
      }
    });
  }

  const files = [];
  const missingFiles = [];
  for (const path of fileSet) {
    let response;
    try {
      response = await fetch(path);
    } catch (_error) {
      missingFiles.push(`${path} (Netzwerkfehler)`);
      continue;
    }

    if (!response.ok) {
      missingFiles.push(`${path} (HTTP ${response.status})`);
      continue;
    }

    files.push({ path, data: new Uint8Array(await response.arrayBuffer()) });
  }

  if (missingFiles.length) {
    throw new Error(
      formatValidationIssues(
        "Integritätsprüfung fehlgeschlagen. Die Präsentation ist unvollständig:",
        missingFiles,
      ),
    );
  }

  const checksums = resolveChecksumEntries(manifest, basePath);
  if (checksums.size > 0) {
    const fileMap = new Map(files.map((file) => [file.path, file.data]));
    const checksumIssues = [];
    for (const [path, expected] of checksums.entries()) {
      if (path === `${basePath}/${MANIFEST_FILE_NAME}` || isPathExcludedFromExport(path, basePath)) {
        continue;
      }

      const fileData = fileMap.get(path);
      if (!fileData) {
        checksumIssues.push(`${path} (Prüfsumme vorhanden, Datei fehlt)`);
        continue;
      }

      const actual = await sha256Hex(fileData);
      if (actual !== expected) {
        checksumIssues.push(`${path} (Prüfsumme ungültig)`);
      }
    }

    if (checksumIssues.length) {
      throw new Error(
        formatValidationIssues(
          "Integritätsprüfung fehlgeschlagen. Prüfsummen stimmen nicht:",
          checksumIssues,
        ),
      );
    }
  }

  return createStoredZip(files);
}

function createStoredZip(files) {
  const fileRecords = files.map((file) => {
    const nameBytes = new TextEncoder().encode(file.path);
    return { ...file, nameBytes, crc: crc32(file.data) };
  });

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  fileRecords.forEach((file) => {
    const localHeader = new ArrayBuffer(30);
    const localView = new DataView(localHeader);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, file.crc, true);
    localView.setUint32(18, file.data.length, true);
    localView.setUint32(22, file.data.length, true);
    localView.setUint16(26, file.nameBytes.length, true);
    localView.setUint16(28, 0, true);

    const localBlob = new Uint8Array(30 + file.nameBytes.length + file.data.length);
    localBlob.set(new Uint8Array(localHeader), 0);
    localBlob.set(file.nameBytes, 30);
    localBlob.set(file.data, 30 + file.nameBytes.length);
    localParts.push(localBlob);

    const centralHeader = new ArrayBuffer(46);
    const centralView = new DataView(centralHeader);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, file.crc, true);
    centralView.setUint32(20, file.data.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, file.nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);

    const centralBlob = new Uint8Array(46 + file.nameBytes.length);
    centralBlob.set(new Uint8Array(centralHeader), 0);
    centralBlob.set(file.nameBytes, 46);
    centralParts.push(centralBlob);

    offset += localBlob.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = new ArrayBuffer(22);
  const endView = new DataView(endHeader);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, fileRecords.length, true);
  endView.setUint16(10, fileRecords.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, new Uint8Array(endHeader)], { type: "application/zip" });
}

function triggerBlobDownload(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

async function handleDownloadClick(event) {
  const button = event.target.closest(".download-action");
  if (!button || button.disabled) {
    return;
  }

  const { slug, basePath, manifestUrl, slidesUrl, title } = button.dataset;
  if (!slug || !basePath || !manifestUrl || !slidesUrl) {
    console.error("Download-Konfiguration unvollständig.");
    return;
  }

  const presentation = loadedPresentations.find((item) => item.path === basePath);
  if (!presentation) {
    return;
  }

  button.disabled = true;
  button.textContent = "Erzeuge .sld …";
  try {
    const zipBlob = await createPresentationZip({ slug, basePath, manifestUrl, slidesUrl }, presentation);
    triggerBlobDownload(zipBlob, `${slug}.sld`);
    button.textContent = ".sld herunterladen";
  } catch (error) {
    console.error(error);
    const displayTitle = title || slug;
    window.alert(`Download für "${displayTitle}" fehlgeschlagen: ${error.message}`);
    button.textContent = "Erneut versuchen";
  } finally {
    button.disabled = false;
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
      const downloadContract = buildDownloadContract(presentation);
      const downloadAction = downloadContract.isValid
        ? `
          <button
            class="download-action"
            type="button"
            data-slug="${escapeHtml(downloadContract.slug)}"
            data-base-path="${escapeHtml(downloadContract.basePath)}"
            data-manifest-url="${escapeHtml(downloadContract.manifestUrl)}"
            data-slides-url="${escapeHtml(downloadContract.slidesUrl)}"
            data-title="${escapeHtml(title)}"
            aria-label="${escapeHtml(title)} als .sld herunterladen"
          >
            .sld herunterladen
          </button>
        `
        : `
          <button class="download-action download-action--disabled" type="button" disabled aria-disabled="true">
            Download nicht verfügbar
          </button>
        `;

      return `
        <li class="presentation-card">
          <h2>${highlightMatches(title, queryTokens)}</h2>
          <p>${highlightMatches(description, queryTokens)}</p>
          <p class="presentation-meta">Bereich/Kategorie: <strong>${highlightMatches(category, queryTokens)}</strong></p>
          <div class="tags">${renderTags(presentation.tags, queryTokens)}</div>
          <div class="presentation-actions">
            ${viewAction}
            ${downloadAction}
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
listElement.addEventListener("click", (event) => {
  handleDownloadClick(event);
});
loadPresentations();
