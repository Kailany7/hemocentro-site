import "dotenv/config";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI nao foi definida no arquivo .env");
}

export const env = Object.freeze({
  mongoUri,
  mongoDatabase: process.env.MONGODB_DB ?? "hemohelp",
  port: Number(process.env.PORT ?? 3002),
  // O segredo do JWT e conferido apenas nas rotas de autenticacao,
  // para a API continuar subindo mesmo sem a variavel definida.
  jwtSecret: process.env.JWT_SECRET ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? "carteiras",
  // Notificações por e-mail via Gmail (Nodemailer + App Password).
  gmailUser: process.env.GMAIL_USER ?? "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  siteUrl: process.env.SITE_URL ?? "http://localhost:5173",
  // Intervalo do job de notificações em ms (padrão: 15 minutos).
  notificacoesIntervaloMs: process.env.NOTIFICACOES_INTERVALO_MS
    ? Number(process.env.NOTIFICACOES_INTERVALO_MS)
    : 15 * 60 * 1000,
});
