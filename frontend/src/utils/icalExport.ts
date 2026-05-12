export interface ICalFixture {
  id: string;
  home: string;
  away: string;
  date: string;
  time: string;
  stadium?: string;
  matchweek?: number | string;
  broadcaster?: string;
}

/**
 * Generates and triggers download of an iCalendar (.ics) file
 * from a list of fixtures.
 */
export const exportICS = (fixtures: ICalFixture[], leagueName: string) => {
  const calendarLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fixtures and Squad Optimizer//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  fixtures.forEach((f) => {
    const start = new Date(`${f.date}T${f.time}:00Z`); // Assuming UTC for simplicity
    const end = new Date(start.getTime() + 105 * 60 * 1000); // 1h 45m duration

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    calendarLines.push('BEGIN:VEVENT');
    calendarLines.push(`UID:${f.id}@danyalaqeel.creator`);
    calendarLines.push(`DTSTAMP:${formatDate(new Date())}`);
    calendarLines.push(`DTSTART:${formatDate(start)}`);
    calendarLines.push(`DTEND:${formatDate(end)}`);
    calendarLines.push(`SUMMARY:${f.home} vs ${f.away} (${leagueName})`);
    calendarLines.push(`DESCRIPTION:Matchweek ${f.matchweek} - ${f.broadcaster || 'Tactical Slot'}`);
    calendarLines.push(`LOCATION:${f.stadium || 'TBD'}`);
    calendarLines.push('STATUS:CONFIRMED');
    calendarLines.push('END:VEVENT');
  });

  calendarLines.push('END:VCALENDAR');

  const blob = new Blob([calendarLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${leagueName.replace(/\s+/g, '_')}_Schedule.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
