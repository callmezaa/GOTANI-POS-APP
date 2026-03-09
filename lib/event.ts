// lib/event.ts
import mitt from "mitt";

export type AppEvents = {
  "profile-updated": void;
};

const emitter = mitt<AppEvents>();

export default emitter;
