// Every text/background pair used by components/ui (docs/DESIGN.md § 2): ≥ 4.5:1 for text,
// ≥ 3:1 for large text (> 24 px), series marks and the focus ring.
import { describe, expect, it } from "vitest";
import { blend, contrastRatio } from "@/lib/contrast";

const T = {
  ground: "#EEF2EF", surface: "#FFFFFF", ink: "#0F2724", ink2: "#3E5550", ink3: "#55696A", track: "#DDE7E2",
  animal: "#D9662B", plant: "#0E8A74", plantOnDark: "#3FC1A3", action: "#0B6E5D", actionHover: "#08513F",
  winPlant: "#E1F0EA", winAnimal: "#FBEDE4", animalNote: "#8A4A1E", onDark1: "#DCEBE5", onDark2: "#C8DCD5", onDark3: "#B9D9CF", white: "#FFFFFF",
};
const darkChip = blend(T.white, 0.08, T.ink);

const TEXT: [string, string, string][] = [
  ["ink on ground", T.ink, T.ground], ["ink on surface", T.ink, T.surface], ["ink-2 on ground", T.ink2, T.ground],
  ["ink-2 on surface", T.ink2, T.surface], ["ink-3 on ground", T.ink3, T.ground], ["ink-3 on surface", T.ink3, T.surface],
  ["ink on track", T.ink, T.track], ["ink-2 on track", T.ink2, T.track], ["ink-3 on track", T.ink3, T.track],
  ["white on action", T.white, T.action], ["white on action hover", T.white, T.actionHover],
  ["action link on surface", T.action, T.surface], ["action link on ground", T.action, T.ground],
  ["action on win-plant", T.action, T.winPlant], ["ink on win-plant", T.ink, T.winPlant], ["ink-2 on win-plant", T.ink2, T.winPlant],
  ["ink on win-animal", T.ink, T.winAnimal], ["ink-2 on win-animal", T.ink2, T.winAnimal], ["animal-note on win-animal", T.animalNote, T.winAnimal],
  ["white on ink", T.white, T.ink], ["on-dark-1 on ink", T.onDark1, T.ink], ["on-dark-2 on ink", T.onDark2, T.ink], ["on-dark-3 on ink", T.onDark3, T.ink],
  ["ink on plant-on-dark (button)", T.ink, T.plantOnDark], ["white on dark chip", T.white, darkChip], ["on-dark-3 on dark chip", T.onDark3, darkChip],
  ["ink on white chip", T.ink, T.white],
];

const NON_TEXT: [string, string, string][] = [
  ["animal mark on surface", T.animal, T.surface], ["plant mark on surface", T.plant, T.surface],
  ["animal mark on ground", T.animal, T.ground], ["plant mark on ground", T.plant, T.ground],
  ["plant-on-dark mark on ink", T.plantOnDark, T.ink], ["animal mark on ink", T.animal, T.ink],
  ["focus ring on surface", T.action, T.surface], ["focus ring on ground", T.action, T.ground], ["focus ring on ink", T.plantOnDark, T.ink],
];

describe("contrast", () => {
  it.each(TEXT)("%s ≥ 4.5:1", (_, fg, bg) => expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5));
  it.each(NON_TEXT)("%s ≥ 3:1", (_, fg, bg) => expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3));
  it("matches a known ratio (black on white = 21)", () => expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21));
});
