"use client";

import React from "react";
import { BestsellerRail } from "./BestsellerRail";
import { CustomRecommendationBlocks } from "./CustomBlocks";

export function HomeRecommendations() {
  return (
    <>
      <BestsellerRail />
      <CustomRecommendationBlocks placement="home" />
    </>
  );
}
