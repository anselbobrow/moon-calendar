import { Temporal } from "@js-temporal/polyfill";
import {
  MoonData,
  DayProps,
  Phase,
  PhaseDataDao,
  PhaseDataProps,
} from "./phaseDataDao";

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

/** PhaseData implementation based on interpolation from the Navy API
 * linked below. This implementation is inaccurate as you cannot reasonably
 * interpolate between quarters to get accurate daily percentages, and
 * so I have abandoned this approach in favor of the astronomy-engine
 * package on NPM, see PhaseDataAstroEngine.ts for more info. */
class PhaseDataNavy implements PhaseDataDao {
  async getData(args: PhaseDataProps): Promise<MoonData> {
    return this.getDataWithNavyApi({ zdt: args.zdt });
  }

  private getDataWithNavyApi = async ({
    zdt,
  }: {
    zdt: Temporal.ZonedDateTime;
  }): Promise<MoonData> => {
    const params = new URLSearchParams();
    params.append("date", this.apiRequestStartDate(zdt));
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
      return {
        phases: [
          {
            phase: Phase.WaxingCrescent,
            afterFirstNewOfMonth: false, // FIXME unimplemented
            days: this.transformData(data, zdt),
          },
        ],
      };
    } catch (e) {
      console.log((e as Error).message);
      throw e;
    }
  };

  private transformData = (
    data: Data,
    zdt: Temporal.ZonedDateTime,
  ): DayProps[] => {
    // how many days to truncate from the result,
    // as they are in the previous month
    const offset: number = this.getOffset(data, zdt);
    const daysInMonth: number = zdt.daysInMonth;
    const percentageCycleByDay: number[] =
      this.getPercentageIlluminationByDay(data);
    const percentageCycleInMonth: number[] = percentageCycleByDay.slice(
      offset,
      offset + daysInMonth,
    );
    const monthOfDayProps: DayProps[] = this.mapPercentageCycleToDayProps(
      percentageCycleInMonth,
    );
    return monthOfDayProps;
  };

  private mapPercentageCycleToDayProps = (input: number[]): DayProps[] => {
    return input.map((percentCycle, idx) => {
      const percentFullness = Math.round(
        percentCycle < 50 ? percentCycle * 2 : percentCycle * -2 + 200,
      );
      let phase: Phase;
      if (percentCycle < 25) {
        phase = Phase.WaxingCrescent;
      } else if (percentCycle < 50) {
        phase = Phase.WaxingGibbous;
      } else if (percentCycle < 75) {
        phase = Phase.WaningGibbous;
      } else {
        phase = Phase.WaningCrescent;
      }
      return {
        percentFullness,
        dayOfWeek: 0, // FIXME unimplemented
        dayOfMonth: idx + 1,
        eclipticLongitude: 0, // FIXME unimplemented
        dayOfCycle: 0, // FIXME unimplemented
        isHalf: true, // FIXME unimplemented
        isQuarter: true, // FIXME unimplemented
        tilt: 0, // FIXME unimplemented
      };
    });
  };

  /** Uses linear interpolation to get the estimated percent illumination
   * of the moon on a given day. NB: This is an inaccurate estimation method
   * and was replaced in the PhaseDataAstroEngine class */
  private getPercentageIlluminationByDay = (data: Data): number[] => {
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
      const phase = this.phaseFromString(p.phase)!;
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
        arr[d1 + n] = (p1 + n * (dp / dt)) * 100;
      }
    }
    return arr;
  };

  private getOffset = (data: Data, zdt: Temporal.ZonedDateTime): number => {
    const firstPhase = data.phasedata[0];
    const firstPhasePlainDate = Temporal.PlainDate.from({
      year: firstPhase.year,
      month: firstPhase.month,
      day: firstPhase.day,
    });
    const startOfMonth = zdt.toPlainDate().with({ day: 1 });
    const offset = startOfMonth.since(firstPhasePlainDate);
    return offset.days;
  };

  private apiRequestStartDate = (zdt: Temporal.ZonedDateTime): string => {
    const longestPhaseLengthDays = 8;
    const zonedDateTime = zdt
      // in the worst case scenario, a phase starts on
      // day 2 of the month and we need the previous phase
      // to interpolate a value for day 1
      .with({ day: 2 })
      .subtract({ days: longestPhaseLengthDays });
    // format the string correctly for the request
    return zonedDateTime.toPlainDate().toString();
  };

  private phaseFromString = (input: string): number | undefined => {
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
}

export default PhaseDataNavy;
