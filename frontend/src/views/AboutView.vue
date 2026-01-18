<template>
  <main>
    <div class="about-container">
      <!-- Project Description -->
      <section class="about-section mb-5">
        <h1 class="page-title mb-4">About the Project</h1>
        <div class="about-content">
          <p class="lead">
            MusicWeb is a music library management application, inspired by Filmweb.
            It allows users to browse, add and rate music tracks.
          </p>
          <p>
            The project was created as part of the JavaScript 2025 course. The application enables
            comprehensive music collection management, including adding songs, albums and artists,
            as well as creating reviews and ratings.
          </p>
        </div>
      </section>

      <!-- Authors Section -->
      <section class="authors-section mb-5">
        <h2 class="section-title mb-4">Authors</h2>
        <div class="authors-grid">
          <div class="author-card">
            <h3>Dariusz Korolczuk</h3>
            <p>Team Member</p>
          </div>
          <div class="author-card">
            <h3>Adrian Mogielnicki</h3>
            <p>Team Member</p>
          </div>
          <div class="author-card">
            <h3>Bartosz Regucki</h3>
            <p>Team Member</p>
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
        <h2 class="section-title mb-4">Features</h2>
        <div class="features-list">
          <div class="feature-row">
            <h3>User Management</h3>
            <p>Registration, login and permission management system (ADMIN, EDITOR, USER).</p>
          </div>
          <div class="feature-row">
            <h3>Music Library</h3>
            <p>Adding, editing and deleting music tracks with information about artist, album, year and genre.</p>
          </div>
          <div class="feature-row">
            <h3>Review System</h3>
            <p>Creating and managing reviews of music tracks with a 1-5 rating scale.</p>
          </div>
          <div class="feature-row">
            <h3>Authorization</h3>
            <p>Role-based permission system with JWT tokens.</p>
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
