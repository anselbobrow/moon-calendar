import { splitProps, type Component } from "solid-js";

import styles from "./Day.module.css";
import { Phase } from "./data/phaseDataDao";
import Moon from "./Moon";
import { QUARTER_NAMES, WEEKDAYS } from "./types/common";

interface DayProps {
  dayOfWeek: number;
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
      <span classList={{ [styles.saturday]: props.dayOfWeek === 6 }}>
        {props.dayOfWeek < 6 && WEEKDAYS[props.dayOfWeek - 1]}
      </span>
      <span
        classList={{
          [styles.saturday]: props.dayOfWeek === 6,
          [styles.sunday]: props.dayOfWeek === 7,
        }}
      >
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
