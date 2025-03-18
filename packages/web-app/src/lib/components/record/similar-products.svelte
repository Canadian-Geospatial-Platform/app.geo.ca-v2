<script lang="ts">
  import { page } from '$app/stores';

  const translations = $page.data.t;
  const similarProductsText = translations?.similarProducts ? translations["similarProducts"] : "Similar Products";

  const data = $page.data;
  const items = data.item_v2;

  // TODO replace with real data
  const similarProducts = [
    {linkText: 'Sample Title 123 456 789', linkUrl: 'http://fakeurl1.com', description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."},
    {linkText: 'Another Sample Title 123 456 789', linkUrl: 'http://fakeurl2.com', description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."},
    {linkText: 'The Last Sample Title 123 456 789', linkUrl: 'http://fakeurl3.com', description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
  ]

</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-1">
    {similarProductsText}
  </h2>
  <ul class="flex flex-col space-y-4 list-outside list-disc py-2 ml-[1.125rem]">
    {#each similarProducts as product}
      <li>
        <a class="font-custom-style-body-2" href={product.linkUrl}>
          {product.linkText}
        </a>
        <p class="line-clamp-2">{product.description}</p>
      </li>
    {/each}
  </ul>
</div>
