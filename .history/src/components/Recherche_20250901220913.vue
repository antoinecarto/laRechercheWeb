<template>
  <div>
    <h1>A la recherche du temps perdu</h1>
    <p>un mot à mot</p>

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
            {{ progressPercent }}{{ progressUnit }} ({{ index }}/{{
              totalWords
            }})
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
          <span>(1 mot par seconde)</span>
          <span>(25 mots par seconde)</span>
          <span>(50 mots par seconde)</span>
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
        <!-- Bouton psychédélique seulement sur desktop -->
        <button
          v-if="!isMobileDevice"
          @click="isPsychedelic = !isPsychedelic"
          class="btn-mode"
        >
          {{ isPsychedelic ? "Mode normal" : "Mode psychédélique" }}
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
import p5 from "p5";

// Détection mobile
const isMobile = () => {
  return (
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

// Variables réactives
const hasStarted = ref(false);
const isPsychedelic = ref(false);
const p5Container = ref(null);
const isPaused = ref(false);
const currentSpeed = ref(3.0);
const startTime = ref(null);
const elapsedTime = ref(0);
const isMobileDevice = ref(isMobile());

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
const progressPercent = computed(() => {
  if (totalWords.value === 0) return 0;

  const progress = (index.value / totalWords.value) * 100;

  // Affichage adaptatif selon le pourcentage
  if (progress < 0.1) {
    // Pour 10000 : affiche 1/10000, 2/10000, etc.
    return (progress * 100).toFixed(2);
  } else if (progress < 1) {
    // Pour mille : affiche 1.5‰, 2.3‰, etc.
    return (progress * 10).toFixed(1);
  } else {
    // Pour cent classique : affiche 1.2%, 5.8%, etc.
    return progress.toFixed(1);
  }
});

const progressUnit = computed(() => {
  if (totalWords.value === 0) return "%";

  const progress = (index.value / totalWords.value) * 100;

  if (progress < 0.1) {
    return "/10000"; // pour 10000
  } else if (progress < 1) {
    return "‰"; // pour mille
  } else {
    return "%"; // pour cent
  }
});

// Chargement du fichier texte
const loadTextFile = async () => {
  try {
    loadError.value = null;
    isTextLoaded.value = false;

    const response = await fetch(`${import.meta.env.BASE_URL}proust.txt`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

    proustText = await response.text();
    words.value = proustText.split(/\s+/).filter((w) => w.length > 0);
    isTextLoaded.value = true;
  } catch (error) {
    console.error(error);
    loadError.value = `Impossible de charger proust.txt: ${error.message}`;
    // fallback
    proustText =
      "Longtemps je me suis couché de bonne heure... sans avoir chargé le fichier !";
    words.value = proustText.split(/\s+/).filter((w) => w.length > 0);
    isTextLoaded.value = true;
  }
};

// Plein écran
const toggleFullscreen = async () => {
  const elem = p5Container.value;
  if (!elem) return;
  if (!document.fullscreenElement) await elem.requestFullscreen();
  else await document.exitFullscreen();
};

// Démarrage
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

// Contrôles
const restartAnimation = () => startAnimation();
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

// Formatage du temps
const formatTime = (seconds) => {
  const days = Math.floor(seconds / 86400);
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

// Timer pour elapsedTime
let timeInterval = null;

// Sketch p5.js
const sketch = (p) => {
  let t = 0; // pour le fond psychédélique

  p.setup = () => {
    // Canvas responsive dès le départ
    const containerWidth = p5Container.value?.clientWidth || 800;
    const canvasWidth = Math.min(containerWidth - 40, 800); // -40 pour le padding
    const canvasHeight = Math.min(canvasWidth * 0.5, 400); // Ratio 2:1 sur mobile

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(p5Container.value);
    p.frameRate(currentSpeed.value);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
    // ----- Fond -----
    if (isPsychedelic.value) {
      // Fond psychédélique animé
      p.loadPixels();
      for (let x = 0; x < p.width; x++) {
        for (let y = 0; y < p.height; y++) {
          const r = 128 + 128 * Math.sin(x * 0.01 + t);
          const g = 128 + 128 * Math.sin(y * 0.01 + t + 2);
          const b = 128 + 128 * Math.sin((x + y) * 0.01 + t + 4);
          const idx = (x + y * p.width) * 4;
          p.pixels[idx] = r;
          p.pixels[idx + 1] = g;
          p.pixels[idx + 2] = b;
          p.pixels[idx + 3] = 255;
        }
      }
      p.updatePixels();
      t += 0.05;
    } else {
      p.background(0); // fond normal
    }

    // ----- Texte avant démarrage -----
    if (!hasStarted.value) {
      p.fill(isPsychedelic.value ? [255, 255, 0] : 255);
      p.textSize(28);
      p.text(
        "Appuyez sur 'Démarrer' pour commencer...\nBonne lecture ! (et bon courage)",
        p.width / 2,
        p.height / 2
      );
      return;
    }

    // ----- Mettre à jour le temps écoulé -----
    if (!isPaused.value && startTime.value) {
      elapsedTime.value = (Date.now() - startTime.value) / 1000;
    }

    const textSizeValue = Math.min(p.width / 12, 64);
    p.textSize(textSizeValue);

    // ----- Affichage du mot courant -----
    if (index.value < words.value.length) {
      const currentTime = p.millis();
      const wordInterval = 1000 / currentSpeed.value;
      const timeSinceLastWord = currentTime - lastWordTime;
      const fadeProgress = Math.min(
        timeSinceLastWord / (wordInterval * 0.3),
        1
      );
      const alpha = p.map(fadeProgress, 0, 1, 50, 255);

      // Mot courant
      p.fill(
        isPsychedelic.value ? [255, 255, 0, alpha] : [255, 255, 255, alpha]
      );
      p.text(words.value[index.value], p.width / 2, p.height / 2);

      // Mot suivant en transparence
      if (index.value < words.value.length - 1) {
        p.fill(isPsychedelic.value ? [255, 255, 0, 50] : [100, 100, 150, 50]);
        p.textSize(textSizeValue * 0.6);
        p.text(words.value[index.value + 1], p.width / 2, p.height / 2 + 80);
      }

      // Incrémenter l'index après affichage
      if (!isPaused.value && timeSinceLastWord >= wordInterval) {
        index.value++;
        lastWordTime = currentTime;
      }
    } else {
      // ----- Texte de fin -----
      p.textSize(Math.min(p.width / 20, 32));
      p.fill(isPsychedelic.value ? [255, 255, 0] : [150, 255, 150]);
      p.text("Lecture terminée !", p.width / 2, p.height / 2 - 30);
    }
  };

  p.keyPressed = () => {
    if (isTextLoaded.value) restartAnimation();
  };

  p.windowResized = () => {
    const containerWidth = p5Container.value?.clientWidth || 800;
    const canvasWidth = Math.min(containerWidth - 40, 800);
    const canvasHeight = Math.min(canvasWidth * 0.5, 400);
    p.resizeCanvas(canvasWidth, canvasHeight);
  };
};

onMounted(async () => {
  // Force le mode normal sur mobile
  if (isMobileDevice.value) {
    isPsychedelic.value = false;
  }

  await loadTextFile();
  p5Instance = new p5(sketch, p5Container.value);

  timeInterval = setInterval(() => {
    if (!isPaused.value && startTime.value && isTextLoaded.value) {
      elapsedTime.value = (Date.now() - startTime.value) / 1000;
    }
  }, 100);
});

onUnmounted(() => {
  if (p5Instance) p5Instance.remove();
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
/* --- Bouton mode psychédélique / retour --- */
.btn-mode {
  background-color: #ff00ff;
  color: white;
  padding: 8px 16px;
  margin-left: 8px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-mode:hover {
  background-color: #cc00cc;
  transform: translateY(-1px);
}

/* --- Container P5 --- */
.p5-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* --- Info panel --- */
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

/* --- Progress bar --- */
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

/* --- Speed control --- */
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
  -moz-appearance: none;
  appearance: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
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

/* --- Messages d'erreur --- */
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

/* --- Canvas --- */
.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* --- Contrôles --- */
.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-start,
.btn-pause {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-start {
  background: #007bff;
  color: white;
}

.btn-start:hover {
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

/* --- Instructions --- */
.instructions {
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .p5-container {
    margin: 1rem 0;
    padding: 1rem;
  }

  .info-panel {
    padding: 1rem;
  }

  .time-info {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .time-display {
    padding: 0.25rem;
  }

  .time-display .label {
    font-size: 0.8rem;
  }

  .time-display .time {
    font-size: 1.1rem;
  }

  .speed-control {
    padding: 1rem;
  }

  .speed-label {
    font-size: 0.9rem;
  }

  .speed-marks {
    font-size: 0.65rem;
    padding: 0 5px;
  }

  .controls {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-start,
  .btn-pause {
    width: 200px;
  }

  .btn-mode {
    width: 200px;
  }

  .instructions {
    font-size: 0.8rem;
    padding: 0 0.5rem;
  }

  .canvas-wrapper {
    margin: 1rem 0;
  }
}

@media (max-width: 480px) {
  .p5-container {
    margin: 0.5rem 0;
    padding: 0.75rem;
  }

  .time-display .time {
    font-size: 1rem;
  }

  .btn-start,
  .btn-pause,
  .btn-mode {
    width: 100%;
    max-width: 250px;
  }
}
</style>
