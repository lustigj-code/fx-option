import useAuthorization from '@/lib/auth/useAuthorization';

export * from '@/lib/auth/useAuthorization';

export const useRouteGuard = useAuthorization;

export default useRouteGuard;
