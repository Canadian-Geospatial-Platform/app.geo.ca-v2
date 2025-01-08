<script lang="ts">
  import { page } from '$app/stores';

  const lang = $page.data.lang;
  const title = lang == 'fr-ca' ?
    "Nous apprécions vos commentaires" : "We Value Your Feedback";
</script>

<div class="font-custom-style-body-1 px-5 md:px-0">
  <h2 class="font-custom-style-h2 mb-1">
    {title}
  </h2>
  <!-- TODO: Update feedback text -->
  <div>
    {#if lang == 'en-ca'}
      <h2>Welcome to the app.geo.ca Beta!</h2>
      <br />
      <p>
        We're thrilled to have you on board as we explore the exciting world of geospatial data.
        Your feedback is invaluable to us! If you encounter any issues, have suggestions, or simply
        want to share your thoughts, please reach out to us at
        <a class="underline text-custom-16" href="mailto:geo@nrcan-rncan.gc.ca">geo@nrcan-rncan.gc.ca</a>
        . Let's make this platform even better together!
      </p>
    {:else}
      <h2>Bienvenue dans la version bêta d'app.geo.ca !</h2>
      <br />
      <p>
        Nous sommes ravis de vous accueillir à bord alors que nous explorons le passionnant monde
        des données géospatiales. Vos commentaires sont inestimables pour nous ! Si vous rencontrez
        des problèmes, avez des suggestions ou souhaitez simplement partager vos réflexions,
        n'hésitez pas à nous contacter à l'adresse
        <a class="underline text-custom-16" href="mailto:geo@nrcan-rncan.gc.ca">geo@nrcan-rncan.gc.ca</a>
        . Construisons ensemble une plateforme encore meilleure !
      </p>
    {/if}
  </div>
</div>
