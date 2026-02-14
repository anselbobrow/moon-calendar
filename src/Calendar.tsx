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
import { PHASE_NAMES, Position } from "./types/common";

interface CalendarProps {
  state: {
    zdt: Temporal.ZonedDateTime;
    position: Position;
    locale: string;
  };
}

const Calendar: Component<CalendarProps> = (props) => {
  const fetcher = new PhaseData().getData;
  const resourceProps = createMemo(() => ({
    zdt: props.state.zdt,
    position: props.state.position,
  }));
  const [moonData] = createResource(resourceProps, fetcher);

  const month = createMemo(() =>
    props.state.zdt
      .toLocaleString(props.state.locale, {
        calendar: props.state.zdt.calendarId,
        month: "long",
      })
      .toUpperCase(),
  );

  return (
    <div class={styles.cal}>
      <h2>{month()}</h2>
      <div>
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
                      {(dayProps) => (
                        <Day
                          {...dayProps()}
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
                      {PHASE_NAMES[phase().phase]}
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
