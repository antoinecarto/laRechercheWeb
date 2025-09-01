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
          <span class="progress-text">
            {{ Math.round(progressPercent) }}% ({{ index }}/{{ totalWords }})
          </span>
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
          min="1"
          max="50"
          step="0.1"
          :value="currentSpeed"
          @input="updateSpeed"
          class="speed-slider"
        />
        <div class="speed-marks">
          <span>Lent (1)</span>
          <span>Normal (3)</span>
          <span>Rapide (50)</span>
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

      <div
        ref="p5Container"
        class="canvas-wrapper"
        @click="toggleFullscreen"
        style="cursor: pointer"
      ></div>

      <!-- Contrôles optionnels -->
      <div class="controls" v-if="isTextLoaded">
        <button @click="startAnimation" class="btn-start">
          {{ !hasStarted ? "Démarrer" : "Recommencer" }}
        </button>
        <button v-if="hasStarted" @click="togglePause" class="btn-pause">
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
import { ref, computed, onMounted, onUnmounted } from "vue";

// Ajouter cette variable réactive
const hasStarted = ref(false);

// Variables réactives Vue
const p5Container = ref(null);
const isPaused = ref(false);
const currentSpeed = ref(3.0); // mots par seconde
const startTime = ref(null);
const elapsedTime = ref(0);

// Variables p5.js
let p5Instance = null;
const words = ref([]);
const index = ref(0);
let lastWordTime = 0;
let proustText = "";
const isTextLoaded = ref(false);
const loadError = ref(null);

// Variables calculées
const totalWords = computed(() => words.value.length);
const totalEstimatedTime = computed(() =>
  totalWords.value > 0 ? totalWords.value / currentSpeed.value : 0
);
const remainingTime = computed(() =>
  totalWords.value > 0
    ? (totalWords.value - index.value) / currentSpeed.value
    : 0
);
const progressPercent = computed(() =>
  totalWords.value > 0 ? (index.value / totalWords.value) * 100 : 0
);

// Fonction pour charger le fichier texte
const loadTextFile = async () => {
  try {
    loadError.value = null;
    isTextLoaded.value = false;

    const response = await fetch("/proust.txt");
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

    proustText = await response.text();
    words.value = proustText.split(/\s+/).filter((word) => word.length > 0);
    isTextLoaded.value = true;

    console.log(`Texte chargé: ${words.value.length} mots`);
  } catch (error) {
    console.error("Erreur lors du chargement du fichier:", error);
    loadError.value = `Impossible de charger le fichier proust.txt: ${error.message}`;

    // Fallback texte par défaut
    proustText =
      "Longtemps je me suis couché de bonne heure... sans avoir chargé le fichier !";
    words.value = proustText.split(/\s+/).filter((word) => word.length > 0);
    isTextLoaded.value = true;
  }
};

// Plein écran
const toggleFullscreen = async () => {
  const elem = p5Container.value;
  if (!elem) return;

  if (!document.fullscreenElement) {
    try {
      await elem.requestFullscreen();
    } catch (err) {
      console.error("Erreur lors du passage en plein écran:", err);
    }
  } else {
    try {
      await document.exitFullscreen();
    } catch (err) {
      console.error("Erreur lors de la sortie du plein écran:", err);
    }
  }
};

// Fonction pour démarrer ou recommencer
const startAnimation = () => {
  index.value = 0;
  isPaused.value = false;
  startTime.value = Date.now();
  elapsedTime.value = 0;
  hasStarted.value = true;

  if (p5Instance) {
    p5Instance.frameRate(currentSpeed.value);
    p5Instance.loop();
  }
};

// Fonctions de contrôle
const restartAnimation = () => {
  startAnimation();
};

const togglePause = () => {
  if (!p5Instance) return;
  if (isPaused.value) {
    p5Instance.loop();
    startTime.value = Date.now() - elapsedTime.value * 1000;
  } else {
    p5Instance.noLoop();
  }
  isPaused.value = !isPaused.value;
};

const updateSpeed = (event) => {
  currentSpeed.value = parseFloat(event.target.value);
  if (p5Instance) p5Instance.frameRate(currentSpeed.value);
};

const formatTime = (seconds) => {
  const days = Math.floor(seconds / 86400); // 24*3600
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (days > 0 || hrs > 0) parts.push(`${hrs}h`);
  if (days > 0 || hrs > 0 || mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
};

// Timer pour mettre à jour le temps écoulé
let timeInterval = null;

// Sketch p5.js
const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(800, 400);
    canvas.parent(p5Container.value);
    p.frameRate(currentSpeed.value);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
    p.background(0);

    if (!isTextLoaded.value) {
      p.fill(loadError.value ? [255, 100, 100] : [255, 255, 100]);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text(
        loadError.value ? "Erreur de chargement" : "Chargement du texte...",
        p.width / 2,
        p.height / 2
      );
      return;
    }

    // 🟢 Attente avant lancement
    if (!hasStarted.value) {
      p.fill(200, 200, 255);
      p.textSize(28);
      p.text(
        "Appuyez sur 'Démarrer' pour commencer... Bonne lecture ! (et bon courage)",
        p.width / 2,
        p.height / 2
      );
      return;
    }

    if (!isPaused.value && startTime.value)
      elapsedTime.value = (Date.now() - startTime.value) / 1000;

    const textSizeValue = Math.min(p.width / 12, 64);
    p.textSize(textSizeValue);

    if (index.value < words.value.length) {
      const currentTime = p.millis();
      const wordInterval = 1000 / currentSpeed.value;

      // Calculer le fade in basé sur le temps depuis le dernier mot affiché
      const timeSinceLastWord = currentTime - lastWordTime;
      const fadeProgress = Math.min(
        timeSinceLastWord / (wordInterval * 0.3),
        1
      );
      const alpha = p.map(fadeProgress, 0, 1, 50, 255);

      // Afficher le mot courant
      p.fill(255, 255, 255, alpha);
      p.text(words.value[index.value], p.width / 2, p.height / 2);

      // Afficher le mot suivant en transparence
      if (index.value < words.value.length - 1) {
        p.fill(100, 100, 150, 50);
        p.textSize(textSizeValue * 0.6);
        p.text(words.value[index.value + 1], p.width / 2, p.height / 2 + 80);
      }

      // Incrémenter l’index **après l’affichage**
      if (!isPaused.value && timeSinceLastWord >= wordInterval) {
        index.value++;
        lastWordTime = currentTime;
      }
    } else {
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

      p.noLoop();
    }
  };

  p.keyPressed = () => {
    if (isTextLoaded.value) restartAnimation();
  };

  p.windowResized = () => {
    const containerWidth = p5Container.value?.clientWidth || 800;
    p.resizeCanvas(Math.min(containerWidth, 800), 400);
  };
};

onMounted(async () => {
  await loadTextFile();
  const p5 = (await import("p5")).default;
  p5Instance = new p5(sketch);

  timeInterval = setInterval(() => {
    if (!isPaused.value && startTime.value && isTextLoaded.value) {
      elapsedTime.value = (Date.now() - startTime.value) / 1000;
    }
  }, 100);
});

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove();
    p5Instance = null;
  }
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
/* --- Styles identiques à ton fichier original --- */
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
  justify-content: center; /* centre horizontalement */
  align-items: center; /* centre verticalement */
  width: 100%;
  height: 100%;
  overflow: hidden;
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
