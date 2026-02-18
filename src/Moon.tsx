import { geoCircle, geoOrthographic, geoPath } from "d3";
import { Component } from "solid-js";
import styles from "./Moon.module.css";

const Moon: Component<{
  eclipticLongitude: number;
  tilt: number;
  isQuarter: boolean;
}> = (props) => {
  const hemisphere = geoCircle()();
  const correction = () => (props.eclipticLongitude < 180 ? 90 : -90);
  const projection = () =>
    geoOrthographic()
      .translate([21, 21])
      .scale(props.isQuarter ? 18 : 19)
      .rotate([180 - props.eclipticLongitude, 0, props.tilt + correction()]);
  const path = () => geoPath(projection());
  return (
    <svg class={styles.moon} viewBox="0 0 42 42">
      <circle
        cx={21}
        cy={21}
        r={20}
        classList={{ [styles["is-quarter"]]: props.isQuarter }}
      />
      <path d={path()(hemisphere)!} />
    </svg>
  );
};

export default Moon;
