import type { ActionPublic } from "@/types/action_types";
import type { IsPerformedPublic } from "@/types/is_performed_types";
import type { ReservationPublic } from "@/types/reservation_types";
import type { VehiclePublic } from "@/types/vehicle_types";
import type { VehModelPublic } from "@/types/vehmodel_types";
import { ActionType } from "@/types/action_types";

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

interface AdminReportProps {
  vehicles: VehiclePublic[];
  models: VehModelPublic[];
  reservations: ReservationPublic[];
  actions: ActionPublic[];
  isPerformeds: IsPerformedPublic[];
  makes: any[];
}

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLastMonths = (count: number) => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const monthIndex = now.getMonth() - (count - 1 - index);
    const monthDate = new Date(now.getFullYear(), monthIndex, 1);
    const monthName = monthDate.toLocaleString("pl-PL", { month: "short" });
    return {
      label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      end: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
    };
  });
};

const getOverlapDays = (from: Date, to: Date, rangeStart: Date, rangeEnd: Date) => {
  const start = from > rangeStart ? from : rangeStart;
  const end = to < rangeEnd ? to : rangeEnd;
  if (end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const clampValue = (value: number) => Math.max(0, Math.min(value, 100));

export default function AdminReport({ vehicles, models, reservations, actions, isPerformeds, makes }: AdminReportProps) {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const modelMap = new Map(models.map((m) => [m.id, m]));
  const actionMap = new Map(actions.map((a) => [a.id, a.type]));
  const reservationMap = new Map(reservations.map((r) => [r.id, r]));
  const makeMap = new Map(makes.map((m) => [m.id, m]));

  const vehicleCostsMap = new Map<number, { label: string; service: number; exploitation: number }>();

  isPerformeds.forEach((performed) => {
    const actionType = actionMap.get(performed.action_id);
    if (!actionType) return;
    
    const reservation = reservationMap.get(performed.reservation_id);
    if (!reservation) return;
    
    const vehicle = typeof reservation.vehicle_id === "number" ? vehicleMap.get(reservation.vehicle_id) : undefined;
    if (!vehicle) return;
    
    const model = modelMap.get(vehicle.veh_model_id);
    if (!model) return;

    const make = makeMap.get((model as any).make_id);
    const makeName = make && make.name ? `${make.name} ` : "";

    if (!vehicleCostsMap.has(vehicle.id)) {
      vehicleCostsMap.set(vehicle.id, {
        label: `${makeName}${model.name} (ID:${vehicle.id})`,
        service: 0,
        exploitation: 0,
      });
    }

    const vCost = vehicleCostsMap.get(vehicle.id)!;
    if (actionType === ActionType.SERVICE) vCost.service += performed.price;
    if (actionType === ActionType.EXPLOITATION) vCost.exploitation += performed.price;
  });

  const vehicleCostsData = [...vehicleCostsMap.values()]
    .sort((a, b) => (b.service + b.exploitation) - (a.service + a.exploitation))
    .slice(0, 8);

  const maxSingleCost = Math.max(
    ...vehicleCostsData.map((v) => Math.max(v.service, v.exploitation)),
    1
  );

  const totalServiceCost = [...vehicleCostsMap.values()].reduce((sum, v) => sum + v.service, 0);
  const totalExploitationCost = [...vehicleCostsMap.values()].reduce((sum, v) => sum + v.exploitation, 0);
  const totalOverallCost = totalServiceCost + totalExploitationCost;

 
  const months = getLastMonths(12);
  const totalVehicles = Math.max(vehicles.length, 1);

  const occupancy = months.map((month) => {
    let reservedDays = 0;
    reservations.forEach((reservation) => {
      if (reservation.state === "canceled") return;
      const start = parseDate(reservation.date_start_planned);
      const end = parseDate(reservation.date_end_planned);
      if (!start || !end) return;
      reservedDays += getOverlapDays(start, end, month.start, month.end);
    });
    const monthDays = month.end.getDate();
    const totalPossibleDays = totalVehicles * monthDays;
    return {
      label: month.label,
      percent: totalPossibleDays ? Math.round((reservedDays / totalPossibleDays) * 100) : 0,
    };
  });

  
  const svgPoints = occupancy.map((item, index) => {
    const x = 30 + index * 76;
    const y = 140 - clampValue(item.percent) * 1.2;
    return { x, y, percent: item.percent, label: item.label };
  });

 
  let smoothLinePath = "";
  if (svgPoints.length > 0) {
    smoothLinePath = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 1; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1];
      const curr = svgPoints[i];
      const midX = (prev.x + curr.x) / 2;
      smoothLinePath += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }


  const modelStatsMap = new Map<string, { label: string; count: number; days: number }>();

  reservations.forEach((reservation) => {
    if (reservation.state === "canceled") return;
    
    const vehicle = typeof reservation.vehicle_id === "number" ? vehicleMap.get(reservation.vehicle_id) : undefined;
    if (!vehicle) return;
    
    const model = modelMap.get(vehicle.veh_model_id);
    if (!model) return;
    
    const make = makeMap.get((model as any).make_id);
    const makeName = make && make.name ? `${make.name} ` : "";
    const key = `${makeName}${model.name}`;

    const start = parseDate(reservation.date_start_planned);
    const end = parseDate(reservation.date_end_planned);
    
    let days = 0;
    if (start && end) {
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    if (!modelStatsMap.has(key)) {
      modelStatsMap.set(key, { label: key, count: 0, days: 0 });
    }
    
    const stats = modelStatsMap.get(key)!;
    stats.count += 1;
    stats.days += days;
  });

  const selectedModels = [...modelStatsMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* --- GÓRNY RZĄD: KOSZTY + MODELE --- */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        
        {/* LEWA KOLUMNA: KOSZTY (SŁUPKOWY) */}
        <section className="glass-elevated rounded-[2rem] border border-white/5 p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Koszty per Pojazd</h3>
              <p className="text-sm text-white/60">Zestawienie kosztów serwisowych i eksploatacyjnych (Top 8).</p>
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium text-white/70 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400"></span> Serwis
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span> Eksploatacja
              </div>
            </div>
          </div>

          {/* Wykres */}
          <div className="flex-1 flex items-stretch gap-2 sm:gap-6 mt-auto overflow-x-auto pb-2 px-2 custom-scrollbar pt-4">
            {vehicleCostsData.length > 0 ? (
              vehicleCostsData.map((v) => (
                <div key={v.label} className="flex flex-col items-center justify-end flex-shrink-0 w-20 sm:w-24 group cursor-pointer">
                  <div className="flex items-end gap-1 h-44 w-full justify-center relative bg-white/[0.02] rounded-t-xl border-b border-white/10">
                    
                    {/* W słupkach max 80% zamiast 100%, aby na górze zostało miejsce na tekst dla najwyższego słupka */}
                    <div 
                      className="w-full max-w-[1.5rem] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md relative transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${(v.service / maxSingleCost) * 80}%`, minHeight: v.service > 0 ? '4px' : '0' }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1.5 py-0.5 rounded z-10">
                        {v.service > 0 ? currencyFormatter.format(v.service) : ''}
                      </span>
                    </div>

                    <div 
                      className="w-full max-w-[1.5rem] bg-gradient-to-t from-purple-600 to-purple-500 rounded-t-md relative transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${(v.exploitation / maxSingleCost) * 80}%`, minHeight: v.exploitation > 0 ? '4px' : '0' }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1.5 py-0.5 rounded z-10">
                        {v.exploitation > 0 ? currencyFormatter.format(v.exploitation) : ''}
                      </span>
                    </div>

                  </div>
                  <div className="text-[10px] font-medium text-center text-white/50 leading-tight w-full break-words mt-3 h-8">
                    {v.label}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                Brak danych o kosztach dla pojazdów.
              </div>
            )}
          </div>

          {/* PODSUMOWANIE KOSZTÓW */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mb-1">
                Łączne koszty floty
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                {currencyFormatter.format(totalOverallCost)}
              </div>
            </div>
            
            <div className="flex gap-6 bg-black/20 px-4 py-3 rounded-2xl border border-white/5">
              <div>
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Całkowity Serwis</div>
                <div className="text-sm font-bold text-cyan-400">
                  {currencyFormatter.format(totalServiceCost)}
                </div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Całkowita Eksploatacja</div>
                <div className="text-sm font-bold text-purple-400">
                  {currencyFormatter.format(totalExploitationCost)}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* PRAWA KOLUMNA: NAJCZĘŚCIEJ WYBIERANE MODELE */}
        <section className="glass-elevated rounded-[2rem] border border-white/5 p-6 flex flex-col min-h-[400px]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Top Modele</h3>
            <p className="text-sm text-white/60">Zestawienie liczby rezerwacji i dni.</p>
          </div>

          {selectedModels.length > 0 ? (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-1">
              {selectedModels.map((item, index) => (
                <div 
                  key={item.label} 
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group flex flex-col justify-center"
                >
                  <div className="absolute -right-2 -bottom-4 text-7xl font-black text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-base font-bold text-white mb-2 truncate pr-6" title={item.label}>
                      {item.label}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Rezerwacje</span>
                        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                          {item.count}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Dni wynajmu</span>
                        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          {item.days}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-sm text-white/50">Brak wystarczających danych.</p>
            </div>
          )}
        </section>
      </div>

      {/* --- DOLNY RZĄD: OBŁOŻENIE FLOTY (PEŁNA SZEROKOŚĆ) --- */}
      <section className="glass-elevated rounded-[2rem] border border-white/5 p-6 flex flex-col">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">Obłożenie floty</h3>
          <p className="text-sm text-white/60">Ile procent dni w miesiącu było zajętych dla całej floty (Ostatnie 12 miesięcy).</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <svg viewBox="0 0 900 140" className="w-full h-full min-h-[140px] overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            
            <path
              d={smoothLinePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {svgPoints.map((item) => (
              <g key={item.label}>
                <circle cx={item.x} cy={item.y} r="5" fill="#38bdf8" />
                <text x={item.x} y={item.y - 12} textAnchor="middle" className="text-[11px] font-bold fill-white">
                  {item.percent}%
                </text>
              </g>
            ))}
          </svg>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mt-6 text-xs text-white/70 text-center">
            {svgPoints.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="font-semibold text-white truncate" title={item.label}>{item.label}</div>
                <div>{item.percent}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

