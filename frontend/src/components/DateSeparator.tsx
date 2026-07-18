import React from "react";

interface DateSeparatorProps {
  date: string | number | Date;
}

const formatDateLabel = (date: string | number | Date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => (
  <div className="flex items-center justify-center my-2">
    <span className="text-xs text-base-content/50 bg-base-200 rounded-full px-3 py-1">
      {formatDateLabel(date)}
    </span>
  </div>
);

export default DateSeparator;
