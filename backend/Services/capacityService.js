// backend/services/capacityService.js

/**
 * Utility to round a datetime to the nearest 15-minute slot
 */
function roundTo15Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  const rounded = Math.floor(minutes / 15) * 15;
  d.setMinutes(rounded);
  return d;
}

/**
 * Check if a booking can fit based on capacity rules.
 * @param {Array} existingBookings - current bookings from DB
 * @param {Object} newBooking - { datetime, guests }
 * @returns {Object} { allowed: boolean, reason?: string }
 */
function checkCapacity(existingBookings, newBooking) {
  const bookingTime = roundTo15Minutes(newBooking.datetime);
  const endTime = new Date(bookingTime);
  endTime.setHours(endTime.getHours() + 2); // dining time = 2 hrs

  let seatsAtTime = 0;
  let slotBookings = 0;

  for (const b of existingBookings) {
    const start = roundTo15Minutes(b.datetime);
    const finish = new Date(start);
    finish.setHours(finish.getHours() + 2);

    // If the bookings overlap in time
    if (bookingTime < finish && endTime > start) {
      seatsAtTime += b.guests;
      if (start.getTime() === bookingTime.getTime()) {
        slotBookings += b.guests;
      }
    }
  }

  // Check slot cap (20 max per 15-min block)
  if (slotBookings + newBooking.guests > 20) {
    return { allowed: false, reason: "Too many people in this slot (20 max)." };
  }

  // Check overall restaurant cap (90 seats max at once)
  if (seatsAtTime + newBooking.guests > 90) {
    return { allowed: false, reason: "Restaurant full at this time (90 seats max)." };
  }

  return { allowed: true };
}

module.exports = { checkCapacity, roundTo15Minutes };
