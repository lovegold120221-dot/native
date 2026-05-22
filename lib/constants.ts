/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Default Live API model to use
 */
export const DEFAULT_LIVE_API_MODEL =
  'gemini-2.5-flash-native-audio-preview-09-2025';

export const DEFAULT_VOICE = 'Zephyr';

export const AVAILABLE_VOICES = ['Zephyr', 'Puck', 'Charon', 'Luna', 'Nova', 'Kore', 'Fenrir',	'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',	'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'];

export const VOICE_ALIASES: Record<string, string> = {
  'Zephyr': 'Superman',
  'Puck': 'Batman',
  'Charon': 'Wonder Woman',
  'Luna': 'Spider-Man',
  'Nova': 'Iron Man',
  'Kore': 'Captain America',
  'Fenrir': 'Thor',
  'Leda': 'Black Widow',
  'Orus': 'Hulk',
  'Aoede': 'Scarlet Witch',
  'Callirrhoe': 'Doctor Strange',
  'Autonoe': 'Black Panther',
  'Enceladus': 'Captain Marvel',
  'Iapetus': 'Ant-Man',
  'Umbriel': 'Wasp',
  'Algieba': 'Hawkeye',
  'Despina': 'Vision',
  'Erinome': 'Falcon',
  'Algenib': 'Winter Soldier',
  'Rasalgethi': 'War Machine',
  'Laomedeia': 'Quicksilver',
  'Achernar': 'Star-Lord',
  'Alnilam': 'Gamora',
  'Schedar': 'Drax',
  'Gacrux': 'Rocket Raccoon',
  'Pulcherrima': 'Groot',
  'Achird': 'Mantis',
  'Zubenelgenubi': 'Nebula',
  'Vindemiatrix': 'Loki',
  'Sadachbia': 'Thanos',
  'Sadaltager': 'Shazam',
  'Sulafat': 'Aquaman'
};
