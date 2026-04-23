const INDEX_URL = "index.json";

const sortSelect = document.getElementById("sort-select");
const listElement = document.getElementById("presentation-list");
const statusElement = document.getElementById("status-message");

let loadedPresentations = [];

function showStatus(message) {
  statusElement.textContent = message;
  statusElement.hidden = false;
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

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '<span class="tag">Keine Tags</span>';
  }

  return tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function renderList(presentations) {
  if (!Array.isArray(presentations) || presentations.length === 0) {
    showStatus("Aktuell sind keine Präsentationen verfügbar.");
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
          <h2><a class="viewer-link" href="${viewerPath}">${title}</a></h2>
          <p>${description}</p>
          <p class="presentation-meta">Bereich/Kategorie: <strong>${category}</strong></p>
          <div class="tags">${renderTags(presentation.tags)}</div>
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

function updateList() {
  const selectedSort = sortSelect.value;
  const sorted = sortPresentations(loadedPresentations, selectedSort);
  renderList(sorted);
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
    updateList();
  } catch (error) {
    console.error(error);
    showStatus("Die Präsentationen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
  }
}

sortSelect.addEventListener("change", updateList);
loadPresentations();
