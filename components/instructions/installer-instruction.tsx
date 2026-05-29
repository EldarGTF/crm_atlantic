import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";

export function InstallerInstruction() {
  return (
    <InstructionPage
      title="Инструкция: Монтажник"
      subtitle="Монтаж на объекте и чек-лист на заказе"
    >
      <InstructionSection title="Утром">
        <InstructionSteps
          steps={[
            "«Сегодня» — монтажи на сегодня с адресом и временем.",
            "«Календарь» — только ваши назначения на месяц.",
            "«Монтаж» — список всех ваших монтажей.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="На объекте">
        <InstructionSteps
          steps={[
            "Откройте заказ из списка монтажа (ссылка на карточку заказа).",
            "Проверьте адрес и телефон клиента в шапке заказа.",
            "В блоке «Монтаж» отмечайте пункты чек-листа по мере выполнения.",
            "При необходимости загрузите фото в «Документы» (если доступно).",
          ]}
        />
        <InstructionTip>
          Адрес монтажа — главный адрес на карточке заказа. Нажмите на адрес, чтобы открыть карту.
        </InstructionTip>
      </InstructionSection>

      <InstructionSection title="Разделы">
        <InstructionLinks
          links={[
            { href: "/today", label: "Сегодня" },
            { href: "/calendar", label: "Календарь" },
            { href: "/installation", label: "Монтаж" },
            { href: "/tasks", label: "Задачи" },
          ]}
        />
      </InstructionSection>
    </InstructionPage>
  );
}
