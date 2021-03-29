export type Mode = "instance" | "deploy" | "fixtures" | "validate";

export { fromDirectory as getInstance, Instance } from "./instance";
export { fromDirectory as getKivik, Kivik } from "./kivik";
