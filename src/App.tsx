import { onMount, type Component } from "solid-js";

import Calendar, { CalendarProps } from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";
import { createStore } from "solid-js/store";

const App: Component = () => {
  const [state, setState] = createStore<CalendarProps["state"]>({
    locale: "en-US",
    zdt: Temporal.Now.zonedDateTimeISO(),
    position: [0, 0, 0],
  });

  const setMonth = (month: number) => setState("zdt", (i) => i.with({ month }));
  const setYear = (year: number) => setState("zdt", (i) => i.with({ year }));

  const getPositionFromIP = () => {
    setState("position", (p) => p);
  };

  onMount(() => {
    if (!("geolocation" in navigator)) {
      getPositionFromIP();
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState("position", (p) => [
          position.coords.latitude,
          position.coords.longitude,
          p[2],
        ]);
      },
      (e: GeolocationPositionError) => {
        console.error(
          `Couldn't get location with geolocation API, trying with IP:\n${e.message}`,
        );
        getPositionFromIP();
      },
    );
  });

  return (
    <main>
      <Calendar state={state} setMonth={setMonth} setYear={setYear} />
    </main>
  );
};

export default App;
