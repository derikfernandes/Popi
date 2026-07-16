// Entrada serverless da Vercel: todas as rotas /api/* são atendidas
// pelo app Express compartilhado (ver rewrites em vercel.json).
import app from "./_lib/app";

export default app;
