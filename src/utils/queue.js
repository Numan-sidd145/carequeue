export const activeStatuses = ["Booked", "Checked in", "Waiting", "In consultation"];

export const statusOrder = [
  "Booked",
  "Checked in",
  "Waiting",
  "In consultation",
  "Completed",
  "Cancelled",
];

export function getDoctorAppointments(state, doctorId) {
  return state.appointments
    .filter((appointment) => appointment.doctorId === doctorId)
    .sort((a, b) => a.queueNumber - b.queueNumber);
}

export function getTodayDoctorAppointments(state, doctorId) {
  return getDoctorAppointments(state, doctorId).filter(
    (appointment) => appointment.date === state.today
  );
}

export function isSlotBooked(state, doctorId, slotId) {
  return state.appointments.some(
    (appointment) =>
      appointment.doctorId === doctorId &&
      appointment.slotId === slotId &&
      appointment.date === state.today &&
      appointment.status !== "Cancelled"
  );
}

export function getNextQueueNumber(state, doctorId) {
  const queue = state.queueStatuses.find((item) => item.doctorId === doctorId);
  const doctorAppointments = getTodayDoctorAppointments(state, doctorId);
  const maxBookedNumber = doctorAppointments.reduce(
    (max, appointment) => Math.max(max, appointment.queueNumber),
    0
  );
  return Math.max(queue?.currentOngoingNumber || 0, maxBookedNumber) + 1;
}

export function getPeopleAhead(state, doctorId, queueNumber) {
  const queue = state.queueStatuses.find((item) => item.doctorId === doctorId);
  if (!queue) return 0;
  return Math.max(queueNumber - queue.currentOngoingNumber - 1, 0);
}

export function getEstimatedWait(state, doctorId, queueNumber) {
  const queue = state.queueStatuses.find((item) => item.doctorId === doctorId);
  if (!queue) return 0;
  const peopleAhead = getPeopleAhead(state, doctorId, queueNumber);
  return peopleAhead * queue.averageConsultationMinutes + queue.runningLateMinutes;
}

export function getDoctorQueueSummary(state, doctorId) {
  const queue = state.queueStatuses.find((item) => item.doctorId === doctorId);
  const appointments = getTodayDoctorAppointments(state, doctorId).filter((appointment) =>
    activeStatuses.includes(appointment.status)
  );
  const nextAppointment = appointments.find(
    (appointment) => appointment.queueNumber > (queue?.currentOngoingNumber || 0)
  );
  const waitingCount = appointments.filter(
    (appointment) => appointment.queueNumber > (queue?.currentOngoingNumber || 0)
  ).length;

  return {
    currentOngoingNumber: queue?.currentOngoingNumber || 0,
    averageConsultationMinutes: queue?.averageConsultationMinutes || 12,
    runningLateMinutes: queue?.runningLateMinutes || 0,
    waitingCount,
    nextQueueNumber: nextAppointment?.queueNumber || null,
    estimatedWaitForNext:
      nextAppointment && queue
        ? getEstimatedWait(state, doctorId, nextAppointment.queueNumber)
        : queue?.runningLateMinutes || 0,
  };
}

export function recalculateQueueAfterCancellation(state, doctorId) {
  const todayAppointments = getTodayDoctorAppointments(state, doctorId)
    .filter((appointment) => appointment.status !== "Cancelled")
    .sort((a, b) => a.queueNumber - b.queueNumber);
  const queue = state.queueStatuses.find((item) => item.doctorId === doctorId);
  let nextNumber = queue?.currentOngoingNumber ? queue.currentOngoingNumber + 1 : 1;
  const renumbered = new Map();

  todayAppointments.forEach((appointment) => {
    renumbered.set(appointment.id, nextNumber);
    nextNumber += 1;
  });

  return state.appointments.map((appointment) => {
    if (!renumbered.has(appointment.id)) return appointment;
    return { ...appointment, queueNumber: renumbered.get(appointment.id) };
  });
}

export function getAppointmentDerivedDetails(state, appointment) {
  return {
    peopleAhead: getPeopleAhead(state, appointment.doctorId, appointment.queueNumber),
    estimatedWait: getEstimatedWait(state, appointment.doctorId, appointment.queueNumber),
    currentOngoingNumber:
      state.queueStatuses.find((item) => item.doctorId === appointment.doctorId)
        ?.currentOngoingNumber || 0,
  };
}
