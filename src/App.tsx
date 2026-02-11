import { createMemo, createSignal, type Component } from "solid-js";

import Calendar from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";

const App: Component = () => {
  const [locale, setLocale] = createSignal("en-US");
  const [month, setMonth] = createSignal(2);
  const [year, setYear] = createSignal(2026);
  const instant = createMemo(() => {
    return Temporal.ZonedDateTime.from({
      day: 1,
      month: month(),
      year: year(),
      timeZone: "UTC",
    }).toInstant();
  });
  return (
    <main>
      <Calendar
        instant={instant}
        locale={locale}
        setMonth={setMonth}
        setYear={setYear}
      />
    </main>
  );
};

export default App;
