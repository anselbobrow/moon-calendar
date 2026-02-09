import { createSignal, type Component } from "solid-js";

import Calendar from "./Calendar";
import { Temporal } from "@js-temporal/polyfill";

const App: Component = () => {
  const [instant, setInstant] = createSignal(Temporal.Now.instant());
  const [locale, setLocale] = createSignal("en-US");
  return (
    <main>
      <Calendar instant={instant} locale={locale} />
    </main>
  );
};

export default App;
