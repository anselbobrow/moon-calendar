import { createMemo, splitProps, type Component } from "solid-js";

import styles from "./Day.module.css";
import { Phase } from "./data/phaseDataDao";
import Moon from "./Moon";
import { QUARTER_NAMES } from "./types/common";

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

const Day: Component<
  DayProps & { phase: Phase; afterFirstNewOfMonth: boolean }
> = (props) => {
  const weekend = createMemo(() => props.weekDay === "S");
  const [moonProps] = splitProps(props, [
    "eclipticLongitude",
    "tilt",
    "isQuarter",
  ]);
  return (
    <div
      classList={{
        [styles.day]: true,
        [styles["after-first-new"]]: props.afterFirstNewOfMonth,
      }}
    >
      <span>{!weekend() && props.weekDay}</span>
      <span classList={{ [styles.weekend]: weekend() }}>
        {props.dayOfMonth}
      </span>
      <div class={styles["day-lower"]}>
        <span>{props.dayOfCycle}</span>
        <div class={styles.moon}>
          <Moon {...moonProps} />
        </div>
        <span
          classList={{
            [styles["is-quarter"]]: props.isQuarter,
            [styles["is-half"]]: props.isHalf,
          }}
        >
          {props.isQuarter
            ? QUARTER_NAMES[props.phase]
            : `${Math.round(props.percentFullness)}%`}
        </span>
      </div>
    </div>
  );
};

export default Day;
export { type DayProps };
