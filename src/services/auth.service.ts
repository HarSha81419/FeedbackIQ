import type { AuthResponse, LoginCredentials, SignupCredentials } from '@/types';
import { api } from './api';
import { mockDelay } from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(800);
    if (!credentials.email || !credentials.password) {
      throw new Error('Invalid credentials');
    }
    return {
      token: createMockJwt(credentials.email),
      user: {
        id: '1',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    };
  }
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function signup(credentials: SignupCredentials): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(1000);
    return {
      token: createMockJwt(credentials.email),
      user: {
        id: '1',
        email: credentials.email,
        name: credentials.name,
        role: 'analyst',
        createdAt: new Date().toISOString(),
      },
    };
  }
  const { data } = await api.post<AuthResponse>('/auth/signup', credentials);
  return data;
}

function createMockJwt(email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: email,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  );
  return `${header}.${payload}.mock-signature`;
}
