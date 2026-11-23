import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  alertCircleOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeOutline,
  layersOutline,
  sparklesOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { FilterOption, Incident, IncidentPriority } from '../types/incident';

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-101',
    title: 'Fallo de enlace en Switch Rack B',
    location: 'Aula 204 - Redes',
    description: 'Pérdida intermitente de paquetes en puertos Gigabit 12 al 16.',
    priority: 'alta',
    status: 'pendiente',
    createdAt: '09:15',
  },
  {
    id: 'INC-102',
    title: 'Actualización de imágenes Docker',
    location: 'Laboratorio DAM 2',
    description: 'Desplegar imagen base Node 22 Alpine en estaciones de trabajo.',
    priority: 'media',
    status: 'pendiente',
    createdAt: '10:30',
  },
  {
    id: 'INC-103',
    title: 'Calibración de proyector láser',
    location: 'Aula Magna',
    description: 'Ajuste trapezoidal y verificación de entrada HDMI.',
    priority: 'baja',
    status: 'resuelta',
    createdAt: 'Ayer',
  },
];

// Etiquetas neo-brutalistas de prioridad con contraste WCAG AAA (> 7:1)
const PRIORITY_BADGE_STYLES: Record<IncidentPriority, string> = {
  alta: 'bg-gum-coral text-ink border-ink',
  media: 'bg-gum-yellow text-ink border-ink',
  baja: 'bg-gum-mint text-ink border-ink',
};

const PRIORITY_STRIPE_STYLES: Record<IncidentPriority, string> = {
  alta: 'bg-gum-coral',
  media: 'bg-gum-yellow',
  baja: 'bg-gum-pink',
};

const formatLiveClock = (): string =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

