import { splitProps, type Component } from "solid-js";

import styles from "./Day.module.css";
import { DayProps, Phase } from "./data/phaseDataDao";

const Day: Component<DayProps & { phase: Phase }> = (props) => {
  const [
    {
      weekDay,
      dayOfMonth,
      dayOfCycle,
      percentFullness,
      phase,
      isQuarter,
      isHalf,
    },
    _,
  ] = splitProps(props, [
    "weekDay",
    "phase",
    "percentFullness",
    "dayOfCycle",
    "dayOfMonth",
    "isQuarter",
    "isHalf",
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
  return (
    <div class={styles.day}>
      <span>{weekDay !== "S" && weekDay}</span>
      <span>{dayOfMonth}</span>
      <div class={styles["day-lower"]}>
        <span>{dayOfCycle}</span>
        <div class={styles.moon} />
        <span
          classList={{
            [styles.isQuarter]: isQuarter,
            [styles.isHalf]: isHalf,
          }}
        >
          {isQuarter ? quarterName(phase) : `${Math.round(percentFullness)}%`}
        </span>
      </div>
    </div>
  );
};

export default Day;
