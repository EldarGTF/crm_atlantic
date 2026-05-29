import {
  InstructionPage,
  InstructionSection,
  InstructionSteps,
  InstructionTip,
  InstructionLinks,
} from "./instruction-ui";

export function AdminInstruction() {
  return (
    <InstructionPage
      title="Инструкция: Администратор"
      subtitle="Полный доступ к CRM и настройке сотрудников"
    >
      <InstructionSection title="Ваши разделы">
        <InstructionLinks
          links={[
            { href: "/dashboard", label: "Дашборд и KPI" },
            { href: "/leads", label: "Заявки и клиенты" },
            { href: "/orders", label: "Заказы" },
            { href: "/staff", label: "Сотрудники (создание учётных записей)" },
            { href: "/archive", label: "Архив" },
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Только у администратора">
        <InstructionSteps
          steps={[
            "Раздел «Сотрудники» — создание пользователей, назначение ролей, сброс доступа.",
            "На карточке заявки — кнопка «Удалить заявку» (безвозвратно, с заказом и замерами).",
            "На карточке заказа — кнопка «Удалить заказ» (заявка остаётся).",
          ]}
        />
        <InstructionTip>
          Обычные сотрудники закрывают сделки через акт и архив, а не через удаление.
        </InstructionTip>
      </InstructionSection>

      <InstructionSection title="Контроль процесса">
        <InstructionSteps
          steps={[
            "Следите за дашбордом: просроченные задачи, производство, монтажи.",
            "При жалобах на файлы — проверьте настройки загрузки на сервере (MinIO).",
            "Роли замерщика/монтажника в календаре видят только свои назначения.",
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Типовой день">
        <p>
          Просмотр дашборда → разбор проблемных заявок → при необходимости правка сотрудников или
          удаление ошибочных записей → контроль архива и аналитики.
        </p>
      </InstructionSection>
    </InstructionPage>
  );
}
