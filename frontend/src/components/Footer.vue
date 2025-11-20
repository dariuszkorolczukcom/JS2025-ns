<template>
  <footer class="mt-auto py-3">
    <div class="container text-center">
      <p class="footer-text mb-0">
        MUSICWEB <span class="mx-2">•</span> EST. 2025 <span class="mx-2">•</span> Designed by <br> Dariusz Korolczuk <span class="mx-2">•</span> Bartosz Regucki <span class="mx-2">•</span> Adrian Mogielnicki
      </p>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Footer',
})
</script>

<style scoped>
footer {
  background-color: var(--bg-color);
  color: var(--text-color);
  border-top: 1px solid var(--bs-border-color);
}

.footer-text {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
  opacity: 0.8;
}
</style>
