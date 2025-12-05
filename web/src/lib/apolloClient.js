/**
 * Apollo Client Configuration
 * - apollo3-cache-persist for localStorage persistence
 * - JWT token authentication
 * - Error handling with token refresh
 */

import { ApolloClient, InMemoryCache, createHttpLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';

// GraphQL endpoint
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  credentials: 'include',
});

// Get auth state from Redux persist
const getAuthState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const persistedState = localStorage.getItem('persist:app-store');
    if (!persistedState) return null;
    const parsed = JSON.parse(persistedState);
    if (!parsed.auth) return null;
    return JSON.parse(parsed.auth);
  } catch (error) {
    console.error('[Apollo] Failed to read auth state:', error);
    return null;
  }
};

// Auth link - adds authorization header
const authLink = setContext((_, { headers }) => {
  const authState = getAuthState();
  const accessToken = authState?.accessToken;

  return {
    headers: {
      ...headers,
      ...(accessToken && {
        authorization: `Bearer ${accessToken}`,
      }),
      'Content-Type': 'application/json',
      'x-client-type': 'web',
    },
  };
});

// Error link - handles authentication errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      const { message, extensions } = error;
      const code = extensions?.code || extensions?.errorCode;

      console.error(`[GraphQL Error]: ${message}, Code: ${code}`);

      // Handle unauthenticated errors
      if (code === 'UNAUTHENTICATED' || code === 'TOKEN_EXPIRED') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          localStorage.removeItem('persist:app-store');
          window.location.href = '/login';
        }
        return;
      }
    }
  }

  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);
  }
});

// Apollo cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Add your field policies here
      },
    },
  },
});

// Apollo Client instance
let apolloClient = null;

/**
 * Create Apollo Client synchronously
 * Cache persistence happens in background
 * @returns {ApolloClient}
 */
const createApolloClient = () => {
  const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    // Apollo Client 3.14+ API
    devtools: {
      enabled: process.env.NODE_ENV === 'development',
    },
    clientAwareness: {
      name: 'duri-web',
      version: '1.0.0',
    },
  });

  // Persist cache in background (non-blocking)
  if (typeof window !== 'undefined') {
    persistCache({
      cache,
      storage: new LocalStorageWrapper(window.localStorage),
      key: 'apollo-cache',
      maxSize: 1048576 * 2, // 2MB
      debug: process.env.NODE_ENV === 'development',
    })
      .then(() => console.log('[Apollo] Cache persisted to localStorage'))
      .catch((error) => console.error('[Apollo] Failed to persist cache:', error));
  }

  return client;
};

/**
 * Get or create Apollo Client instance (sync)
 * @returns {ApolloClient}
 */
export const initApolloClient = () => {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
};

/**
 * Get Apollo Client instance (sync)
 * @returns {ApolloClient|null}
 */
export const getApolloClient = () => apolloClient;

/**
 * Reset Apollo store (for logout)
 */
export const resetApolloStore = async () => {
  if (apolloClient) {
    await apolloClient.clearStore();
    // Clear persisted cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apollo-cache');
    }
    console.log('[Apollo] Store and persisted cache cleared');
  }
};

// Token Manager for compatibility
export const tokenManager = {
  getAccessToken: () => {
    const authState = getAuthState();
    return authState?.accessToken || null;
  },
  getRefreshToken: () => {
    const authState = getAuthState();
    return authState?.refreshToken || null;
  },
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
  refreshToken: async () => {
    // Stub - actual refresh logic handled by auth flow
    console.log('[tokenManager] Token refresh requested');
    return null;
  },
  clearApolloCache: async () => {
    await resetApolloStore();
  },
  setTokens: (accessToken, refreshToken) => {
    console.log('[tokenManager] setTokens called');
  }
};

// Alias for compatibility
export const initializeApollo = initApolloClient;

export default {
  initApolloClient,
  initializeApollo,
  getApolloClient,
  resetApolloStore,
  tokenManager,
};
