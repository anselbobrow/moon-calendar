import {
  Accessor,
  Component,
  createMemo,
  createResource,
  Index,
  Match,
  Setter,
  Show,
  splitProps,
  Switch,
} from "solid-js";
import styles from "./Calendar.module.css";
import { Temporal } from "@js-temporal/polyfill";
import Day from "./Day";
import PhaseData from "./data/phaseDataDao";

interface CalendarProps {
  instant: Accessor<Temporal.Instant>;
  locale: Accessor<string>;
  setMonth: Setter<number>;
  setYear: Setter<number>;
}

const Calendar: Component<CalendarProps> = (props) => {
  const [{ instant, locale, setMonth, setYear }, _] = splitProps(props, [
    "instant",
    "locale",
    "setMonth",
    "setYear",
  ]);
  const fetcher = new PhaseData().getData;
  const [moonData] = createResource(instant, fetcher);
  const date = createMemo(() => instant().toZonedDateTimeISO("UTC"));
  const year = createMemo(() =>
    date().toLocaleString(locale(), {
      calendar: date().calendarId,
      year: "numeric",
    }),
  );
  const month = createMemo(() =>
    date()
      .toLocaleString(locale(), {
        calendar: date().calendarId,
        month: "long",
      })
      .toUpperCase(),
  );
  const phaseName = (phase: number): string => {
    switch (phase) {
      case 0:
        return "WAXING CRESCENT";
      case 1:
        return "WAXING GIBBOUS";
      case 2:
        return "WANING GIBBOUS";
      case 3:
        return "WANING CRESCENT";
      default:
        return "";
    }
  };
  return (
    <div class={styles.cal}>
      <div class={styles["year-header"]}>
        <input
          type="number"
          value={date().year}
          min={1900}
          max={2100}
          required
          onInput={(e) =>
            e.currentTarget.checkValidity() &&
            setYear(e.currentTarget.valueAsNumber)
          }
        />
        <h2>{year()}</h2>
      </div>
      <div class={styles["month-header"]}>
        <input
          type="number"
          value={date().month}
          min={1}
          max={12}
          required
          onInput={(e) =>
            e.currentTarget.checkValidity() &&
            setMonth(e.currentTarget.valueAsNumber)
          }
        />
        <h2>{month()}</h2>
      </div>
      <div class={styles.month}>
        <Switch>
          <Match when={moonData.state === "errored"}>
            <p>{moonData.error.message}</p>
          </Match>
          <Match when={moonData.state === "pending"}>
            <p>Loading...</p>
          </Match>
          <Match when={moonData.state === "ready"}>
            <Index each={moonData()?.phases}>
              {(phase) => (
                <div class={styles.phase}>
                  <div>
                    <Index each={phase().days}>
                      {(props) => <Day {...props()} phase={phase().phase} />}
                    </Index>
                  </div>
                  <Show when={phase().days.length > 2}>
                    <span>{phaseName(phase().phase)}</span>
                  </Show>
                </div>
              )}
            </Index>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default Calendar;
