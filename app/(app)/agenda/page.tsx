"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clock4,
  Lock,
  UserSearch,
  UserIcon,
  X,
  ChartNoAxesColumn,
  CoinsIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  CalendarClockIcon,
} from "lucide-react";
import { StatusNotification } from "@/components/status-notification";
import { getAppointmentsByDate, getAppointmentsByWeek } from "@/services/api/appointment";
import { WeekAppointmentCard } from "./components/week-appointment-card";
import {
  HOUR_ROW_HEIGHT,
  WEEK_END_HOUR,
  WEEK_ROW_HEIGHT,
  WEEK_START_HOUR,
  appointmentStatusOptions,
  initialStockProducts,
  monthDayLabels,
  procedureOptions,
  professionalOptions,
  timeSlots,
  weekDayLabels,
  weekTimeSlots,
  weeklyEvents,
} from "./constants";
import type {
  AgendaStatusNotification,
  Appointment,
  AppointmentDetails,
  AppointmentStatus,
  DetailsTab,
  EditAppointmentForm,
  NewAppointmentForm,
  StockProduct,
  ViewMode,
  WeeklyEvent,
  WeeklyEventLayout,
} from "./types";
import {
  addDays,
  addMinutesToTime,
  addMonths,
  computeDayEventLayout,
  createAppointmentId,
  formatCurrencyInput,
  getEndOfMonth,
  getStartOfMonth,
  getStartOfWeek,
  normalizeProfessionalName,
  parseCurrencyToCents,
  parseTimeToMinutes,
  statusDotColor,
  statusLabel,
  statusOptionButtonStyles,
  toDateKey,
} from "./utils";

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [editableStatus, setEditableStatus] = useState<AppointmentStatus>("confirmado");
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("status");
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editAppointmentError, setEditAppointmentError] = useState("");
  const [editAppointment, setEditAppointment] = useState<EditAppointmentForm>({
    date: "",
    startTime: "",
    endTime: "",
    patient: "",
    procedure: "",
    procedureValue: "",
    notes: "",
    professional: "",
  });
  const [stockProducts, setStockProducts] = useState<StockProduct[]>(initialStockProducts);
  const [appointmentStockUsage, setAppointmentStockUsage] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [stockDraftByProductId, setStockDraftByProductId] = useState<Record<string, string>>({});
  const [stockControlError, setStockControlError] = useState("");
  const [statusNotification, setStatusNotification] = useState<AgendaStatusNotification | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfessionalFilterOpen, setIsProfessionalFilterOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => getStartOfMonth(new Date()));
  const [isCreateDatePickerOpen, setIsCreateDatePickerOpen] = useState(false);
  const [createDatePickerMonth, setCreateDatePickerMonth] = useState(() => getStartOfMonth(new Date()));
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [clientSearchPopoverOpen, setClientSearchPopoverOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>(() => ({
    date: "",
    startTime: "",
    endTime: "",
    patient: "",
    procedure: "",
    procedureValue: "",
    professional: "",
    status: "confirmado",
    notes: "",
  }));
  const [createAppointmentError, setCreateAppointmentError] = useState("");
  const scheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const weekScheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const professionalsFilterRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const datePickerPopoverRef = useRef<HTMLDivElement | null>(null);
  const [datePickerPopoverStyle, setDatePickerPopoverStyle] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const createDatePickerRef = useRef<HTMLDivElement | null>(null);
  const clientFilterRef = useRef<HTMLDivElement | null>(null);
  const availableProfessionals = useMemo(() => {
    const professionals = new Set<string>();

    appointmentList.forEach((appointment) => {
      professionals.add(normalizeProfessionalName(appointment.professional));
    });

    weeklyEvents.forEach((event) => {
      professionals.add(normalizeProfessionalName(event.professional));
    });

    return Array.from(professionals).sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [appointmentList]);
  const normalizedClientFilter = useMemo(() => clientFilter.trim().toLocaleLowerCase("pt-BR"), [clientFilter]);
  const filteredAppointmentList = useMemo(
    () =>
      appointmentList.filter((appointment) => {
        const professionalMatches =
          selectedProfessionals.length === 0 ||
          selectedProfessionals.includes(normalizeProfessionalName(appointment.professional));
        const clientMatches =
          normalizedClientFilter.length === 0 ||
          appointment.patient.toLocaleLowerCase("pt-BR").includes(normalizedClientFilter);

        return professionalMatches && clientMatches;
      }),
    [appointmentList, normalizedClientFilter, selectedProfessionals]
  );
  const filteredWeeklyBaseEvents = useMemo(
    () =>
      weeklyEvents.filter((event) => {
        const professionalMatches =
          selectedProfessionals.length === 0 ||
          selectedProfessionals.includes(normalizeProfessionalName(event.professional));
        const clientMatches =
          normalizedClientFilter.length === 0 ||
          event.patient.toLocaleLowerCase("pt-BR").includes(normalizedClientFilter);

        return professionalMatches && clientMatches;
      }),
    [normalizedClientFilter, selectedProfessionals]
  );
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const weekStartDate = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekEndDate = useMemo(() => addDays(weekStartDate, 6), [weekStartDate]);
  const monthStartDate = useMemo(() => getStartOfMonth(selectedDate), [selectedDate]);
  const monthEndDate = useMemo(() => getEndOfMonth(selectedDate), [selectedDate]);
  const monthGridDays = useMemo(() => {
    const firstGridDay = addDays(monthStartDate, -monthStartDate.getDay());
    const lastGridDay = addDays(monthEndDate, 6 - monthEndDate.getDay());
    const days: Date[] = [];

    for (
      let cursorDate = new Date(firstGridDay);
      cursorDate <= lastGridDay;
      cursorDate = addDays(cursorDate, 1)
    ) {
      days.push(new Date(cursorDate));
    }

    return days;
  }, [monthStartDate, monthEndDate]);
  const datePickerMonthStart = useMemo(() => getStartOfMonth(datePickerMonth), [datePickerMonth]);
  const datePickerMonthEnd = useMemo(() => getEndOfMonth(datePickerMonth), [datePickerMonth]);
  const datePickerGridDays = useMemo(() => {
    const firstGridDay = addDays(datePickerMonthStart, -datePickerMonthStart.getDay());
    const lastGridDay = addDays(datePickerMonthEnd, 6 - datePickerMonthEnd.getDay());
    const days: Date[] = [];

    for (
      let cursorDate = new Date(firstGridDay);
      cursorDate <= lastGridDay;
      cursorDate = addDays(cursorDate, 1)
    ) {
      days.push(new Date(cursorDate));
    }

    return days;
  }, [datePickerMonthStart, datePickerMonthEnd]);
  const createDatePickerMonthStart = useMemo(
    () => getStartOfMonth(createDatePickerMonth),
    [createDatePickerMonth]
  );
  const createDatePickerMonthEnd = useMemo(
    () => getEndOfMonth(createDatePickerMonth),
    [createDatePickerMonth]
  );
  const createDatePickerGridDays = useMemo(() => {
    const firstGridDay = addDays(createDatePickerMonthStart, -createDatePickerMonthStart.getDay());
    const lastGridDay = addDays(createDatePickerMonthEnd, 6 - createDatePickerMonthEnd.getDay());
    const days: Date[] = [];

    for (
      let cursorDate = new Date(firstGridDay);
      cursorDate <= lastGridDay;
      cursorDate = addDays(cursorDate, 1)
    ) {
      days.push(new Date(cursorDate));
    }

    return days;
  }, [createDatePickerMonthStart, createDatePickerMonthEnd]);
  const monthlyAppointmentsByDate = useMemo(() => {
    return filteredAppointmentList.reduce<Record<string, Appointment[]>>((accumulator, appointment) => {
      if (!accumulator[appointment.date]) {
        accumulator[appointment.date] = [];
      }
      accumulator[appointment.date].push(appointment);
      return accumulator;
    }, {});
  }, [filteredAppointmentList]);
  const selectedMonthAppointments = useMemo(
    () =>
      filteredAppointmentList.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T00:00:00`);
        return (
          appointmentDate.getFullYear() === monthStartDate.getFullYear() &&
          appointmentDate.getMonth() === monthStartDate.getMonth()
        );
      }),
    [filteredAppointmentList, monthStartDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)),
    [weekStartDate]
  );

  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    [selectedDate]
  );

  const normalizedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  const normalizedSelectedDate = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const selectedDateAppointments = useMemo(
    () => filteredAppointmentList.filter((appointment) => appointment.date === selectedDateKey),
    [filteredAppointmentList, selectedDateKey]
  );
  /** Busca por nome no dia atual (lista completa, independente do filtro de profissional) */
  const clientDaySearchMatches = useMemo(() => {
    const q = normalizedClientFilter;
    if (q.length < 2) return [];
    return appointmentList
      .filter(
        (a) =>
          a.date === selectedDateKey &&
          a.patient.toLocaleLowerCase("pt-BR").includes(q)
      )
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointmentList, selectedDateKey, normalizedClientFilter]);
  const selectedDayEvents = useMemo(
    () =>
      computeDayEventLayout(
        selectedDateAppointments.map((appointment) => ({
          dayIndex: 0,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          title: appointment.procedure,
          patient: appointment.patient,
          professional: normalizeProfessionalName(appointment.professional),
          procedureValue: appointment.procedureValue,
          notes: appointment.notes,
          status: appointment.status,
          appointmentId: appointment.id,
          canEditStatus: true,
        }))
      ),
    [selectedDateAppointments]
  );
  const selectedWeekAppointments = useMemo(
    () =>
      filteredAppointmentList
        .map((appointment): WeeklyEvent | null => {
          const date = new Date(`${appointment.date}T00:00:00`);
          const dayDifference = Math.floor(
            (date.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDifference < 0 || dayDifference > 6) {
            return null;
          }

          return {
            dayIndex: dayDifference,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            title: appointment.procedure,
            patient: appointment.patient,
            professional: normalizeProfessionalName(appointment.professional),
            procedureValue: appointment.procedureValue,
            notes: appointment.notes,
            status: appointment.status,
            appointmentId: appointment.id,
            canEditStatus: true,
          };
        })
        .filter((event): event is WeeklyEvent => event !== null),
    [filteredAppointmentList, weekStartDate]
  );
  const selectedWeekEvents = useMemo(
    () => [...filteredWeeklyBaseEvents, ...selectedWeekAppointments],
    [filteredWeeklyBaseEvents, selectedWeekAppointments]
  );
  const selectedWeekEventsByDay = useMemo(
    () =>
      weekDayLabels.map((_, dayIndex) =>
        computeDayEventLayout(selectedWeekEvents.filter((event) => event.dayIndex === dayIndex))
      ),
    [selectedWeekEvents]
  );

  const isSelectedDateToday = normalizedSelectedDate === normalizedToday;
  const isSelectedWeekCurrent = useMemo(() => {
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    return currentWeekStart.getTime() === weekStartDate.getTime();
  }, [weekStartDate]);

  const currentMinutesOfDay = useMemo(
    () => currentTime.getHours() * 60 + currentTime.getMinutes(),
    [currentTime]
  );

  const currentTimeLabel = useMemo(
    () =>
      `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(
        2,
        "0"
      )}`,
    [currentTime]
  );

  const currentTimeIndicatorTop = useMemo(
    () => (currentMinutesOfDay * HOUR_ROW_HEIGHT) / 60,
    [currentMinutesOfDay]
  );
  const weekCurrentTimeIndicatorTop = useMemo(
    () => ((currentMinutesOfDay - WEEK_START_HOUR * 60) * WEEK_ROW_HEIGHT) / 60,
    [currentMinutesOfDay]
  );
  const showWeekCurrentTimeLine =
    isSelectedWeekCurrent &&
    currentMinutesOfDay >= WEEK_START_HOUR * 60 &&
    currentMinutesOfDay <= WEEK_END_HOUR * 60;

  const headerTitle = useMemo(() => {
    if (viewMode === "week") {
      const startDay = weekStartDate.getDate();
      const endDay = weekEndDate.getDate();
      const startMonth = weekStartDate.toLocaleDateString("pt-BR", { month: "short" });
      const endMonth = weekEndDate.toLocaleDateString("pt-BR", { month: "short" });
      const startYear = weekStartDate.getFullYear();
      const endYear = weekEndDate.getFullYear();
      const isSameMonth = weekStartDate.getMonth() === weekEndDate.getMonth();
      const isSameYear = startYear === endYear;

      if (isSameMonth && isSameYear) {
        return `${startDay} - ${endDay} de ${startMonth} de ${startYear}`;
      }

      if (isSameYear) {
        return `${startDay} de ${startMonth} - ${endDay} de ${endMonth} de ${startYear}`;
      }

      return `${startDay} de ${startMonth} de ${startYear} - ${endDay} de ${endMonth} de ${endYear}`;
    }

    if (viewMode === "month") {
      return selectedDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    }

    return formattedDate;
  }, [viewMode, weekStartDate, weekEndDate, selectedDate, formattedDate]);

  const headerSubtitle = useMemo(() => {
    if (viewMode === "week") {
      return `${selectedWeekEvents.length} agendamento(s) nesta semana`;
    }

    if (viewMode === "month") {
      return `${selectedMonthAppointments.length} agendamento(s) neste mês`;
    }

    return `${selectedDateAppointments.length} agendamento(s) para este dia`;
  }, [viewMode, selectedWeekEvents.length, selectedDateAppointments.length, selectedMonthAppointments.length]);

  const disableTodayButton =
    viewMode === "day" ? isSelectedDateToday : viewMode === "week" ? isSelectedWeekCurrent : false;
  const selectedAppointmentStockUsage = useMemo(() => {
    if (!selectedAppointmentDetails?.appointmentId) {
      return {};
    }

    return appointmentStockUsage[selectedAppointmentDetails.appointmentId] ?? {};
  }, [appointmentStockUsage, selectedAppointmentDetails?.appointmentId]);
  const selectedStockItemsCount = useMemo(
    () =>
      Object.values(stockDraftByProductId).filter((quantity) => Number(quantity) > 0).length,
    [stockDraftByProductId]
  );

  const DATE_PICKER_POPOVER_W = 320;
  const DATE_PICKER_Z = 100;

  const updateDatePickerPopoverPosition = useCallback(() => {
    const el = datePickerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    let left = rect.left + rect.width / 2 - DATE_PICKER_POPOVER_W / 2;
    left = Math.max(
      gap,
      Math.min(left, window.innerWidth - DATE_PICKER_POPOVER_W - gap)
    );
    const estimatedH = 340;
    let top = rect.bottom + gap;
    if (top + estimatedH > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - estimatedH - gap);
    }
    setDatePickerPopoverStyle({ top, left });
  }, []);

  function openDatePicker() {
    setDatePickerMonth(getStartOfMonth(selectedDate));
    setIsDatePickerOpen((current) => {
      if (current) return false;
      updateDatePickerPopoverPosition();
      return true;
    });
  }

  function openCreateDatePicker() {
    const baseDate = newAppointment.date ? new Date(`${newAppointment.date}T00:00:00`) : new Date();

    setCreateDatePickerMonth(getStartOfMonth(baseDate));
    setIsCreateDatePickerOpen((current) => !current);
  }

  function openCreateAppointmentModal() {
    setNewAppointment({
      date: "",
      startTime: "",
      endTime: "",
      patient: "",
      procedure: "",
      procedureValue: "",
      professional: "",
      status: "confirmado",
      notes: "",
    });
    setCreateAppointmentError("");
    setIsCreateDatePickerOpen(false);
    setIsCreateModalOpen(true);
  }

  function handleCreateAppointment() {
    if (!newAppointment.date || !newAppointment.startTime || !newAppointment.endTime) {
      setCreateAppointmentError("Preencha data, horário inicial e horário final.");
      return;
    }

    if (!newAppointment.professional.trim()) {
      setCreateAppointmentError("Selecione um profissional.");
      return;
    }

    const isBlockedSlot = newAppointment.status === "bloqueado";

    if (!isBlockedSlot && (!newAppointment.patient.trim() || !newAppointment.procedure.trim())) {
      setCreateAppointmentError("Preencha paciente e procedimento.");
      return;
    }

    if (parseCurrencyToCents(newAppointment.procedureValue) < 0) {
      setCreateAppointmentError("O valor do procedimento não pode ser negativo.");
      return;
    }

    if (parseTimeToMinutes(newAppointment.endTime) <= parseTimeToMinutes(newAppointment.startTime)) {
      setCreateAppointmentError("O horário final precisa ser maior que o inicial.");
      return;
    }

    const newStartMinutes = parseTimeToMinutes(newAppointment.startTime);
    const newEndMinutes = parseTimeToMinutes(newAppointment.endTime);
    const normalizedProfessional = normalizeProfessionalName(newAppointment.professional);

    const hasTimeConflict = appointmentList.some((appointment) => {
      if (appointment.date !== newAppointment.date) {
        return false;
      }

      if (normalizeProfessionalName(appointment.professional) !== normalizedProfessional) {
        return false;
      }

      const existingStartMinutes = parseTimeToMinutes(appointment.startTime);
      const existingEndMinutes = parseTimeToMinutes(appointment.endTime);

      return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;
    });

    if (hasTimeConflict) {
      setCreateAppointmentError(
        "Este profissional já possui agendamento/bloqueio neste intervalo. Escolha outro horário."
      );
      return;
    }

    setAppointmentList((currentAppointments) => [
      ...currentAppointments,
      {
        id: createAppointmentId(),
        date: newAppointment.date,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        patient: isBlockedSlot ? "Horário bloqueado" : newAppointment.patient.trim(),
        procedure: isBlockedSlot ? "Indisponível para agendamento" : newAppointment.procedure.trim(),
        procedureValue: isBlockedSlot ? "" : newAppointment.procedureValue,
        notes: newAppointment.notes.trim(),
        professional: newAppointment.professional.trim(),
        status: newAppointment.status,
      },
    ]);
    setIsCreateModalOpen(false);
  }

  function goToClientAppointment(apt: Appointment) {
    setClientSearchPopoverOpen(false);
    setClientFilter("");
    setSelectedDate(new Date(`${apt.date}T12:00:00`));
    setViewMode("day");
    openAppointmentDetails({
      appointmentId: apt.id,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      patient: apt.patient,
      procedure: apt.procedure,
      procedureValue: apt.procedureValue,
      notes: apt.notes,
      professional: normalizeProfessionalName(apt.professional),
      status: apt.status,
      canEditStatus: true,
    });
    const scrollToCard = () => {
      document.getElementById(`agenda-appt-${apt.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(scrollToCard));
    window.setTimeout(scrollToCard, 250);
  }

  function openAppointmentDetails(details: AppointmentDetails) {
    const savedUsage = details.appointmentId ? appointmentStockUsage[details.appointmentId] : undefined;

    setSelectedAppointmentDetails(details);
    setEditableStatus(details.status);
    setDetailsTab("status");
    setIsEditingAppointment(false);
    setEditAppointmentError("");
    setStockControlError("");
    setStockDraftByProductId(
      savedUsage
        ? Object.fromEntries(
          Object.entries(savedUsage).map(([productId, quantity]) => [productId, String(quantity)])
        )
        : {}
    );
    setEditAppointment({
      date: details.date,
      startTime: details.startTime,
      endTime: details.endTime,
      patient: details.patient,
      procedure: details.procedure,
      procedureValue: details.procedureValue || "",
      notes: details.notes || "",
      professional: details.professional,
    });
  }

  function handleOpenEditAppointment() {
    if (!selectedAppointmentDetails?.appointmentId || !selectedAppointmentDetails.canEditStatus) {
      return;
    }

    setIsEditingAppointment(true);
    setEditAppointmentError("");
    setEditAppointment({
      date: selectedAppointmentDetails.date,
      startTime: selectedAppointmentDetails.startTime,
      endTime: selectedAppointmentDetails.endTime,
      patient: selectedAppointmentDetails.patient,
      procedure: selectedAppointmentDetails.procedure,
      procedureValue: selectedAppointmentDetails.procedureValue || "",
      notes: selectedAppointmentDetails.notes || "",
      professional: selectedAppointmentDetails.professional,
    });
  }

  function handleSaveEditedAppointment() {
    if (!selectedAppointmentDetails?.appointmentId || !selectedAppointmentDetails.canEditStatus) {
      return;
    }

    if (!editAppointment.patient.trim() || !editAppointment.procedure.trim()) {
      setEditAppointmentError("Preencha paciente e procedimento.");
      return;
    }

    if (parseCurrencyToCents(editAppointment.procedureValue) < 0) {
      setEditAppointmentError("O valor do procedimento não pode ser negativo.");
      return;
    }

    if (parseTimeToMinutes(editAppointment.endTime) <= parseTimeToMinutes(editAppointment.startTime)) {
      setEditAppointmentError("O horário final precisa ser maior que o inicial.");
      return;
    }

    const updatedPatientName = editAppointment.patient.trim();

    setAppointmentList((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === selectedAppointmentDetails.appointmentId
          ? {
            ...appointment,
            date: editAppointment.date,
            startTime: editAppointment.startTime,
            endTime: editAppointment.endTime,
            patient: updatedPatientName,
            procedure: editAppointment.procedure.trim(),
            procedureValue: editAppointment.procedureValue,
            notes: editAppointment.notes.trim(),
            professional: editAppointment.professional.trim(),
          }
          : appointment
      )
    );
    setSelectedAppointmentDetails((currentDetails) =>
      currentDetails
        ? {
          ...currentDetails,
          date: editAppointment.date,
          startTime: editAppointment.startTime,
          endTime: editAppointment.endTime,
          patient: updatedPatientName,
          procedure: editAppointment.procedure.trim(),
          procedureValue: editAppointment.procedureValue,
          notes: editAppointment.notes.trim(),
          professional: editAppointment.professional.trim(),
        }
        : currentDetails
    );
    setIsEditingAppointment(false);
    setEditAppointmentError("");
    setStatusNotification({
      title: "Agendamento atualizado",
      description: `Os dados de ${updatedPatientName} foram atualizados com sucesso.`,
    });
  }

  function handleStockDraftChange(productId: string, value: string) {
    const numericValue = value.replace(/\D/g, "");
    setStockControlError("");

    if (!numericValue) {
      setStockDraftByProductId((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }

    setStockDraftByProductId((current) => ({
      ...current,
      [productId]: numericValue,
    }));
  }

  function handleUpdateAppointmentStatus() {
    if (!selectedAppointmentDetails?.canEditStatus || !selectedAppointmentDetails.appointmentId) {
      return;
    }

    const appointmentId = selectedAppointmentDetails.appointmentId;
    const previousUsage = appointmentStockUsage[appointmentId] ?? {};

    if (editableStatus === "concluido") {
      const selectedStockItems = Object.entries(stockDraftByProductId)
        .map(([productId, quantity]) => ({
          productId,
          quantity: Number(quantity),
        }))
        .filter((item) => item.quantity > 0);

      for (const item of selectedStockItems) {
        const product = stockProducts.find((stockItem) => stockItem.id === item.productId);
        if (!product) {
          continue;
        }

        const availableForThisAppointment = product.quantity + (previousUsage[item.productId] ?? 0);
        if (item.quantity > availableForThisAppointment) {
          setDetailsTab("estoque");
          setStockControlError(
            `Quantidade inválida para ${product.name}. Disponível: ${availableForThisAppointment} ${product.unit}.`
          );
          return;
        }
      }

      setStockProducts((currentProducts) =>
        currentProducts.map((product) => {
          const newQuantity = Number(stockDraftByProductId[product.id] ?? 0);
          const oldQuantity = previousUsage[product.id] ?? 0;
          const delta = newQuantity - oldQuantity;
          return { ...product, quantity: product.quantity - delta };
        })
      );
      setAppointmentStockUsage((currentUsage) => ({
        ...currentUsage,
        [appointmentId]: Object.fromEntries(
          selectedStockItems.map((item) => [item.productId, item.quantity])
        ),
      }));
      setStockControlError("");
    } else if (Object.keys(previousUsage).length > 0) {
      setStockProducts((currentProducts) =>
        currentProducts.map((product) => ({
          ...product,
          quantity: product.quantity + (previousUsage[product.id] ?? 0),
        }))
      );
      setAppointmentStockUsage((currentUsage) => {
        const nextUsage = { ...currentUsage };
        delete nextUsage[appointmentId];
        return nextUsage;
      });
      setStockControlError("");
    }

    const patientName = selectedAppointmentDetails.patient;
    const updatedStatusLabel = statusLabel(editableStatus);

    setAppointmentList((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === selectedAppointmentDetails.appointmentId
          ? { ...appointment, status: editableStatus }
          : appointment
      )
    );
    setSelectedAppointmentDetails((currentDetails) =>
      currentDetails ? { ...currentDetails, status: editableStatus } : currentDetails
    );
    setSelectedAppointmentDetails(null);
    setStatusNotification({
      title: editableStatus === "confirmado" ? "Agendamento Confirmado" : "Status Atualizado",
      description:
        editableStatus === "confirmado"
          ? `O atendimento foi confirmado com sucesso para ${patientName}.`
          : `Status alterado para ${updatedStatusLabel} para ${patientName}.`,
    });
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "day") {
      return;
    }

    let isCancelled = false;

    async function loadAppointmentsByDay() {
      try {
        const appointments = await getAppointmentsByDate(selectedDateKey);

        if (!isCancelled) {
          setAppointmentList(appointments);
        }
      } catch (error) {
        if (!isCancelled) {
          setAppointmentList([]);
        }
        console.error("Erro ao buscar agendamentos (dia):", error);
      }
    }

    void loadAppointmentsByDay();

    return () => {
      isCancelled = true;
    };
  }, [selectedDateKey, viewMode]);

  useEffect(() => {
    if (viewMode !== "week") {
      return;
    }

    let isCancelled = false;

    async function loadAppointmentsByWeek() {
      try {
        const weekStartKey = toDateKey(weekStartDate);
        const weekEndKey = toDateKey(weekEndDate);
        const appointments = await getAppointmentsByWeek(weekStartKey, weekEndKey);

        if (!isCancelled) {
          setAppointmentList(appointments);
        }
      } catch (error) {
        if (!isCancelled) {
          setAppointmentList([]);
        }
        console.error("Erro ao buscar agendamentos (semana):", error);
      }
    }

    void loadAppointmentsByWeek();

    return () => {
      isCancelled = true;
    };
  }, [weekStartDate, weekEndDate, viewMode]);

  useEffect(() => {
    if (viewMode !== "day" || !isSelectedDateToday || !scheduleScrollRef.current) {
      return;
    }

    const scrollContainer = scheduleScrollRef.current;
    const targetScrollTop = currentTimeIndicatorTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTop = Math.max(0, targetScrollTop);
  }, [selectedDateKey, isSelectedDateToday, currentTimeIndicatorTop, viewMode]);

  useEffect(() => {
    if (viewMode !== "week" || !isSelectedWeekCurrent || !weekScheduleScrollRef.current) {
      return;
    }

    const scrollContainer = weekScheduleScrollRef.current;
    const targetScrollTop = weekCurrentTimeIndicatorTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTop = Math.max(0, targetScrollTop);
  }, [isSelectedWeekCurrent, weekCurrentTimeIndicatorTop, viewMode]);

  useEffect(() => {
    if (!statusNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusNotification(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusNotification]);

  useEffect(() => {
    if (!isProfessionalFilterOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        professionalsFilterRef.current &&
        !professionalsFilterRef.current.contains(event.target as Node)
      ) {
        setIsProfessionalFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfessionalFilterOpen]);

  useEffect(() => {
    if (!isDatePickerOpen) {
      setDatePickerPopoverStyle(null);
      return;
    }

    updateDatePickerPopoverPosition();
    window.addEventListener("resize", updateDatePickerPopoverPosition);
    window.addEventListener("scroll", updateDatePickerPopoverPosition, true);

    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (datePickerRef.current?.contains(t) || datePickerPopoverRef.current?.contains(t)) {
        return;
      }
      setIsDatePickerOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateDatePickerPopoverPosition);
      window.removeEventListener("scroll", updateDatePickerPopoverPosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDatePickerOpen, updateDatePickerPopoverPosition]);

  useEffect(() => {
    if (!isCreateDatePickerOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (createDatePickerRef.current && !createDatePickerRef.current.contains(event.target as Node)) {
        setIsCreateDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateDatePickerOpen]);

  useEffect(() => {
    if (!clientSearchPopoverOpen || normalizedClientFilter.length < 2) {
      return;
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (clientFilterRef.current?.contains(event.target as Node)) return;
      setClientSearchPopoverOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [clientSearchPopoverOpen, normalizedClientFilter.length]);

  useEffect(() => {
    if (!isCreateDatePickerOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      createDatePickerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCreateDatePickerOpen]);

  const isBlockedSlot = newAppointment.status === "bloqueado";
  const formattedCreateAppointmentDate = useMemo(() => {
    if (!newAppointment.date) {
      return "Selecionar data";
    }

    const selectedCreateDate = new Date(`${newAppointment.date}T00:00:00`);
    return selectedCreateDate.toLocaleDateString("pt-BR");
  }, [newAppointment.date]);

  return (
    <div className="min-h-screen">
        <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-center lg:justify-between bg-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="h-8 w-8 shrink-0 text-blue-600" aria-hidden />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Agendamentos</h1>
                
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="group flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-300/50 transition-colors hover:bg-blue-700"
              onClick={openCreateAppointmentModal}
            >
              <span className="relative h-4 w-4">
                <PlusIcon className="absolute inset-0 h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-90 group-hover:scale-75 group-hover:opacity-0" />
                <MinusIcon className="absolute inset-0 h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100" />
              </span>
              <span className="text-sm font-semibold text-white">Novo Agendamento</span>
            </button>
          </div>
        </div>
        
        <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            {/* Data à esquerda */}
            <div className="relative min-w-0 shrink-0 sm:min-w-[12rem] sm:max-w-[min(20rem,calc(100vw-8rem))]" ref={datePickerRef}>
                <button
                  type="button"
                  className={`flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-center shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-3 ${
                    isDatePickerOpen
                      ? "border-blue-400 bg-white ring-1 ring-blue-200"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-md active:scale-[0.99]"
                  }`}
                  onClick={openDatePicker}
                  aria-label="Abrir calendário e escolher data"
                  aria-expanded={isDatePickerOpen}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" aria-hidden />
                  <span className="min-w-0 truncate text-center text-sm font-bold capitalize tracking-tight text-slate-800 sm:text-base">
                    {headerTitle}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform sm:h-4 sm:w-4 ${
                      isDatePickerOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                    aria-hidden
                  />
                </button>
            </div>
            {isDatePickerOpen &&
            datePickerPopoverStyle &&
            typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={datePickerPopoverRef}
                    role="dialog"
                    aria-label="Calendário"
                    className="fixed w-80 max-w-[min(20rem,calc(100vw-1rem))] rounded-2xl border border-blue-100 bg-white p-3 shadow-xl shadow-slate-300/40"
                    style={{
                      top: datePickerPopoverStyle.top,
                      left: datePickerPopoverStyle.left,
                      zIndex: DATE_PICKER_Z,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setDatePickerMonth((current) => addMonths(current, -1))}
                        aria-label="Mês anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {datePickerMonth.toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setDatePickerMonth((current) => addMonths(current, 1))}
                        aria-label="Próximo mês"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-[0.08em] text-slate-400">
                      {monthDayLabels.map((label) => (
                        <span key={`picker-${label}`}>{label}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {datePickerGridDays.map((day) => {
                        const dayKey = toDateKey(day);
                        const isCurrentMonth = day.getMonth() === datePickerMonth.getMonth();
                        const isSelected = dayKey === selectedDateKey;
                        const isToday = dayKey === todayKey;
                        return (
                          <button
                            key={`picker-day-${dayKey}`}
                            type="button"
                            className={`h-9 rounded-lg text-sm font-semibold transition ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : isToday
                                  ? "bg-blue-50 text-blue-700"
                                  : isCurrentMonth
                                    ? "text-slate-700 hover:bg-blue-50"
                                    : "text-slate-300 hover:bg-slate-50"
                            }`}
                            onClick={() => {
                              setSelectedDate(day);
                              setIsDatePickerOpen(false);
                            }}
                          >
                            {String(day.getDate()).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>,
                  document.body
                )
              : null}

            <div
              className="relative grid min-w-[200px] shrink-0 grid-cols-3 rounded-lg bg-slate-100 p-1 sm:min-w-[220px]"
              role="tablist"
              aria-label="Modo de visualização da agenda"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-md bg-white shadow-sm ring-1 ring-slate-200/90 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                style={{
                  width: "calc((100% - 0.5rem) / 3)",
                  transform: `translateX(calc(${viewMode === "day" ? 0 : viewMode === "week" ? 1 : 2} * 100%))`,
                }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "day"}
                className={`relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                  viewMode === "day" ? "font-semibold text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setViewMode("day")}
              >
                Dia
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "week"}
                className={`relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                  viewMode === "week" ? "font-semibold text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setViewMode("week")}
              >
                Semana
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "month"}
                className={`relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                  viewMode === "month" ? "font-semibold text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setViewMode("month")}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={clientFilterRef}>
              <div className="flex h-10 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
                <UserSearch className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <input
                  type="text"
                  value={clientFilter}
                  onChange={(event) => {
                    setClientFilter(event.target.value);
                    setClientSearchPopoverOpen(true);
                  }}
                  onFocus={() => setClientSearchPopoverOpen(true)}
                  placeholder="Buscar cliente no dia…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  aria-autocomplete="list"
                  aria-expanded={
                    clientSearchPopoverOpen && normalizedClientFilter.length >= 2
                  }
                  aria-controls="client-day-matches"
                />
              </div>
              {clientSearchPopoverOpen && normalizedClientFilter.length >= 2 && clientDaySearchMatches.length > 0 ? (
                <div
                  id="client-day-matches"
                  role="listbox"
                  className="absolute left-0 top-full z-[90] mt-1 w-[min(100vw-2rem,22rem)] rounded-xl border border-blue-100 bg-white py-2 shadow-xl shadow-slate-200/80"
                >
                  <p className="border-b border-slate-100 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    No dia {selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </p>
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {clientDaySearchMatches.map((apt) => (
                      <li key={apt.id} role="option">
                        <button
                          type="button"
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-blue-50"
                          onClick={() => goToClientAppointment(apt)}
                        >
                          <span className="text-xs font-bold text-blue-700">
                            {apt.startTime} – {apt.endTime}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{apt.patient}</span>
                          <span className="truncate text-xs text-slate-500">{apt.procedure}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-slate-100 px-3 pt-2 text-[10px] text-slate-400">
                    Clique para abrir e ir ao horário na agenda (dia)
                  </p>
                </div>
              ) : clientSearchPopoverOpen && normalizedClientFilter.length >= 2 ? (
                <div className="absolute left-0 top-full z-[90] mt-1 w-[min(100vw-2rem,20rem)] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
                  Nenhum agendamento deste cliente neste dia.
                </div>
              ) : null}
            </div>

            <div className="relative" ref={professionalsFilterRef}>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"
                onClick={() => setIsProfessionalFilterOpen((current) => !current)}
                aria-expanded={isProfessionalFilterOpen}
                aria-haspopup="dialog"
              >
                <UserSearch className="h-4 w-4" />
                {selectedProfessionals.length === 0
                  ? "Profissionais"
                  : `${selectedProfessionals.length} profissional(is)`}
              </button>
              {isProfessionalFilterOpen ? (
                <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Filtrar profissionais
                  </p>
                  <button
                    type="button"
                    className={`mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${selectedProfessionals.length === 0
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                      }`}
                    onClick={() => setSelectedProfessionals([])}
                  >
                    Todos
                    {selectedProfessionals.length === 0 ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Ativo</span>
                    ) : null}
                  </button>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {availableProfessionals.map((professional) => {
                      const isSelected = selectedProfessionals.includes(professional);

                      return (
                        <label
                          key={professional}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedProfessionals((current) =>
                                current.includes(professional)
                                  ? current.filter((item) => item !== professional)
                                  : [...current, professional]
                              )
                            }
                          />
                          <span className="truncate">{professional}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          </div>
          <div className="flex pt-3 flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-slate-50 px-3 py-1 text-gray-800">
              <span className="h-2 w-2 rounded-full bg-[#2db32d]" />
              Confirmado
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-slate-50 px-3 py-1 text-gray-800">
              <span className="h-2 w-2 rounded-full bg-[#c4c43a]" />
              Pendente
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-slate-50 px-3 py-1 text-gray-800">
              <span className="h-2 w-2 rounded-full bg-[#B65AC8]" />
              Em andamento
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-slate-50 px-3 py-1 text-gray-800">
              <span className="h-2 w-2 rounded-full bg-[#4bb7b7]" />
              Concluído
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-slate-50 px-3 py-1 text-gray-800">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              Bloqueado
            </span>
          </div>
        </div>


        {viewMode === "day" ? (
          <div ref={scheduleScrollRef} className="max-h-[70vh] overflow-y-auto bg-white rounded-xl border border-slate-200">
            <div className="min-w-[980px] ">
              <div className="relative">
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="grid h-20 grid-cols-[64px_1fr] border-b border-slate-100 last:border-b-0"
                    style={{ height: `${HOUR_ROW_HEIGHT / 2}px` }}
                  >
                    <div className="flex items-start justify-center py-4 text-xs font-semibold text-slate-400">
                      {slot}
                    </div>
                    <div className="border-l border-slate-100" />
                  </div>
                ))}

                <div className="pointer-events-none absolute inset-y-0 left-16 right-0 z-10">
                  {selectedDayEvents.map((event) => {
                    const startMinutes = parseTimeToMinutes(event.startTime);
                    const endMinutes = parseTimeToMinutes(event.endTime);
                    const top = (startMinutes * HOUR_ROW_HEIGHT) / 60;
                    const height = ((endMinutes - startMinutes) * HOUR_ROW_HEIGHT) / 60;
                    const columnWidth = 100 / event.overlapCount;
                    const leftOffset = columnWidth * event.overlapIndex;

                    return (
                      <WeekAppointmentCard
                        key={`day-${event.appointmentId ?? event.startTime}-${event.overlapIndex}`}
                        event={event}
                        top={top}
                        height={height}
                        columnWidth={columnWidth}
                        leftOffset={leftOffset}
                        maxWidth={event.overlapCount === 1 ? 340 : undefined}
                        anchorId={
                          event.appointmentId ? `agenda-appt-${event.appointmentId}` : undefined
                        }
                        onOpen={() =>
                          openAppointmentDetails({
                            appointmentId: event.appointmentId,
                            date: selectedDateKey,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            patient: event.patient,
                            procedure: event.title,
                            procedureValue: event.procedureValue,
                            notes: event.notes,
                            professional: event.professional,
                            status: event.status,
                            canEditStatus: Boolean(event.canEditStatus && event.appointmentId),
                          })
                        }
                      />
                    );
                  })}
                </div>
                {isSelectedDateToday ? (
                  <div
                    className="pointer-events-none absolute left-16 right-0 z-20"
                    style={{ top: `${currentTimeIndicatorTop}px` }}
                  >
                    <div className="relative">
                      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500" />
                      <span className="absolute -top-2 right-0 rounded bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                        {currentTimeLabel}
                      </span>
                      <div className="h-0.5 w-full bg-red-500" />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-[64px_1fr] bg-slate-50/80">
                <div className="flex items-start justify-center py-2 text-xs font-semibold text-slate-500">
                  23:59
                </div>
                <div className="py-2 text-xs text-slate-400">Fim do dia</div>
              </div>
            </div>
          </div>
        ) : viewMode === "week" ? (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] bg-slate-50/80">
                <div className="flex items-center justify-center border-b border-r border-slate-200 px-2 py-4 text-xs font-semibold text-slate-400">
                  Horário
                </div>
                {weekDays.map((day, index) => {
                  const isToday = toDateKey(day) === toDateKey(new Date());

                  return (
                    <div
                      key={`${toDateKey(day)}-${index}`}
                      className={`border-b border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${isToday ? "bg-indigo-50" : ""
                        }`}
                    >
                      <p className={`text-xs font-semibold ${isToday ? "text-indigo-500" : "text-slate-400"}`}>
                        {weekDayLabels[index]}
                      </p>
                      <p className={`text-3xl font-bold leading-none ${isToday ? "text-indigo-600" : "text-slate-800"}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div ref={weekScheduleScrollRef} className="max-h-[70vh] overflow-y-auto">
                <div className="relative">
                  {weekTimeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))]"
                      style={{ height: `${WEEK_ROW_HEIGHT}px` }}
                    >
                      <div className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400">
                        {slot}
                      </div>
                      {weekDayLabels.map((dayLabel) => (
                        <div key={`${slot}-${dayLabel}`} className="border-b border-r border-slate-200 last:border-r-0" />
                      ))}
                    </div>
                  ))}

                  <div className="pointer-events-none absolute inset-0 grid grid-cols-[88px_repeat(7,minmax(0,1fr))]">
                    <div />
                    {weekDayLabels.map((dayLabel, dayIndex) => (
                      <div key={dayLabel} className="relative">
                        {selectedWeekEventsByDay[dayIndex].map((event) => {
                          const startMinutes = parseTimeToMinutes(event.startTime);
                          const endMinutes = parseTimeToMinutes(event.endTime);
                          const top =
                            ((startMinutes - WEEK_START_HOUR * 60) * WEEK_ROW_HEIGHT) / 60;
                          const height = Math.max(
                            56,
                            ((endMinutes - startMinutes) * WEEK_ROW_HEIGHT) / 60
                          );
                          const columnWidth = 100 / event.overlapCount;
                          const leftOffset = columnWidth * event.overlapIndex;

                          return (
                            <WeekAppointmentCard
                              key={`${dayIndex}-${event.title}-${event.startTime}-${event.overlapIndex}`}
                              event={event}
                              top={top}
                              height={height}
                              columnWidth={columnWidth}
                              leftOffset={leftOffset}
                              maxWidth={event.overlapCount === 1 ? 340 : undefined}
                              anchorId={
                                event.appointmentId
                                  ? `agenda-appt-${event.appointmentId}`
                                  : undefined
                              }
                              onOpen={() =>
                                openAppointmentDetails({
                                  appointmentId: event.appointmentId,
                                  date: toDateKey(weekDays[dayIndex]),
                                  startTime: event.startTime,
                                  endTime: event.endTime,
                                  patient: event.patient,
                                  procedure: event.title,
                                  procedureValue: event.procedureValue,
                                  notes: event.notes,
                                  professional: event.professional,
                                  status: event.status,
                                  canEditStatus: Boolean(event.canEditStatus && event.appointmentId),
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {showWeekCurrentTimeLine ? (
                    <div
                      className="pointer-events-none absolute left-[88px] right-0 z-20"
                      style={{ top: `${weekCurrentTimeIndicatorTop}px` }}
                    >
                      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500" />
                      <span className="absolute -top-2 right-2 rounded bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                        {currentTimeLabel}
                      </span>
                      <div className="h-0.5 w-full bg-red-500" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1080px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-7 bg-slate-50/90">
                {monthDayLabels.map((label) => (
                  <div
                    key={label}
                    className="border-b border-r border-slate-200 px-3 py-3 text-center text-xs font-semibold tracking-[0.08em] text-slate-400 last:border-r-0"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthGridDays.map((day) => {
                  const dayKey = toDateKey(day);
                  const dayAppointments = monthlyAppointmentsByDate[dayKey] ?? [];
                  const isToday = dayKey === todayKey;
                  const isOutsideCurrentMonth = day.getMonth() !== monthStartDate.getMonth();
                  const isSelectedDay = dayKey === selectedDateKey;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`flex min-h-[128px] flex-col items-start justify-start border-b border-r border-slate-200 px-2.5 py-2 text-left align-top transition hover:bg-slate-50 ${isOutsideCurrentMonth ? "bg-slate-50/70" : "bg-white"
                        } ${isSelectedDay ? "ring-1 ring-inset ring-indigo-200" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode("day");
                      }}
                    >
                      <p
                        className={`mb-1.5 text-sm font-semibold ${isToday
                            ? "text-indigo-600 underline underline-offset-2"
                            : isOutsideCurrentMonth
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                      >
                        {String(day.getDate()).padStart(2, "0")}
                      </p>

                      {dayAppointments.length > 0 ? (
                        <span className="mt-1.5 flex h-5 items-center rounded bg-indigo-100 px-2 text-[11px] font-medium text-indigo-700">
                          {dayAppointments.length}{" "}
                          {dayAppointments.length === 1 ? "agendamento" : "agendamentos"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      

      {selectedAppointmentDetails ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
          onClick={() => setSelectedAppointmentDetails(null)}
        >
          <div
            className="flex h-full w-full max-w-md flex-col border-l border-blue-100 bg-white shadow-2xl shadow-blue-200/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-2xl font-bold text-slate-800">Detalhes do Agendamento</h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setSelectedAppointmentDetails(null)}
                aria-label="Fechar detalhes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-5 py-5 text-sm text-slate-700">
              {isEditingAppointment ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Editar agendamento
                  </p>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Cliente
                      <input
                        type="text"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                        value={editAppointment.patient}
                        onChange={(event) =>
                          setEditAppointment((current) => ({ ...current, patient: event.target.value }))
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Procedimento
                        <select
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.procedure}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, procedure: event.target.value }))
                          }
                        >
                          {procedureOptions.map((procedure) => (
                            <option key={procedure} value={procedure}>
                              {procedure}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Profissional
                        <select
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.professional}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, professional: event.target.value }))
                          }
                        >
                          {professionalOptions.map((professional) => (
                            <option key={professional} value={professional}>
                              {professional}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Valor do procedimento
                      <input
                        type="text"
                        inputMode="numeric"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                        placeholder="R$ 0,00"
                        value={editAppointment.procedureValue}
                        onChange={(event) =>
                          setEditAppointment((current) => ({
                            ...current,
                            procedureValue: formatCurrencyInput(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Observações
                      <textarea
                        className="mt-1.5 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                        placeholder="Observações adicionais..."
                        value={editAppointment.notes}
                        onChange={(event) =>
                          setEditAppointment((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Data
                        <div className="relative mt-1.5">
                          <CalendarIcon
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600"
                            aria-hidden
                          />
                          <input
                            type="date"
                            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-blue-300 hover:bg-blue-50/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                            value={editAppointment.date}
                            onChange={(event) =>
                              setEditAppointment((current) => ({ ...current, date: event.target.value }))
                            }
                          />
                        </div>
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Início
                        <input
                          type="time"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.startTime}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, startTime: event.target.value }))
                          }
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Término
                        <input
                          type="time"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.endTime}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, endTime: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  <p className="text-lg font-bold text-slate-800">{selectedAppointmentDetails.patient}</p>
                  <p className="mt-1 text-sm text-blue-700">{selectedAppointmentDetails.procedure}</p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold ${detailsTab === "status"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                  onClick={() => setDetailsTab("status")}
                >
                  Status
                </button>
                <button
                  type="button"
                  className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold ${detailsTab === "estoque"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                  onClick={() => setDetailsTab("estoque")}
                >
                  Estoque {selectedStockItemsCount > 0 ? `(${selectedStockItemsCount})` : ""}
                </button>
              </div>

              {detailsTab === "status" ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Informações da sessão
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex justify-between gap-3">
                      <span className="text-slate-500 flex items-center gap-2"> <CalendarIcon className="h-4 w-4 text-blue-600" />Data</span>
                      <span className="font-semibold text-slate-800">{selectedAppointmentDetails.date}</span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-slate-500 flex items-center gap-2"> <Clock3 className="h-4 w-4 text-blue-600" />Horário</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppointmentDetails.startTime} - {selectedAppointmentDetails.endTime}
                      </span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-slate-500 flex items-center gap-2"> <UserIcon className="h-4 w-4 text-blue-600" />Profissional</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppointmentDetails.professional || "Não informado"}
                      </span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-slate-500 flex items-center gap-2"> <CoinsIcon className="h-4 w-4 text-blue-600" />Valor</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppointmentDetails.procedureValue || "Não informado"}
                      </span>
                    </p>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Observações</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedAppointmentDetails.notes?.trim() || "Sem observações."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {detailsTab === "status" ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <ChartNoAxesColumn className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</p>
                  </div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(editableStatus)}`} />
                    {statusLabel(editableStatus)}
                  </div>
                  {selectedAppointmentDetails.canEditStatus ? (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      {appointmentStatusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${statusOptionButtonStyles(
                            status,
                            editableStatus
                          )}`}
                          onClick={() => {
                            setEditableStatus(status);
                            setStockControlError("");
                            if (status === "concluido") {
                              setDetailsTab("estoque");
                            }
                          }}
                          aria-pressed={editableStatus === status}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(status)}`} />
                          {statusLabel(status)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-900">
                      {statusLabel(selectedAppointmentDetails.status)}
                    </p>
                  )}
                  {!selectedAppointmentDetails.canEditStatus ? (
                    <p className="mt-2 text-xs text-blue-700">Este atendimento é apenas visualização.</p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <h4 className="text-2xl font-bold text-slate-800">Controle de estoque</h4>
                    <p className="mt-1 text-base text-slate-500">
                      Registre os itens utilizados neste atendimento
                    </p>
                  </div>
                  <div className="space-y-3">
                    {stockProducts.map((product) => {
                      const availableForThisAppointment =
                        product.quantity + (selectedAppointmentStockUsage[product.id] ?? 0);
                      const currentQuantity = stockDraftByProductId[product.id] ?? "";
                      const isSelected = Number(currentQuantity) > 0;

                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm text-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                              {product.icon}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-900">{product.name}</p>
                              <p className="text-sm text-slate-500">
                                {availableForThisAppointment} {product.unit} | {Number(currentQuantity || 0)} un.
                                utilizados
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
                              onClick={() => {
                                const currentValue = Number(currentQuantity || 0);
                                const nextValue = Math.max(0, currentValue - 1);
                                handleStockDraftChange(product.id, nextValue > 0 ? String(nextValue) : "");
                              }}
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-12 bg-transparent text-center text-xl font-semibold text-slate-800 outline-none"
                              value={currentQuantity || 0}
                              onChange={(event) => handleStockDraftChange(product.id, event.target.value)}
                            />
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
                              onClick={() => {
                                const currentValue = Number(currentQuantity || 0);
                                const nextValue = Math.min(availableForThisAppointment, currentValue + 1);
                                handleStockDraftChange(product.id, String(nextValue));
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Ao salvar como concluído, o estoque será baixado conforme os itens selecionados.
                  </p>
                </div>
              )}
            </div>

            {editAppointmentError ? (
              <p className="px-5 pb-1 text-sm font-medium text-rose-600">{editAppointmentError}</p>
            ) : null}
            {stockControlError ? (
              <p className="px-5 pb-1 text-sm font-medium text-rose-600">{stockControlError}</p>
            ) : null}

            <div className="flex gap-2 border-t border-blue-100 bg-white px-5 py-4">
              {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="flex-1 rounded-lg border bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  onClick={handleUpdateAppointmentStatus}
                >
                  Salvar
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={handleOpenEditAppointment}
                >
                  Editar agendamento
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && isEditingAppointment ? (
                <>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    onClick={handleSaveEditedAppointment}
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setIsEditingAppointment(false);
                      setEditAppointmentError("");
                    }}
                  >
                    Cancelar edição
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col border-l border-indigo-100 bg-white shadow-2xl shadow-indigo-200/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-slate-800">Novo Agendamento</h3>
              </div>

              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 px-5 py-5">
              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Cliente
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <UserSearch className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                    placeholder="Nome do cliente ou CPF"
                    value={newAppointment.patient}
                    disabled={isBlockedSlot}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, patient: event.target.value }))
                    }
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-semibold normal-case text-blue-600 transition hover:text-blue-800"
                  >
                    + Adicionar cliente
                  </button>
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Profissional
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700"
                    value={newAppointment.professional}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, professional: event.target.value }))
                    }
                  >
                    {professionalOptions.map((professional) => (
                      <option key={professional} value={professional}>
                        {professional}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Procedimento
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    value={newAppointment.procedure}
                    disabled={isBlockedSlot}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, procedure: event.target.value }))
                    }
                  >
                    {procedureOptions.map((procedure) => (
                      <option key={procedure} value={procedure}>
                        {procedure}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Lock className="h-4 w-4 text-slate-500" />
                  Horário bloqueado para o profissional
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  checked={isBlockedSlot}
                  onChange={(event) =>
                    setNewAppointment((current) => ({
                      ...current,
                      status: event.target.checked ? "bloqueado" : "confirmado",
                    }))
                  }
                />
              </label>
              {isBlockedSlot ? (
                <p className="-mt-2 text-xs font-medium text-slate-500">
                  Ao salvar, este intervalo ficará indisponível para novos agendamentos desse profissional.
                </p>
              ) : null}

              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Valor do procedimento
                <input
                  type="text"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="R$ 0,00"
                  value={newAppointment.procedureValue}
                  disabled={isBlockedSlot}
                  onChange={(event) =>
                    setNewAppointment((current) => ({
                      ...current,
                      procedureValue: formatCurrencyInput(event.target.value),
                    }))
                  }
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Data
                  <div className="relative mt-2" ref={createDatePickerRef}>
                    <button
                      type="button"
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isCreateDatePickerOpen
                          ? "border-blue-400 ring-1 ring-blue-200"
                          : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md active:scale-[0.995]"
                      }`}
                      onClick={openCreateDatePicker}
                      aria-label="Selecionar data do agendamento"
                      aria-expanded={isCreateDatePickerOpen}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <CalendarIcon className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
                        <span
                          className={`whitespace-nowrap ${newAppointment.date ? "text-slate-800" : "text-slate-400"}`}
                        >
                          {formattedCreateAppointmentDate}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-500 ${isCreateDatePickerOpen ? "rotate-180 text-blue-600" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {isCreateDatePickerOpen ? (
                      <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-blue-100 bg-white p-3 shadow-lg">
                        <div className="mb-3 flex items-center justify-between">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => setCreateDatePickerMonth((current) => addMonths(current, -1))}
                            aria-label="Mês anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <p className="text-sm font-semibold capitalize text-slate-800">
                            {createDatePickerMonth.toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => setCreateDatePickerMonth((current) => addMonths(current, 1))}
                            aria-label="Próximo mês"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-[0.08em] text-slate-400">
                          {monthDayLabels.map((label) => (
                            <span key={`create-picker-${label}`}>{label}</span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {createDatePickerGridDays.map((day) => {
                            const dayKey = toDateKey(day);
                            const isCurrentMonth = day.getMonth() === createDatePickerMonth.getMonth();
                            const isSelected = dayKey === newAppointment.date;
                            const isToday = dayKey === todayKey;

                            return (
                              <button
                                key={`create-picker-day-${dayKey}`}
                                type="button"
                                className={`h-9 rounded-lg text-sm font-semibold transition ${isSelected
                                    ? "bg-blue-600 text-white"
                                    : isToday
                                      ? "bg-blue-50 text-blue-700"
                                      : isCurrentMonth
                                        ? "text-slate-700 hover:bg-blue-50"
                                        : "text-slate-300 hover:bg-slate-50"
                                  }`}
                                onClick={() => {
                                  setNewAppointment((current) => ({ ...current, date: dayKey }));
                                  setIsCreateDatePickerOpen(false);
                                }}
                              >
                                {String(day.getDate()).padStart(2, "0")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Início
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="time"
                      className="w-full bg-transparent text-base text-slate-700 outline-none"
                      value={newAppointment.startTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({ ...current, startTime: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Término
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="time"
                      className="w-full bg-transparent text-base text-slate-700 outline-none"
                      value={newAppointment.endTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({ ...current, endTime: event.target.value }))
                      }
                    />
                  </div>
                </label>
              </div>

              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Observações
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Observações adicionais..."
                  value={newAppointment.notes}
                  onChange={(event) =>
                    setNewAppointment((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </div>

            {createAppointmentError ? (
              <p className="px-5 pb-2 text-sm font-medium text-rose-600">{createAppointmentError}</p>
            ) : null}

            <div className="flex gap-3 border-t border-indigo-100 bg-white px-5 py-4">
              <button
                type="button"
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                onClick={handleCreateAppointment}
              >
                {isBlockedSlot ? "Salvar Bloqueio" : "Salvar Agendamento"}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusNotification ? (
        <StatusNotification
          title={statusNotification.title}
          description={statusNotification.description}
          onClose={() => setStatusNotification(null)}
        />
      ) : null}
    </div>
  );
}
