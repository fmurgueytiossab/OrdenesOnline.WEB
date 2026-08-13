export type PortalType = 'representantes' | 'clientes';

export const PORTAL_ROUTES = {
  representantes: {
    login: '/Representantes',
    orders: '/Representantes/ordenes',
    forgotPassword: '/Representantes/forgot-password',
    changePassword: '/Representantes/change-password',
  },
  clientes: {
    login: '/Clientes',
    orders: '/Clientes/ordenes',
    forgotPassword: '/Clientes/forgot-password',
    changePassword: '/Clientes/change-password',
  },
} as const;

export function normalizePortal(value: unknown): PortalType {
  return value === 'clientes' ? 'clientes' : 'representantes';
}
