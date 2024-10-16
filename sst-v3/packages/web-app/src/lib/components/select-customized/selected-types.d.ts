import type * as Kit from '@sveltejs/kit';
import type { ComponentType } from "svelte";

export type SelectOption = {
  value: string,
  label: string,
  // The icon should be a component from the 'icons' folder
  icon?: ComponentType,
}