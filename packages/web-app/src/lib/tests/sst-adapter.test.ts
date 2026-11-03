import type { Builder } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adapt, readFile, writeFile } = vi.hoisted(() => ({
  adapt: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('svelte-kit-sst', () => ({
  default: () => ({ name: 'svelte-kit-sst', adapt }),
}));

vi.mock('node:fs/promises', () => ({ readFile, writeFile }));

import sstAdapter from '../../../scripts/svelte-kit-sst.js';

describe('SST adapter SvelteKit 3 compatibility', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['\n', '\r\n'])('removes only the obsolete polyfill import and call with %j line endings', async (newline) => {
    const source = [
      'import { installPolyfills } from "@sveltejs/kit/node/polyfills";',
      'import { Server } from "../index.js";',
      'installPolyfills();',
      'const app = new Server(manifest);',
      'await app.init({ env: process.env });',
    ].join(newline);
    readFile.mockResolvedValue(source);
    const builder = {} as Builder;

    await sstAdapter().adapt(builder);

    expect(adapt).toHaveBeenCalledWith(builder);
    expect(adapt.mock.invocationCallOrder[0]).toBeLessThan(readFile.mock.invocationCallOrder[0]);
    expect(writeFile).toHaveBeenCalledWith(expect.stringMatching(/[\\/]lambda-handler[\\/]index\.js$/), expect.any(String), 'utf8');
    const output = writeFile.mock.calls[0][1] as string;
    expect(output).not.toContain('installPolyfills');
    expect(output).toContain('import { Server } from "../index.js";');
    expect(output).toContain('await app.init({ env: process.env });');
  });

  it.each(['export const handler = () => {};', 'import { installPolyfills } from "@sveltejs/kit/node/polyfills";', 'installPolyfills();'])(
    'fails explicitly when the upstream handler changes',
    async (source) => {
      readFile.mockResolvedValue(source);

      await expect(sstAdapter().adapt({} as Builder)).rejects.toThrow('review the SvelteKit 3 compatibility wrapper');
      expect(writeFile).not.toHaveBeenCalled();
    }
  );

  it('propagates adapter failures without modifying output', async () => {
    adapt.mockRejectedValue(new Error('adapter failed'));

    await expect(sstAdapter().adapt({} as Builder)).rejects.toThrow('adapter failed');
    expect(readFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });
});
