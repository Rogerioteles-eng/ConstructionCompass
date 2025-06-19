import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DiaryCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithEntries: string[]; // Array de datas em formato YYYY-MM-DD
}

export default function DiaryCalendar({ selectedDate, onDateSelect, datesWithEntries }: DiaryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const today = new Date();
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Ajuste para começar na segunda-feira
  };

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateWithEntry = (date: Date) => {
    return datesWithEntries.includes(formatDateForComparison(date));
  };

  const isToday = (date: Date) => {
    return formatDateForComparison(date) === formatDateForComparison(today);
  };

  const isSelected = (date: Date) => {
    return formatDateForComparison(date) === formatDateForComparison(selectedDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Dias vazios do início do mês
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const hasEntry = isDateWithEntry(date);
      const isTodayDate = isToday(date);
      const isSelectedDate = isSelected(date);

      days.push(
        <Button
          key={day}
          variant={isSelectedDate ? "default" : "ghost"}
          size="sm"
          className={`
            h-10 w-10 p-0 relative
            ${isTodayDate ? "ring-2 ring-blue-500" : ""}
            ${hasEntry ? "bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800" : ""}
            ${isSelectedDate ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
          `}
          onClick={() => onDateSelect(date)}
        >
          {day}
          {hasEntry && (
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-600 rounded-full"></div>
          )}
        </Button>
      );
    }

    return days;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário do Diário
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Com registro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-full"></div>
            <span>Hoje</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}