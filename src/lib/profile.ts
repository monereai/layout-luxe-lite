import { useEffect, useState } from "react";

export const PROFILE_KEY = "monereai-profile";
export type Profile = "young-man" | "young-woman";

export const PROFILE_OPTIONS: Array<{
  id: Profile;
  label: string;
  description: string;
}> = [
  {
    id: "young-man",
    label: "Young Man",
    description: "Guidance shaped around courage, leadership, strength, and responsibility.",
  },
  {
    id: "young-woman",
    label: "Young Woman",
    description: "Guidance shaped around dignity, inner strength, wisdom, and grace.",
  },
];

export const PROFILE_GUIDANCE: Record<Profile, string> = {
  "young-man": "Speak directly to this young man. When relevant, frame growth through courage, servant leadership, steady strength, and responsibility—without stereotypes or pressure to hide emotion.",
  "young-woman": "Speak directly to this young woman. When relevant, frame growth through dignity, inner strength, wisdom, and grace—without stereotypes or pressure to be passive.",
};

const EVENT = "monereai-profile-change";

export function isProfile(value: string | null): value is Profile {
  return value === "young-man" || value === "young-woman";
}

export function setProfile(profile: Profile) {
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.dispatchEvent(new Event(EVENT));
}

export function useProfile() {
  const [profile, updateProfile] = useState<Profile | undefined>();

  useEffect(() => {
    const read = () => {
      const saved = window.localStorage.getItem(PROFILE_KEY);
      updateProfile(isProfile(saved) ? saved : undefined);
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return profile;
}
