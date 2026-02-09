import {
  Accessor,
  Component,
  createMemo,
  createResource,
  Index,
  Match,
  splitProps,
  Switch,
} from "solid-js";
import styles from "./Calendar.module.css";
import { Temporal } from "@js-temporal/polyfill";
import { getData } from "./data/phaseData";
import Day from "./Day";

interface CalendarProps {
  instant: Accessor<Temporal.Instant>;
  locale: Accessor<string>;
}

const Calendar: Component<CalendarProps> = (props) => {
  const [{ instant, locale }, _] = splitProps(props, ["instant", "locale"]);
  const [moonData] = createResource({ instant: instant() }, getData);
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
  return (
    <div class={styles.cal}>
      <h2>{year()}</h2>
      <div class={styles.month}>
        <h2>{month()}</h2>
      </div>
      <div class={styles.days}>
        <Switch>
          <Match when={moonData.state === "pending"}>
            <p>Loading...</p>
          </Match>
          <Match when={moonData.state === "errored"}>
            <p>{moonData.error}</p>
          </Match>
          <Match when={moonData.state === "ready"}>
            <Index each={moonData()}>
              {(val, idx) => <Day phase={val} day={idx + 1} />}
            </Index>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default Calendar;
