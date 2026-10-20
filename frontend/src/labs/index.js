import osmosis from "./osmosis.js";
import enzyme from "./enzyme.js";
import photosynthesis from "./photosynthesis.js";
import mitosis from "./mitosis.js";

export const labs = [osmosis, enzyme, photosynthesis, mitosis];

export function getLab(kind) {
  return labs.find((lab) => lab.kind === kind) || null;
}

export const topics = [...new Set(labs.map((lab) => lab.topic))];
