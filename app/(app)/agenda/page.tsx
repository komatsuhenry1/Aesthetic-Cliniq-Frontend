"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clock4,
  Lock,
  FileText,
  UserSearch,
  UserIcon,
  UserPlus,
  CheckCircle2,
  X,
  ChartNoAxesColumn,
  CoinsIcon,
  CreditCard,
  InfoIcon,
  CalendarClockIcon,
  PlusIcon,
  MinusIcon,
} from "lucide-react";
import { StatusNotification } from "@/components/status-notification";
import {
  getAppointmentsByDate,
  getAppointmentsByWeek,
  getMonthlyAppointmentCount,
  createAppointment,
} from "@/services/api/appointment";
import type { MonthlyCountItem } from "@/services/api/appointment";
import { getProfessionalNames } from "@/services/api/professional";
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
  paymentMethodLabel,
  statusDotColor,
  statusLabel,
  statusOptionButtonStyles,
  toDateKey,
} from "./utils";

export default function AgendaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [monthlyCounts, setMonthlyCounts] = useState<MonthlyCountItem[]>([]);
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
    paymentMethod: "",
    installments: "",
  });
  const [stockProducts, setStockProducts] = useState<StockProduct[]>(initialStockProducts);
  const [appointmentStockUsage, setAppointmentStockUsage] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [stockDraftByProductId, setStockDraftByProductId] = useState<Record<string, string>>({});
  const [stockControlError, setStockControlError] = useState("");
  const [statusNotification, setStatusNotification] = useState<AgendaStatusNotification | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateDrawerClosing, setIsCreateDrawerClosing] = useState(false);
  const [isDetailsDrawerClosing, setIsDetailsDrawerClosing] = useState(false);
  const [isProfessionalFilterOpen, setIsProfessionalFilterOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => getStartOfMonth(new Date()));
  const [isCreateDatePickerOpen, setIsCreateDatePickerOpen] = useState(false);
  const [createDatePickerMonth, setCreateDatePickerMonth] = useState(() => getStartOfMonth(new Date()));
  const [isCreateProfessionalSelectOpen, setIsCreateProfessionalSelectOpen] = useState(false);
  const [isCreateProcedureSelectOpen, setIsCreateProcedureSelectOpen] = useState(false);
  const [isEditDatePickerOpen, setIsEditDatePickerOpen] = useState(false);
  const [editDatePickerMonth, setEditDatePickerMonth] = useState(() => getStartOfMonth(new Date()));
  const [isEditProfessionalSelectOpen, setIsEditProfessionalSelectOpen] = useState(false);
  const [isEditProcedureSelectOpen, setIsEditProcedureSelectOpen] = useState(false);
  const [createProfessionalNameOptions, setCreateProfessionalNameOptions] = useState<string[]>(professionalOptions);
  const [createProfessionalNamesLoading, setCreateProfessionalNamesLoading] = useState(false);
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
    paymentMethod: "",
    installments: "",
  }));
  const [createAppointmentError, setCreateAppointmentError] = useState("");

  // States para Criação Rápida de Cliente
  const [isQuickContactDrawerOpen, setIsQuickContactDrawerOpen] = useState(false);
  const [isQuickContactDrawerClosing, setIsQuickContactDrawerClosing] = useState(false);
  const [quickContactName, setQuickContactName] = useState("");
  const [quickContactCPF, setQuickContactCPF] = useState("");
  const [quickContactBirthDate, setQuickContactBirthDate] = useState("");
  const [quickContactEmail, setQuickContactEmail] = useState("");
  const [quickContactPhone, setQuickContactPhone] = useState("");
  const [quickContactSubmitted, setQuickContactSubmitted] = useState(false);

  const formatCPF = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }, []);

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }, []);

  const formatBirthDate = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }, []);

  const handleSaveQuickContact = () => {
    setQuickContactSubmitted(true);
    if (
      quickContactName.trim() &&
      quickContactPhone.replace(/\D/g, "").length === 11
    ) {
      // Simula salvar e preenche o agendamento
      setNewAppointment((current) => ({
        ...current,
        patient: quickContactName.trim(),
      }));
      setIsQuickContactDrawerClosing(true);
      setStatusNotification({
        title: "Cliente Adicionado",
        description: `${quickContactName} foi pré-selecionado para este agendamento.`,
      });
    }
  };

  const handleCloseQuickContact = () => {
    setIsQuickContactDrawerClosing(true);
  };

  useEffect(() => {
    if (!isQuickContactDrawerClosing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsQuickContactDrawerOpen(false);
      setIsQuickContactDrawerClosing(false);
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isQuickContactDrawerClosing]);

  useEffect(() => {
    const isNewAppointment = searchParams.get("newAppointment") === "true";
    const patientName = searchParams.get("patient");

    if (isNewAppointment) {
      setIsCreateModalOpen(true);
      if (patientName) {
        setNewAppointment((current) => ({
          ...current,
          patient: patientName,
        }));
      }
      // Limpa os parâmetros da URL sem recarregar a página
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

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
  const createProfessionalSelectRef = useRef<HTMLDivElement | null>(null);
  const createProcedureSelectRef = useRef<HTMLDivElement | null>(null);
  const editDatePickerRef = useRef<HTMLDivElement | null>(null);
  const editProfessionalSelectRef = useRef<HTMLDivElement | null>(null);
  const editProcedureSelectRef = useRef<HTMLDivElement | null>(null);
  const clientFilterRef = useRef<HTMLDivElement | null>(null);
  const paymentMethodOptions = [
    { value: "dinheiro", label: "Dinheiro", hint: "Pagamento em espécie", icon: CoinsIcon },
    { value: "cartao_credito", label: "Crédito", hint: "Cartão de crédito", icon: CreditCard },
    { value: "cartao_debito", label: "Débito", hint: "Cartão de débito", icon: CreditCard },
    { value: "pix", label: "PIX", hint: "Transferência", icon: CreditCard },
  ] as const;
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const formatTimeInput = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);

    if (digitsOnly.length <= 2) {
      return digitsOnly;
    }

    return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
  }, []);
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
  const createProfessionalOptions = useMemo(() => {
    const merged = new Set<string>([...createProfessionalNameOptions, ...availableProfessionals]);
    return Array.from(merged).sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [availableProfessionals, createProfessionalNameOptions]);
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
  const editDatePickerMonthStart = useMemo(
    () => getStartOfMonth(editDatePickerMonth),
    [editDatePickerMonth]
  );
  const editDatePickerMonthEnd = useMemo(
    () => getEndOfMonth(editDatePickerMonth),
    [editDatePickerMonth]
  );
  const editDatePickerGridDays = useMemo(() => {
    const firstGridDay = addDays(editDatePickerMonthStart, -editDatePickerMonthStart.getDay());
    const lastGridDay = addDays(editDatePickerMonthEnd, 6 - editDatePickerMonthEnd.getDay());
    const days: Date[] = [];

    for (
      let cursorDate = new Date(firstGridDay);
      cursorDate <= lastGridDay;
      cursorDate = addDays(cursorDate, 1)
    ) {
      days.push(new Date(cursorDate));
    }

    return days;
  }, [editDatePickerMonthStart, editDatePickerMonthEnd]);
  const monthlyAppointmentsByDate = useMemo(() => {
    return filteredAppointmentList.reduce<Record<string, Appointment[]>>((accumulator, appointment) => {
      if (!accumulator[appointment.date]) {
        accumulator[appointment.date] = [];
      }
      accumulator[appointment.date].push(appointment);
      return accumulator;
    }, {});
  }, [filteredAppointmentList]);

  const monthlyCountMap = useMemo(() => {
    return monthlyCounts.reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});
  }, [monthlyCounts]);
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
          paymentMethod: appointment.paymentMethod,
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
            paymentMethod: appointment.paymentMethod,
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

  function openEditDatePicker() {
    const baseDate = editAppointment.date ? new Date(`${editAppointment.date}T00:00:00`) : new Date();

    setEditDatePickerMonth(getStartOfMonth(baseDate));
    setIsEditDatePickerOpen((current) => !current);
  }

  const loadCreateProfessionalNames = useCallback(async () => {
    setCreateProfessionalNamesLoading(true);

    try {
      const names = await getProfessionalNames();
      setCreateProfessionalNameOptions(names.length > 0 ? names : professionalOptions);
    } catch {
      setCreateProfessionalNameOptions(professionalOptions);
    } finally {
      setCreateProfessionalNamesLoading(false);
    }
  }, []);

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
      paymentMethod: "",
      installments: "",
    });
    setCreateAppointmentError("");
    setIsCreateDatePickerOpen(false);
    setIsCreateProfessionalSelectOpen(false);
    setIsCreateProcedureSelectOpen(false);
    setIsCreateModalOpen(true);
    setIsCreateDrawerClosing(false);
    void loadCreateProfessionalNames();
  }

  async function handleCreateAppointment() {
    if (!newAppointment.date || !newAppointment.startTime || !newAppointment.endTime) {
      setCreateAppointmentError("Preencha data, horário inicial e horário final.");
      return;
    }

    if (!timePattern.test(newAppointment.startTime) || !timePattern.test(newAppointment.endTime)) {
      setCreateAppointmentError("Digite os horários no formato HH:MM.");
      return;
    }

    if (!newAppointment.professional.trim()) {
      setCreateAppointmentError("Selecione um profissional.");
      return;
    }

    const isBlockedSlot = newAppointment.status === "bloqueado";

    const effectivePatient = userRole === "USER" ? userName : newAppointment.patient.trim();

    if (!isBlockedSlot && (!effectivePatient || !newAppointment.procedure.trim())) {
      setCreateAppointmentError("Preencha paciente e procedimento.");
      return;
    }

    if (
      !isBlockedSlot &&
      newAppointment.paymentMethod === "cartao_credito" &&
      (!newAppointment.installments?.trim() || Number(newAppointment.installments) <= 0)
    ) {
      setCreateAppointmentError("Informe a quantidade de parcelas para o pagamento em crédito.");
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

    try {
      // Usando os UUIDs fornecidos conforme solicitado. No futuro, você deve mapear isso pro ID real selecionado nos selects.
      const payload = {
        client_id: "019d0b8a-0a93-7c73-87d1-b0946f7f59b3", 
        professional_id: "440438e3-41d7-4f75-a14d-28fdf27a6617",
        patient_name: isBlockedSlot ? "Horário bloqueado" : effectivePatient,
        professional_name: newAppointment.professional.trim(),
        procedure: isBlockedSlot ? "Indisponível para agendamento" : newAppointment.procedure.trim(),
        price: isBlockedSlot ? 0 : parseCurrencyToCents(newAppointment.procedureValue) / 100,
        start_time: `${newAppointment.date}T${newAppointment.startTime}:00Z`,
        end_time: `${newAppointment.date}T${newAppointment.endTime}:00Z`,
        payment_method: isBlockedSlot ? "" : (newAppointment.paymentMethod.trim().toUpperCase() || 'DINHEIRO'),
        notes: newAppointment.notes.trim()
      };

      console.log("Enviando payload para o backend:", JSON.stringify(payload, null, 2));

      await createAppointment(payload);

      // Mantém a atualização do estado local para que apareça na interface instantaneamente!
      setAppointmentList((currentAppointments) => [
        ...currentAppointments,
        {
          id: createAppointmentId(),
          date: newAppointment.date,
          startTime: newAppointment.startTime,
          endTime: newAppointment.endTime,
          patient: isBlockedSlot ? "Horário bloqueado" : effectivePatient,
          procedure: isBlockedSlot ? "Indisponível para agendamento" : newAppointment.procedure.trim(),
          procedureValue: isBlockedSlot ? "" : newAppointment.procedureValue,
          notes: newAppointment.notes.trim(),
          professional: newAppointment.professional.trim(),
          status: newAppointment.status,
          paymentMethod: isBlockedSlot ? "" : newAppointment.paymentMethod.trim(),
          installments:
            !isBlockedSlot && newAppointment.paymentMethod === "cartao_credito"
              ? newAppointment.installments?.trim()
              : "",
        },
      ]);
      setIsCreateDrawerClosing(true);
      
      setStatusNotification({
        title: "Agendamento Salvo",
        description: isBlockedSlot 
          ? "O bloqueio de horário foi registrado com sucesso."
          : `O agendamento para ${effectivePatient} foi criado com sucesso!`
      });
    } catch (error: any) {
      console.error("Erro ao criar o agendamento no backend:", error);
      console.error("Detalhes do erro:", error?.details);
      
      let errorMsg = "Ocorreu um erro ao criar o agendamento. Tente novamente.";
      if (error?.details && typeof error.details === "object" && typeof error.details.error === "string") {
        errorMsg += ` Detalhes: ${error.details.error}`;
      } else if (error?.details && typeof error.details === "string") {
       errorMsg += ` Detalhes: ${error.details}`;
      }
      setCreateAppointmentError(errorMsg);
    }
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
      paymentMethod: apt.paymentMethod,
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

    setIsDetailsDrawerClosing(false);
    setSelectedAppointmentDetails(details);
    setEditableStatus(details.status);
    setDetailsTab("status");
    setIsEditingAppointment(false);
    setEditAppointmentError("");
    setStockControlError("");
    setIsEditDatePickerOpen(false);
    setIsEditProfessionalSelectOpen(false);
    setIsEditProcedureSelectOpen(false);
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
      paymentMethod: details.paymentMethod || "",
      installments: details.installments || "",
    });
  }

  function handleOpenEditAppointment() {
    if (!selectedAppointmentDetails?.appointmentId || !selectedAppointmentDetails.canEditStatus) {
      return;
    }

    setIsEditingAppointment(true);
    setEditAppointmentError("");
    setIsEditDatePickerOpen(false);
    setIsEditProfessionalSelectOpen(false);
    setIsEditProcedureSelectOpen(false);
    setEditAppointment({
      date: selectedAppointmentDetails.date,
      startTime: selectedAppointmentDetails.startTime,
      endTime: selectedAppointmentDetails.endTime,
      patient: selectedAppointmentDetails.patient,
      procedure: selectedAppointmentDetails.procedure,
      procedureValue: selectedAppointmentDetails.procedureValue || "",
      notes: selectedAppointmentDetails.notes || "",
      professional: selectedAppointmentDetails.professional,
      paymentMethod: selectedAppointmentDetails.paymentMethod || "",
      installments: selectedAppointmentDetails.installments || "",
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

    if (
      editAppointment.paymentMethod === "cartao_credito" &&
      (!editAppointment.installments?.trim() || Number(editAppointment.installments) <= 0)
    ) {
      setEditAppointmentError("Informe a quantidade de parcelas para o pagamento em crédito.");
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
            paymentMethod: editAppointment.paymentMethod.trim(),
            installments:
              editAppointment.paymentMethod === "cartao_credito" ? editAppointment.installments?.trim() : "",
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
          paymentMethod: editAppointment.paymentMethod.trim(),
          installments:
            editAppointment.paymentMethod === "cartao_credito" ? editAppointment.installments?.trim() : "",
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
    setUserRole(localStorage.getItem("userRole") || "");
    setUserName(localStorage.getItem("userName") || "");
  }, []);

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
    if (viewMode !== "month") {
      return;
    }

    let isCancelled = false;

    async function loadMonthlyCounts() {
      try {
        const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;
        const counts = await getMonthlyAppointmentCount(monthKey);

        if (!isCancelled) {
          setMonthlyCounts(counts);
        }
      } catch (error) {
        if (!isCancelled) {
          setMonthlyCounts([]);
        }
        console.error("Erro ao buscar contagens mensais:", error);
      }
    }

    void loadMonthlyCounts();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, viewMode]);

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
    if (!isCreateProfessionalSelectOpen && !isCreateProcedureSelectOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (createProfessionalSelectRef.current?.contains(target)) {
        return;
      }

      if (createProcedureSelectRef.current?.contains(target)) {
        return;
      }

      setIsCreateProfessionalSelectOpen(false);
      setIsCreateProcedureSelectOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateProcedureSelectOpen, isCreateProfessionalSelectOpen]);

  useEffect(() => {
    if (!isEditDatePickerOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (editDatePickerRef.current && !editDatePickerRef.current.contains(event.target as Node)) {
        setIsEditDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditDatePickerOpen]);

  useEffect(() => {
    if (!isEditProfessionalSelectOpen && !isEditProcedureSelectOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (editProfessionalSelectRef.current?.contains(target)) {
        return;
      }

      if (editProcedureSelectRef.current?.contains(target)) {
        return;
      }

      setIsEditProfessionalSelectOpen(false);
      setIsEditProcedureSelectOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditProcedureSelectOpen, isEditProfessionalSelectOpen]);

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
  const formattedEditAppointmentDate = useMemo(() => {
    if (!editAppointment.date) {
      return "Selecionar data";
    }

    const selectedEditDate = new Date(`${editAppointment.date}T00:00:00`);
    return selectedEditDate.toLocaleDateString("pt-BR");
  }, [editAppointment.date]);

  return (
    <div className="min-h-screen">
        <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-center lg:justify-between bg-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center text-purple-600 sm:h-12 sm:w-12"
              aria-hidden
            >
              <CalendarClockIcon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Agendamentos</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 sm:mt-3 sm:text-base">
            Gerencie os agendamentos e históricos da clínica
          </p>
        </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="group flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-300/50 transition-colors hover:bg-purple-700"
              onClick={openCreateAppointmentModal}
            >
              <span className="relative h-4 w-4">
                <PlusIcon className="absolute inset-0 h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-90 group-hover:scale-75 group-hover:opacity-0" />
                <MinusIcon className="absolute inset-0 h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100" />
              </span>
              <span className="text-sm font-semibold text-white">Criar Agendamento</span>
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
                  className={`flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-center shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:px-3 ${
                    isDatePickerOpen
                      ? "border-purple-400 bg-white ring-1 ring-purple-200"
                      : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/60 hover:shadow-md active:scale-[0.99]"
                  }`}
                  onClick={openDatePicker}
                  aria-label="Abrir calendário e escolher data"
                  aria-expanded={isDatePickerOpen}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-purple-600 sm:h-5 sm:w-5" aria-hidden />
                  <span className="min-w-0 truncate text-center text-sm font-bold capitalize tracking-tight text-slate-800 sm:text-base">
                    {headerTitle}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform sm:h-4 sm:w-4 ${
                      isDatePickerOpen ? "rotate-180 text-purple-600" : ""
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
                    className="fixed w-80 max-w-[min(20rem,calc(100vw-1rem))] rounded-2xl border border-purple-100 bg-white p-3 shadow-xl shadow-slate-300/40"
                    style={{
                      top: datePickerPopoverStyle.top,
                      left: datePickerPopoverStyle.left,
                      zIndex: DATE_PICKER_Z,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
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
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
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
                                ? "bg-purple-600 text-white"
                                : isToday
                                  ? "bg-purple-50 text-purple-700"
                                  : isCurrentMonth
                                    ? "text-slate-700 hover:bg-purple-50"
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
                  viewMode === "day" ? "font-semibold text-purple-600" : "text-slate-500 hover:text-slate-800"
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
                  viewMode === "week" ? "font-semibold text-purple-600" : "text-slate-500 hover:text-slate-800"
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
                  viewMode === "month" ? "font-semibold text-purple-600" : "text-slate-500 hover:text-slate-800"
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
                  className="absolute left-0 top-full z-[90] mt-1 w-[min(100vw-2rem,22rem)] rounded-xl border border-purple-100 bg-white py-2 shadow-xl shadow-slate-200/80"
                >
                  <p className="border-b border-slate-100 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    No dia {selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </p>
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {clientDaySearchMatches.map((apt) => (
                      <li key={apt.id} role="option">
                        <button
                          type="button"
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-purple-50"
                          onClick={() => goToClientAppointment(apt)}
                        >
                          <span className="text-xs font-bold text-purple-700">
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
                        ? "bg-purple-50 font-semibold text-purple-700"
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
                            className="h-4 w-4 rounded border-slate-300 text-purple-600"
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
                            paymentMethod: event.paymentMethod,
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
                      className={`border-b border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${isToday ? "bg-purple-50" : ""
                        }`}
                    >
                      <p className={`text-xs font-semibold ${isToday ? "text-purple-500" : "text-slate-400"}`}>
                        {weekDayLabels[index]}
                      </p>
                      <p className={`text-3xl font-bold leading-none ${isToday ? "text-purple-600" : "text-slate-800"}`}>
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
                                  paymentMethod: event.paymentMethod,
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
                  const apiCount = monthlyCountMap[dayKey] ?? 0;
                  const dayAppointments = monthlyAppointmentsByDate[dayKey] ?? [];
                  const displayCount = Math.max(apiCount, dayAppointments.length);
                  const isToday = dayKey === todayKey;
                  const isOutsideCurrentMonth = day.getMonth() !== monthStartDate.getMonth();
                  const isSelectedDay = dayKey === selectedDateKey;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`flex min-h-[128px] flex-col items-start justify-start border-b border-r border-slate-200 px-2.5 py-2 text-left align-top transition hover:bg-slate-50 ${isOutsideCurrentMonth ? "bg-slate-50/70" : "bg-white"
                        } ${isSelectedDay ? "ring-1 ring-inset ring-purple-200" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode("day");
                      }}
                    >
                      <p
                        className={`mb-1.5 text-sm font-semibold ${isToday
                            ? "text-purple-600 underline underline-offset-2"
                            : isOutsideCurrentMonth
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                      >
                        {String(day.getDate()).padStart(2, "0")}
                      </p>

                      {displayCount > 0 ? (
                        <span className="mt-1.5 flex h-5 items-center rounded bg-purple-100 px-2 text-[11px] font-medium text-purple-700">
                          {displayCount}{" "}
                          {displayCount === 1 ? "agendamento" : "agendamentos"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {newAppointment.paymentMethod === "cartao_credito" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                    Parcelamento
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="Quantidade de parcelas (ex: 3)"
                      className="h-10 w-full rounded-xl border border-purple-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none ring-purple-100 transition-all focus:border-purple-400 focus:ring-4 sm:h-11 sm:text-base"
                      value={newAppointment.installments}
                      onChange={(event) =>
                        setNewAppointment((current) => ({
                          ...current,
                          installments: event.target.value,
                        }))
                      }
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-purple-400 uppercase tracking-widest">
                      vezes
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      

      {selectedAppointmentDetails ? (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px] ${
            isDetailsDrawerClosing ? "prof-drawer-backdrop-leave" : "prof-drawer-backdrop-enter"
          }`}
          onClick={() => setIsDetailsDrawerClosing(true)}
        >
          <div
            className={`flex h-full w-full max-w-md flex-col border-l border-purple-100 bg-white shadow-2xl shadow-purple-200/60 ${
              isDetailsDrawerClosing ? "prof-drawer-aside-leave" : "prof-drawer-aside-enter"
            }`}
            onClick={(event) => event.stopPropagation()}
            onAnimationEnd={(e) => {
              if (!isDetailsDrawerClosing || e.animationName !== "prof-drawer-leave") return;
              setSelectedAppointmentDetails(null);
              setIsDetailsDrawerClosing(false);
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-2xl font-bold text-slate-800">
                {isEditingAppointment ? "Editar Agendamento" : "Detalhes do Agendamento"}
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setIsDetailsDrawerClosing(true)}
                aria-label="Fechar detalhes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-5 py-5 text-sm text-slate-700">
              {isEditingAppointment ? (
                <div className="space-y-6">
                  <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Paciente
                    <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 transition-all focus-within:border-purple-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-purple-100 sm:h-11">
                      <UserSearch className="h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="Nome do paciente"
                        value={editAppointment.patient}
                        onChange={(e) => setEditAppointment(curr => ({ ...curr, patient: e.target.value }))}
                      />
                    </div>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <p>Profissional</p>
                      <div className="relative mt-2" ref={editProfessionalSelectRef}>
                        <button
                          type="button"
                          aria-expanded={isEditProfessionalSelectOpen}
                          onClick={() => {
                            setIsEditProfessionalSelectOpen((current) => !current);
                            setIsEditProcedureSelectOpen(false);
                          }}
                          className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition sm:h-11 sm:text-base ${
                            isEditProfessionalSelectOpen
                              ? "border-purple-400 bg-white ring-1 ring-purple-100"
                              : "border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/40"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                              <UserIcon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span
                                className={`block truncate font-medium ${
                                  editAppointment.professional ? "text-slate-800" : "text-slate-400"
                                }`}
                              >
                                {editAppointment.professional || "Selecione o profissional"}
                              </span>
                            </span>
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                              isEditProfessionalSelectOpen ? "rotate-180 text-purple-600" : ""
                            }`}
                          />
                        </button>
                        {isEditProfessionalSelectOpen ? (
                          <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-lg">
                            {createProfessionalOptions.map((professional) => {
                              const isActive = professional === editAppointment.professional;

                              return (
                                <button
                                  key={professional}
                                  type="button"
                                  onClick={() => {
                                    setEditAppointment((current) => ({ ...current, professional }));
                                    setIsEditProfessionalSelectOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                    isActive
                                      ? "bg-purple-50 text-purple-700"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                      isActive ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    <UserIcon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 truncate text-sm font-medium normal-case">
                                    {professional}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <p>Procedimento</p>
                      <div className="relative mt-2" ref={editProcedureSelectRef}>
                        <button
                          type="button"
                          aria-expanded={isEditProcedureSelectOpen}
                          onClick={() => {
                            setIsEditProcedureSelectOpen((current) => !current);
                            setIsEditProfessionalSelectOpen(false);
                          }}
                          className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition sm:h-11 sm:text-base ${
                            isEditProcedureSelectOpen
                              ? "border-purple-400 bg-white ring-1 ring-purple-100"
                              : "border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/40"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                              <InfoIcon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span
                                className={`block truncate font-medium ${
                                  editAppointment.procedure ? "text-slate-800" : "text-slate-400"
                                }`}
                              >
                                {editAppointment.procedure || "Selecione o procedimento"}
                              </span>
                            </span>
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                              isEditProcedureSelectOpen ? "rotate-180 text-purple-600" : ""
                            }`}
                          />
                        </button>
                        {isEditProcedureSelectOpen ? (
                          <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-lg">
                            {procedureOptions.map((procedure) => {
                              const isActive = procedure === editAppointment.procedure;

                              return (
                                <button
                                  key={procedure}
                                  type="button"
                                  onClick={() => {
                                    setEditAppointment((current) => ({ ...current, procedure }));
                                    setIsEditProcedureSelectOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                    isActive
                                      ? "bg-purple-50 text-purple-700"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                    <InfoIcon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 truncate text-sm font-medium normal-case">
                                    {procedure}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Data
                      <div className="relative mt-2" ref={editDatePickerRef}>
                        <button
                          type="button"
                          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                            isEditDatePickerOpen
                              ? "border-purple-400 ring-1 ring-purple-200 bg-white"
                              : "text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md active:scale-[0.995]"
                          }`}
                          onClick={openEditDatePicker}
                          aria-label="Selecionar data do agendamento"
                          aria-expanded={isEditDatePickerOpen}
                        >
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <CalendarIcon className="h-5 w-5 shrink-0 text-purple-600" aria-hidden />
                            <span
                              className={`whitespace-nowrap ${
                                editAppointment.date ? "text-slate-800" : "text-slate-400"
                              }`}
                            >
                              {formattedEditAppointmentDate}
                            </span>
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-500 ${
                              isEditDatePickerOpen ? "rotate-180 text-purple-600" : ""
                            }`}
                            aria-hidden
                          />
                        </button>
                        {isEditDatePickerOpen ? (
                          <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-purple-100 bg-white p-3 shadow-lg">
                            <div className="mb-3 flex items-center justify-between">
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                                onClick={() => setEditDatePickerMonth((current) => addMonths(current, -1))}
                                aria-label="Mês anterior"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <p className="text-sm font-semibold capitalize text-slate-800">
                                {editDatePickerMonth.toLocaleDateString("pt-BR", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                                onClick={() => setEditDatePickerMonth((current) => addMonths(current, 1))}
                                aria-label="Próximo mês"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-[0.08em] text-slate-400">
                              {monthDayLabels.map((label) => (
                                <span key={`edit-picker-${label}`}>{label}</span>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {editDatePickerGridDays.map((day) => {
                                const dayKey = toDateKey(day);
                                const isCurrentMonth = day.getMonth() === editDatePickerMonth.getMonth();
                                const isSelected = dayKey === editAppointment.date;
                                const isToday = dayKey === todayKey;

                                return (
                                  <button
                                    key={`edit-picker-day-${dayKey}`}
                                    type="button"
                                    className={`h-9 rounded-lg text-sm font-semibold transition ${
                                      isSelected
                                        ? "bg-purple-600 text-white"
                                        : isToday
                                          ? "bg-purple-50 text-purple-700"
                                          : isCurrentMonth
                                            ? "text-slate-700 hover:bg-purple-50"
                                            : "text-slate-300 hover:bg-slate-50"
                                    }`}
                                    onClick={() => {
                                      setEditAppointment((current) => ({ ...current, date: dayKey }));
                                      setIsEditDatePickerOpen(false);
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

                    <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Valor
                      <input
                        type="text"
                        inputMode="numeric"
                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                        placeholder="R$ 0,00"
                        value={editAppointment.procedureValue}
                        onChange={(e) => setEditAppointment(curr => ({ ...curr, procedureValue: formatCurrencyInput(e.target.value) }))}
                      />
                    </label>
                  </div>

                  <div className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Forma de pagamento
                    </p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {paymentMethodOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = editAppointment.paymentMethod === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                              setEditAppointment((current) => ({
                                ...current,
                                paymentMethod: current.paymentMethod === option.value ? "" : option.value,
                                installments:
                                  option.value === "cartao_credito" && current.paymentMethod !== option.value
                                    ? current.installments
                                    : "",
                              }))
                            }
                            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left normal-case transition-all duration-300 ${
                              isSelected
                                ? "scale-[1.02] border-purple-400 bg-purple-50 text-purple-700 shadow-md shadow-purple-100 ring-2 ring-purple-200/70"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/60 hover:shadow-sm"
                            }`}
                          >
                            <span
                              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${
                                isSelected ? "translate-x-full" : "-translate-x-full group-hover:translate-x-full"
                              }`}
                              aria-hidden
                            />
                            <span
                              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                isSelected
                                  ? "bg-purple-100 text-purple-600 scale-110"
                                  : "bg-white text-slate-500 group-hover:scale-105"
                              }`}
                            >
                              <Icon className={`h-5 w-5 transition-transform duration-300 ${isSelected ? "rotate-6" : ""}`} />
                            </span>
                            <span className="relative z-10 min-w-0">
                              <span className="block text-sm font-semibold">{option.label}</span>
                              <span className="block text-xs font-medium text-slate-500">{option.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {editAppointment.paymentMethod === "cartao_credito" && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                        Parcelamento
                      </label>
                      <div className="group relative flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-purple-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100/50">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="Quantidade de parcelas (ex: 3)"
                          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                          value={editAppointment.installments}
                          onChange={(e) => setEditAppointment(curr => ({ ...curr, installments: e.target.value }))}
                        />
                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                          vezes
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Início
                      <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-purple-400 focus-within:bg-slate-50 focus-within:ring-0 sm:h-11">
                        <Clock4 className="h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="08:30"
                          className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                          value={editAppointment.startTime}
                          onChange={(e) => setEditAppointment(curr => ({ ...curr, startTime: formatTimeInput(e.target.value) }))}
                        />
                      </div>
                    </label>
                    <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Término
                      <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-purple-400 focus-within:bg-slate-50 focus-within:ring-0 sm:h-11">
                        <Clock4 className="h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="09:00"
                          className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                          value={editAppointment.endTime}
                          onChange={(e) => setEditAppointment(curr => ({ ...curr, endTime: formatTimeInput(e.target.value) }))}
                        />
                      </div>
                    </label>
                  </div>

                  <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Observações
                    <textarea
                      className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100"
                      placeholder="Observações adicionais..."
                      value={editAppointment.notes}
                      onChange={(e) => setEditAppointment(curr => ({ ...curr, notes: e.target.value }))}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Card de Visualização Principal */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{selectedAppointmentDetails.patient}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 ring-1 ring-inset ring-emerald-200/50">
                            <CheckCircle2 className="h-3 w-3" /> {selectedAppointmentDetails.procedure}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${detailsTab === "status"
                          ? "bg-purple-50 text-purple-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                      onClick={() => setDetailsTab("status")}
                    >
                      Status
                    </button>
                    <button
                      type="button"
                      className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${detailsTab === "estoque"
                          ? "bg-purple-50 text-purple-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                      onClick={() => setDetailsTab("estoque")}
                    >
                      Estoque {selectedStockItemsCount > 0 ? `(${selectedStockItemsCount})` : ""}
                    </button>
                  </div>

                  {detailsTab === "status" ? (
                    <div className="space-y-5">
                      {/* Informações Detalhadas */}
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-1 w-4 rounded-full bg-purple-500" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Detalhes do Atendimento
                          </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <CalendarIcon className="h-3 w-3 text-purple-500" /> Data
                            </span>
                            <p className="text-sm font-bold text-slate-700 ml-5">{selectedAppointmentDetails.date}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Clock3 className="h-3 w-3 text-purple-500" /> Horário
                            </span>
                            <p className="text-sm font-bold text-slate-700 ml-5">
                              {selectedAppointmentDetails.startTime} - {selectedAppointmentDetails.endTime}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <UserIcon className="h-3 w-3 text-purple-500" /> Profissional
                            </span>
                            <p className="text-sm font-bold text-slate-700 ml-5">
                              {selectedAppointmentDetails.professional || "Não informado"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <CoinsIcon className="h-3 w-3 text-purple-500" /> Valor
                            </span>
                            <p className="text-sm font-bold text-emerald-600 ml-5">
                              {selectedAppointmentDetails.procedureValue || "Não informado"}
                            </p>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-purple-500" /> Pagamento
                            </span>
                            <div className="ml-5 mt-1">
                              {(() => {
                                const option = paymentMethodOptions.find(
                                  (o) => o.value === selectedAppointmentDetails.paymentMethod
                                );
                                const paymentLabel = paymentMethodLabel(selectedAppointmentDetails.paymentMethod);
                                const hasPayment = paymentLabel !== "Não informado";
                                const Icon = option?.icon ?? CreditCard;
                                const isCreditPayment =
                                  selectedAppointmentDetails.paymentMethod === "cartao_credito" ||
                                  paymentLabel === "Cartão de Crédito";

                                if (hasPayment) {
                                  return (
                                    <div className="flex items-center gap-3">
                                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700 ring-1 ring-inset ring-purple-200/50">
                                        <Icon className="h-3.5 w-3.5" />
                                        {option?.label ?? paymentLabel}
                                      </span>
                                      {isCreditPayment && selectedAppointmentDetails.installments ? (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                          {selectedAppointmentDetails.installments}x sem juros
                                        </span>
                                      ) : null}
                                    </div>
                                  );
                                }

                                return (
                                  <span className="text-sm font-bold text-slate-500 italic">Não informado</span>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <FileText className="h-3 w-3 text-purple-500" /> Observações
                            </span>
                            <div className="ml-5 mt-1 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                {selectedAppointmentDetails.notes?.trim() || "Nenhuma observação registrada."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <ChartNoAxesColumn className="h-4 w-4 text-purple-600" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status do Agendamento</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-100">
                          <span className={`h-2 w-2 rounded-full ${statusDotColor(editableStatus)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                          {statusLabel(editableStatus)}
                        </div>
                        {selectedAppointmentDetails.canEditStatus ? (
                          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                            {appointmentStatusOptions.map((status) => (
                              <button
                                key={status}
                                type="button"
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${statusOptionButtonStyles(
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
                                <span className={`h-2 w-2 rounded-full ${statusDotColor(status)}`} />
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-purple-50/50 px-4 py-3 border border-purple-100/50">
                            <p className="text-xs font-bold text-purple-900 leading-relaxed">
                              {statusLabel(selectedAppointmentDetails.status)}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-purple-600 opacity-70">Este atendimento é apenas visualização.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-1 w-4 rounded-full bg-purple-500" />
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">CONTROLE DE ESTOQUE</h4>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
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
                              className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-300 ${
                                isSelected ? "border-purple-200 bg-purple-50/30" : "border-slate-100 hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg shadow-inner">
                                  {product.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{product.name}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {availableForThisAppointment} {product.unit} disp.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                <button
                                  type="button"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-purple-600 active:scale-90"
                                  onClick={() => {
                                    const currentValue = Number(currentQuantity || 0);
                                    const nextValue = Math.max(0, currentValue - 1);
                                    handleStockDraftChange(product.id, nextValue > 0 ? String(nextValue) : "");
                                  }}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="w-10 bg-transparent text-center text-sm font-black text-slate-700 outline-none"
                                  value={currentQuantity || 0}
                                  onChange={(event) => handleStockDraftChange(product.id, event.target.value)}
                                />
                                <button
                                  type="button"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-purple-600 active:scale-90"
                                  onClick={() => {
                                    const currentValue = Number(currentQuantity || 0);
                                    const nextValue = Math.min(availableForThisAppointment, currentValue + 1);
                                    handleStockDraftChange(product.id, String(nextValue));
                                  }}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                          * Ao salvar como concluído, o estoque será baixado conforme os itens selecionados.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editAppointmentError ? (
              <p className="px-5 pb-1 text-sm font-bold text-rose-600 animate-pulse">{editAppointmentError}</p>
            ) : null}
            {stockControlError ? (
              <p className="px-5 pb-1 text-sm font-bold text-rose-600 animate-pulse">{stockControlError}</p>
            ) : null}

            <div className="flex gap-2 border-t border-purple-100 bg-white px-5 py-4">
              {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="group relative flex-1 overflow-hidden rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95"
                  onClick={handleUpdateAppointmentStatus}
                >
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    aria-hidden
                  />
                  <span className="relative z-10 flex w-full items-center justify-center gap-2 text-center">
                    <CheckCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    Salvar
                  </span>
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="group relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md hover:shadow-purple-100 active:scale-[0.98]"
                  onClick={handleOpenEditAppointment}
                >
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-purple-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    aria-hidden
                  />
                  <span className="relative z-10 transition-colors duration-300 text-center w-full">Editar agendamento</span>
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && isEditingAppointment ? (
                <>
                  <button
                    type="button"
                    className="group relative flex-1 overflow-hidden rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95"
                    onClick={handleSaveEditedAppointment}
                  >
                    <span
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                      aria-hidden
                    />
                    <span className="relative z-10 flex w-full items-center justify-center gap-2 text-center">
                      <CheckCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                      Salvar alterações
                    </span>
                  </button>
                  <button
                    type="button"
                    className="group relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md hover:shadow-rose-100 active:scale-[0.98]"
                    onClick={() => {
                      setIsEditingAppointment(false);
                      setEditAppointmentError("");
                    }}
                  >
                    <span
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                      aria-hidden
                    />
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-rose-800 text-center w-full">
                      Cancelar edição
                    </span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            role="presentation"
            className={`absolute inset-0 bg-slate-900/40 ${
              isCreateDrawerClosing ? "prof-drawer-backdrop-leave" : "prof-drawer-backdrop-enter"
            }`}
            onClick={() => setIsCreateDrawerClosing(true)}
          />
          <div
            className={`relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-lg border-l border-purple-100 bg-white shadow-2xl shadow-purple-200/60 ${
              isCreateDrawerClosing ? "prof-drawer-aside-leave" : "prof-drawer-aside-enter"
            }`}
            onClick={(event) => event.stopPropagation()}
            onAnimationEnd={() => {
              if (!isCreateDrawerClosing) return;
              setIsCreateModalOpen(false);
              setIsCreateDrawerClosing(false);
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
                paymentMethod: "",
                installments: "",
              });
              setCreateAppointmentError("");
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-slate-800">Criar Agendamento</h3>
              </div>

              <button
                type="button"
                className="group rounded-lg p-1.5 text-slate-400 transition-all duration-200 ease-out hover:scale-110 hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                onClick={() => setIsCreateDrawerClosing(true)}
                aria-label="Fechar painel"
              >
                <X
                  className="h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90"
                  strokeWidth={2}
                />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 px-5 py-5">
              {userRole !== "USER" && (
                <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Cliente
                  <div
                  className={`mt-2 flex h-10 items-center gap-3 rounded-lg border px-3 sm:h-11 ${
                    isBlockedSlot
                      ? "border-slate-200 bg-slate-100"
                      : "border-slate-200 bg-slate-50 focus-within:border-purple-400 focus-within:ring-0"
                  }`}
                >
                  <UserSearch className={`h-5 w-5 ${isBlockedSlot ? "text-slate-300" : "text-slate-400"}`} />
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 sm:text-base"
                    placeholder="Nome do cliente ou CPF"
                    value={newAppointment.patient}
                    disabled={isBlockedSlot}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, patient: event.target.value }))
                    }
                  />
                </div>
                {!isBlockedSlot ? (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickContactName(newAppointment.patient);
                        setQuickContactCPF("");
                        setQuickContactBirthDate("");
                        setQuickContactEmail("");
                        setQuickContactPhone("");
                        setQuickContactSubmitted(false);
                        setIsQuickContactDrawerClosing(false);
                        setIsQuickContactDrawerOpen(true);
                      }}
                      className="text-sm font-semibold normal-case text-purple-600 transition hover:text-purple-800"
                    >
                      + Adicionar cliente
                    </button>
                  </div>
                  ) : null}
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <p>Profissional</p>
                  <div className="relative mt-2" ref={createProfessionalSelectRef}>
                    <button
                      type="button"
                      aria-expanded={isCreateProfessionalSelectOpen}
                      onClick={() => {
                        setIsCreateProfessionalSelectOpen((current) => !current);
                        setIsCreateProcedureSelectOpen(false);
                      }}
                      className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition sm:h-11 sm:text-base ${
                        isCreateProfessionalSelectOpen
                          ? "border-purple-400 bg-white ring-1 ring-purple-100"
                          : "border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/40"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                          <UserIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block truncate font-medium ${
                              newAppointment.professional ? "text-slate-800" : "text-slate-400"
                            }`}
                          >
                            {newAppointment.professional || "Selecione o profissional"}
                          </span>
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          isCreateProfessionalSelectOpen ? "rotate-180 text-purple-600" : ""
                        }`}
                      />
                    </button>
                    {isCreateProfessionalSelectOpen ? (
                      <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-lg">
                        {createProfessionalOptions.map((professional) => {
                          const isActive = professional === newAppointment.professional;

                          return (
                            <button
                              key={professional}
                              type="button"
                              onClick={() => {
                                setNewAppointment((current) => ({ ...current, professional }));
                                setIsCreateProfessionalSelectOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                isActive
                                  ? "bg-purple-50 text-purple-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  isActive ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <UserIcon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 truncate text-sm font-medium normal-case">
                                {professional}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <p>Procedimento</p>
                  <div className="relative mt-2" ref={createProcedureSelectRef}>
                    <button
                      type="button"
                      disabled={isBlockedSlot}
                      aria-expanded={isCreateProcedureSelectOpen}
                      onClick={() => {
                        if (isBlockedSlot) return;
                        setIsCreateProcedureSelectOpen((current) => !current);
                        setIsCreateProfessionalSelectOpen(false);
                      }}
                      className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition sm:h-11 sm:text-base ${
                        isBlockedSlot
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : isCreateProcedureSelectOpen
                            ? "border-purple-400 bg-white ring-1 ring-purple-100"
                            : "border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/40"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isBlockedSlot ? "bg-slate-200 text-slate-400" : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block truncate font-medium ${
                              newAppointment.procedure
                                ? isBlockedSlot
                                  ? "text-slate-400"
                                  : "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {newAppointment.procedure || "Selecione o procedimento"}
                          </span>
                         
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          isCreateProcedureSelectOpen ? "rotate-180 text-purple-600" : ""
                        }`}
                      />
                    </button>
                    {isCreateProcedureSelectOpen && !isBlockedSlot ? (
                      <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-lg">
                        {procedureOptions.map((procedure) => {
                          const isActive = procedure === newAppointment.procedure;

                          return (
                            <button
                              key={procedure}
                              type="button"
                              onClick={() => {
                                setNewAppointment((current) => ({ ...current, procedure }));
                                setIsCreateProcedureSelectOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                isActive
                                  ? "bg-purple-50 text-purple-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  isActive ? "bg-purple-100 text-purple-600" : "bg-purple-100 text-purple-600"
                                }`}
                              >
                                <InfoIcon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 truncate text-sm font-medium normal-case">
                                {procedure}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Lock className="h-4 w-4 text-slate-500" />
                  Horário bloqueado para o profissional
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:outline-none focus:ring-0 focus-visible:ring-0"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Data
                  <div className="relative mt-2" ref={createDatePickerRef}>
                    <button
                      type="button"
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        isCreateDatePickerOpen
                          ? "border-purple-400 ring-1 ring-purple-200"
                          : "text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md active:scale-[0.995]"
                      }`}
                      onClick={openCreateDatePicker}
                      aria-label="Selecionar data do agendamento"
                      aria-expanded={isCreateDatePickerOpen}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <CalendarIcon className="h-5 w-5 shrink-0 text-purple-600" aria-hidden />
                        <span
                          className={`whitespace-nowrap ${newAppointment.date ? "text-slate-800" : "text-slate-400"}`}
                        >
                          {formattedCreateAppointmentDate}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-500 ${isCreateDatePickerOpen ? "rotate-180 text-purple-600" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {isCreateDatePickerOpen ? (
                      <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-purple-100 bg-white p-3 shadow-lg">
                        <div className="mb-3 flex items-center justify-between">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
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
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-purple-50 hover:text-purple-700"
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
                                className={`h-9 rounded-lg text-sm font-semibold transition ${
                                  isSelected
                                    ? "bg-purple-600 text-white"
                                    : isToday
                                      ? "bg-purple-50 text-purple-700"
                                      : isCurrentMonth
                                        ? "text-slate-700 hover:bg-purple-50"
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
                <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Valor
                  <input
                    type="text"
                    inputMode="numeric"
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-11 sm:text-base"
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
              </div>

              <div className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Forma de pagamento
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {paymentMethodOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = newAppointment.paymentMethod === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isBlockedSlot}
                        aria-pressed={isSelected}
                        onClick={() =>
                          setNewAppointment((current) => ({
                            ...current,
                            paymentMethod: current.paymentMethod === option.value ? "" : option.value,
                            installments:
                              option.value === "cartao_credito" && current.paymentMethod !== option.value
                                ? current.installments
                                : "",
                          }))
                        }
                        className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left normal-case transition-all duration-300 ${
                          isBlockedSlot
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                            : isSelected
                              ? "scale-[1.02] border-purple-400 bg-purple-50 text-purple-700 shadow-md shadow-purple-100 ring-2 ring-purple-200/70"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/60 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${
                            isSelected ? "translate-x-full" : "-translate-x-full group-hover:translate-x-full"
                          }`}
                          aria-hidden
                        />
                        <span
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            isSelected
                              ? "bg-purple-100 text-purple-600 scale-110"
                              : "bg-white text-slate-500 group-hover:scale-105"
                          }`}
                        >
                          <Icon className={`h-5 w-5 transition-transform duration-300 ${isSelected ? "rotate-6" : ""}`} />
                        </span>
                        <span className="relative z-10 min-w-0">
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="block text-xs font-medium text-slate-500">{option.hint}</span>
                        </span>
                        <span
                          className={`relative z-10 ml-auto rounded-full transition-all duration-300 ${
                            isSelected
                              ? "h-2.5 w-2.5 scale-100 bg-purple-600 opacity-100"
                              : "h-2.5 w-2.5 scale-75 bg-purple-600 opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {newAppointment.paymentMethod === "cartao_credito" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                    Parcelamento
                  </label>
                  <div className="group relative flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-purple-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100/50">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="Quantidade de parcelas (ex: 3)"
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                      value={newAppointment.installments}
                      onChange={(event) =>
                        setNewAppointment((current) => ({
                          ...current,
                          installments: event.target.value,
                        }))
                      }
                    />
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                      vezes
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Início
                  <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-purple-400 focus-within:bg-slate-50 focus-within:ring-0 sm:h-11">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="08:30"
                      className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                      value={newAppointment.startTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({
                          ...current,
                          startTime: formatTimeInput(event.target.value),
                        }))
                      }
                    />
                  </div>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Término
                  <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-purple-400 focus-within:bg-slate-50 focus-within:ring-0 sm:h-11">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="09:00"
                      className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                      value={newAppointment.endTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({
                          ...current,
                          endTime: formatTimeInput(event.target.value),
                        }))
                      }
                    />
                  </div>
                </label>
              </div>

              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Observações
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100"
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

            <div className="flex gap-3 border-t border-purple-100 bg-white px-5 py-4">
              <button
                type="button"
                className="group relative flex-1 overflow-hidden rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95"
                onClick={handleCreateAppointment}
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                  {isBlockedSlot ? "Salvar Bloqueio" : "Salvar Agendamento"}
                </span>
              </button>
              <button
                type="button"
                className="group relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md hover:shadow-rose-100 active:scale-95"
                onClick={() => setIsCreateDrawerClosing(true)}
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden
                />
                <span className="relative z-10">Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isQuickContactDrawerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            role="presentation"
            className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm ${
              isQuickContactDrawerClosing ? "prof-drawer-backdrop-leave" : "prof-drawer-backdrop-enter"
            }`}
            onClick={handleCloseQuickContact}
          />
          <aside
            className={`relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
              isQuickContactDrawerClosing ? "modal-leave" : "modal-enter"
            }`}
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Novo Contato Rápido</h2>
                  <p className="text-xs font-medium text-slate-500">Cadastre o cliente sem sair do agendamento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseQuickContact}
                className="group rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="grid gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Beatriz Silva"
                    value={quickContactName}
                    onChange={(e) => setQuickContactName(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />
                  {quickContactSubmitted && !quickContactName.trim() && (
                    <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wider ml-1">Nome é obrigatório</p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Telefone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={quickContactPhone}
                      onChange={(e) => setQuickContactPhone(formatPhone(e.target.value))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                    {quickContactSubmitted && quickContactPhone.replace(/\D/g, "").length !== 11 && (
                      <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wider ml-1">Telefone inválido</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Data de Nascimento</label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={quickContactBirthDate}
                      onChange={(e) => setQuickContactBirthDate(formatBirthDate(e.target.value))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={quickContactCPF}
                      onChange={(e) => setQuickContactCPF(formatCPF(e.target.value))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                    <input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={quickContactEmail}
                      onChange={(e) => setQuickContactEmail(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseQuickContact}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md hover:shadow-rose-100 active:scale-95"
                >
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    aria-hidden
                  />
                  <span className="relative z-10">Cancelar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickContact}
                  className="group relative overflow-hidden rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95"
                >
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    aria-hidden
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    Salvar
                  </span>
                </button>
              </div>
            </footer>
          </aside>
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
