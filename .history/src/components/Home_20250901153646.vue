<template>
  <div>
    <!-- Titre cliquable -->
    <h1>
      <router-link to="/recherche" class="title-link">
        À la recherche du temps perdu - mot à mot \nLaissez votre cerveau lire à
        son rythme.
      </router-link>
    </h1>
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
