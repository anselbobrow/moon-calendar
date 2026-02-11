import { createMemo, createSignal, type Component } from "solid-js";

import Calendar from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";

const App: Component = () => {
  const [locale, setLocale] = createSignal("en-US");
  const [month, setMonth] = createSignal(2);
  const instant = createMemo(() => {
    return Temporal.ZonedDateTime.from({
      day: 1,
      month: month(),
      year: 2026,
      timeZone: "UTC",
    }).toInstant();
  });
  return (
    <main>
      <input
        type="number"
        value={month()}
        min={1}
        max={12}
        onInput={(e) => setMonth(e.currentTarget.valueAsNumber)}
      />
      <Calendar instant={instant} locale={locale} />
    </main>
  );
};

export default App;
