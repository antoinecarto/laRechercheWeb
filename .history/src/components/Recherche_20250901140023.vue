<template>
  <div>
    <h1>Recherche</h1>
    <p>Bienvenue sur la page de recherche !</p>

    <!-- Container pour le canvas p5.js -->
    <div class="p5-container">
      <!-- Compteur de temps et informations -->
      <div class="info-panel">
        <div class="time-info">
          <div class="time-display">
            <span class="label">Temps écoulé:</span>
            <span class="time">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="time-display">
            <span class="label">Temps total estimé:</span>
            <span class="time">{{ formatTime(totalEstimatedTime) }}</span>
          </div>
          <div class="time-display">
            <span class="label">Temps restant:</span>
            <span class="time">{{ formatTime(remainingTime) }}</span>
          </div>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
          <span class="progress-text"
            >{{ Math.round(progressPercent) }}% ({{ index }}/{{
              totalWords
            }})</span
          >
        </div>
      </div>

      <!-- Contrôle de vitesse -->
      <div class="speed-control" v-if="isTextLoaded">
        <label for="speed-slider" class="speed-label">
          Vitesse de défilement:
          <strong>{{ currentSpeed.toFixed(1) }} mots/sec</strong>
        </label>
        <input
          id="speed-slider"
          type="range"
          min="0.2"
          max="10"
          step="0.1"
          :value="currentSpeed"
          @input="updateSpeed"
          class="speed-slider"
        />
        <div class="speed-marks">
          <span>Lent (0.2)</span>
          <span>Normal (3)</span>
          <span>Rapide (10)</span>
        </div>
      </div>

      <!-- Message d'erreur si le fichier ne peut pas être chargé -->
      <div v-if="loadError" class="error-message">
        <h3>⚠️ Attention</h3>
        <p>{{ loadError }}</p>
        <p>
          <strong>Solution:</strong> Placez le fichier
          <code>proust.txt</code> dans le dossier <code>public/</code> de votre
          projet Vue.js
        </p>
      </div>

      <div ref="p5Container" class="canvas-wrapper"></div>

      <!-- Contrôles optionnels -->
      <div class="controls" v-if="isTextLoaded">
        <button @click="restartAnimation" class="btn-restart">
          Recommencer
        </button>
        <button @click="togglePause" class="btn-pause">
          {{ isPaused ? "Reprendre" : "Pause" }}
        </button>
      </div>

      <p class="instructions" v-if="isTextLoaded">
        Le texte s'affiche mot par mot. Appuyez sur une touche ou utilisez les
        boutons pour contrôler l'animation.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";

// Variables réactives Vue
const p5Container = ref(null);
const isPaused = ref(false);
const currentSpeed = ref(3.0); // mots par seconde
const startTime = ref(null);
const elapsedTime = ref(0);

// Variables p5.js
let p5Instance = null;
let words = [];
let index = 0;
let lastWordTime = 0;
let proustText = "";
let isTextLoaded = ref(false);
let loadError = ref(null);

// Variables calculées
const totalWords = computed(() => words.length);
const totalEstimatedTime = computed(() => {
  return totalWords.value > 0 ? totalWords.value / currentSpeed.value : 0;
});
const remainingTime = computed(() => {
  const remaining = totalWords.value - index;
  return remaining > 0 ? remaining / currentSpeed.value : 0;
});
const progressPercent = computed(() => {
  return totalWords.value > 0 ? (index / totalWords.value) * 100 : 0;
});

// Fonction pour charger le fichier texte
const loadTextFile = async () => {
  try {
    loadError.value = null;
    isTextLoaded.value = false;

    const response = await fetch("/proust.txt");
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    proustText = await response.text();
    words = proustText.split(/\s+/).filter((word) => word.length > 0);
    isTextLoaded.value = true;

    console.log(`Texte chargé: ${words.length} mots`);
  } catch (error) {
    console.error("Erreur lors du chargement du fichier:", error);
    loadError.value = `Impossible de charger le fichier proust.txt: ${error.message}`;

    // Fallback vers un texte par défaut
    proustText =
      "Longtemps je me suis couché de bonne heure. Parfois à peine ma bougie éteinte mes yeux se fermaient si vite que je n'avais pas le temps de me dire je m'endors. Et une demi-heure après la pensée qu'il était temps de chercher le sommeil m'éveillait je voulais poser le volume que je croyais avoir encore dans les mains et souffler ma lumière.";
    words = proustText.split(/\s+/).filter((word) => word.length > 0);
    isTextLoaded.value = true;
  }
};

// Fonctions de contrôle
const restartAnimation = () => {
  index = 0;
  isPaused.value = false;
  startTime.value = Date.now();
  elapsedTime.value = 0;
  if (p5Instance) {
    p5Instance.frameRate(currentSpeed.value);
    p5Instance.loop();
  }
};

const togglePause = () => {
  if (p5Instance) {
    if (isPaused.value) {
      p5Instance.loop();
      startTime.value = Date.now() - elapsedTime.value * 1000;
    } else {
      p5Instance.noLoop();
    }
    isPaused.value = !isPaused.value;
  }
};

