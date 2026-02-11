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
import Day from "./Day";
import PhaseData from "./data/phaseDataDao";

interface CalendarProps {
  instant: Accessor<Temporal.Instant>;
  locale: Accessor<string>;
}

const Calendar: Component<CalendarProps> = (props) => {
  const [{ instant, locale }, _] = splitProps(props, ["instant", "locale"]);
  const fetcher = new PhaseData().getData;
  const [moonData] = createResource(instant(), fetcher);
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
        return "WANING CRESCENT";
      case 3:
        return "WANING GIBBOUS";
      default:
        return "";
    }
  };
  return (
    <div class={styles.cal}>
      <h2>{year()}</h2>
      <div>
        <h2>{month()}</h2>
      </div>
      <div class={styles.month}>
        <Switch>
          <Match when={moonData.state === "errored"}>
            <p>{JSON.stringify(moonData.error)}</p>
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
                      {(props, idx) => (
                        <Day
                          {...props()}
                          isQuarter={idx === 0}
                          isHalf={idx === 0 && phase().phase % 2 === 0}
                          phase={phase().phase}
                        />
                      )}
                    </Index>
                  </div>
                  <span>{phaseName(phase().phase)}</span>
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
