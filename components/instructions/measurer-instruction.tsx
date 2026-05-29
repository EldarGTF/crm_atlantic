import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";

export function MeasurerInstruction() {
  return (
    <InstructionPage
      title="Инструкция: Замерщик"
      subtitle="Выезды на объект: замеры, фото, календарь"
    >
      <InstructionSection title="Утром">
        <InstructionSteps
          steps={[
            "Откройте «Сегодня» — все замеры на текущий день.",
            "Или «Календарь» — план на месяц (видны только ваши замеры).",
            "«Замеры» — полный список с фильтрацией по статусу.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="На объекте">
        <InstructionSteps
          steps={[
            "Откройте карточку замера.",
            "Нажмите «В работу», когда приехали.",
            "Сделайте фото и замеры, загрузите файлы (можно с камеры телефона).",
            "По завершении — «Выполнен».",
            "При переносе — кнопка переноса даты/адреса.",
          ]}
        />
        <InstructionTip>
          Адрес замера потом отобразится на заказе, пока не назначен монтаж с другим адресом.
        </InstructionTip>
      </InstructionSection>

      <InstructionSection title="Разделы">
        <InstructionLinks
          links={[
            { href: "/today", label: "Сегодня" },
            { href: "/calendar", label: "Календарь" },
            { href: "/measurements", label: "Замеры" },
            { href: "/tasks", label: "Задачи" },
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Карта">
        <p>
          На карточке замера есть ссылка на адрес — откроется карта для навигации.
        </p>
      </InstructionSection>
    </InstructionPage>
  );
}
