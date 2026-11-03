// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  page: {
    data: {
      lang: 'en-ca',
      signedIn: true,
      userDataStatus: 'ok',
      userData: {
        favourites: ['dataset-1'],
        mapConfigs: [{ id: 'map-1', name: 'Saved map', config: { map: {} }, createdAt: '2026-01-01T00:00:00.000Z' }],
      },
      t: {},
    },
    url: new URL('https://example.test/en-ca/favourites/datasets'),
  },
  navigating: { type: null },
  goto: vi.fn(),
  resolve: vi.fn((path: string, params?: Record<string, string>) =>
    path.replace(/\[([^\]]+)\]/g, (_match, key: string) => params?.[key] ?? `[${key}]`)
  ),
  updateLocalStorage: vi.fn(),
  datasetResponseJson: vi.fn<() => Promise<unknown>>(),
  fetch: vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<{ ok: boolean; json?: () => Promise<unknown> }>>(),
}));

vi.mock('$app/state', () => ({ page: mocks.page, navigating: mocks.navigating }));
vi.mock('$app/navigation', () => ({ goto: mocks.goto }));
vi.mock('$app/paths', () => ({ resolve: mocks.resolve }));
vi.mock('#lib/utils/event-dispatchers/local-storage-changed.js', () => ({ updateLocalStorage: mocks.updateLocalStorage }));

import FavouritesDatasets from '#lib/components/favourites/favourites-datasets.svelte';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});

afterAll(() => {
  if (originalShowModal) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  }

  if (originalClose) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  }
});

describe('FavouritesDatasets', () => {
  beforeEach(() => {
    mocks.page.data = {
      lang: 'en-ca',
      signedIn: true,
      userDataStatus: 'ok',
      userData: {
        favourites: ['dataset-1'],
        mapConfigs: [{ id: 'map-1', name: 'Saved map', config: { map: {} }, createdAt: '2026-01-01T00:00:00.000Z' }],
      },
      t: {},
    };
    mocks.page.url = new URL('https://example.test/en-ca/favourites/datasets');
    mocks.goto.mockReset().mockResolvedValue(undefined);
    mocks.resolve.mockClear();
    mocks.updateLocalStorage.mockReset();
    mocks.datasetResponseJson.mockReset().mockResolvedValue([
      {
        id: 'dataset-1',
        title_en: 'Dataset One',
        title_fr: 'Jeu de données un',
        formats: ['JSON'],
        hasMapLayer: true,
      },
    ]);
    localStorage.clear();
    mocks.fetch
      .mockReset()
      .mockImplementation((_input, init) =>
        Promise.resolve(init?.method === 'POST' ? { ok: true, json: mocks.datasetResponseJson } : { ok: false })
      );
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads and renders saved dataset rows', async () => {
    render(FavouritesDatasets);

    await screen.findAllByText('Dataset One');

    expect(mocks.fetch).toHaveBeenCalledWith(
      '/en-ca/favourites',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
    );
    expect((screen.getByRole('button', { name: 'View on map (1)' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    ['single dataset', 'DELETE', 'Remove'],
    ['all datasets', 'PUT', 'Remove all'],
  ] as const)('preserves rows and local state when removing %s fails', async (_label, method, buttonName) => {
    render(FavouritesDatasets);
    await screen.findAllByText('Dataset One');
    mocks.updateLocalStorage.mockClear();

    const removeButton =
      buttonName === 'Remove' ? screen.getAllByRole('button', { name: buttonName })[0] : screen.getByRole('button', { name: buttonName });
    await fireEvent.click(removeButton);
    await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mocks.fetch).toHaveBeenCalledWith(
      '/en-ca/api/favourites',
      expect.objectContaining({ method, ...(method === 'DELETE' ? { body: JSON.stringify({ id: 'dataset-1' }) } : {}) })
    );
    expect(screen.getAllByText('Dataset One').length).toBeGreaterThan(0);
    expect(mocks.updateLocalStorage).not.toHaveBeenCalled();
  });

  it('keeps the saved-map picker open and reports a navigation failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.goto.mockRejectedValueOnce(new Error('Navigation failed'));
    render(FavouritesDatasets);
    await screen.findAllByText('Dataset One');

    await fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    await fireEvent.click(screen.getByRole('button', { name: 'Saved map' }));

    expect(mocks.goto).toHaveBeenCalledWith('/en-ca/favourites/view?mapId=map-1&addDatasetId=dataset-1&source=maps');
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to open the selected saved map');
    expect(screen.getByRole('button', { name: 'Saved map' })).toBeTruthy();
    consoleError.mockRestore();
  });

  it('opens the map view with the selected dataset IDs', async () => {
    render(FavouritesDatasets);
    await screen.findAllByText('Dataset One');

    await fireEvent.click(screen.getByRole('button', { name: 'View on map (1)' }));

    expect(mocks.goto).toHaveBeenCalledWith('/en-ca/favourites/view?ids=dataset-1&source=datasets');
  });
});
