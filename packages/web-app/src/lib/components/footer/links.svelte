<script lang="ts">
  export let linksData: JSON;
</script>

<div class="bg-custom-14">
  <div class="content-width grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-12">
    {#each Object.entries(linksData) as [colIndex, data]}
      <div class="p-3 font-custom-style-footer-1">
        {#if Object.hasOwn(data, "title")}
          <h3>{data["title"]}</h3>
        {/if}
        {#if Object.hasOwn(data, "links")}
          <ul class="list-disc list-outside py-2 ml-[18px]">
            {#each data["links"] as link}
              <li class="py-2 font-custom-style-footer-2 hover:underline">
                <a href={link["href"]}>{link["title"]}</a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style></style>
