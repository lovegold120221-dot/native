/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const navigationSystemTools: FunctionCall[] = [
  {
    name: 'find_route',
    description: 'Finds a route to a specified destination.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destination: {
          type: 'STRING',
          description: 'The destination address or landmark.',
        },
        modeOfTransport: {
          type: 'STRING',
          description: 'The mode of transport (e.g., driving, walking, cycling).',
        },
      },
      required: ['destination'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'find_nearby_places',
    description: 'Finds nearby places of a certain type.',
    parameters: {
      type: 'OBJECT',
      properties: {
        placeType: {
          type: 'STRING',
          description: 'The type of place to search for (e.g., restaurant, gas station, park).',
        },
        radius: {
          type: 'NUMBER',
          description: 'The search radius in kilometers.',
        },
      },
      required: ['placeType'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'get_traffic_info',
    description: 'Gets real-time traffic information for a specified location.',
    parameters: {
      type: 'OBJECT',
      properties: {
        location: {
          type: 'STRING',
          description: 'The location to get traffic information for.',
        },
      },
      required: ['location'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'search_web',
    description: 'Searches the web for real-time information, news, or facts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The search query to look up.',
        },
      },
      required: ['query'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'fetch_url',
    description: 'Fetches the content of a specific URL.',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description: 'The URL to fetch content from.',
        },
      },
      required: ['url'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
];
