import "server-only";

import { groq } from "next-sanity";

import { client } from "./client";
import {
  DEFAULT_CONFIGURATOR_SERVICES,
  type ConfiguratorService,
} from "@/lib/configurator/services";

const configuratorServicesQuery = groq`
  *[_type == "configuratorServices"][0].services[]{
    icon,
    title,
    description
  }
`;

/**
 * The services strip copy, or the built-in defaults when an editor has not
 * written the document yet — the strip is part of the page layout, so an empty
 * document must not leave a gap.
 */
export async function getConfiguratorServices(): Promise<ConfiguratorService[]> {
  const services = await client.fetch<ConfiguratorService[] | null>(
    configuratorServicesQuery,
    {},
    { next: { revalidate: 60 } },
  );

  return services?.length ? services : DEFAULT_CONFIGURATOR_SERVICES;
}
