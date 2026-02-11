import { Temporal } from "@js-temporal/polyfill";
import {
  CalProps,
  DayProps,
  Phase,
  PhaseDataDao,
  PhaseProps,
} from "./phaseDataDao";
import * as Astronomy from "astronomy-engine";

export default class PhaseDataAstroEngine implements PhaseDataDao {
  getData = async (instant: Temporal.Instant): Promise<CalProps> => {
    return this.getDataByPhase(instant);
  };

  getDataByPhase = async (instant: Temporal.Instant): Promise<CalProps> => {
    return new Promise((res, rej) => {
      try {
        const startOfMonth = new Date(
          instant.toZonedDateTimeISO("UTC").with({ day: 1 }).startOfDay()
            .epochMilliseconds,
        );
        const firstQuarterOfMonth = Astronomy.SearchMoonQuarter(startOfMonth);
        const allQuarters: Astronomy.MoonQuarter[] = [];
        if (firstQuarterOfMonth.time.date.getUTCDate() !== 1) {
          const lastQuarterOfPreviousMonth =
            this.prevMoonQuarter(firstQuarterOfMonth);
          allQuarters.push(lastQuarterOfPreviousMonth);
        }
        let quarter = firstQuarterOfMonth;
        while (quarter.time.date.getUTCMonth() === startOfMonth.getUTCMonth()) {
          allQuarters.push(quarter);
          quarter = Astronomy.NextMoonQuarter(quarter);
        }
        res({
          phases: allQuarters.map((q) =>
            this.phasePropsFromMoonQuarter(q, startOfMonth.getUTCMonth()),
          ),
        });
      } catch (e) {
        rej((e as Error).message);
      }
    });
  };

  /** Given a moon quarter, fill up an array of DayProps objs
   * for all days within both the phase and the month of interest */
  private phasePropsFromMoonQuarter = (
    mq: Astronomy.MoonQuarter,
    month: number,
  ): PhaseProps => {
    let lastNewMoonQuarter = mq;
    while (lastNewMoonQuarter.quarter !== 0) {
      lastNewMoonQuarter = this.prevMoonQuarter(lastNewMoonQuarter);
    }
    const lastNewMoonDay = this.getTemporalStartOfDay(lastNewMoonQuarter.time);

    const days: DayProps[] = [];
    const nextQuarterStart = this.getTemporalStartOfDay(
      Astronomy.NextMoonQuarter(mq).time,
    );
    let day = this.getTemporalStartOfDay(mq.time);
    while (Temporal.ZonedDateTime.compare(day, nextQuarterStart) === -1) {
      // only push days that are within the month we're interested in
      // Date.getUTCMonth is 0-indexed, while ZonedDateTime.month is 1-indexed
      if (day.month === month + 1) {
        const date = new Date(day.epochMilliseconds);
        const isQuarter = mq.time.date.getUTCDate() === day.day;
        days.push({
          weekDay: day.toLocaleString("en-US", { weekday: "narrow" }),
          dayOfMonth: day.day,
          dayOfCycle: day.since(lastNewMoonDay).total({ unit: "day" }),
          percentFullness:
            Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction *
            100,
          eclipticLongitude: Astronomy.MoonPhase(date),
          isQuarter,
          isHalf: isQuarter && mq.quarter % 2 === 0,
        });
      }
      day = day.add({ days: 1 });
    }
    return { phase: mq.quarter as Phase, days };
  };

  /** Converts an AstroDate to the start of day as a Temporal.Instant */
  private getTemporalStartOfDay = (
    time: Astronomy.AstroTime,
  ): Temporal.ZonedDateTime => {
    return Temporal.Instant.fromEpochMilliseconds(time.date.getTime())
      .toZonedDateTimeISO("UTC")
      .withPlainTime();
  };

  /** Based on implementation of NextMoonQuarter:
   * https://github.com/cosinekitty/astronomy/blob/865d3da7d8112bbc7911238052c6af4aaf877181/demo/nodejs/astronomy.js#L4823 */
  private prevMoonQuarter = (
    mq: Astronomy.MoonQuarter,
  ): Astronomy.MoonQuarter => {
    const MILLIS_PER_DAY = 1000 * 3600 * 24;
    const date = new Date(mq.time.date.getTime() - 6 * MILLIS_PER_DAY);
    const quarter = (mq.quarter - 1) % 4;
    const time = Astronomy.SearchMoonPhase(quarter * 90, date, -10);
    if (!time) {
      throw "Couldn't find previous moon quarter";
    }
    return new Astronomy.MoonQuarter(quarter, time);
  };
}
