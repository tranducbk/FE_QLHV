import { createContext, useContext } from "react";

export const MetadataContext = createContext();

export function useMetadata() {
  return useContext(MetadataContext);
}

export const metadata = {
  title: "Hệ học viên 5",
  description: "Hệ học viên 5",
};
