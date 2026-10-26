import { describe, expect, it } from "vitest";

import { describeRemindersCron } from "./notificationConfig";

describe("describeRemindersCron", () => {
  it("given a daily cron, when describing, then returns the time of day", () => {
    expect(describeRemindersCron("0 0 9 * * *")).toBe("todos los días a las 09:00");
    expect(describeRemindersCron("0 30 18 * * *")).toBe("todos los días a las 18:30");
  });

  it("given a custom cron, when describing, then returns it verbatim", () => {
    expect(describeRemindersCron("0 0 9 * * MON-FRI")).toBe('según la programación "0 0 9 * * MON-FRI"');
  });
});
