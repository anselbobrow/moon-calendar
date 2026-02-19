import {
  batch,
  createEffect,
  createSignal,
  For,
  on,
  onMount,
  Show,
  type Component,
} from "solid-js";

import Calendar, { CalendarProps } from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";

const App: Component = () => {
  const [state, setState] = createStore<CalendarProps>({
    locale: "en-US",
    zdt: Temporal.Now.zonedDateTimeISO(),
    position: [0, 0, 0],
  });

  const setMonth = (month: number) => setState("zdt", (i) => i.with({ month }));
  const setYear = (year: number) => setState("zdt", (i) => i.with({ year }));

  // logic to track state for displayed calendar months
  const [numMonths, setNumMonths] = createSignal(1);
  const [monthStates, setMonthStates] = createSignal([{ ...state }]);
  const handleNumMonths = (n: number) => {
    if (n < monthStates().length) {
      setMonthStates((prev) => prev.slice(0, n));
    }
    fillMonths(n);
    setNumMonths(n);
  };
  const fillMonths = (n: number) => {
    batch(() => {
      while (n > monthStates().length) {
        setMonthStates((prev) => [
          ...prev,
          {
            ...prev[prev.length - 1],
            zdt: prev[prev.length - 1].zdt.add({ months: 1 }),
          },
        ]);
      }
    });
  };
  createEffect(
    on([() => state.zdt, () => state.position], () => {
      setMonthStates([{ ...state }]);
      fillMonths(numMonths());
    }),
  );

  // location getting logic
  const getPositionFromIP = () => {
    console.error("getPositionFromIP not implemented");
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
        console.log(
          `Couldn't get location with geolocation API, trying with IP:\n${e.message}`,
        );
        getPositionFromIP();
      },
    );
  });

  return (
    <>
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
              handleNumMonths(e.currentTarget.valueAsNumber)
            }
          />
        </div>
      </div>
      <hr />
      <For each={monthStates()}>
        {(state, idx) => (
          <>
            <Show when={idx() === 0 || state.zdt.month === 1}>
              <h2 class={styles["year-header"]}>
                {state.zdt.toLocaleString(state.locale, {
                  year: "numeric",
                })}
              </h2>
            </Show>
            <Calendar {...state} />
          </>
        )}
      </For>
    </>
  );
};

export default App;
