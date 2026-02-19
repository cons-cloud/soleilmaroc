// Configuration de base pour les tests
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// Mock pour Supabase
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));

// Configuration du serveur de test
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());
