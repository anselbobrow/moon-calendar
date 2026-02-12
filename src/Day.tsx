import { createMemo, splitProps, type Component } from "solid-js";

import styles from "./Day.module.css";
import { DayProps, Phase } from "./data/phaseDataDao";
import Moon from "./Moon";

const Day: Component<
  DayProps & { phase: Phase; afterFirstNewOfMonth: boolean }
> = (props) => {
  const [
    {
      weekDay,
      dayOfMonth,
      dayOfCycle,
      percentFullness,
      eclipticLongitude,
      phase,
      isQuarter,
      isHalf,
      tilt,
      afterFirstNewOfMonth,
    },
    _,
  ] = splitProps(props, [
    "weekDay",
    "phase",
    "percentFullness",
    "eclipticLongitude",
    "dayOfCycle",
    "dayOfMonth",
    "isQuarter",
    "isHalf",
    "tilt",
    "afterFirstNewOfMonth",
  ]);
  const quarterName = (phase: Phase): string => {
    switch (phase) {
      case 0:
        return "NEW MOON";
      case 1:
        return "FIRST QUARTER";
      case 2:
        return "FULL MOON";
      case 3:
        return "LAST QUARTER";
      default:
        return "";
    }
  };
  const weekend = createMemo(() => weekDay === "S");
  return (
    <div
      classList={{
        [styles.day]: true,
        [styles["after-first-new"]]: afterFirstNewOfMonth,
      }}
    >
      <span>{!weekend() && weekDay}</span>
      <span classList={{ [styles.weekend]: weekend() }}>{dayOfMonth}</span>
      <div class={styles["day-lower"]}>
        <span>{dayOfCycle}</span>
        <div class={styles.moon}>
          <Moon
            eclipticLongitude={eclipticLongitude}
            tilt={tilt}
            isQuarter={isQuarter}
          />
        </div>
        <span
          classList={{
            [styles["is-quarter"]]: isQuarter,
            [styles["is-half"]]: isHalf,
          }}
        >
          {isQuarter ? quarterName(phase) : `${Math.round(percentFullness)}%`}
        </span>
      </div>
    </div>
  );
};

export default Day;
