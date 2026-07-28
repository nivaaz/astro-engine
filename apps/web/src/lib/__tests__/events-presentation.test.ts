import { describe, expect, it } from "vitest";
import { MajorEventSchema, type MajorEvent } from "@sukara/astro-schema";
import {
  filterRelevantEvents,
  groupEventsByLocalDate,
} from "../events-presentation";

const event = (
  id: string,
  exactAt: string,
  extra: Record<string, unknown>,
): MajorEvent =>
  MajorEventSchema.parse({
    id: `evt_v1_${id.repeat(64)}`,
    exactAt,
    significance: "major",
    ...extra,
  });

describe("event presentation projection", () => {
  it("removes Moon aspects and quarter lunations while retaining new/full lunations", () => {
    const events = [
      event("a", "2026-01-01T00:00:00.000Z", {
        kind: "aspect",
        bodyA: "moon",
        bodyB: "saturn",
        aspect: "square",
        exactLongitude: 0,
      }),
      event("b", "2026-01-01T01:00:00.000Z", {
        kind: "lunation",
        phase: "first-quarter",
        longitude: 90,
      }),
      event("c", "2026-01-01T02:00:00.000Z", {
        kind: "lunation",
        phase: "new",
        longitude: 0,
      }),
      event("d", "2026-01-01T03:00:00.000Z", {
        kind: "lunation",
        phase: "full",
        longitude: 180,
      }),
    ];
    expect(filterRelevantEvents(events).map(({ id }) => id)).toEqual([
      `evt_v1_${"c".repeat(64)}`,
      `evt_v1_${"d".repeat(64)}`,
    ]);
  });

  it("groups by browser/local timezone and emits each date once", () => {
    const events = [
      event("a", "2026-01-01T23:30:00.000Z", {
        kind: "ingress",
        body: "venus",
        sign: "aquarius",
      }),
      event("b", "2026-01-02T00:15:00.000Z", {
        kind: "station",
        body: "jupiter",
        direction: "direct",
        longitude: 111,
      }),
      event("c", "2026-01-03T00:15:00.000Z", {
        kind: "ingress",
        body: "mars",
        sign: "leo",
      }),
    ];
    expect(groupEventsByLocalDate(events, "Australia/Sydney")).toMatchObject([
      {
        localDate: "2026-01-02",
        events: [
          { id: `evt_v1_${"a".repeat(64)}` },
          { id: `evt_v1_${"b".repeat(64)}` },
        ],
      },
      { localDate: "2026-01-03", events: [{ id: `evt_v1_${"c".repeat(64)}` }] },
    ]);
  });
});
