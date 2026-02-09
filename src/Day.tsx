import { Accessor, splitProps, type Component } from "solid-js";

import styles from "./Day.module.css";

const Day: Component<{ phase: Accessor<number>; day: number }> = (props) => {
  const [{ phase, day }, _] = splitProps(props, ["phase", "day"]);
  return (
    <div class={styles.day}>
      <span>M</span>
      <span>{day}</span>
      <div class={styles["day-lower"]}>
        <span>0</span>
        <div class={styles.moon} />
        <span class={styles.percent}>{phase()}%</span>
      </div>
    </div>
  );
};

export default Day;
