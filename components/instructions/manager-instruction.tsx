import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";

export function ManagerInstruction() {
  return (
    <InstructionPage
      title="Инструкция: Менеджер"
      subtitle="Ведение клиентов от заявки до закрытия сделки"
    >
      <InstructionSection title="С чего начать день">
        <InstructionSteps
          steps={[
            "Откройте «Дашборд» — заявки, выручка, срочные задачи.",
            "Раздел «Сегодня» — если нужно проверить выезды.",
            "«Заявки» — новые и те, что в работе.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Путь сделки">
        <InstructionSteps
          steps={[
            "Клиент → «Клиенты» или при создании заявки.",
            "Заявка → статусы, назначение замера.",
            "После согласования → «Создать заказ», спецификация и суммы.",
            "«Отправить в производство» — выбрать цеха и наряды.",
            "Когда готово → назначить монтаж.",
            "Загрузить акт → «Подписать акт» → «В архив».",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Полезные разделы">
        <InstructionLinks
          links={[
            { href: "/leads", label: "Заявки" },
            { href: "/clients", label: "Клиенты" },
            { href: "/orders", label: "Заказы" },
            { href: "/measurements", label: "Замеры" },
            { href: "/production", label: "Производство (контроль очереди)" },
            { href: "/installation", label: "Монтаж" },
            { href: "/calendar", label: "Календарь" },
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Адрес на заказе">
        <p>
          На карточке заказа показывается адрес: сначала <strong>монтаж</strong>, если назначен;
          иначе <strong>последний замер</strong>; иначе адрес из карточки клиента.
        </p>
        <InstructionTip>
          Указывайте точный адрес при назначении замера и монтажа — он попадёт на заказ автоматически.
        </InstructionTip>
      </InstructionSection>

      <InstructionSection title="Поиск">
        <p>
          На большинстве страниц — поле поиска в списке. В шапке (на дашборде и др.) — глобальный
          поиск по клиентам, заявкам и номеру заказа.
        </p>
      </InstructionSection>
    </InstructionPage>
  );
}
