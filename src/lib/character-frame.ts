import { createContext, useContext } from "react";

export const CharacterFrameContext = createContext(0);
export function useCharacterFrame() {
  return useContext(CharacterFrameContext);
}