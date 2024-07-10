<script lang="ts">
  import { page } from '$app/stores';

  const legalData: {[key: string]: string} = $page.data.legalData;

  let logoUrl = Object.hasOwn(legalData,"logoUrl") ? legalData["logoUrl"] : "";
  let logoAlt = Object.hasOwn(legalData, "logoAlt") ? legalData["logoAlt"] : "";
	let contactUs = Object.hasOwn(legalData, "contactUs") ? legalData["contactUs"] : "";
	let ccmeo = Object.hasOwn(legalData, "ccmeo") ? legalData["ccmeo"] : "";
	let nrcan = Object.hasOwn(legalData, "nrcan") ? legalData["nrcan"] : "";
	let goc = Object.hasOwn(legalData, "goc") ? legalData["goc"] : "";
  let license = Object.hasOwn(legalData, "license") ? legalData["license"] : "";
	let licenceUrl = Object.hasOwn(legalData, "licenceUrl") ? legalData["licenceUrl"] : "";
	let copyright = Object.hasOwn(legalData, "copyright") ? legalData["copyright"] : "";
  let email = Object.hasOwn(legalData, "email") ? legalData["email"] : "";
</script>

<div class="bg-custom-5 font-open-sans">
  <div class="grid grid-cols-1 md:grid-cols-2 content-width">
    <div class="legal-col">
      <h3>{contactUs}</h3>
      <p>{ccmeo}</p>
      <p>{nrcan}</p>
      <p>{goc}</p>
      <p><a href="{'mailto:' + email}">{email}</a></p>
    </div>
    <div class="legal-col md:text-right">
      <img 
        class="w-28 md:ml-auto mb-3"
        src= {logoUrl}
        alt= {logoAlt}
      />
      <p><a href={licenceUrl}>{license}</a></p>
      <p>{copyright}</p>
    </div>
  </div>
</div>

<style>
  .legal-col {
    @apply p-3;
  }

  @media (min-width: 768px) {
    .legal-col {
      align-content: flex-end;
    }
  }

  h3 {
    @apply text-lg;
    @apply font-bold;
  }

  p {
    @apply text-sm;
  }

  a {
    @apply underline;
    @apply text-custom-8;
  }
</style>