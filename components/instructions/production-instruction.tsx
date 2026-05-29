import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";
import { PRODUCTION_DEPT_LABELS } from "@/lib/instruction-roles";

type Props = { role: string };

export function ProductionInstruction({ role }: Props) {
  const deptLabel = PRODUCTION_DEPT_LABELS[role] ?? "Производство";
  const isDeptOnly = role !== "PRODUCTION" && role !== "ADMIN";

  return (
    <InstructionPage
      title={`Инструкция: ${deptLabel}`}
      subtitle="Очередь заказов и отметки по цеху"
    >
      <InstructionSection title="Раздел «Производство»">
        <InstructionSteps
          steps={[
            "Откройте «Производство» — заказы в трёх колонках: ожидают, в работе, готово к монтажу.",
            isDeptOnly
              ? "Вы видите только заказы, где выбран ваш цех, и только свою строку на карточке."
              : "Менеджер видит вкладки по цехам; мастер цеха — все цеха на карточке.",
            "«Сегодня» и «Задачи» — при необходимости.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Ваши действия на карточке заказа">
        <InstructionSteps
          steps={[
            "Откройте заказ из очереди (по номеру и клиенту).",
            "В блоке своего цеха нажмите «В работу» — заказ перейдёт в производство.",
            "По готовности — «Готово» для вашего цеха.",
            "Когда все назначенные цеха нажали «Готово» — статус «Готов к монтажу».",
          ]}
        />
        <InstructionTip>
          Наряд вашего цеха — в блоке «Наряды в цех» или в файлах (стекло / ПВХ / алюминий).
        </InstructionTip>
      </InstructionSection>

      {!isDeptOnly && (
        <InstructionSection title="Вкладки цехов (менеджер / мастер)">
          <p>
            Фильтры «Стекло», «ПВХ», «Алюминий» показывают только заказы с выбранным цехом при
            отправке в производство.
          </p>
        </InstructionSection>
      )}

      <InstructionSection title="Разделы">
        <InstructionLinks
          links={[
            { href: "/production", label: "Производство" },
            { href: "/orders", label: "Заказы (просмотр)" },
            { href: "/today", label: "Сегодня" },
            { href: "/tasks", label: "Задачи" },
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Уведомления">
        <p>
          Внизу меню — «Включить уведомления», чтобы получать push о новых заказах в производство.
        </p>
      </InstructionSection>
    </InstructionPage>
  );
}
