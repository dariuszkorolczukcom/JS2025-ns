<template>
  <div class="star-rating">
    <span
      v-for="star in maxStars"
      :key="star"
      class="star"
      :class="{ 
        filled: star <= effectiveRating, 
        half: star - 0.5 === effectiveRating,
        clickable: !readonly
      }"
      @click="!readonly && handleStarClick(star)"
      @mouseenter="!readonly && (hoverRating = star)"
      @mouseleave="!readonly && (hoverRating = 0)"
    >
      ★
    </span>
    <span v-if="showValue" class="rating-value">{{ displayRating }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StarRating',
  props: {
    rating: {
      type: Number,
      required: true,
      default: 0
    },
    max: {
      type: Number,
      default: 5
    },
    readonly: {
      type: Boolean,
      default: true
    },
    showValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['rating-selected', 'update:rating'],
  data() {
    return {
      hoverRating: 0
    }
  },
  computed: {
    maxStars(): number {
      return this.max
    },
    displayRating(): string {
      return this.rating.toFixed(1)
    },
    effectiveRating(): number {
      return this.hoverRating || this.rating
    }
  },
  methods: {
    handleStarClick(star: number) {
      if (!this.readonly) {
        this.$emit('rating-selected', star)
        this.$emit('update:rating', star)
      }
    }
  }
})
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.star {
  font-size: 1.25rem;
  color: var(--bs-border-color);
  line-height: 1;
  transition: color 0.2s;
}

.star.clickable {
  cursor: pointer;
}

.star.clickable:hover {
  color: #ffc107;
  transform: scale(1.1);
}

.star.filled {
  color: #ffc107;
}

.star.half {
  background: linear-gradient(90deg, #ffc107 50%, var(--bs-border-color) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rating-value {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}
</style>

