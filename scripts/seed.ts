import "dotenv/config";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  users,
  equipment,
  repairRequests,
  type Priority,
  type RequestStatus,
} from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Seeding database…");

  await db.delete(repairRequests);
  await db.delete(equipment);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        name: "Администратор",
        email: "admin@demo.local",
        passwordHash,
        role: "admin",
      },
      {
        name: "Диспетчер Иванова",
        email: "dispatcher@demo.local",
        passwordHash,
        role: "dispatcher",
      },
      {
        name: "Мастер Петров",
        email: "master1@demo.local",
        passwordHash,
        role: "master",
      },
      {
        name: "Мастер Сидоров",
        email: "master2@demo.local",
        passwordHash,
        role: "master",
      },
    ])
    .returning();

  const admin = insertedUsers.find((u) => u.role === "admin")!;
  const dispatcher = insertedUsers.find((u) => u.role === "dispatcher")!;
  const master1 = insertedUsers.find((u) => u.email === "master1@demo.local")!;
  const master2 = insertedUsers.find((u) => u.email === "master2@demo.local")!;

  const insertedEquipment = await db
    .insert(equipment)
    .values([
      {
        name: "Токарный станок ТС-200",
        inventoryCode: "EQ-001",
        workshop: "Цех №1",
        type: "Станок",
      },
      {
        name: "Фрезерный станок ФС-150",
        inventoryCode: "EQ-002",
        workshop: "Цех №1",
        type: "Станок",
      },
      {
        name: "Конвейер КЛ-12",
        inventoryCode: "EQ-003",
        workshop: "Цех №2",
        type: "Конвейер",
      },
      {
        name: "Компрессор КМ-40",
        inventoryCode: "EQ-004",
        workshop: "Цех №2",
        type: "Компрессор",
      },
      {
        name: "Печь термообработки ПТ-8",
        inventoryCode: "EQ-005",
        workshop: "Цех №3",
        type: "Печь",
      },
      {
        name: "Кран-балка 5т",
        inventoryCode: "EQ-006",
        workshop: "Цех №3",
        type: "Подъёмник",
      },
      {
        name: "Пресс гидравлический ПГ-100",
        inventoryCode: "EQ-007",
        workshop: "Цех №1",
        type: "Пресс",
      },
      {
        name: "Сварочный пост СП-4",
        inventoryCode: "EQ-008",
        workshop: "Цех №2",
        type: "Сварка",
      },
      {
        name: "Насосный агрегат НА-2",
        inventoryCode: "EQ-009",
        workshop: "Цех №3",
        type: "Насос",
      },
      {
        name: "Шлифовальный станок ШС-60",
        inventoryCode: "EQ-010",
        workshop: "Цех №1",
        type: "Станок",
      },
    ])
    .returning();

  const priorities: Priority[] = ["low", "medium", "high", "critical"];
  const titles = [
    "Посторонний шум в приводе",
    "Перегрев узла",
    "Утечка масла",
    "Сбой датчика",
    "Износ ремня",
    "Нестабильное давление",
    "Заедание направляющих",
    "Отказ пускателя",
    "Вибрация выше нормы",
    "Требуется плановое ТО",
  ];

  const now = Date.now();
  const requestsData = [];

  for (let i = 0; i < 42; i++) {
    const eqItem = insertedEquipment[i % insertedEquipment.length];
    const priority = priorities[i % priorities.length];
    const daysAgo = Math.floor(i * 2.2) % 120;
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const slaHours = priority === "critical" ? 12 : priority === "high" ? 24 : 48;
    const master = i % 2 === 0 ? master1 : master2;

    let status: RequestStatus;
    let assignedAt: Date | null = null;
    let startedAt: Date | null = null;
    let completedAt: Date | null = null;
    let assigneeId: string | null = null;

    const bucket = i % 7;
    if (bucket === 0) {
      status = "new";
    } else if (bucket === 1) {
      status = "assigned";
      assigneeId = master.id;
      assignedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    } else if (bucket === 2) {
      status = "in_progress";
      assigneeId = master.id;
      assignedAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000);
      startedAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
    } else if (bucket === 3) {
      status = "cancelled";
      assigneeId = master.id;
      assignedAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000);
    } else {
      status = "done";
      assigneeId = master.id;
      assignedAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000);
      startedAt = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000);
      // Mix on-time and late completions for SLA analytics
      const durationHours =
        i % 3 === 0 ? slaHours + 10 + (i % 5) : Math.max(4, slaHours - 8 - (i % 6));
      completedAt = new Date(
        (startedAt ?? createdAt).getTime() + durationHours * 60 * 60 * 1000
      );
    }

    requestsData.push({
      title: `${titles[i % titles.length]} (#${i + 1})`,
      description: `Автоматически сгенерированная демо-заявка по оборудованию ${eqItem.name}. Требуется диагностика и устранение неисправности.`,
      workComment:
        status === "done"
          ? "Работы выполнены, оборудование введено в эксплуатацию."
          : status === "in_progress"
            ? "Диагностика завершена, выполняется ремонт."
            : null,
      equipmentId: eqItem.id,
      priority,
      status,
      createdById: i % 3 === 0 ? admin.id : dispatcher.id,
      assigneeId,
      slaHours,
      createdAt,
      assignedAt,
      startedAt,
      completedAt,
    });
  }

  await db.insert(repairRequests).values(requestsData);

  console.log("Seed complete.");
  console.log("Demo users (password: demo1234):");
  console.log("  admin@demo.local");
  console.log("  dispatcher@demo.local");
  console.log("  master1@demo.local");
  console.log("  master2@demo.local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
