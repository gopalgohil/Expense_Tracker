export const getPeriodRanges = (query) => {
  const { month, quarter, year, startDate, endDate, allTime } = query;

  let start, end;
  let prevStart, prevEnd;
  let periodLabel = '';
  let prevPeriodLabel = '';

  if (allTime === 'true' || allTime === true) {
    return {
      current: null,
      previous: null,
      periodLabel: 'All Time',
      prevPeriodLabel: 'Previous All Time',
      type: 'all'
    };
  }

  if (startDate || endDate) {
    // Custom range
    start = startDate ? new Date(startDate) : new Date(0);
    start.setUTCHours(0, 0, 0, 0);

    if (endDate) {
      const endD = new Date(endDate);
      endD.setUTCDate(endD.getUTCDate() + 1);
      endD.setUTCHours(0, 0, 0, 0);
      end = endD;
    } else {
      const now = new Date();
      now.setUTCHours(23, 59, 59, 999);
      end = now;
    }

    const diffMs = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime());
    prevStart = new Date(start.getTime() - diffMs);

    const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
    periodLabel = `${new Date(start).toLocaleDateString('en-US', options)} - ${new Date(new Date(end).getTime() - 1).toLocaleDateString('en-US', options)}`;
    prevPeriodLabel = `${new Date(prevStart).toLocaleDateString('en-US', options)} - ${new Date(new Date(prevEnd).getTime() - 1).toLocaleDateString('en-US', options)}`;

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      periodLabel,
      prevPeriodLabel,
      type: 'custom'
    };
  }



  if (year) {
    const y = parseInt(year);
    if (!isNaN(y)) {
      start = new Date(Date.UTC(y, 0, 1));
      end = new Date(Date.UTC(y + 1, 0, 1));

      prevStart = new Date(Date.UTC(y - 1, 0, 1));
      prevEnd = new Date(Date.UTC(y, 0, 1));

      periodLabel = `${y}`;
      prevPeriodLabel = `${y - 1}`;

      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
        periodLabel,
        prevPeriodLabel,
        type: 'yearly'
      };
    }
  }

  // Default: Month (specified or current)
  let ym = month;
  if (!ym || ym.split('-').length !== 2) {
    const now = new Date();
    ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const [yVal, mVal] = ym.split('-').map(Number);
  start = new Date(Date.UTC(yVal, mVal - 1, 1));
  end = new Date(Date.UTC(yVal, mVal, 1));

  // Previous month
  const pmDate = new Date(Date.UTC(yVal, mVal - 2, 1));
  const py = pmDate.getUTCFullYear();
  const pm = pmDate.getUTCMonth() + 1;
  prevStart = new Date(Date.UTC(py, pm - 1, 1));
  prevEnd = new Date(Date.UTC(py, pm, 1));

  const monthName = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const prevMonthName = prevStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
    periodLabel: monthName,
    prevPeriodLabel: prevMonthName,
    type: 'monthly'
  };
};