const Home: React.FC = () => {
  // Estado principal de datos y controles UI
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todas');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState<string>(formatLiveClock);

  // Estado controlado del formulario modal
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IncidentPriority>('media');

  // Referencia a IonList para cerrar elementos deslizados programáticamente
  const listRef = useRef<HTMLIonListElement | null>(null);

  // Reloj en tiempo real con tabular-nums
  useEffect(() => {
    const timer = window.setInterval(() => setLiveClock(formatLiveClock()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Cálculo memoizado de indicadores KPI (CE 3.e: optimización de renderizado)
  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((item) => item.status === 'pendiente').length;
    const resolved = incidents.filter((item) => item.status === 'resuelta').length;
    const critical = incidents.filter(
      (item) => item.status === 'pendiente' && item.priority === 'alta'
    ).length;
    const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, resolved, critical, resolvedPct };
  }, [incidents]);

  // Filtrado combinado por estado y búsqueda textual
  const filteredIncidents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return incidents.filter((item) => {
      const matchesStatus = activeFilter === 'todas' || item.status === activeFilter;
      const matchesQuery =
        normalizedQuery === '' ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.location.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [incidents, activeFilter, searchQuery]);

  // Gesto nativo Pull-to-Refresh
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      setToastMessage('Estado sincronizado con el servidor');
      event.detail.complete();
    }, 700);
  };

  // Alternar estado pendiente / resuelta desde IonItemSliding o IonChip
  const handleToggleStatus = async (id: string) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'pendiente' ? 'resuelta' : 'pendiente' }
          : item
      )
    );
    await listRef.current?.closeSlidingItems();
    setToastMessage('Estado de incidencia actualizado');
  };

  // Eliminación de elemento
  const handleDeleteIncident = async (id: string) => {
    setIncidents((prev) => prev.filter((item) => item.id !== id));
    await listRef.current?.closeSlidingItems();
    setToastMessage(`Incidencia ${id} eliminada`);
  };

  // Creación de nueva incidencia desde IonModal
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setToastMessage('El título y la ubicación son obligatorios');
      return;
    }

    const newIncident: Incident = {
      id: `INC-${Math.floor(104 + Math.random() * 895)}`,
      title: title.trim(),
      location: location.trim(),
      description: description.trim() || 'Sin observaciones adicionales.',
      priority,
      status: 'pendiente',
      createdAt: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setTitle('');
    setLocation('');
    setDescription('');
    setPriority('media');
    setIsModalOpen(false);
    setToastMessage(`Incidencia ${newIncident.id} registrada`);
  };

  return (
    <IonPage>
      {/* Barra superior fija estilo Gumroad dividida con bordes negros de 2px */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="neo-toolbar">
          <IonTitle className="px-4 font-sans text-base font-bold tracking-tight text-ink">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-gum-pink font-display text-xs font-extrabold text-ink">
                S
              </span>
              <span>SmartLab</span>
              <span className="hidden font-mono text-xs font-normal tabular-nums text-neutral-600 md:inline">
                · {liveClock}
              </span>
            </span>
          </IonTitle>

          <IonButtons slot="end" className="h-[56px]">
            <div className="flex h-[56px] items-stretch">
              <div className="flex items-center gap-2 border-l-2 border-ink bg-white px-3 sm:px-4">
                <span className="hidden text-xs font-semibold text-ink sm:inline">
                  Pendientes
                </span>
                <IonBadge
                  color="secondary"
                  className="rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-ink"
                >
                  {metrics.pending}
                </IonBadge>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex h-full items-center gap-1.5 border-l-2 border-ink bg-ink px-3.5 text-xs font-bold text-white transition-colors duration-150 hover:bg-gum-pink hover:text-ink sm:px-5 sm:text-sm"
              >
                <span>Nueva</span>
                <span className="hidden sm:inline">incidencia</span>
              </button>
            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="bg-cream">
        {/* Control táctil Pull-to-Refresh */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Sincronizando..."
          />
        </IonRefresher>

        {/* Layout principal en unidades vh/dvh + efecto Page Recede al abrir el modal */}
        <div
          className={`brutal-stage flex min-h-[100vh] min-h-[100dvh] flex-col justify-between bg-cream text-ink ${
            isModalOpen ? 'is-receded' : ''
          }`}
        >
          {/* Cabecera monumental + Hero dividido 50/50 rosa/amarillo estilo Gumroad (vh) */}
          <header className="w-full border-b-2 border-ink bg-white">
            {/* Wordmark tipográfico brutalista a ancho completo en una sola línea */}
            <div className="border-b-2 border-ink bg-white px-3 py-3 text-center sm:px-4 sm:py-4">
              <p className="whitespace-nowrap font-display text-[clamp(1.75rem,8.5vw,7.25rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.045em] text-ink select-none">
                SMARTLAB
              </p>
            </div>

            {/* Split Hero 50/50 dimensionado con min-h-[30vh] md:min-h-[34vh] */}
            <div className="grid min-h-[30vh] grid-cols-1 md:min-h-[34vh] md:grid-cols-2">
              {/* Mitad izquierda: Rosa Gumroad + titular moderno + CTA negro interactivo */}
              <div className="flex flex-col justify-center border-b-2 border-ink bg-gum-pink p-6 sm:p-10 md:border-b-0 md:border-r-2">
                <div className="mx-auto w-full max-w-lg">
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-ink shadow-neo-sm">
                    <IonIcon icon={sparklesOutline} className="text-xs" />
                    Panel Operativo DAM
                  </span>

                  <h1 className="mt-4 font-sans text-[clamp(1.9rem,4.1vw,3.35rem)] font-bold leading-[1.03] tracking-[-0.035em] text-ink">
                    De incidencia a resuelta en minutos.
                  </h1>

                  <p className="mt-3.5 max-w-md text-sm leading-relaxed text-ink/90 sm:text-base">
                    Controla aulas, redes y laboratorios desde un panel táctil moderno. Filtra,
                    prioriza y actualiza el estado de cada aviso sin fricción.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="group inline-flex min-h-[48px] items-center gap-2 rounded-[6px] border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-white transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:bg-gum-yellow hover:text-ink hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <span>Registrar incidencia</span>
                      <IonIcon
                        icon={arrowForwardOutline}
                        className="text-base transition-transform duration-150 group-hover:translate-x-1"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFilter('pendiente')}
                      className="inline-flex min-h-[48px] items-center rounded-[6px] border-2 border-ink bg-white px-5 py-3 text-sm font-bold text-ink shadow-neo-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      Ver pendientes ({metrics.pending})
                    </button>
                  </div>
                </div>
              </div>

              {/* Mitad derecha: Amarillo Gumroad + pegatina orgánica rosa + tarjeta en vivo */}
              <div className="group relative flex items-center justify-center overflow-hidden bg-gum-yellow p-6 sm:p-10">
                {/* Silueta orgánica rosa con trazo negro grueso (referencia directa al arte de Gumroad) */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 420 320"
                  className="pointer-events-none absolute h-[92%] w-[92%] max-w-md transition-transform duration-300 group-hover:scale-[1.03]"
                >
                  <path
                    d="M72,56 C135,14 282,12 346,66 C406,116 402,216 340,266 C276,316 142,312 74,264 C16,222 14,96 72,56 Z"
                    fill="#FF90E8"
                    stroke="#000000"
                    strokeWidth="3"
                  />
                </svg>

                {/* Tarjeta interactiva neo-brutalista de pulso del laboratorio */}
                <div className="relative z-10 w-full max-w-sm rounded-[14px] border-2 border-ink bg-white p-5 shadow-neo-lg transition-transform duration-200 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                    <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-ink">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-ink bg-gum-mint" />
                      Monitor en vivo
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-ink">
                      {liveClock}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">
                        Ratio de resolución
                      </p>
                      <p className="font-sans text-4xl font-bold leading-none tracking-[-0.04em] text-ink tabular-nums sm:text-5xl">
                        {metrics.resolvedPct}%
                      </p>
                    </div>
                    <span className="rounded-full border-2 border-ink bg-gum-mint px-3 py-1 font-mono text-xs font-bold text-ink">
                      {metrics.resolved}/{metrics.total} OK
                    </span>
                  </div>

                  {/* Barra de progreso chunky neo-brutalista */}
                  <div className="mt-4 h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                    <div
                      className="h-full border-r-2 border-ink bg-gum-pink transition-all duration-300"
                      style={{ width: `${Math.max(metrics.resolvedPct, 12)}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border-2 border-ink bg-gum-coral px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink">
                      {metrics.critical} críticas
                    </span>
                    <span className="rounded-full border-2 border-ink bg-gum-yellow px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink">
                      {metrics.pending} pendientes
                    </span>
                  </div>
                </div>

                {/* Pegatinas apiladas en esquina inferior izquierda (guiño a los discos G-G-G) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 left-4 z-20 hidden items-center -space-x-3 transition-transform duration-200 group-hover:-rotate-6 sm:flex"
                >
                  <span className="flex h-10 w-10 -rotate-12 items-center justify-center rounded-full border-2 border-ink bg-gum-pink font-display text-sm font-extrabold text-ink shadow-neo-sm">
                    S
                  </span>
                  <span className="flex h-10 w-10 rotate-6 items-center justify-center rounded-full border-2 border-ink bg-gum-pink font-display text-sm font-extrabold text-ink shadow-neo-sm">
                    L
                  </span>
                  <span className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-full border-2 border-ink bg-white font-mono text-xs font-bold text-ink shadow-neo-sm">
                    26
                  </span>
                </div>

                {/* Pastilla flotante inferior derecha (guiño a la cápsula de autor de Gumroad) */}
                <div className="pointer-events-none absolute bottom-3 right-4 z-20 hidden items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-1.5 pr-3.5 shadow-neo-sm sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-gum-pink font-display text-xs font-extrabold text-ink">
                    S
                  </span>
                  <span className="text-xs font-bold text-ink">SmartLab Live</span>
                </div>
              </div>
            </div>
          </header>

          {/* Contenedor operativo central dimensionado con min-h-[54vh] */}
          <main className="mx-auto flex min-h-[54vh] w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-7 sm:px-6">
            {/* Bloque 1: Panel de métricas KPI neo-brutalistas interactivas con Tailwind Grid */}
            <section aria-label="Resumen de métricas" className="mb-8">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-sans text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
                  Estado operativo
                </h2>
                <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5 font-mono text-[11px] font-bold text-ink shadow-neo-sm">
                  Pulsa una tarjeta para filtrar
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {/* KPI 01 - Total */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('todas')}
                  className={`group flex min-h-[14vh] flex-col justify-between rounded-[10px] border-2 border-ink p-4 text-left transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                    activeFilter === 'todas'
                      ? 'bg-ink text-white shadow-neo-pink'
                      : 'bg-white text-ink shadow-neo'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide">
                      Total
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink transition-transform duration-200 group-hover:rotate-12 ${
                        activeFilter === 'todas'
                          ? 'bg-gum-pink text-ink'
                          : 'bg-cream text-ink'
                      }`}
                    >
                      <IonIcon icon={layersOutline} className="text-base" />
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-4xl font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-5xl">
                    {metrics.total}
                  </p>
                </button>

                {/* KPI 02 - Pendientes */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('pendiente')}
                  className={`group flex min-h-[14vh] flex-col justify-between rounded-[10px] border-2 border-ink p-4 text-left transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                    activeFilter === 'pendiente'
                      ? 'bg-ink text-gum-yellow shadow-neo-yellow'
                      : 'bg-gum-yellow text-ink shadow-neo'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide">
                      Pendientes
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white text-ink transition-transform duration-200 group-hover:rotate-12">
                      <IonIcon icon={timeOutline} className="text-base" />
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-4xl font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-5xl">
                    {metrics.pending}
                  </p>
                </button>

                {/* KPI 03 - Críticas */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('pendiente')}
                  className="group flex min-h-[14vh] flex-col justify-between rounded-[10px] border-2 border-ink bg-gum-coral p-4 text-left text-ink shadow-neo transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide">
                      Críticas
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white text-ink transition-transform duration-200 group-hover:rotate-12">
                      <IonIcon icon={alertCircleOutline} className="text-base" />
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-4xl font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-5xl">
                    {metrics.critical}
                  </p>
                </button>

                {/* KPI 04 - Resueltas */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('resuelta')}
                  className={`group flex min-h-[14vh] flex-col justify-between rounded-[10px] border-2 border-ink p-4 text-left transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                    activeFilter === 'resuelta'
                      ? 'bg-ink text-gum-mint shadow-neo-pink'
                      : 'bg-gum-mint text-ink shadow-neo'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide">
                      Resueltas
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white text-ink transition-transform duration-200 group-hover:rotate-12">
                      <IonIcon icon={checkmarkCircleOutline} className="text-base" />
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-4xl font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-5xl">
                    {metrics.resolved}
                  </p>
                </button>
              </div>
            </section>

            {/* Bloque 2: Buscador neo-brutalista y selector segmentado */}
            <section
              aria-label="Filtros de búsqueda"
              className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-6">
                <IonSearchbar
                  value={searchQuery}
                  onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
                  placeholder="Buscar por código, título o aula..."
                  debounce={200}
                  className="neo-searchbar"
                  aria-label="Buscar incidencias"
                />
              </div>

              <div className="md:col-span-6">
                <IonSegment
                  value={activeFilter}
                  className="neo-segment"
                  onIonChange={(e) =>
                    setActiveFilter((e.detail.value as FilterOption) ?? 'todas')
                  }
                >
                  <IonSegmentButton value="todas">
                    <IonLabel>Todas ({metrics.total})</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="pendiente">
                    <IonLabel>Pendientes ({metrics.pending})</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="resuelta">
                    <IonLabel>Resueltas ({metrics.resolved})</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </section>

            {/* Bloque 3: Listado interactivo con contadores CSS, tarjetas táctiles y gestos swipe */}
            <section aria-label="Listado de incidencias" className="flex flex-1 flex-col">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-sans text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
                  Incidencias registradas ({filteredIncidents.length})
                </h2>
                <span className="font-mono text-xs text-neutral-600">
                  Desliza a la izquierda para acciones →
                </span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="flex min-h-[26vh] flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-ink bg-white p-8 text-center shadow-neo">
                  <span className="rounded-full border-2 border-ink bg-gum-pink px-3 py-1 font-mono text-xs font-bold text-ink">
                    0 resultados
                  </span>
                  <p className="mt-3 text-base font-bold text-ink">
                    No existen incidencias que coincidan con el filtro aplicado.
                  </p>
                </div>
              ) : (
                <IonList
                  ref={listRef}
                  lines="none"
                  className="brutal-incident-list space-y-4 bg-transparent p-0"
                >
                  {filteredIncidents.map((incident, idx) => (
                    <IonItemSliding
                      key={incident.id}
                      style={{ animationDelay: `${idx * 65}ms` }}
                      className="brutal-incident-row animate-neo-pop group overflow-hidden rounded-[12px] border-2 border-ink bg-white shadow-neo transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg"
                    >
                      <IonItem className="[--background:#ffffff] [--inner-padding-end:16px] [--padding-start:0px]">
                        <div className="flex w-full">
                          {/* Franja lateral de color Gumroad según estado/prioridad */}
                          <span
                            aria-hidden="true"
                            className={`w-2.5 shrink-0 border-r-2 border-ink transition-colors duration-200 ${
                              incident.status === 'resuelta'
                                ? 'bg-gum-mint'
                                : PRIORITY_STRIPE_STYLES[incident.priority]
                            }`}
                          />

                          <div className="w-full py-4 pl-4 pr-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="brutal-incident-index inline-flex h-6 min-w-[26px] items-center justify-center rounded-full border-2 border-ink bg-gum-pink px-1.5 font-mono text-[11px] font-bold text-ink" />
                                <span className="rounded-[4px] border-2 border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white">
                                  {incident.id}
                                </span>
                                <span
                                  className={`rounded-full border-2 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${
                                    PRIORITY_BADGE_STYLES[incident.priority]
                                  }`}
                                >
                                  {incident.priority}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold tabular-nums text-neutral-600">
                                {incident.createdAt}
                              </span>
                            </div>

                            <h3
                              className={`mt-2.5 font-sans text-lg font-bold tracking-tight transition-colors duration-150 ${
                                incident.status === 'resuelta'
                                  ? 'text-neutral-500 line-through decoration-2'
                                  : 'text-ink'
                              }`}
                            >
                              {incident.title}
                            </h3>

                            <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                              {incident.description}
                            </p>

                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink/10 pt-3">
                              <span className="text-xs font-medium text-neutral-600">
                                Ubicación:{' '}
                                <strong className="font-bold text-ink">
                                  {incident.location}
                                </strong>
                              </span>

                              <IonChip
                                className={`m-0 h-8 rounded-full border-2 border-ink px-3.5 font-sans text-xs font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-sm active:translate-x-0 active:translate-y-0 active:shadow-none ${
                                  incident.status === 'resuelta'
                                    ? 'neo-chip-resolved'
                                    : 'neo-chip-pending'
                                }`}
                                onClick={() => handleToggleStatus(incident.id)}
                              >
                                {incident.status === 'resuelta' ? 'Resuelta ✓' : 'Pendiente ●'}
                              </IonChip>
                            </div>
                          </div>
                        </div>
                      </IonItem>

                      {/* Opciones ocultas tras deslizamiento horizontal */}
                      <IonItemOptions side="end">
                        <IonItemOption
                          color="success"
                          onClick={() => handleToggleStatus(incident.id)}
                        >
                          <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
                        </IonItemOption>
                        <IonItemOption
                          color="danger"
                          onClick={() => handleDeleteIncident(incident.id)}
                        >
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </IonList>
              )}
            </section>
          </main>

          {/* Footer neo-brutalista negro con acento rosa Gumroad y altura en vh */}
          <footer className="flex min-h-[10vh] items-center border-t-2 border-ink bg-ink text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 py-4 pl-4 pr-24 sm:pl-6 sm:pr-28">
              <div className="flex items-center gap-2.5 text-xs font-semibold sm:text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gum-pink font-display text-xs font-extrabold text-ink">
                  S
                </span>
                <span>SmartLab — Ionic React + Tailwind</span>
              </div>
              <span className="font-sans text-2xl font-bold leading-none tracking-tight text-gum-pink">
                ©26
              </span>
            </div>
          </footer>
        </div>

        {/* Botón de acción flotante (FAB) neo-brutalista rosa con hover amarillo (>= 48x48px) */}
        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="mb-4 mr-4">
          <IonFabButton
            className="neo-fab group"
            onClick={() => setIsModalOpen(true)}
            aria-label="Registrar nueva incidencia"
          >
            <IonIcon
              icon={addOutline}
              className="transition-transform duration-200 group-hover:rotate-90"
            />
          </IonFabButton>
        </IonFab>

        {/* Modal de alta de nueva incidencia en estética Gumroad Neo-Brutalista */}
        <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar className="neo-modal-toolbar">
              <IonTitle className="font-sans text-base font-bold tracking-tight text-ink">
                Nueva incidencia
              </IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Cerrar formulario"
                  className="text-ink"
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding bg-cream">
            <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col justify-between py-2">
              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="rounded-[8px] border-2 border-ink bg-gum-yellow px-4 py-3 text-sm font-semibold text-ink shadow-neo-sm">
                  Registra un nuevo evento técnico y aparecerá al instante en el panel operativo.
                </div>

                <IonItem className="rounded-[8px] border-2 border-ink bg-white shadow-neo [--background:#ffffff] [--border-width:0]">
                  <IonInput
                    label="Título de la incidencia *"
                    labelPlacement="stacked"
                    placeholder="Ej. Error de compilación en SDK"
                    value={title}
                    onIonInput={(e) => setTitle(e.detail.value ?? '')}
                    required
                  />
                </IonItem>

                <IonItem className="rounded-[8px] border-2 border-ink bg-white shadow-neo [--background:#ffffff] [--border-width:0]">
                  <IonInput
                    label="Aula o Ubicación *"
                    labelPlacement="stacked"
                    placeholder="Ej. Laboratorio 102"
                    value={location}
                    onIonInput={(e) => setLocation(e.detail.value ?? '')}
                    required
                  />
                </IonItem>

                <IonItem className="rounded-[8px] border-2 border-ink bg-white shadow-neo [--background:#ffffff] [--border-width:0]">
                  <IonSelect
                    label="Nivel de Prioridad"
                    labelPlacement="stacked"
                    value={priority}
                    onIonChange={(e) => setPriority(e.detail.value as IncidentPriority)}
                  >
                    <IonSelectOption value="alta">Alta (Crítica)</IonSelectOption>
                    <IonSelectOption value="media">Media (Operativa)</IonSelectOption>
                    <IonSelectOption value="baja">Baja (Mantenimiento)</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="rounded-[8px] border-2 border-ink bg-white shadow-neo [--background:#ffffff] [--border-width:0]">
                  <IonTextarea
                    label="Descripción técnica"
                    labelPlacement="stacked"
                    rows={4}
                    placeholder="Detalla los síntomas observados..."
                    value={description}
                    onIonInput={(e) => setDescription(e.detail.value ?? '')}
                  />
                </IonItem>

                <div className="pt-2">
                  <IonButton expand="block" type="submit" className="neo-submit">
                    Guardar incidencia
                  </IonButton>
                </div>
              </form>
            </div>
          </IonContent>
        </IonModal>

        {/* Notificación Toast de confirmación */}
        <IonToast
          isOpen={toastMessage !== null}
          message={toastMessage ?? ''}
          duration={2200}
          position="bottom"
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
