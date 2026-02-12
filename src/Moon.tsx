import { geoCircle, geoOrthographic, geoPath } from "d3";
import { Component, splitProps } from "solid-js";

const Moon: Component<{
  eclipticLongitude: number;
  tilt: number;
  isQuarter: boolean;
}> = (props) => {
  const [{ eclipticLongitude, tilt, isQuarter }, _] = splitProps(props, [
    "eclipticLongitude",
    "tilt",
    "isQuarter",
  ]);
  const correction = eclipticLongitude < 180 ? 90 : -90;
  const projection = geoOrthographic()
    .translate([20, 20])
    .scale(isQuarter ? 18 : 19)
    .rotate([180 - eclipticLongitude, 0, tilt + correction]);
  const hemisphere = geoCircle()();
  const path = geoPath(projection);
  return (
    <svg width="40" height="40">
      <circle cx="20" cy="20" r="20" fill={isQuarter ? "#5291cb" : "#000"} />
      <path fill="#fff" d={path(hemisphere)!} />
    </svg>
  );
};

export default Moon;
