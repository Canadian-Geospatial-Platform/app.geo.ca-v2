import type { Component } from 'svelte';

export type SelectOption = {
  value: string;
  label: string;
  component?: Component;
};
