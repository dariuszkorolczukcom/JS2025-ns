<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    class="walkman-logo"
    aria-label="MusicWeb Walkman Logo"
  >
    <!-- Case (Minimal Frame) -->
    <rect x="10" y="10" width="80" height="80" class="walkman-case" />
    
    <!-- Cassette Window -->
    <rect x="20" y="25" width="60" height="40" class="cassette-window" />
    
    <!-- Tape Spools -->
    <g class="spools">
      <!-- Left Spool Group for Rotation -->
      <g class="spool-container left-spool-container">
        <circle cx="35" cy="45" r="8" class="spool" />
        <line x1="35" y1="37" x2="35" y2="53" class="spool-detail" />
        <line x1="27" y1="45" x2="43" y2="45" class="spool-detail" />
      </g>
      
      <!-- Right Spool Group for Rotation -->
      <g class="spool-container right-spool-container">
        <circle cx="65" cy="45" r="8" class="spool" />
        <line x1="65" y1="37" x2="65" y2="53" class="spool-detail" />
        <line x1="57" y1="45" x2="73" y2="45" class="spool-detail" />
      </g>
      
      <!-- Connecting tape -->
      <line x1="35" y1="45" x2="65" y2="45" class="tape-line" />
    </g>
    
    <!-- Controls -->
    <rect x="92" y="20" width="6" height="10" class="button" />
    <rect x="92" y="35" width="6" height="10" class="button" />
    <rect x="92" y="50" width="6" height="10" class="button" />

    <!-- Jack -->
    <circle cx="25" cy="18" r="3" class="jack" />
  </svg>
</template>

<style scoped>
.walkman-logo {
  width: 40px;
  height: 40px;
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
  color: var(--primary-color); /* Inherit primary color */
}

.walkman-case {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
}

.cassette-window {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.spool {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.spool-detail {
  stroke: currentColor;
  stroke-width: 2;
}

.tape-line {
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0.5;
}

.button {
  fill: currentColor;
}

.jack {
  fill: currentColor;
}

/* Animation setup */
.spool-container {
  transform-box: fill-box;
  transform-origin: center;
}

.walkman-logo:hover .left-spool-container {
  animation: spin 2s linear infinite;
}

.walkman-logo:hover .right-spool-container {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
