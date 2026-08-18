import { DealCard } from "@/components/DealCard";
import { PIPELINE_STAGES, STAGE_LABEL, formatCurrency, type Deal } from "@/lib/types";

export function KanbanBoard({ deals }: { deals: Deal[] }) {
  const dealsByStage = new Map<string, Deal[]>();
  for (const stage of PIPELINE_STAGES) dealsByStage.set(stage, []);
  for (const deal of deals) {
    dealsByStage.get(deal.stage)?.push(deal);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {PIPELINE_STAGES.map((stage) => {
        const stageDeals = dealsByStage.get(stage) ?? [];
        const total = stageDeals.reduce((sum, deal) => sum + (deal.deal_value ?? 0), 0);
        return (
          <div key={stage}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {STAGE_LABEL[stage]} ({stageDeals.length})
              </h3>
            </div>
            {total > 0 && <p className="mb-2 text-xs text-muted">{formatCurrency(total, "USD")}</p>}
            {stageDeals.length === 0 ? (
              <p className="text-xs text-muted">No deals</p>
            ) : (
              stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
            )}
          </div>
        );
      })}
    </div>
  );
}
