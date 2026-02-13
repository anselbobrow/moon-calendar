import { Temporal } from "@js-temporal/polyfill";
import PhaseDataAstroEngine from "./phaseDataAstroEngine";
import { DayProps } from "../Day";
import { Position } from "../types/common";

enum Phase {
  WaxingCrescent,
  WaxingGibbous,
  WaningGibbous,
  WaningCrescent,
}

interface MoonDataPhase {
  phase: Phase;
  afterFirstNewOfMonth: boolean;
  days: DayProps[];
}

interface MoonData {
  phases: MoonDataPhase[];
}

interface PhaseDataProps {
  zdt: Temporal.ZonedDateTime;
  position: Position;
}

/** Interface for all PhaseData providers, including the wrapper class below */
interface PhaseDataDao {
  getData(args: PhaseDataProps): Promise<MoonData>;
}

/** Wrapper class for easy switching out of the backend */
export default class PhaseData implements PhaseDataDao {
  getData(args: PhaseDataProps): Promise<MoonData> {
    return new PhaseDataAstroEngine().getData(args);
  }
}

export {
  Phase,
  type PhaseDataDao,
  type DayProps,
  type MoonDataPhase,
  type MoonData,
  type PhaseDataProps,
};
