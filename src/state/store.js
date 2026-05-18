import { seedData } from "../data/seedData.js";
import {
  activeStatuses,
  getAppointmentDerivedDetails,
  getNextQueueNumber,
  isSlotBooked,
  recalculateQueueAfterCancellation,
} from "../utils/queue.js";

const STORAGE_KEY = "carequeue-state-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialState() {
  return {
    ...clone(seedData),
    today: "2026-05-18",
    currentUserId: "user-demo",
    selectedLocationId: "loc-home",
    detectedLocation: null,
    view: "home",
    selectedDoctorId: null,
    selectedAppointmentId: null,
    filters: {
      search: "",
      distance: "all",
      availabilityToday: false,
      maxFee: "all",
      minRating: "all",
      gender: "all",
      language: "all",
    },
    ui: {
      toast: null,
      errors: {},
      bookingDraft: {
        selectedSlotId: "",
        symptoms: "",
        patientName: "",
        patientPhone: "",
      },
      profileDraft: null,
      authDraft: {
        fullName: "",
        phone: "",
      },
      adminDraft: {
        name: "",
        specialty: "General Physician",
        clinicId: "clinic-hope",
        gender: "Female",
        language: "English",
        fee: 700,
        firstSlot: "09:00",
        slotDrafts: {},
      },
    },
  };
}

let state = loadState();
const subscribers = new Set();

function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState();
    const parsed = JSON.parse(stored);
    return { ...initialState(), ...parsed, ui: { ...initialState().ui, ...parsed.ui } };
  } catch {
    return initialState();
  }
}

function saveState() {
  const { ui, ...persistentState } = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
}

function setState(updater) {
  const next = typeof updater === "function" ? updater(state) : updater;
  state = next;
  saveState();
  subscribers.forEach((subscriber) => subscriber(state));
}

export function subscribe(listener) {
  subscribers.add(listener);
  listener(state);
  return () => subscribers.delete(listener);
}

export function getState() {
  return state;
}

