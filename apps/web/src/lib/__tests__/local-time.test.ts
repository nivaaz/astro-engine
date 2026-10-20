import { describe, expect, it } from "vitest";
import { localCivilToUtc, resolveLocalCivilTime } from "../local-time";

describe("local civil time resolution", () => {
  it.each([
    ["1996-01-01", "12:00", "Australia/Sydney", "1996-01-01T01:00:00.000Z"],
    ["2026-01-01", "12:00", "Asia/Kathmandu", "2026-01-01T06:15:00.000Z"],
    ["2024-02-29", "00:00", "UTC", "2024-02-29T00:00:00.000Z"],
  ])("resolves %s %s in %s", (date, time, zone, instant) => {
    expect(resolveLocalCivilTime(date, time, zone)).toEqual({
      kind: "resolved",
      instant,
    });
    expect(localCivilToUtc(date, time, zone)).toBe(instant);
  });

  it.each([
    ["2026-10-04", "02:30", "Australia/Sydney"],
    ["2026-03-08", "02:30", "America/New_York"],
    ["2026-10-04", "02:15", "Australia/Lord_Howe"],
    ["2011-12-30", "12:00", "Pacific/Apia"],
  ])("rejects skipped %s %s in %s", (date, time, zone) => {
    expect(resolveLocalCivilTime(date, time, zone)).toEqual({
      kind: "nonexistent",
    });
    expect(localCivilToUtc(date, time, zone)).toBeNull();
  });

  it.each([
    [
      "2026-04-05",
      "02:30",
      "Australia/Sydney",
      "2026-04-04T15:30:00.000Z",
      "2026-04-04T16:30:00.000Z",
    ],
    [
      "2026-11-01",
      "01:30",
      "America/New_York",
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T06:30:00.000Z",
    ],
    [
      "2026-04-05",
      "01:45",
      "Australia/Lord_Howe",
      "2026-04-04T14:45:00.000Z",
      "2026-04-04T15:15:00.000Z",
    ],
  ])(
    "requires a choice for repeated %s %s in %s",
    (date, time, zone, earlier, later) => {
      expect(resolveLocalCivilTime(date, time, zone)).toEqual({
        kind: "ambiguous",
        earlier,
        later,
      });
      expect(localCivilToUtc(date, time, zone)).toBeNull();
      expect(localCivilToUtc(date, time, zone, "earlier")).toBe(earlier);
      expect(localCivilToUtc(date, time, zone, "later")).toBe(later);
    },
  );

  it.each([
    ["2026-02-30", "12:00", "UTC"],
    ["2026-02-29", "12:00", "UTC"],
    ["2026-01-01", "24:00", "UTC"],
    ["2026-01-01", "12:60", "UTC"],
    ["2026-1-1", "12:00", "UTC"],
    ["2026-01-01", "12:00", "Invalid/Zone"],
    ["", "", "UTC"],
  ])("rejects invalid input %s %s %s", (date, time, zone) => {
    expect(resolveLocalCivilTime(date, time, zone)).toEqual({
      kind: "invalid",
    });
  });
});
