import { obterColecao } from "../database/mongodb.js";

export async function listarEstoque() {
  return (await obterColecao("EstoqueSangue")).find({}).sort({ nome: 1 }).toArray();
}

export async function listarCampanhas() {
  return (
    await obterColecao("Campanhas")
  )
    .find({
      ativo: { $ne: false },
      status: {
        $not: /^(inativ[ao]|cancelad[ao]|finalizad[ao]|encerrad[ao])$/i,
      },
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listarLocais() {
  const [locaisFixos, unidadesMoveis] = await Promise.all([
    (await obterColecao("LocaisColeta")).find({ ativo: { $ne: false } }).sort({ nome: 1 }).toArray(),
    (await obterColecao("UnidadesMoveis")).find({ ativo: { $ne: false } }).sort({ nome: 1 }).toArray(),
  ]);

  return [
    ...locaisFixos,
    ...unidadesMoveis.map((unidade) => ({ ...unidade, __movel: true })),
  ];
}
