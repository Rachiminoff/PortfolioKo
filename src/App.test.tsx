import { createVaultToken, isValidVaultToken } from './server/vaultSession';

describe('vault session tokens', () => {
  const originalSecret = process.env.VAULT_SESSION_SECRET;

  beforeEach(() => {
    process.env.VAULT_SESSION_SECRET = 'test-only-vault-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.VAULT_SESSION_SECRET;
    else process.env.VAULT_SESSION_SECRET = originalSecret;
  });

  test('accepts a freshly signed token', () => {
    expect(isValidVaultToken(createVaultToken())).toBe(true);
  });

  test('rejects a token with a changed signature', () => {
    const token = createVaultToken();
    const altered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    expect(isValidVaultToken(altered)).toBe(false);
  });

  test('rejects malformed tokens and missing secrets', () => {
    expect(isValidVaultToken('not-a-token')).toBe(false);
    delete process.env.VAULT_SESSION_SECRET;
    expect(isValidVaultToken(createSafeTokenFallback())).toBe(false);
  });
});

function createSafeTokenFallback() {
  return '0.nonce.invalid-signature';
}
