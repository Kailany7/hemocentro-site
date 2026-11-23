import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function obterTransporter() {
  if (transporter) return transporter;

  if (!env.gmailUser || !env.gmailAppPassword) {
    throw new Error(
      "GMAIL_USER e GMAIL_APP_PASSWORD precisam estar definidos no arquivo .env",
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailUser,
      pass: env.gmailAppPassword,
    },
  });

  return transporter;
}

function gerarHtmlEmail(doador, campanha) {
  const linhasDetalhes = [
    campanha.data
      ? `<tr>
           <td style="padding:6px 0;color:#6b7280;font-size:14px;">📅 Período</td>
           <td style="padding:6px 0;font-size:14px;font-weight:600;">${campanha.data}</td>
         </tr>`
      : "",
    campanha.local || campanha.endereco
      ? `<tr>
           <td style="padding:6px 0;color:#6b7280;font-size:14px;">📍 Local</td>
           <td style="padding:6px 0;font-size:14px;font-weight:600;">${campanha.local ?? campanha.endereco}</td>
         </tr>`
      : "",
    campanha.horario
      ? `<tr>
           <td style="padding:6px 0;color:#6b7280;font-size:14px;">🕐 Horário</td>
           <td style="padding:6px 0;font-size:14px;font-weight:600;">${campanha.horario}</td>
         </tr>`
      : "",
    campanha.meta
      ? `<tr>
           <td style="padding:6px 0;color:#6b7280;font-size:14px;">🎯 Meta</td>
           <td style="padding:6px 0;font-size:14px;font-weight:600;">${campanha.meta}</td>
         </tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Nova campanha de doação — HemoHelp</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Cabeçalho -->
          <tr>
            <td style="background:#dc2626;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:-0.5px;">🩸 HemoHelp</h1>
              <p style="margin:6px 0 0;color:#fecaca;font-size:14px;">Central de doação de sangue</p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#111827;">
                Olá, <strong>${doador.nome}</strong>! 👋
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Uma nova campanha de doação de sangue foi publicada e você pode fazer parte dela!
              </p>

              <!-- Card da campanha -->
              <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
                <h2 style="margin:0 0 8px;font-size:18px;color:#991b1b;">${campanha.titulo}</h2>
                ${campanha.descricao ? `<p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.5;">${campanha.descricao}</p>` : ""}
                ${
                  linhasDetalhes
                    ? `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                         ${linhasDetalhes}
                       </table>`
                    : ""
                }
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#dc2626;border-radius:8px;padding:12px 28px;">
                    <a href="${env.siteUrl}" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">
                      Ver todas as campanhas →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                Sua doação pode salvar até <strong>4 vidas</strong>. Obrigado por fazer parte da nossa corrente do bem! ❤️
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
                Você recebe este e-mail porque está cadastrado no HemoHelp com notificações ativas.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Para desativar, acesse seu
                <a href="${env.siteUrl}/doador" style="color:#dc2626;text-decoration:none;">perfil no HemoHelp</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function enviarEmailCampanha(doador, campanha) {
  const transport = obterTransporter();

  await transport.sendMail({
    from: `"HemoHelp" <${env.gmailUser}>`,
    to: doador.email,
    subject: `🩸 Nova campanha de doação: ${campanha.titulo}`,
    html: gerarHtmlEmail(doador, campanha),
  });
}

// Verifica a conexão com o Gmail (use durante startup para diagnóstico).
export async function verificarConexaoEmail() {
  try {
    const transport = obterTransporter();
    await transport.verify();
    console.log("Serviço de e-mail (Gmail) conectado com sucesso.");
    return true;
  } catch (erro) {
    console.error("Falha ao verificar conexão com Gmail:", erro.message);
    return false;
  }
}
