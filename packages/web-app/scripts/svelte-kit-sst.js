import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import adapter from 'svelte-kit-sst';

// TODO: Remove this compatibility wrapper once svelte-kit-sst updates its generated handler for SvelteKit 3.
/**
 * SvelteKit 3 removed node/polyfills; the SST Lambda runtime provides these APIs natively.
 * Keep this compatibility wrapper until svelte-kit-sst updates its generated handler.
 *
 * @returns {import('@sveltejs/kit').Adapter}
 */
export default function sstAdapter() {
  const upstream = adapter();

  return {
    ...upstream,
    async adapt(builder) {
      await upstream.adapt(builder);

      const handlerPath = path.resolve('.svelte-kit', 'svelte-kit-sst', 'server', 'lambda-handler', 'index.js');
      const source = await readFile(handlerPath, 'utf8');
      const polyfillImport = /^import \{ installPolyfills \} from ["']@sveltejs\/kit\/node\/polyfills["'];\r?$/gm;
      const polyfillCall = /^installPolyfills\(\);\r?$/gm;

      if (source.match(polyfillImport)?.length !== 1 || source.match(polyfillCall)?.length !== 1) {
        throw new Error('The svelte-kit-sst Lambda handler changed; review the SvelteKit 3 compatibility wrapper.');
      }

      await writeFile(handlerPath, source.replace(polyfillImport, '').replace(polyfillCall, ''), 'utf8');
    },
  };
}