export const actions = {
  navigate(view, payload = {}) {
    setState((current) => ({
      ...current,
      view,
      selectedDoctorId: payload.doctorId ?? current.selectedDoctorId,
      selectedAppointmentId: payload.appointmentId ?? current.selectedAppointmentId,
      ui: { ...current.ui, errors: {}, toast: payload.toast || null },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  selectDoctor(doctorId) {
    const user = state.users.find((item) => item.id === state.currentUserId);
    setState((current) => ({
      ...current,
      view: "doctor",
      selectedDoctorId: doctorId,
      ui: {
        ...current.ui,
        errors: {},
        bookingDraft: {
          selectedSlotId: "",
          symptoms: "",
          patientName: user?.fullName || "",
          patientPhone: user?.phone || "",
        },
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  updateFilter(name, value) {
    setState((current) => ({
      ...current,
      filters: { ...current.filters, [name]: value },
    }));
  },

  resetFilters() {
    setState((current) => ({
      ...current,
      filters: initialState().filters,
    }));
  },

  setLocation(locationId) {
    setState((current) => ({
      ...current,
      selectedLocationId: locationId,
      detectedLocation: null,
      ui: { ...current.ui, toast: "Location updated" },
    }));
  },

  setDetectedLocation(location) {
    setState((current) => ({
      ...current,
      selectedLocationId: null,
      detectedLocation: location,
      ui: { ...current.ui, toast: "Using detected location" },
    }));
  },

  updateBookingDraft(name, value) {
    setState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        bookingDraft: { ...current.ui.bookingDraft, [name]: value },
        errors: { ...current.ui.errors, [name]: "" },
      },
    }));
  },

  bookAppointment(doctorId) {
    const current = getState();
    const draft = current.ui.bookingDraft;
    const doctor = current.doctors.find((item) => item.id === doctorId);
    const slot = doctor?.slots.find((item) => item.id === draft.selectedSlotId);
    const errors = {};

    if (!doctor?.available) errors.doctor = "This doctor is currently unavailable.";
    if (doctor?.available && !doctor.availableToday) {
      errors.doctor = "This doctor has no remaining slots today.";
    }
    if (!draft.selectedSlotId) errors.selectedSlotId = "Select an available slot.";
    if (slot && isSlotBooked(current, doctorId, slot.id)) {
      errors.selectedSlotId = "That slot was just booked. Please choose another.";
    }
    if (!draft.patientName.trim()) errors.patientName = "Enter the patient name.";
    if (!/^[+\d\s-]{8,}$/.test(draft.patientPhone.trim())) {
      errors.patientPhone = "Enter a valid phone number.";
    }

    if (Object.keys(errors).length) {
      setState((stateWithErrors) => ({
        ...stateWithErrors,
        ui: { ...stateWithErrors.ui, errors, toast: "Please fix the highlighted fields" },
      }));
      return;
    }

    const queueNumber = getNextQueueNumber(current, doctorId);
    const appointmentId = `appt-${Date.now()}`;
    const bookingNumber = `BQ-${Math.floor(3000 + Math.random() * 6000)}`;
    const appointment = {
      id: appointmentId,
      bookingNumber,
      userId: current.currentUserId,
      doctorId,
      slotId: slot.id,
      date: current.today,
      time: slot.time,
      queueNumber,
      status: "Booked",
      createdAt: new Date().toISOString(),
      symptoms: draft.symptoms.trim(),
    };
    const derived = getAppointmentDerivedDetails(current, appointment);
    const notification = {
      id: `notif-${Date.now()}`,
      userId: current.currentUserId,
      type: "Booking",
      title: "Appointment booked",
      message: `${doctor.name} confirmed ${bookingNumber}. Queue ${queueNumber}, ${derived.peopleAhead} ahead.`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setState((previous) => ({
      ...previous,
      appointments: previous.appointments.concat(appointment),
      notifications: [notification].concat(previous.notifications),
      view: "confirmation",
      selectedAppointmentId: appointmentId,
      ui: {
        ...previous.ui,
        toast: "Appointment booked",
        errors: {},
        bookingDraft: initialState().ui.bookingDraft,
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  cancelAppointment(appointmentId) {
    const current = getState();
    const appointment = current.appointments.find((item) => item.id === appointmentId);
    if (!appointment || appointment.status === "Completed") return;
    const cancelled = current.appointments.map((item) =>
      item.id === appointmentId ? { ...item, status: "Cancelled" } : item
    );
    const recalculated = recalculateQueueAfterCancellation(
      { ...current, appointments: cancelled },
      appointment.doctorId
    );

    setState((previous) => ({
      ...previous,
      appointments: recalculated,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          userId: previous.currentUserId,
          type: "Cancellation",
          title: "Appointment cancelled",
          message: `${appointment.bookingNumber} was cancelled and the queue was adjusted.`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...previous.notifications,
      ],
      ui: { ...previous.ui, toast: "Appointment cancelled. Queue adjusted." },
    }));
  },

  updateAppointmentStatus(appointmentId, status) {
    const current = getState();
    const appointment = current.appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    setState((previous) => {
      let nextQueueStatuses = previous.queueStatuses;
      const nextAppointments = previous.appointments.map((item) => {
        if (item.id !== appointmentId) return item;
        return { ...item, status };
      });

      if (status === "In consultation") {
        nextQueueStatuses = previous.queueStatuses.map((queue) =>
          queue.doctorId === appointment.doctorId
            ? { ...queue, currentOngoingNumber: appointment.queueNumber }
            : queue
        );
      }

      if (status === "Completed") {
        nextQueueStatuses = previous.queueStatuses.map((queue) =>
          queue.doctorId === appointment.doctorId
            ? { ...queue, currentOngoingNumber: Math.max(queue.currentOngoingNumber, appointment.queueNumber) }
            : queue
        );
      }

      return {
        ...previous,
        appointments: nextAppointments,
        queueStatuses: nextQueueStatuses,
        ui: { ...previous.ui, toast: `Status updated to ${status}` },
      };
    });
  },

  completeNextForDoctor(doctorId) {
    const current = getState();
    const queue = current.queueStatuses.find((item) => item.doctorId === doctorId);
    const next = current.appointments
      .filter(
        (appointment) =>
          appointment.doctorId === doctorId &&
          appointment.date === current.today &&
          activeStatuses.includes(appointment.status) &&
          appointment.queueNumber > (queue?.currentOngoingNumber || 0)
      )
      .sort((a, b) => a.queueNumber - b.queueNumber)[0];

    if (!next) {
      setState((previous) => ({
        ...previous,
        ui: { ...previous.ui, toast: "No waiting appointments for this doctor" },
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      appointments: previous.appointments.map((appointment) =>
        appointment.id === next.id ? { ...appointment, status: "Completed" } : appointment
      ),
      queueStatuses: previous.queueStatuses.map((item) =>
        item.doctorId === doctorId
          ? { ...item, currentOngoingNumber: next.queueNumber }
          : item
      ),
      notifications: [
        {
          id: `notif-${Date.now()}`,
          userId: previous.currentUserId,
          type: "Queue",
          title: "Queue moved",
          message: `The current ongoing appointment is now ${next.queueNumber}.`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...previous.notifications,
      ],
      ui: { ...previous.ui, toast: `Appointment ${next.queueNumber} completed` },
    }));
  },

  toggleDoctorAvailability(doctorId) {
    setState((previous) => {
      const doctor = previous.doctors.find((item) => item.id === doctorId);
      const available = !doctor?.available;
      return {
        ...previous,
        doctors: previous.doctors.map((item) =>
          item.id === doctorId ? { ...item, available, nextAvailable: available ? item.nextAvailable : "Unavailable" } : item
        ),
        notifications: available
          ? previous.notifications
          : [
              {
                id: `notif-${Date.now()}`,
                userId: previous.currentUserId,
                type: "Reschedule",
                title: "Doctor unavailable",
                message: `${doctor.name} became unavailable. A reschedule option is available from My appointments.`,
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...previous.notifications,
            ],
        ui: {
          ...previous.ui,
          toast: available ? "Doctor is available again" : "Users notified for rescheduling",
        },
      };
    });
  },

  updateProfileDraft(name, value) {
    setState((current) => {
      const draft =
        current.ui.profileDraft ||
        current.users.find((item) => item.id === current.currentUserId) ||
        {};
      return {
        ...current,
        ui: {
          ...current.ui,
          profileDraft: { ...draft, [name]: value },
          errors: { ...current.ui.errors, [name]: "" },
        },
      };
    });
  },

  updateAuthDraft(name, value) {
    setState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        authDraft: { ...current.ui.authDraft, [name]: value },
        errors: { ...current.ui.errors, [name]: "" },
      },
    }));
  },

  loginOrSignup() {
    const current = getState();
    const draft = current.ui.authDraft;
    const phone = draft.phone.trim();
    const fullName = draft.fullName.trim();
    const errors = {};
    if (!/^[+\d\s-]{8,}$/.test(phone)) errors.authPhone = "Enter a valid phone number.";

    const existingUser = current.users.find((user) => user.phone === phone);
    if (!existingUser && !fullName) errors.authName = "Enter a name to create an account.";

    if (Object.keys(errors).length) {
      setState((previous) => ({
        ...previous,
        ui: { ...previous.ui, errors, toast: "Please fix account details" },
      }));
      return;
    }

    if (existingUser) {
      setState((previous) => ({
        ...previous,
        currentUserId: existingUser.id,
        ui: {
          ...previous.ui,
          errors: {},
          toast: `Signed in as ${existingUser.fullName}`,
          authDraft: initialState().ui.authDraft,
          profileDraft: null,
        },
      }));
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      fullName,
      phone,
      age: "",
      gender: "Prefer not to say",
      medicalHistory: "",
      preferredSpecialties: [],
      locationId: current.selectedLocationId || "loc-home",
    };

    setState((previous) => ({
      ...previous,
      users: previous.users.concat(newUser),
      currentUserId: newUser.id,
      ui: {
        ...previous.ui,
        errors: {},
        toast: "Account created",
        authDraft: initialState().ui.authDraft,
        profileDraft: newUser,
      },
    }));
  },

  saveProfile() {
    const current = getState();
    const draft =
      current.ui.profileDraft ||
      current.users.find((item) => item.id === current.currentUserId);
    const errors = {};
    if (!draft.fullName?.trim()) errors.fullName = "Full name is required.";
    if (!/^[+\d\s-]{8,}$/.test(draft.phone || "")) errors.phone = "Enter a valid phone number.";
    if (!Number(draft.age) || Number(draft.age) < 1) errors.age = "Enter a valid age.";

    if (Object.keys(errors).length) {
      setState((previous) => ({
        ...previous,
        ui: { ...previous.ui, errors, toast: "Please fix the profile fields" },
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      users: previous.users.map((user) =>
        user.id === previous.currentUserId
          ? { ...user, ...draft, age: Number(draft.age) }
          : user
      ),
      ui: { ...previous.ui, profileDraft: null, errors: {}, toast: "Profile saved" },
    }));
  },

  markNotificationsRead() {
    setState((previous) => ({
      ...previous,
      notifications: previous.notifications.map((item) =>
        item.userId === previous.currentUserId ? { ...item, read: true } : item
      ),
    }));
  },

  updateAdminDraft(name, value) {
    setState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        adminDraft: { ...current.ui.adminDraft, [name]: value },
        errors: { ...current.ui.errors, [name]: "" },
      },
    }));
  },

  updateSlotDraft(doctorId, value) {
    setState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        adminDraft: {
          ...current.ui.adminDraft,
          slotDrafts: {
            ...current.ui.adminDraft.slotDrafts,
            [doctorId]: value,
          },
        },
      },
    }));
  },

  addDoctor() {
    const current = getState();
    const draft = current.ui.adminDraft;
    const errors = {};
    if (!draft.name.trim()) errors.adminName = "Doctor name is required.";
    if (!draft.specialty.trim()) errors.adminSpecialty = "Specialty is required.";
    if (!Number(draft.fee) || Number(draft.fee) < 1) errors.adminFee = "Enter a valid fee.";
    if (!/^\d{2}:\d{2}$/.test(draft.firstSlot)) errors.adminSlot = "Use HH:MM format.";

    if (Object.keys(errors).length) {
      setState((previous) => ({
        ...previous,
        ui: { ...previous.ui, errors, toast: "Please fix doctor details" },
      }));
      return;
    }

    const id = `doc-${Date.now()}`;
    const slotId = `slot-${id}-${draft.firstSlot.replace(":", "")}`;
    const doctor = {
      id,
      name: draft.name.startsWith("Dr.") ? draft.name : `Dr. ${draft.name}`,
      specialty: draft.specialty,
      gender: draft.gender,
      languages: [draft.language],
      clinicId: draft.clinicId,
      fee: Number(draft.fee),
      rating: 4.6,
      reviewCount: 0,
      experience: 1,
      availableToday: true,
      available: true,
      nextAvailable: draft.firstSlot,
      bio: `${draft.specialty} available for same-day consultations.`,
      slots: [{ id: slotId, time: draft.firstSlot, period: periodForTime(draft.firstSlot) }],
    };

    setState((previous) => ({
      ...previous,
      doctors: previous.doctors.concat(doctor),
      queueStatuses: previous.queueStatuses.concat({
        doctorId: id,
        currentOngoingNumber: 0,
        averageConsultationMinutes: 12,
        runningLateMinutes: 0,
      }),
      ui: {
        ...previous.ui,
        errors: {},
        toast: "Doctor added",
        adminDraft: { ...initialState().ui.adminDraft, clinicId: draft.clinicId },
      },
    }));
  },

  addSlot(doctorId) {
    const current = getState();
    const time = current.ui.adminDraft.slotDrafts[doctorId] || "";
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setState((previous) => ({
        ...previous,
        ui: { ...previous.ui, toast: "Use HH:MM for the slot time" },
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      doctors: previous.doctors.map((doctor) => {
        if (doctor.id !== doctorId) return doctor;
        const exists = doctor.slots.some((slot) => slot.time === time);
        if (exists) return doctor;
        return {
          ...doctor,
          availableToday: true,
          available: true,
          slots: doctor.slots.concat({
            id: `slot-${doctorId}-${time.replace(":", "")}-${Date.now()}`,
            time,
            period: periodForTime(time),
          }),
        };
      }),
      ui: {
        ...previous.ui,
        toast: "Slot added",
        adminDraft: {
          ...previous.ui.adminDraft,
          slotDrafts: { ...previous.ui.adminDraft.slotDrafts, [doctorId]: "" },
        },
      },
    }));
  },

  updateDoctorField(doctorId, field, value) {
    setState((previous) => ({
      ...previous,
      doctors: previous.doctors.map((doctor) =>
        doctor.id === doctorId
          ? { ...doctor, [field]: field === "fee" ? Number(value) : value }
          : doctor
      ),
      ui: { ...previous.ui, toast: "Doctor updated" },
    }));
  },

  updateQueueField(doctorId, field, value) {
    setState((previous) => ({
      ...previous,
      queueStatuses: previous.queueStatuses.map((queue) =>
        queue.doctorId === doctorId ? { ...queue, [field]: Number(value) } : queue
      ),
      ui: { ...previous.ui, toast: "Queue settings updated" },
    }));
  },

  resetDemo() {
    state = initialState();
    saveState();
    subscribers.forEach((subscriber) => subscriber(state));
  },
};

function periodForTime(time) {
  const hour = Number(time.split(":")[0]);
  if (hour < 12) return "Morning";
  if (hour < 16) return "Afternoon";
  return "Evening";
}
