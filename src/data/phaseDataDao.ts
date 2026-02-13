import { Temporal } from "@js-temporal/polyfill";
import PhaseDataAstroEngine from "./phaseDataAstroEngine";
import { Position } from "../App";

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
  tilt: number;
}

interface PhaseProps {
  phase: Phase;
  afterFirstNewOfMonth: boolean;
  days: DayProps[];
}

interface CalProps {
  phases: PhaseProps[];
}

interface PhaseDataProps {
  zdt: Temporal.ZonedDateTime;
  position: Position;
}

interface PhaseDataDao {
  getData(args: PhaseDataProps): Promise<CalProps>;
}

export default class PhaseData implements PhaseDataDao {
  getData(args: PhaseDataProps): Promise<CalProps> {
    return new PhaseDataAstroEngine().getData(args);
  }
}

export {
  Phase,
  type PhaseDataDao,
  type DayProps,
  type PhaseProps,
  type CalProps,
  type PhaseDataProps,
};
