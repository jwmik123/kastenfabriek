import "server-only";

import { groq } from "next-sanity";

import { client } from "./client";
import {
  toAvailabilityConfig,
  type ShowroomAvailabilityConfig,
  type ShowroomDocument,
} from "@/lib/showroom/availability";

export interface ShowroomSettings extends ShowroomAvailabilityConfig {
  introText?: string;
  confirmationText?: string;
}

const query = groq`
  *[_type == "showroomAvailability"][0]{
    enabled,
    bookableFrom,
    slotMinutes,
    capacityPerSlot,
    minLeadHours,
    maxWeeksAhead,
    saturdayRanges[]{ start, end },
    weeklySchedule[]{ weekday, ranges[]{ start, end } },
    exceptions[]{ date, closed, ranges[]{ start, end } },
    introText,
    confirmationText
  }
`;

/** The schedule as published, or null when the owner has not created it yet. */
export async function getShowroomSettings(): Promise<ShowroomSettings | null> {
  const doc = await client.fetch<(ShowroomDocument & ShowroomSettings) | null>(query, {}, {
    next: { revalidate: 60 },
  });
  const config = toAvailabilityConfig(doc);
  return config && doc ? { ...config, introText: doc.introText, confirmationText: doc.confirmationText } : null;
}
