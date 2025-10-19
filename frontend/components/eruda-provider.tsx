"use client";

import eruda from "eruda";
import { ReactNode, useEffect } from "react";

export const Eruda = (props: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APP_ENV === "devv") {
      try {
        eruda.init();
      } catch (error) {
        console.log("Eruda failed to initialize", error);
      }
    }
  }, []);

  return <>{props.children}</>;
};
