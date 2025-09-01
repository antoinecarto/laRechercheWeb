<template>
  <div>
    <h1>Recherche</h1>
    <p>Bienvenue sur la page de recherche !</p>

    <!-- Container pour le canvas p5.js -->
    <div class="p5-container">
      <div ref="p5Container" class="canvas-wrapper"></div>

      <!-- Contrôles optionnels -->
      <div class="controls">
        <button @click="restartAnimation" class="btn-restart">
          Recommencer
        </button>
        <button @click="togglePause" class="btn-pause">
          {{ isPaused ? "Reprendre" : "Pause" }}
        </button>
      </div>

      <p class="instructions">
        Le texte s'affiche mot par mot. Appuyez sur une touche ou utilisez les
        boutons pour contrôler l'animation.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// Variables réactives Vue
const p5Container = ref(null);
const isPaused = ref(false);

// Variables p5.js
let p5Instance = null;
let words = [];
let index = 0;
let proustText =
  "Longtemps je me suis couché de bonne heure. Parfois à peine ma bougie éteinte mes yeux se fermaient si vite que je n'avais pas le temps de me dire je m'endors. Et une demi-heure après la pensée qu'il était temps de chercher le sommeil m'éveillait je voulais poser le volume que je croyais avoir encore dans les mains et souffler ma lumière. J'avais continué en dormant à faire des réflexions sur ce que je venais de lire mais ces réflexions avaient pris un tour un peu particulier.";

// Fonctions de contrôle
const restartAnimation = () => {
  index = 0;
  isPaused.value = false;
  if (p5Instance) {
    p5Instance.loop();
  }
};

const togglePause = () => {
  if (p5Instance) {
    if (isPaused.value) {
      p5Instance.loop();
    } else {
      p5Instance.noLoop();
    }
    isPaused.value = !isPaused.value;
  }
};

// Fonction p5.js sketch
const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(800, 400);
    canvas.parent(p5Container.value);

    words = proustText.split(" ");
    p.frameRate(3);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
    p.background(20, 20, 40);
    p.fill(255, 255, 255);

    // Taille de texte responsive
    const textSize = Math.min(p.width / 12, 64);
    p.textSize(textSize);

    if (index < words.length) {
      // Effet de fade in
      const alpha = p.map(p.frameCount % 60, 0, 30, 0, 255);
      p.fill(255, 255, 255, Math.min(alpha, 255));

      p.text(words[index], p.width / 2, p.height / 2);

      if (p.frameCount % 20 === 0) {
        // Change word every 20 frames at 3fps
        index++;
      }
    } else {
      // Message de fin
      p.textSize(Math.min(p.width / 20, 32));
      p.fill(150, 150, 255);
      p.text("Fin du texte", p.width / 2, p.height / 2 - 30);
      p.textSize(Math.min(p.width / 30, 20));
      p.text(
        "Cliquez sur 'Recommencer' pour relire",
        p.width / 2,
        p.height / 2 + 30
      );
    }
  };

  p.keyPressed = () => {
    restartAnimation();
  };

  // Responsive canvas
  p.windowResized = () => {
    const containerWidth = p5Container.value?.clientWidth || 800;
    p.resizeCanvas(Math.min(containerWidth, 800), 400);
  };
};

onMounted(async () => {
  // Import dynamique de p5.js
  const p5 = (await import("p5")).default;

  // Créer l'instance p5.js
  p5Instance = new p5(sketch);
});

onUnmounted(() => {
  // Nettoyer l'instance p5.js
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }
});
</script>

<style scoped>
.p5-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-restart,
.btn-pause {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-restart {
  background: #007bff;
  color: white;
}

.btn-restart:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-pause {
  background: #6c757d;
  color: white;
}

.btn-pause:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.instructions {
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .p5-container {
    margin: 1rem 0;
    padding: 1rem;
  }

  .controls {
    flex-direction: column;
    align-items: center;
  }

  .btn-restart,
  .btn-pause {
    width: 200px;
  }
}
</style>
