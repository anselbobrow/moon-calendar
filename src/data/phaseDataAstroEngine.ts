import { Temporal } from "@js-temporal/polyfill";
import {
  MoonData,
  DayProps,
  Phase,
  PhaseDataDao,
  PhaseDataProps,
  MoonDataPhase,
} from "./phaseDataDao";
import * as Astronomy from "astronomy-engine";

class PhaseDataAstroEngine implements PhaseDataDao {
  observer!: Astronomy.Observer;

  getData = async (args: PhaseDataProps): Promise<MoonData> => {
    this.observer = new Astronomy.Observer(...args.position);
    return this.getDataByPhase(args.zdt);
  };

  private getDataByPhase = async (
    zdt: Temporal.ZonedDateTime,
  ): Promise<MoonData> => {
    return new Promise((res, rej) => {
      try {
        const startOfMonth = new Date(
          zdt.with({ day: 1 }).startOfDay().epochMilliseconds,
        );
        const allQuarters = this.getAllQuartersForMonth(startOfMonth);
        const phases = this.quartersToMoonDataPhases(
          allQuarters,
          startOfMonth.getMonth(),
        );
        res({ phases });
      } catch (e) {
        rej(e);
      }
    });
  };

  /** Fills in the MoonDataPhase object for the corresponding phases to all
   * quarters in the input list */
  private quartersToMoonDataPhases = (
    quarters: Astronomy.MoonQuarter[],
    month: number,
  ): MoonDataPhase[] => {
    const phases: MoonDataPhase[] = [];
    let afterFirstNewOfMonth = false;
    for (const q of quarters) {
      if (q.time.date.getMonth() === month && q.quarter === 0)
        afterFirstNewOfMonth = true;
      const partialMoonDataPhase = this.phasePropsFromMoonQuarter(q, month);
      phases.push({ ...partialMoonDataPhase, afterFirstNewOfMonth });
    }
    return phases;
  };

  /** Returns a list of all moon quarters whose following phases contain days
   * in the month specified by startOfMonth */
  private getAllQuartersForMonth = (
    startOfMonth: Date,
  ): Astronomy.MoonQuarter[] => {
    const allQuarters: Astronomy.MoonQuarter[] = [];
    const firstQuarterOfMonth = Astronomy.SearchMoonQuarter(startOfMonth);
    if (firstQuarterOfMonth.time.date.getDate() !== 1) {
      const lastQuarterOfPreviousMonth =
        this.prevMoonQuarter(firstQuarterOfMonth);
      allQuarters.push(lastQuarterOfPreviousMonth);
    }
    let quarter = firstQuarterOfMonth;
    while (quarter.time.date.getMonth() === startOfMonth.getMonth()) {
      allQuarters.push(quarter);
      quarter = Astronomy.NextMoonQuarter(quarter);
    }
    return allQuarters;
  };

  /** Given a moon quarter, fill up an array of DayProps objs for all days
   * within both the phase and the month of interest. */
  private phasePropsFromMoonQuarter = (
    mq: Astronomy.MoonQuarter,
    month: number,
  ): Omit<MoonDataPhase, "afterFirstNewOfMonth"> => {
    let lastNewMoonQuarter = mq;
    while (lastNewMoonQuarter.quarter !== 0) {
      lastNewMoonQuarter = this.prevMoonQuarter(lastNewMoonQuarter);
    }
    const lastNewMoonDay = this.getTemporalNoon(lastNewMoonQuarter.time);
    const days: DayProps[] = [];
    const thisQuarterStartDay = mq.time.date.getDate();
    const nextQuarterStartDay =
      Astronomy.NextMoonQuarter(mq).time.date.getDate();
    let day = this.getTemporalNoon(mq.time);
    while (day.day !== nextQuarterStartDay) {
      // Only push days that are within the month we're interested in
      // Date.getMonth is 0-indexed, while ZonedDateTime.month is 1-indexed
      if (day.month - 1 === month) {
        const date = new Date(day.epochMilliseconds);
        const isQuarter = thisQuarterStartDay === day.day;
        const culmination = Astronomy.SearchHourAngle(
          Astronomy.Body.Moon,
          this.observer,
          0,
          new Date(day.startOfDay().epochMilliseconds),
        );
        days.push({
          dayOfWeek: day.dayOfWeek,
          dayOfMonth: day.day,
          dayOfCycle: Math.round(
            day.since(lastNewMoonDay).total({ unit: "day" }),
          ),
          percentFullness:
            Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction *
            100,
          eclipticLongitude: Astronomy.MoonPhase(date),
          isQuarter,
          isHalf: isQuarter && mq.quarter % 2 === 0,
          tilt: this.getMoonTiltDegrees(this.observer, culmination.time),
        });
      }
      day = day.add({ days: 1 });
    }
    return { phase: mq.quarter as Phase, days };
  };

  private getTemporalNoon = (
    time: Astronomy.AstroTime,
  ): Temporal.ZonedDateTime => {
    return Temporal.Instant.fromEpochMilliseconds(time.date.getTime())
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .withPlainTime({ hour: 12 });
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

  /** Tilt angle of sunlit side of the Moon in degrees counterclockwise from up.
   * Based on https://github.com/cosinekitty/astronomy/blob/865d3da7d8112bbc7911238052c6af4aaf877181/demo/nodejs/camera.js */
  private getMoonTiltDegrees = (
    observer: Astronomy.Observer,
    time: Astronomy.AstroTime,
  ): number => {
    const RAD2DEG = 57.29577951308232;

    // Calculate the topocentric equatorial coordinates of date for the Moon.
    // Assume aberration does not matter because the Moon is so close and has such a small relative velocity.
    const moon_equ = Astronomy.Equator(
      Astronomy.Body.Moon,
      time,
      observer,
      true,
      false,
    );

    // Also calculate the Sun's topocentric position in the same coordinate system.
    const sun_equ = Astronomy.Equator(
      Astronomy.Body.Sun,
      time,
      observer,
      true,
      false,
    );

    // Get the rotation matrix that converts equatorial to horizontal coordintes for this place and time.
    let rot = Astronomy.Rotation_EQD_HOR(time, observer);

    // Get the Moon's horizontal coordinates, so we know how much to pivot azimuth and altitude of rotation matrix.
    const moon_hor = Astronomy.Horizon(
      time,
      observer,
      moon_equ.ra,
      moon_equ.dec,
    );

    // Modify the rotation matrix in two steps:
    // First, rotate the orientation so we are facing the Moon's azimuth.
    // We do this by pivoting around the zenith axis.
    // Horizontal axes are: 0 = north, 1 = west, 2 = zenith.
    rot = Astronomy.Pivot(rot, 2, moon_hor.azimuth);

    // Second, pivot around the leftward axis to bring the Moon to the camera's altitude level.
    rot = Astronomy.Pivot(rot, 1, moon_hor.altitude);

    // Apply the same rotation to the Sun's equatorial vector.
    // The x- and y-coordinates now tell us which side appears sunlit in the camera!
    const vec = Astronomy.RotateVector(rot, sun_equ.vec);

    // Don't bother normalizing the Sun vector, because in AU it will be close to unit anyway.
    // Calculate the tilt angle of the sunlit side, as seen by the camera.
    // The x-axis is now pointing directly at the object, z is up in the camera image, y is to the left.
    const tilt = RAD2DEG * Math.atan2(vec.y, vec.z);
    return tilt;
  };
}
export default PhaseDataAstroEngine;
