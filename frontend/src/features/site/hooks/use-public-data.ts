import { useEffect, useState } from "react";
import { ESTOQUE_FIXO, LOCAIS_FIXOS } from "../data/exemplo";
import { dadosPublicosApi } from "../services/public-data-api";
import type { Campaign, CollectionLocation, StockItem } from "../types/public-data";

type ErrosPublicos = {
  estoque: boolean;
  campanhas: boolean;
  locais: boolean;
};

interface UsePublicDataOptions {
  // A landing pode usar dados fixos para estoque e locais; campanhas vêm da API.
  usarDadosFixos?: boolean;
}

// Os dados fixos de estoque e locais aparecem de imediato; campanhas são sempre reais.
export function usePublicData({ usarDadosFixos = true }: UsePublicDataOptions = {}) {
  const [estoque, setEstoque] = useState<StockItem[]>(usarDadosFixos ? ESTOQUE_FIXO : []);
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
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
