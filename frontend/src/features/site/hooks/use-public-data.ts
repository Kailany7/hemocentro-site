import { useEffect, useState } from "react";
import { CAMPANHAS_FIXAS, ESTOQUE_FIXO, LOCAIS_FIXOS } from "../data/exemplo";
import { dadosPublicosApi } from "../services/public-data-api";
import type { Campaign, CollectionLocation, StockItem } from "../types/public-data";

type ErrosPublicos = {
  estoque: boolean;
  campanhas: boolean;
  locais: boolean;
};

interface UsePublicDataOptions {
  // A landing mostra os dados fixos enquanto a API nao responde. A area do
  // doador desliga esse fallback para nunca exibir dados ficticios.
  usarDadosFixos?: boolean;
}

// Os dados fixos aparecem de imediato e continuam na tela se a API falhar.
// Quando a API responde, mesmo com lista vazia, ela passa a ser a fonte da verdade.
export function usePublicData({ usarDadosFixos = true }: UsePublicDataOptions = {}) {
  const [estoque, setEstoque] = useState<StockItem[]>(usarDadosFixos ? ESTOQUE_FIXO : []);
  const [campanhas, setCampanhas] = useState<Campaign[]>(usarDadosFixos ? CAMPANHAS_FIXAS : []);
  const [locais, setLocais] = useState<CollectionLocation[]>(usarDadosFixos ? LOCAIS_FIXOS : []);
  const [loading, setLoading] = useState(true);
  // Erros separados por recurso, para a area do doador saber exatamente o que falhou.
  const [erros, setErros] = useState<ErrosPublicos>({
    estoque: false,
    campanhas: false,
    locais: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    void Promise.allSettled([
      dadosPublicosApi.estoques(controller.signal),
      dadosPublicosApi.campanhas(controller.signal),
      dadosPublicosApi.locais(controller.signal),
    ]).then(([estoqueApi, campanhasApi, locaisApi]) => {
      if (!ativo) return;

      if (estoqueApi.status === "fulfilled") setEstoque(estoqueApi.value);
      if (campanhasApi.status === "fulfilled") setCampanhas(campanhasApi.value);
      if (locaisApi.status === "fulfilled") setLocais(locaisApi.value);

      setErros({
        estoque: estoqueApi.status === "rejected",
        campanhas: campanhasApi.status === "rejected",
        locais: locaisApi.status === "rejected",
      });
      setLoading(false);
    });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, []);

  return { estoque, campanhas, locais, loading, erros };
}
