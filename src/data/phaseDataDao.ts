import { Temporal } from "@js-temporal/polyfill";
import PhaseDataAstroEngine from "./phaseDataAstroEngine";

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
  eclipticLongitude: number;
  isQuarter: boolean;
  isHalf: boolean;
}

interface PhaseProps {
  phase: Phase;
  days: DayProps[];
}

interface CalProps {
  phases: PhaseProps[];
}

interface PhaseDataDao {
  getData(instant: Temporal.Instant): Promise<CalProps>;
}

export default class PhaseData implements PhaseDataDao {
  getData(instant: Temporal.Instant): Promise<CalProps> {
    return new PhaseDataAstroEngine().getData(instant);
  }
}

export {
  Phase,
  type PhaseDataDao,
  type DayProps,
  type PhaseProps,
  type CalProps,
};
