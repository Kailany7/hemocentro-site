import { obterColecao } from "../database/mongodb.js";
import { enviarEmailCampanha } from "../services/email-service.js";
import { env } from "../config/env.js";

// Intervalo de verificação (padrão: 15 minutos).
const INTERVALO_MS = env.notificacoesIntervaloMs ?? 15 * 60 * 1000;

// Tamanho do lote de doadores por vez (evita sobrecarregar o Gmail).
const TAMANHO_LOTE = 10;

// Delay entre lotes para respeitar o limite do Gmail (~500 e-mails/dia no plano gratuito).
const DELAY_ENTRE_LOTES_MS = 2000;

// Rastreia o timestamp da última verificação para não reprocessar campanhas antigas.
let ultimaVerificacao = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function registrarLog(nivel, mensagem, extra = {}) {
  const timestamp = new Date().toISOString();
  const prefixo = `[NotificacoesJob][${timestamp}]`;
  if (nivel === "erro") {
    console.error(`${prefixo} ${mensagem}`, extra);
  } else {
    console.log(`${prefixo} ${mensagem}`, Object.keys(extra).length ? extra : "");
  }
}

async function enviarLote(doadores, campanha, colLog) {
  for (const doador of doadores) {
    // Dupla verificação: evita envio duplicado em caso de reinício ou crash.
    const jaEnviado = await colLog.findOne({
      campanhaId: campanha._id,
      doadorId: doador._id,
    });

    if (jaEnviado) continue;

    try {
      await enviarEmailCampanha(doador, campanha);

      await colLog.insertOne({
        campanhaId: campanha._id,
        doadorId: doador._id,
        email: doador.email,
        enviadoEm: new Date(),
        status: "enviado",
      });

      registrarLog("info", `E-mail enviado para ${doador.email} (campanha: ${campanha.titulo})`);
    } catch (erro) {
      await colLog.insertOne({
        campanhaId: campanha._id,
        doadorId: doador._id,
        email: doador.email,
        enviadoEm: new Date(),
        status: "falhou",
        erro: erro.message,
      });

      registrarLog("erro", `Falha ao notificar ${doador.email}:`, { erro: erro.message });
    }
  }
}

async function verificarEEnviar() {
  const agora = new Date();

  // Na primeira execução, processa campanhas criadas na última hora
  // (margem de segurança para caso o servidor seja reiniciado logo após uma campanha ser publicada).
  if (!ultimaVerificacao) {
    ultimaVerificacao = new Date(agora.getTime() - 60 * 60 * 1000);
  }

  const colCampanhas = await obterColecao("Campanhas");
  const colDoadores = await obterColecao("DoadoresCCadastro");
  const colLog = await obterColecao("NotificacoesLog");

  // Busca campanhas ativas criadas desde a última verificação.
  const novasCampanhas = await colCampanhas
    .find({
      ativo: { $ne: false },
      status: {
        $not: /^(inativ[ao]|cancelad[ao]|finalizad[ao]|encerrad[ao])$/i,
      },
      createdAt: { $gt: ultimaVerificacao, $lte: agora },
    })
    .toArray();

  if (novasCampanhas.length === 0) {
    ultimaVerificacao = agora;
    return;
  }

  registrarLog("info", `${novasCampanhas.length} nova(s) campanha(s) detectada(s).`);

  // Busca doadores com notificação por e-mail ativa.
  // notificacoesEmail: true (padrão) OU campo ausente (compatibilidade com doadores antigos).
  const doadores = await colDoadores
    .find({
      $or: [{ notificacoesEmail: true }, { notificacoesEmail: { $exists: false } }],
      email: { $exists: true, $type: "string" },
    })
    .project({ _id: 1, nome: 1, email: 1, tipoSanguineo: 1 })
    .toArray();

  if (doadores.length === 0) {
    registrarLog("info", "Nenhum doador com notificações ativas encontrado.");
    ultimaVerificacao = agora;
    return;
  }

  registrarLog("info", `Notificando ${doadores.length} doador(es) sobre ${novasCampanhas.length} campanha(s).`);

  for (const campanha of novasCampanhas) {
    // Processa em lotes para não sobrecarregar o Gmail.
    for (let i = 0; i < doadores.length; i += TAMANHO_LOTE) {
      const lote = doadores.slice(i, i + TAMANHO_LOTE);
      await enviarLote(lote, campanha, colLog);

      // Delay entre lotes (exceto no último).
      if (i + TAMANHO_LOTE < doadores.length) {
        await sleep(DELAY_ENTRE_LOTES_MS);
      }
    }
  }

  ultimaVerificacao = agora;
}

export function iniciarJobNotificacoes() {
  registrarLog("info", `Job de notificações iniciado. Intervalo: ${INTERVALO_MS / 1000}s.`);

  // Agenda verificações periódicas.
  setInterval(async () => {
    try {
      await verificarEEnviar();
    } catch (erro) {
      registrarLog("erro", "Erro inesperado no job de notificações:", { erro: erro.message });
    }
  }, INTERVALO_MS);
}
