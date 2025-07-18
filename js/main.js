const API_URL = "http://localhost:8000/api/v1/titles/";

// ---------- Meilleur film ----------
async function getBestMovie() {
  try {
    const response = await fetch(`${API_URL}?sort_by=-imdb_score`);
    const data = await response.json();

    const bestScore = parseFloat(data.results[0].imdb_score);
    const topMovies = data.results.filter(
      movie => parseFloat(movie.imdb_score) === bestScore
    );

    const randomMovie = topMovies[Math.floor(Math.random() * topMovies.length)];
    const detailsResponse = await fetch(randomMovie.url);
    const detailedMovie = await detailsResponse.json();

    displayBestMovie(detailedMovie);
  } catch (error) {
    console.error("Erreur lors du chargement du meilleur film :", error);
  }
}

function displayBestMovie(movie) {
  const container = document.querySelector("#best-movie .movie-featured");

  container.innerHTML = `
    <div class="left-side">
      <img src="${movie.image_url}" alt="${movie.title}">
    </div>
    <div class="right-side">
      <h2>${movie.title}</h2>
      <p>${movie.long_description || "Description non disponible."}</p>
      <button class="open-modal-button button-red">Détails</button>
    </div>
  `;

  const button = container.querySelector(".open-modal-button");
  button.addEventListener("click", () => openModal(movie));
}

// ---------- Modale ----------
function openModal(movie) {
  const modal = document.getElementById("modal");
  const content = modal.querySelector(".modal-content");

  content.innerHTML = `
    <img src="${movie.image_url}" alt="${movie.title}" style="height: 300px; margin-bottom: 10px;">
    <h2>${movie.title}</h2>
    <p><strong>Année :</strong> ${movie.year || "?"}</p>
    <p><strong>Genre :</strong> ${movie.genres.join(", ")}</p>
    <p><strong>Note IMDb :</strong> ${movie.imdb_score}</p>
    <p><strong>Réalisateur :</strong> ${movie.directors.join(", ")}</p>
    <p><strong>Acteurs :</strong> ${movie.actors.join(", ")}</p>
    <p><strong>Résumé :</strong> ${movie.long_description || "<em>Description non disponible</em>"}</p>
    <button class="close-button">Fermer</button>
  `;

  modal.classList.remove("hidden");

  const closeBtn = content.querySelector(".close-button");
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

// ---------- Carrousel générique ----------
async function loadCarousel(containerSelector, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    const carousel = document.querySelector(containerSelector);
    if (!carousel) {
      console.warn(`Élément non trouvé : ${containerSelector}`);
      return;
    }

    carousel.innerHTML = "";
    data.results.slice(0, 7).forEach(movie => {
      const img = document.createElement("img");
      img.src = movie.image_url;
      img.alt = movie.title;
      img.style.cursor = "pointer";

      img.addEventListener("click", async () => {
        const res = await fetch(movie.url);
        const details = await res.json();
        openModal(details);
      });

      carousel.appendChild(img);
    });
  } catch (error) {
    console.error(`Erreur lors du chargement du carrousel ${containerSelector} :`, error);
  }
}

// ---------- Genre dynamique ----------
async function fetchAllGenres() {
  const genres = [];
  let url = "http://localhost:8000/api/v1/genres/";

  while (url) {
    const response = await fetch(url);
    const data = await response.json();
    genres.push(...data.results);
    url = data.next;
  }

  return genres;
}

async function populateGenreSelect() {
  const select = document.getElementById("category-select");
  const genres = await fetchAllGenres();

  genres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre.name;
    option.textContent = genre.name;
    select.appendChild(option);
  });
}

function loadCategory(genre, carouselId) {
  const url = `${API_URL}?genre=${encodeURIComponent(genre)}&sort_by=-imdb_score`;
  loadCarousel(`#${carouselId}`, url);
}

function setupGenreChangeListener() {
  const select = document.getElementById("category-select");
  select.addEventListener("change", () => {
    const genre = select.value;
    loadCategory(genre, "category-3-carousel");
  });
}

// ---------- Initialisation ----------
document.addEventListener("DOMContentLoaded", () => {
  getBestMovie();
  loadCarousel("#top-rated .carousel", `${API_URL}?sort_by=-imdb_score`);
  loadCategory("Mystery", "category-1-carousel");
  loadCategory("Drama", "category-2-carousel");
  populateGenreSelect();
  setupGenreChangeListener();
});
