<template>
  <div>
    <!-- Titre cliquable -->
    <h1>
      <router-link to="/recherche" class="title-link">
        À la recherche du temps perdu
      </router-link>
    </h1>

    <p>Bienvenue sur le projet Vue + Firestore !</p>
  </div>
</template>

<script setup>
// pas besoin de script pour un simple router-link
</script>

<style>
.title-link {
  text-decoration: none; /* enlève le soulignement */
  color: inherit; /* garde la couleur du texte */
  cursor: pointer;
}

.title-link:hover {
  color: #42b983; /* couleur au survol */
}
</style>
