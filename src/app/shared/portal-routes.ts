export type PortalType = 'representantes' | 'clientes';

export const PORTAL_ROUTES = {
  representantes: {
    login: '/Representantes',
    orders: '/Representantes/ordenes',
    accountPassword: '/Representantes/cuenta/contrasena',
    forgotPassword: '/Representantes/forgot-password',
    changePassword: '/Representantes/change-password',
  },
  clientes: {
    login: '/Clientes',
    orders: '/Clientes/ordenes',
    tracking: '/Clientes/seguimiento',
    proposalReview: '/Clientes/propuestas/revision',
    accountPassword: '/Clientes/cuenta/contrasena',
    forgotPassword: '/Clientes/forgot-password',
    changePassword: '/Clientes/change-password',
  },
} as const;

export function normalizePortal(value: unknown): PortalType {
  return value === 'clientes' ? 'clientes' : 'representantes';
}
