import { Temporal } from "@js-temporal/polyfill";

enum Phase {
  WaxingCrescent,
  WaxingGibbous,
  WaningGibbous,
  WaningCrescent,
}

interface DayProps {
  weekDay: string;
  dayOfMonth: number;
  dayOfCycle: number;
  percentFullness: number;
  phase: Phase;
}

interface PhaseData {
  day: number;
  month: number;
  phase: string;
  time: string;
  year: number;
}

interface Data {
  apiversion: string;
  day: number;
  month: number;
  numphases: number;
  phasedata: PhaseData[];
  year: number;
}

const getData = async ({
  instant,
}: {
  instant: Temporal.Instant;
}): Promise<number[]> => {
  const params = new URLSearchParams();
  params.append("date", apiRequestStartDate(instant));
  // a month can contain up to 5 phases, we add
  // one phase on each side to get enough data
  // to interpolate, which makes 7
  params.append("nump", "7");
  try {
    const response = await fetch(
      `https://aa.usno.navy.mil/api/moon/phases/date?${params}`,
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return transformData(data, instant);
  } catch (e) {
    console.log((e as Error).message);
    throw e;
  }
};

const transformData = (data: Data, instant: Temporal.Instant): number[] => {
  // how many days to truncate from the result,
  // as they are in the previous month
  const offset = getOffset(data, instant);
  const percentageFullnessByDay = getPercentageFullnessByDay(data);
  const daysInMonth = instant.toZonedDateTimeISO("UTC").daysInMonth;
  return percentageFullnessByDay.slice(offset, offset + daysInMonth);
};

const getPercentageFullnessByDay = (data: Data): number[] => {
  // create input from data
  const firstPhase = data.phasedata[0];
  const firstPhasePlainDate = Temporal.PlainDate.from({
    year: firstPhase.year,
    month: firstPhase.month,
    day: firstPhase.day,
  });
  const input: { day: number; phase: number }[] = data.phasedata.map((p) => {
    const phasePlainDate = Temporal.PlainDate.from({
      year: p.year,
      month: p.month,
      day: p.day,
    });
    const day = phasePlainDate.since(firstPhasePlainDate).days;
    const phase = phaseFromString(p.phase)!;
    return { day, phase };
  });
  // linear interpolation between each pair of phases
  const arr = [];
  for (let i = 0; i < input.length - 1; i++) {
    const d1 = input[i].day;
    const d2 = input[i + 1].day;
    const p1 = input[i].phase;
    // treat new moon as 100 if it is the second phase
    // so that interpolation works successfully
    let p2 = input[i + 1].phase;
    if (p2 === 0) {
      p2 = 1;
    }
    const dt = d2 - d1;
    const dp = p2 - p1;
    for (let n = 0; n < dt; n++) {
      arr[d1 + n] = Math.round((p1 + n * (dp / dt)) * 100);
    }
  }
  return arr;
};

const getOffset = (data: Data, instant: Temporal.Instant): number => {
  const firstPhase = data.phasedata[0];
  const firstPhasePlainDate = Temporal.PlainDate.from({
    year: firstPhase.year,
    month: firstPhase.month,
    day: firstPhase.day,
  });
  const startOfMonth = instant
    .toZonedDateTimeISO("UTC")
    .toPlainDate()
    .with({ day: 1 });
  const offset = startOfMonth.since(firstPhasePlainDate);
  return offset.days;
};

const apiRequestStartDate = (instant: Temporal.Instant): string => {
  const longestPhaseLengthDays = 8;
  const zonedDateTime = instant
    .toZonedDateTimeISO("UTC")
    // in the worst case scenario, a phase starts on
    // day 2 of the month and we need the previous phase
    // to interpolate a value for day 1
    .with({ day: 2 })
    .subtract({ days: longestPhaseLengthDays });
  // format the string correctly for the request
  return zonedDateTime.toPlainDate().toString();
};

const phaseFromString = (input: string): number | undefined => {
  switch (input) {
    case "New Moon":
      return 0;
    case "First Quarter":
      return 0.25;
    case "Full Moon":
      return 0.5;
    case "Last Quarter":
      return 0.75;
    default:
      throw new Error("Invalid phase.");
  }
};

export { getData, type DayProps, Phase };
