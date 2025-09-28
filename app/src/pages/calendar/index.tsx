import React, { useState, useEffect } from 'react';
import FullCalendar, { EventInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Fetch events from API with optional filter
    // Placeholder example
    setEvents([
      { id: '1', title: 'Event 1', date: '2024-07-01', color: 'blue' },
      { id: '2', title: 'Event 2', date: '2024-07-02', color: 'green' },
    ]);
  }, [filter]);

  return (
    <div>
      <h2>Calendar</h2>
      <div>
        <label>Filter: </label>
        <input value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventColor={(event) => event.event.extendedProps.color}
      />
    </div>
  );
};

export default CalendarPage;
