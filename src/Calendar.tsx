import {
  Component,
  createMemo,
  createResource,
  Index,
  Match,
  Show,
  Switch,
} from "solid-js";
import styles from "./Calendar.module.css";
import { Temporal } from "@js-temporal/polyfill";
import Day from "./Day";
import PhaseData from "./data/phaseDataDao";
import { Position } from "./types/common";

interface CalendarProps {
  state: {
    zdt: Temporal.ZonedDateTime;
    position: Position;
    locale: string;
  };
  setYear: (n: number) => void;
  setMonth: (n: number) => void;
}

const Calendar: Component<CalendarProps> = (props) => {
  const fetcher = new PhaseData().getData;
  const resourceProps = () => ({
    zdt: props.state.zdt,
    position: props.state.position,
  });
  const [moonData] = createResource(resourceProps, fetcher);

  const year = createMemo(() =>
    props.state.zdt.toLocaleString(props.state.locale, {
      calendar: props.state.zdt.calendarId,
      year: "numeric",
    }),
  );
  const month = createMemo(() =>
    props.state.zdt
      .toLocaleString(props.state.locale, {
        calendar: props.state.zdt.calendarId,
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
          value={props.state.zdt.year}
          min={1900}
          max={2100}
          required
          onInput={(e) =>
            e.currentTarget.checkValidity() &&
            props.setYear(e.currentTarget.valueAsNumber)
          }
        />
        <h2>{year()}</h2>
      </div>
      <div class={styles["month-header"]}>
        <input
          type="number"
          value={props.state.zdt.month}
          min={1}
          max={12}
          required
          onInput={(e) =>
            e.currentTarget.checkValidity() &&
            props.setMonth(e.currentTarget.valueAsNumber)
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
                      {(props) => (
                        <Day
                          {...props()}
                          phase={phase().phase}
                          afterFirstNewOfMonth={phase().afterFirstNewOfMonth}
                        />
                      )}
                    </Index>
                  </div>
                  <Show when={phase().days.length > 2}>
                    <span
                      classList={{
                        [styles["after-first-new"]]:
                          phase().afterFirstNewOfMonth,
                      }}
                    >
                      {phaseName(phase().phase)}
                    </span>
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
export { type CalendarProps };
