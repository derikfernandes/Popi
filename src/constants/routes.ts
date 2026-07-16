/** Rotas da aplicação POPI */
export const ROUTES = {
  home: "/",
  mapeamento: "/mapeamento",
  mapeamentoNovo: "/mapeamento/novo",
  mapeamentoPopi: (id: string) => `/mapeamento/${id}`,
  mapeamentoEditar: (id: string) => `/mapeamento/${id}/editar`,
  admin: "/admin",
  adminSecretarias: "/admin/secretarias",
  adminUsuarios: "/admin/usuarios",
  adminPrompts: "/admin/prompts",
} as const;
