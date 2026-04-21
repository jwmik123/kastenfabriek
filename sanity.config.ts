'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {nlNLLocale} from '@sanity/locale-nl-nl'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  i18n: {
    bundles: [nlNLLocale],
  },
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