const updateSpeed = (event) => {
  currentSpeed.value = parseFloat(event.target.value);
  if (p5Instance) {
    p5Instance.frameRate(currentSpeed.value);
  }
};

const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
};

// Timer pour mettre à jour le temps écoulé
let timeInterval = null;

// Fonction p5.js sketch
const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(800, 400);
    canvas.parent(p5Container.value);

    p.frameRate(currentSpeed.value);
    p.textAlign(p.CENTER, p.CENTER);

    // Initialiser le timer seulement si le texte est chargé
    if (isTextLoaded.value) {
      startTime.value = Date.now();
      lastWordTime = p.millis();
    }
  };

  p.draw = () => {
    p.background(20, 20, 40);

    // Afficher un message de chargement si le texte n'est pas encore chargé
    if (!isTextLoaded.value) {
      p.fill(255, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);

      if (loadError.value) {
        p.fill(255, 100, 100);
        p.text("Erreur de chargement", p.width / 2, p.height / 2 - 20);
        p.textSize(16);
        p.text(
          "Utilisation du texte par défaut",
          p.width / 2,
          p.height / 2 + 20
        );
      } else {
        p.text("Chargement du texte...", p.width / 2, p.height / 2);
      }
      return;
    }

    p.fill(255, 255, 255);

    // Mettre à jour le temps écoulé si pas en pause
    if (!isPaused.value && startTime.value) {
      elapsedTime.value = (Date.now() - startTime.value) / 1000;
    }

    // Taille de texte responsive
    const textSize = Math.min(p.width / 12, 64);
    p.textSize(textSize);

    if (index < words.length) {
      // Calculer si c'est le moment de passer au mot suivant
      const currentTime = p.millis();
      const wordInterval = 1000 / currentSpeed.value; // milliseconds per word

      if (currentTime - lastWordTime >= wordInterval) {
        index++;
        lastWordTime = currentTime;
      }

      // Effet de fade in basé sur le temps depuis le dernier mot
      const timeSinceLastWord = currentTime - lastWordTime;
      const fadeProgress = Math.min(
        timeSinceLastWord / (wordInterval * 0.3),
        1
      );
      const alpha = p.map(fadeProgress, 0, 1, 50, 255);

      p.fill(255, 255, 255, alpha);
      p.text(
        words[Math.min(index, words.length - 1)],
        p.width / 2,
        p.height / 2
      );

      // Afficher le mot suivant en transparence
      if (index < words.length - 1) {
        p.fill(100, 100, 150, 50);
        p.textSize(textSize * 0.6);
        p.text(words[index + 1], p.width / 2, p.height / 2 + 80);
      }
    } else if (words.length > 0) {
      // Message de fin
      p.textSize(Math.min(p.width / 20, 32));
      p.fill(150, 255, 150);
      p.text("Lecture terminée !", p.width / 2, p.height / 2 - 30);
      p.textSize(Math.min(p.width / 30, 20));
      p.fill(200, 200, 255);
      p.text(
        `Temps total: ${formatTime(elapsedTime.value)}`,
        p.width / 2,
        p.height / 2 + 10
      );
      p.text(
        "Cliquez sur 'Recommencer' pour relire",
        p.width / 2,
        p.height / 2 + 40
      );

      // Arrêter l'animation
      p.noLoop();
    }
  };

  p.keyPressed = () => {
    if (isTextLoaded.value) {
      restartAnimation();
    }
  };

  // Responsive canvas
  p.windowResized = () => {
    const containerWidth = p5Container.value?.clientWidth || 800;
    p.resizeCanvas(Math.min(containerWidth, 800), 400);
  };
};

onMounted(async () => {
  // Charger le fichier texte d'abord
  await loadTextFile();

  // Import dynamique de p5.js
  const p5 = (await import("p5")).default;

  // Créer l'instance p5.js
  p5Instance = new p5(sketch);

  // Démarrer le timer pour mettre à jour le temps écoulé
  timeInterval = setInterval(() => {
    if (!isPaused.value && startTime.value && isTextLoaded.value) {
      elapsedTime.value = (Date.now() - startTime.value) / 1000;
    }
  }, 100); // Update every 100ms for smooth display
});

onUnmounted(() => {
  // Nettoyer l'instance p5.js
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }

  // Nettoyer le timer
  if (timeInterval) {
    clearInterval(timeInterval);
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

.info-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.time-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
}

.time-display .label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.time-display .time {
  font-size: 1.25rem;
  font-weight: bold;
  color: #007bff;
}

.progress-bar {
  position: relative;
  background: #e9ecef;
  border-radius: 20px;
  height: 30px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #007bff, #0056b3);
  height: 100%;
  border-radius: 20px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.speed-control {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.speed-label {
  display: block;
  text-align: center;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1rem;
}

.speed-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e9ecef;
  outline: none;
  margin-bottom: 0.5rem;
  cursor: pointer;
  -webkit-appearance: none;
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.speed-slider::-webkit-slider-thumb:hover {
  background: #0056b3;
  transform: scale(1.1);
}

.speed-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.speed-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6c757d;
  padding: 0 10px;
}

.error-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: #856404;
}

.error-message h3 {
  margin-top: 0;
  color: #b45309;
}

.error-message code {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: "Courier New", monospace;
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
