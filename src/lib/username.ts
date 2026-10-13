import { useEffect, useState } from "react";

export const USERNAME_KEY = "userName";
const EVT = "monereai-username";

export function cleanName(n: string) {
  return n.replace(/[^\p{L}\p{N} '\-]/gu, "").trim().slice(0, 30);
}

export function setUserName(n: string) {
  const v = cleanName(n);
  if (v) window.localStorage.setItem(USERNAME_KEY, v);
  else window.localStorage.removeItem(USERNAME_KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useUserName() {
  const [name, setName] = useState("");
  useEffect(() => {
    const read = () => setName(window.localStorage.getItem(USERNAME_KEY) ?? "");
    read();
    window.addEventListener(EVT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(EVT, read); window.removeEventListener("storage", read); };
  }, []);
  return name;
}
