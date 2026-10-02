import { db } from "@/db";
import { equipment } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import {
  CreateEquipmentForm,
  EquipmentRow,
} from "@/components/equipment-forms";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const items = await db.select().from(equipment).orderBy(equipment.workshop);

  return (
    <div>
      <PageHeader
        title="Оборудование"
        description="Справочник производственных единиц"
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Добавить</h2>
        <CreateEquipmentForm />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Инв. №</th>
                <th className="px-2 py-2">Название</th>
                <th className="px-2 py-2">Цех</th>
                <th className="px-2 py-2">Тип</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <EquipmentRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
