// utils/profileEvents.ts
import mitt from "mitt";

type Events = {
  "profile-updated": void;
};

const emitter = mitt<Events>();

export const profileEvents = emitter;
