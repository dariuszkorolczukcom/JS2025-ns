<template>
  <main>
    <div class="about-container">
      <!-- Project Description -->
      <section class="about-section mb-5">
        <h1 class="page-title mb-4">O projekcie</h1>
        <div class="about-content">
          <p class="lead">
            MusicWeb to aplikacja do zarządzania biblioteką muzyczną, inspirowana serwisem Filmweb.
            Pozwala użytkownikom na przeglądanie, dodawanie i ocenianie utworów muzycznych.
          </p>
          <p>
            Projekt został stworzony w ramach zajęć z przedmiotu JavaScript 2025. Aplikacja umożliwia
            kompleksowe zarządzanie kolekcją muzyczną, w tym dodawanie utworów, albumów i artystów,
            a także tworzenie opinii i ocen.
          </p>
        </div>
      </section>

      <!-- Authors Section -->
      <section class="authors-section mb-5">
        <h2 class="section-title mb-4">Autorzy</h2>
        <div class="authors-grid">
          <div class="author-card">
            <h3>Dariusz Korolczuk</h3>
            <p>Członek zespołu</p>
          </div>
          <div class="author-card">
            <h3>Adrian Mogielnicki</h3>
            <p>Członek zespołu</p>
          </div>
          <div class="author-card">
            <h3>Bartosz Regucki</h3>
            <p>Członek zespołu</p>
          </div>
        </div>
      </section>

      <!-- Technologies Section -->
      <section class="technologies-section">
        <h2 class="section-title mb-4">Technologie</h2>
        <div class="tech-grid">
          <div class="tech-item">
            <h3>Frontend</h3>
            <ul>
              <li>Vue 3</li>
              <li>TypeScript</li>
              <li>Vite</li>
              <li>Vue Router</li>
              <li>Bootstrap 5</li>
              <li>Axios</li>
            </ul>
          </div>
          <div class="tech-item">
            <h3>Backend</h3>
            <ul>
              <li>Node.js</li>
              <li>Express</li>
              <li>TypeScript</li>
              <li>PostgreSQL</li>
              <li>Passport.js (JWT)</li>
              <li>bcryptjs</li>
            </ul>
          </div>
          <div class="tech-item">
            <h3>Infrastruktura</h3>
            <ul>
              <li>Docker</li>
              <li>Docker Compose</li>
              <li>Nginx</li>
              <li>PostgreSQL</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section mt-5">
        <h2 class="section-title mb-4">Funkcjonalności</h2>
        <div class="features-list">
          <div class="feature-row">
            <h3>Zarządzanie użytkownikami</h3>
            <p>System rejestracji, logowania i zarządzania uprawnieniami (ADMIN, EDITOR, USER).</p>
          </div>
          <div class="feature-row">
            <h3>Biblioteka muzyczna</h3>
            <p>Dodawanie, edycja i usuwanie utworów muzycznych z informacjami o artyście, albumie, roku i gatunku.</p>
          </div>
          <div class="feature-row">
            <h3>System opinii</h3>
            <p>Tworzenie i zarządzanie opiniami o utworach muzycznych z oceną w skali 1-5.</p>
          </div>
          <div class="feature-row">
            <h3>Autoryzacja</h3>
            <p>System uprawnień oparty na rolach i JWT tokenach.</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 2.5rem;
  font-weight: 700;
  border-bottom: 3px solid var(--bs-border-color);
  padding-bottom: 1rem;
}

.about-section {
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--bs-border-color);
}

.about-content {
  line-height: 1.8;
}

.about-content .lead {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.section-title {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--bs-border-color);
  padding-bottom: 0.5rem;
}

.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.author-card {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
  text-align: center;
}

.author-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.author-card p {
  margin: 0;
  color: var(--secondary-color);
  font-size: 0.9rem;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.tech-item {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.tech-item h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--bs-border-color);
  padding-bottom: 0.5rem;
}

.tech-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tech-item li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--bs-border-color);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.tech-item li:last-child {
  border-bottom: none;
}

.features-list {
  margin-top: 2rem;
}

.feature-row {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
  margin-bottom: 1rem;
}

.feature-row h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.feature-row p {
  margin: 0;
  line-height: 1.6;
  color: var(--secondary-color);
}
</style>
