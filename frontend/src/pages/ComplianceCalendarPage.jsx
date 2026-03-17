import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import {
  CalendarMonth,
  Warning,
  CheckCircle,
  Schedule,
  NavigateBefore,
  NavigateNext,
  Event,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  getDay,
  addDays,
  differenceInDays,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const QUARTER_START_MONTHS = [0, 3, 6, 9];

function getDeadlinesForMonth(year, month) {
  const deadlines = [];
  const monthDate = new Date(year, month, 1);
  const lastDay = endOfMonth(monthDate).getDate();

  deadlines.push({ day: 11, label: 'GSTR-1 (Monthly)', type: 'gstr1-monthly' });
  deadlines.push({ day: 13, label: 'GSTR-1 IFF (QRMP)', type: 'gstr1-iff' });
  deadlines.push({ day: 20, label: 'GSTR-3B', type: 'gstr3b' });
  deadlines.push({ day: 25, label: 'PMT-06 Payment', type: 'pmt06' });

  if (QUARTER_START_MONTHS.includes(month)) {
    deadlines.push({
      day: lastDay,
      label: 'GSTR-1 Quarterly',
      type: 'gstr1-quarterly',
    });
  }

  return deadlines.map((d) => ({
    ...d,
    date: new Date(year, month, Math.min(d.day, lastDay)),
  }));
}

function getDeadlineStatus(date, today) {
  const diff = differenceInDays(date, today);
  if (diff < 0) {
    const daysPast = Math.abs(diff);
    return daysPast > 15 ? 'filed' : 'overdue';
  }
  if (diff <= 7) return 'upcoming';
  return 'future';
}

function getStatusColor(status) {
  switch (status) {
    case 'overdue':
      return '#EF4444';
    case 'upcoming':
      return '#F59E0B';
    case 'filed':
      return '#10B981';
    case 'future':
    default:
      return '#3B82F6';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'overdue':
      return 'Overdue';
    case 'upcoming':
      return 'Upcoming';
    case 'filed':
      return 'Filed';
    case 'future':
    default:
      return 'Future';
  }
}

export default function ComplianceCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startPadding = getDay(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
  const nextMonthStart = startOfMonth(addMonths(currentMonth, 1));

  const prevMonthDays = startPadding > 0
    ? eachDayOfInterval({
        start: addDays(prevMonthEnd, -startPadding + 1),
        end: prevMonthEnd,
      })
    : [];

  const totalCells = prevMonthDays.length + daysInMonth.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = nextMonthDaysCount > 0
    ? Array.from({ length: nextMonthDaysCount }, (_, i) =>
        addDays(nextMonthStart, i)
      )
    : [];

  const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];

  const deadlinesMap = useMemo(() => {
    const map = new Map();
    const monthsToCheck = [
      subMonths(currentMonth, 1),
      currentMonth,
      addMonths(currentMonth, 1),
    ];
    monthsToCheck.forEach((m) => {
      const list = getDeadlinesForMonth(m.getFullYear(), m.getMonth());
      list.forEach((d) => {
        const key = format(d.date, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(d);
      });
    });
    return map;
  }, [currentMonth]);

  const upcomingDeadlines = useMemo(() => {
    const all = [];
    const endDate = addDays(today, 60);
    for (let d = new Date(today); d <= endDate; d = addDays(d, 1)) {
      const key = format(d, 'yyyy-MM-dd');
      const items = deadlinesMap.get(key);
      if (items) {
        items.forEach((item) => {
          const status = getDeadlineStatus(item.date, today);
          all.push({ ...item, status });
        });
      }
    }
    return all.sort((a, b) => a.date - b.date).slice(0, 10);
  }, [deadlinesMap, today]);

  const isCurrentMonth = (date) =>
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          GST Compliance Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track filing deadlines and stay compliant with GST regulations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={handlePrevMonth} size="small" color="primary">
                    <NavigateBefore />
                  </IconButton>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCurrentMonth(new Date())}
                    sx={{ mx: 0.5, minWidth: 100 }}
                  >
                    Today
                  </Button>
                  <IconButton onClick={handleNextMonth} size="small" color="primary">
                    <NavigateNext />
                  </IconButton>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Grid container>
                  {WEEKDAYS.map((day) => (
                    <Grid
                      item
                      xs={12 / 7}
                      key={day}
                      sx={{
                        py: 1.5,
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                      }}
                    >
                      {day}
                    </Grid>
                  ))}
                  {allDays.map((date, idx) => {
                    const key = format(date, 'yyyy-MM-dd');
                    const dayDeadlines = deadlinesMap.get(key) || [];
                    const isDimmed = !isCurrentMonth(date);
                    const isTodayDate = isToday(date);

                    return (
                      <Grid
                        item
                        xs={12 / 7}
                        key={idx}
                        sx={{
                          minHeight: 100,
                          p: 0.5,
                          borderRight:
                            (idx + 1) % 7 !== 0 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          borderBottom: '1px solid',
                          borderBottomColor: 'divider',
                          bgcolor: isTodayDate ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          border: isTodayDate ? '2px solid' : 'none',
                          borderColor: isTodayDate ? 'primary.main' : 'transparent',
                          opacity: isDimmed ? 0.6 : 1,
                          '& .MuiChip-root': {
                            height: 18,
                            fontSize: '0.65rem',
                            '& .MuiChip-label': { px: 0.5 },
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={isTodayDate ? 700 : 500}
                          sx={{
                            color: isTodayDate ? 'primary.main' : 'text.primary',
                            mb: 0.5,
                          }}
                        >
                          {format(date, 'd')}
                        </Typography>
                        {dayDeadlines.map((d) => {
                          const status = getDeadlineStatus(d.date, today);
                          const color = getStatusColor(status);
                          return (
                            <Chip
                              key={`${key}-${d.type}`}
                              label={d.label}
                              size="small"
                              sx={{
                                display: 'block',
                                mb: 0.25,
                                bgcolor: `${color}20`,
                                color: color,
                                border: `1px solid ${color}40`,
                                fontWeight: 500,
                              }}
                            />
                          );
                        })}
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Legend:
                </Typography>
                {['overdue', 'upcoming', 'filed', 'future'].map((status) => (
                  <Chip
                    key={status}
                    icon={
                      status === 'overdue' ? (
                        <Warning sx={{ fontSize: 14 }} />
                      ) : status === 'upcoming' ? (
                        <Schedule sx={{ fontSize: 14 }} />
                      ) : status === 'filed' ? (
                        <CheckCircle sx={{ fontSize: 14 }} />
                      ) : (
                        <Event sx={{ fontSize: 14 }} />
                      )
                    }
                    label={getStatusLabel(status)}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(status)}15`,
                      color: getStatusColor(status),
                      border: `1px solid ${getStatusColor(status)}40`,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Upcoming Deadlines
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((d) => (
                    <Paper
                      key={`${format(d.date, 'yyyy-MM-dd')}-${d.type}`}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderLeft: 4,
                        borderColor: getStatusColor(d.status),
                        bgcolor: `${getStatusColor(d.status)}08`,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {d.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(d.date, 'EEE, MMM d, yyyy')}
                      </Typography>
                      <Chip
                        label={getStatusLabel(d.status)}
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: `${getStatusColor(d.status)}25`,
                          color: getStatusColor(d.status),
                        }}
                      />
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming deadlines in the next 60 days.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
