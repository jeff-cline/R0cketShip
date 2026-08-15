import { describe, it, expect } from "vitest";
import {
  createOpportunity,
  listOpportunities,
  updateOpportunity,
  reorderOpportunities,
  addNote,
  getNotesFor,
  colorForEmail,
} from "@/src/opportunities/store";

const JEFF = "jeff.cline@me.com";
const KRYSTALORE = "krystalore@thecrewscoach.com";

describe("opportunities store", () => {
  it("attributes color by partner (orange=Jeff, teal=Krystalore)", () => {
    expect(colorForEmail(JEFF)).toBe("orange");
    expect(colorForEmail(KRYSTALORE)).toBe("teal");
    expect(colorForEmail("someone@else.com")).toBe("teal");
  });

  it("creates opportunities at the top and lists top-to-bottom", async () => {
    const a = await createOpportunity(JEFF, { title: "Alpha", monthlyValue: "1500" });
    const b = await createOpportunity(KRYSTALORE, { title: "Beta", monthlyValue: "3000" });
    const list = await listOpportunities();
    expect(list.map((o) => o.title)).toEqual(["Beta", "Alpha"]); // newest on top
    expect(list[0].createdByEmail).toBe(KRYSTALORE);
    expect(Number(b.monthlyValue)).toBe(3000);
    void a;
  });

  it("persists a new drag/drop order", async () => {
    const a = await createOpportunity(JEFF, { title: "A" });
    const b = await createOpportunity(JEFF, { title: "B" });
    const c = await createOpportunity(JEFF, { title: "C" });
    await reorderOpportunities(JEFF, [a.id, c.id, b.id]);
    const list = await listOpportunities();
    expect(list.map((o) => o.title)).toEqual(["A", "C", "B"]);
  });

  it("clamps stage to 0..5 and updates fields", async () => {
    const o = await createOpportunity(JEFF, { title: "Stage test" });
    await updateOpportunity(JEFF, o.id, { stage: 9, businessName: "Acme", monthlyValue: "$7,500" });
    const [row] = await listOpportunities();
    expect(row.stage).toBe(5);
    expect(row.businessName).toBe("Acme");
    expect(Number(row.monthlyValue)).toBe(7500);
  });

  it("stores color-attributed timestamped notes", async () => {
    const o = await createOpportunity(JEFF, { title: "Notes test" });
    await addNote(JEFF, null, o.id, "Jeff called them");
    await addNote(KRYSTALORE, null, o.id, "Krystalore followed up");
    const notes = await getNotesFor(o.id);
    expect(notes.map((n) => n.authorColor)).toEqual(["orange", "teal"]);
    expect(notes[0].body).toBe("Jeff called them");
  });
});
