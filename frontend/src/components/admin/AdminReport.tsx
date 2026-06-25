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

const renderProgressBar = (value: number, maxValue: number) => {
  const width = maxValue > 0 ? clampValue((value / maxValue) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default function AdminReport({ vehicles, models, reservations, actions, isPerformeds }: AdminReportProps) {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const modelMap = new Map(models.map((m) => [m.id, m]));
  const actionMap = new Map(actions.map((a) => [a.id, a.type]));
  const reservationMap = new Map(reservations.map((r) => [r.id, r]));

  const serviceCosts = new Map<string, number>();
  const exploitationCosts = new Map<string, number>();

  isPerformeds.forEach((performed) => {
    const actionType = actionMap.get(performed.action_id);
    if (!actionType) return;
    const reservation = reservationMap.get(performed.reservation_id);
    if (!reservation) return;
    const vehicle = typeof reservation.vehicle_id === "number" ? vehicleMap.get(reservation.vehicle_id) : undefined;
    if (!vehicle) return;
    const model = modelMap.get(vehicle.veh_model_id);
    if (!model) return;
    const modelName = `${model.make_name} ${model.name}`;
    const targetMap = actionType === ActionType.SERVICE ? serviceCosts : actionType === ActionType.EXPLOITATION ? exploitationCosts : null;
    if (!targetMap) return;
    targetMap.set(modelName, (targetMap.get(modelName) ?? 0) + performed.price);
  });

  const costChartData = (source: Map<string, number>) =>
    [...source.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

  const serviceChart = costChartData(serviceCosts);
  const exploitationChart = costChartData(exploitationCosts);
  const maxCost = Math.max(
    ...serviceChart.map((item) => item.value),
    ...exploitationChart.map((item) => item.value),
    1,
  );

  const months = getLastMonths(6);
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
      raw: reservedDays,
    };
  });

  const modelReservationCounts = new Map<string, number>();
  reservations.forEach((reservation) => {
    if (reservation.state === "canceled") return;
    const vehicle = typeof reservation.vehicle_id === "number" ? vehicleMap.get(reservation.vehicle_id) : undefined;
    if (!vehicle) return;
    const model = modelMap.get(vehicle.veh_model_id);
    if (!model) return;
    const key = `${model.make_name} ${model.name}`;
    modelReservationCounts.set(key, (modelReservationCounts.get(key) ?? 0) + 1);
  });

  const selectedModels = [...modelReservationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const maxModelCount = Math.max(...selectedModels.map((item) => item.count), 1);

  const linePoints = occupancy
    .map((item, index) => {
      const x = 20 + index * 140;
      const y = 140 - clampValue(item.percent) * 1.2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-elevated rounded-[2rem] border border-white/5 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold text-white">Koszty serwisowe i eksploatacyjne</h3>
              <p className="text-sm text-white/60">Podsumowanie kosztów według modelu pojazdu.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Serwisowe</span>
                <span className="text-sm text-white/60">Top modele</span>
              </div>
              {serviceChart.length > 0 ? (
                serviceChart.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{item.label}</span>
                      <span>{currencyFormatter.format(item.value)}</span>
                    </div>
                    {renderProgressBar(item.value, maxCost)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/50">Brak danych o kosztach serwisowych.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Eksploatacyjne</span>
                <span className="text-sm text-white/60">Top modele</span>
              </div>
              {exploitationChart.length > 0 ? (
                exploitationChart.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{item.label}</span>
                      <span>{currencyFormatter.format(item.value)}</span>
                    </div>
                    {renderProgressBar(item.value, maxCost)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/50">Brak danych o kosztach eksploatacyjnych.</p>
              )}
            </div>
          </div>
        </section>

        <section className="glass-elevated rounded-[2rem] border border-white/5 p-6">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-white">Obłożenie floty</h3>
            <p className="text-sm text-white/60">Ile procent dni w miesiącu było zajętych dla całej floty.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <svg viewBox="0 0 900 160" className="w-full h-[160px] overflow-visible">
              <defs>
                <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={linePoints}
              />
              {occupancy.map((item, index) => {
                const x = 20 + index * 140;
                const y = 140 - clampValue(item.percent) * 1.2;
                return (
                  <g key={item.label}>
                    <circle cx={x} cy={y} r="6" fill="#38bdf8" />
                    <text x={x} y={y - 14} textAnchor="middle" className="text-xs fill-white">
                      {item.percent}%
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-white/70">
              {occupancy.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="font-semibold text-white">{item.label}</div>
                  <div>{item.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="glass-elevated rounded-[2rem] border border-white/5 p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-white">Najczęściej wybierane modele</h3>
            <p className="text-sm text-white/60">Modele z największą liczbą rezerwacji.</p>
          </div>
        </div>

        {selectedModels.length > 0 ? (
          <div className="space-y-4">
            {selectedModels.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{item.label}</span>
                  <span>Ilość rezerwacji:{item.count}</span>
                </div>
                {renderProgressBar(item.count, maxModelCount)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">Brak wystarczających danych, aby obliczyć najczęściej wybierane modele.</p>
        )}
      </section>
    </div>
  );
}
