export type Mode = "instance" | "deploy" | "fixtures" | "validate";

export { fromDirectory as getInstance } from "./instance";
export { fromDirectory as getKivik } from "./kivik";
