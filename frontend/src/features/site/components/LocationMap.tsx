import type { Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { CollectionLocation } from "../types/public-data";

type Leaflet = typeof import("leaflet");

interface LocationMapProps {
  locations: CollectionLocation[];
  selectedLocation: CollectionLocation | null;
  onSelect: (location: CollectionLocation) => void;
  loading: boolean;
}

function temPosicao(local: CollectionLocation) {
  return (
    typeof local.latitude === "number" &&
    Number.isFinite(local.latitude) &&
    Math.abs(local.latitude) <= 90 &&
    typeof local.longitude === "number" &&
    Number.isFinite(local.longitude) &&
    Math.abs(local.longitude) <= 180
  );
}

function criarIcone(L: Leaflet) {
  return L.divIcon({
    className: "hemo-map-marker",
    html: '<span class="hemo-map-marker-inner"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"/><circle cx="12" cy="11" r="2.5"/></svg></span>',
    iconSize: [44, 52],
    iconAnchor: [22, 48],
  });
}

export function LocationMap({
  locations,
  selectedLocation,
  onSelect,
  loading,
}: LocationMapProps) {
  const elementoDoMapa = useRef<HTMLDivElement>(null);
  const mapa = useRef<LeafletMap | null>(null);
  const marcadores = useRef<Marker[]>([]);
  // O Leaflet acessa o window ao ser importado, então só carregamos no cliente.
  const [leaflet, setLeaflet] = useState<Leaflet | null>(null);

  const locaisComPosicao = locations.filter(temPosicao);
  const semPosicao = locations.length - locaisComPosicao.length;
  const localSelecionadoNoMapa = locaisComPosicao.find(
    (local) => local.id === selectedLocation?.id,
  );

  useEffect(() => {
    let ativo = true;

    void import("leaflet").then((modulo) => {
      if (!ativo) return;
      const carregado = modulo as unknown as { default?: Leaflet } & Leaflet;
      setLeaflet(carregado.default ?? carregado);
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!leaflet || !elementoDoMapa.current || mapa.current || locaisComPosicao.length === 0) {
      return;
    }

    const primeiro = locaisComPosicao[0];
    if (!primeiro) return;

    const instancia = leaflet
      .map(elementoDoMapa.current, { zoomControl: false, scrollWheelZoom: false })
      .setView(leaflet.latLng(primeiro.latitude!, primeiro.longitude!), 15);

    leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(instancia);
    leaflet.control.zoom({ position: "bottomleft" }).addTo(instancia);
    mapa.current = instancia;

    return () => {
      marcadores.current = [];
      instancia.remove();
      mapa.current = null;
    };
  }, [leaflet, locaisComPosicao.length]);

  useEffect(() => {
    if (!leaflet || !mapa.current) return;

    marcadores.current.forEach((marcador) => marcador.remove());
    marcadores.current = locaisComPosicao.map((local) => {
      const marcador = leaflet
        .marker(leaflet.latLng(local.latitude!, local.longitude!), { icon: criarIcone(leaflet) })
        .addTo(mapa.current!);
      marcador.on("click", () => onSelect(local));
      marcador.bindTooltip(local.nome, { direction: "top", offset: [0, -38] });
      return marcador;
    });

    if (locaisComPosicao.length > 1) {
      mapa.current.fitBounds(
        leaflet.latLngBounds(
          locaisComPosicao.map((local) => leaflet.latLng(local.latitude!, local.longitude!)),
        ),
        { padding: [48, 48], maxZoom: 15 },
      );
    }
  }, [leaflet, locations, onSelect]);

  useEffect(() => {
    if (leaflet && localSelecionadoNoMapa && mapa.current) {
      mapa.current.flyTo(
        leaflet.latLng(localSelecionadoNoMapa.latitude!, localSelecionadoNoMapa.longitude!),
        Math.max(mapa.current.getZoom(), 15),
      );
    }
  }, [leaflet, localSelecionadoNoMapa]);

  return (
    <div
      className="relative isolate z-0 min-h-[390px] overflow-hidden rounded-2xl border border-border bg-[#e8eee8] shadow-panel"
      aria-label="Mapa real dos locais de coleta"
    >
      {locaisComPosicao.length > 0 ? (
        <>
          <div ref={elementoDoMapa} className="absolute inset-0" />
          <div className="pointer-events-none absolute left-4 right-4 top-4 z-[500] max-w-sm rounded-xl border border-white/80 bg-white/95 px-4 py-3 shadow-panel sm:right-auto">
            <p className="text-sm font-bold text-foreground">
              {selectedLocation?.nome ??
                `${locaisComPosicao.length} ${
                  locaisComPosicao.length === 1 ? "local no mapa" : "locais no mapa"
                }`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedLocation?.endereco ??
                "Toque em um marcador ou selecione um local da lista"}
            </p>
            {selectedLocation && !localSelecionadoNoMapa && (
              <p className="mt-1 text-xs font-semibold text-primary">
                Este local ainda não tem posição confirmada no mapa.
              </p>
            )}
            {localSelecionadoNoMapa?.positionApproximate && (
              <p className="mt-1 text-xs font-semibold text-primary">
                Posição aproximada pelo endereço
              </p>
            )}
            {!selectedLocation && semPosicao > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {semPosicao} {semPosicao === 1 ? "local sem posição confirmada" : "locais sem posição confirmada"}
              </p>
            )}
          </div>
        </>
      ) : (
        <div
          className="flex min-h-[390px] items-center justify-center px-8 text-center text-sm text-muted-foreground"
          role="status"
        >
          {loading
            ? "Carregando mapa..."
            : selectedLocation
              ? `${selectedLocation.nome}: posição ainda não confirmada no mapa.`
              : "Ainda não há locais com posição confirmada para mostrar no mapa."}
        </div>
      )}
    </div>
  );
}
