jest.mock('next/config', () => () => ({ publicRuntimeConfig: {} }));

jest.mock(
  'next-auth/react',
  () => ({
    signIn: jest.fn(),
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  }),
  { virtual: true },
);
