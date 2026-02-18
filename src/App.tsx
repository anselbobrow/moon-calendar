import { createMemo, createSignal, onMount, type Component } from "solid-js";

import Calendar, { CalendarProps } from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";

const App: Component = () => {
  const [state, setState] = createStore<CalendarProps["state"]>({
    locale: "en-US",
    zdt: Temporal.Now.zonedDateTimeISO(),
    position: [0, 0, 0],
  });

  const [numMonths, setNumMonths] = createSignal(1);
  const months = createMemo(() =>
    Array.from({ length: numMonths() }, (_, idx) => {
      const newZdt = state.zdt.add({ months: idx });
      const cal = <Calendar state={{ ...state, zdt: newZdt }} />;
      if (newZdt.month === 1 || idx === 0) {
        return (
          <>
            <div class={styles["year-header"]}>
              <h2>
                {newZdt.toLocaleString(state.locale, {
                  calendar: newZdt.calendarId,
                  year: "numeric",
                })}
              </h2>
            </div>
            {cal}
          </>
        );
      } else {
        return cal;
      }
    }),
  );

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
      <div class={styles.inputs}>
        <div>
          <label for="year">Year</label>
          <input
            id="year"
            type="number"
            value={state.zdt.year}
            min={1900}
            max={2100}
            required
            onInput={(e) =>
              e.currentTarget.checkValidity() &&
              setYear(e.currentTarget.valueAsNumber)
            }
          />
        </div>
        <div>
          <label for="month">Month</label>
          <input
            id="month"
            type="number"
            value={state.zdt.month}
            min={1}
            max={12}
            required
            onInput={(e) =>
              e.currentTarget.checkValidity() &&
              setMonth(e.currentTarget.valueAsNumber)
            }
          />
        </div>
        <div>
          <label for="numMonths"># months</label>
          <input
            id="numMonths"
            type="number"
            value={numMonths()}
            min={1}
            max={12}
            required
            onInput={(e) =>
              e.currentTarget.checkValidity() &&
              setNumMonths(e.currentTarget.valueAsNumber)
            }
          />
        </div>
      </div>
      <hr />
      {months()}
    </main>
  );
};

export default App;
