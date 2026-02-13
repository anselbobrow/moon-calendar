import { geoCircle, geoOrthographic, geoPath } from "d3";
import { Component } from "solid-js";

const Moon: Component<{
  eclipticLongitude: number;
  tilt: number;
  isQuarter: boolean;
}> = (props) => {
  const correction = () => (props.eclipticLongitude < 180 ? 90 : -90);
  const projection = () =>
    geoOrthographic()
      .translate([20, 20])
      .scale(props.isQuarter ? 18 : 19)
      .rotate([180 - props.eclipticLongitude, 0, props.tilt + correction()]);
  const path = () => geoPath(projection());
  const hemisphere = geoCircle()();
  return (
    <svg width="40" height="40">
      <circle
        cx="20"
        cy="20"
        r="20"
        fill={props.isQuarter ? "#5291cb" : "#000"}
      />
      <path fill="#fff" d={path()(hemisphere)!} />
    </svg>
  );
};

export default Moon;
