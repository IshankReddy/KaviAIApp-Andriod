import { makeAutoObservable, runInAction } from 'mobx';
import { secureDel, secureGet, secureSet } from '../services/secureKv';

type SecretKey = 'hfToken' | 'openaiKey' | 'anthropicKey' | 'geminiKey';

const KEYS: Record<SecretKey, string> = {
  hfToken: 'kaviai.secret.hfToken.v1',
  openaiKey: 'kaviai.secret.openaiKey.v1',
  anthropicKey: 'kaviai.secret.anthropicKey.v1',
  geminiKey: 'kaviai.secret.geminiKey.v1',
};

class SecretsStore {
  isHydrated = false;

  hfToken = '';
  openaiKey = '';
  anthropicKey = '';
  geminiKey = '';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async hydrate(): Promise<void> {
    try {
      const [hfToken, openaiKey, anthropicKey, geminiKey] = await Promise.all([
        secureGet(KEYS.hfToken),
        secureGet(KEYS.openaiKey),
        secureGet(KEYS.anthropicKey),
        secureGet(KEYS.geminiKey),
      ]);
      runInAction(() => {
        this.hfToken = hfToken ?? '';
        this.openaiKey = openaiKey ?? '';
        this.anthropicKey = anthropicKey ?? '';
        this.geminiKey = geminiKey ?? '';
      });
    } finally {
      runInAction(() => {
        this.isHydrated = true;
      });
    }
  }

  async setSecret(key: SecretKey, value: string): Promise<void> {
    const cleaned = value.trim();
    runInAction(() => {
      if (key === 'hfToken') this.hfToken = cleaned;
      if (key === 'openaiKey') this.openaiKey = cleaned;
      if (key === 'anthropicKey') this.anthropicKey = cleaned;
      if (key === 'geminiKey') this.geminiKey = cleaned;
    });
    if (cleaned) await secureSet(KEYS[key], cleaned);
    else await secureDel(KEYS[key]);
  }
}

export const secretsStore = new SecretsStore();

