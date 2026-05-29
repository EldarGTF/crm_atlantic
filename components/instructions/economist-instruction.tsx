import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";

export function EconomistInstruction() {
  return (
    <InstructionPage
      title="Инструкция: Экономист"
      subtitle="Контроль оплат, отчётов и закрытых сделок"
    >
      <InstructionSection title="Основные задачи">
        <InstructionSteps
          steps={[
            "«Дашборд» и «Аналитика» — выручка, KPI, воронка.",
            "«Заказы» — фильтры по оплате (не оплачен / предоплата / оплачен).",
            "На карточке заказа — блок «Оплата»: сумма, оплачено, долг.",
            "«Архив» — закрытые сделки и выручка.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Разделы">
        <InstructionLinks
          links={[
            { href: "/dashboard", label: "Дашборд" },
            { href: "/analytics", label: "Аналитика" },
            { href: "/orders", label: "Заказы" },
            { href: "/archive", label: "Архив" },
            { href: "/warranty", label: "Гарантия" },
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Фиксация оплаты">
        <InstructionSteps
          steps={[
            "Откройте заказ → блок «Оплата».",
            "Добавьте платёж: сумма, тип (предоплата / остаток).",
            "Статус оплаты обновится автоматически.",
          ]}
        />
        <InstructionTip>
          Часть полей заказа доступна только для просмотра — редактирование спецификации делает менеджер.
        </InstructionTip>
      </InstructionSection>

      <InstructionSection title="Экспорт">
        <p>
          В списке заказов — кнопка «Excel» для выгрузки с учётом фильтров и поиска.
        </p>
      </InstructionSection>
    </InstructionPage>
  );
}
