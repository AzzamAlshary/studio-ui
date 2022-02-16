/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { useSelection } from './useSelection';
import { useActiveSiteId } from './useActiveSiteId';

export function useLegacyPreviewPreference() {
  const site = useActiveSiteId();
  return useSelection((state) =>
    // If preference isn't loaded yet it'll still default to false. This isn't time sensitive.
    Boolean(state.uiConfig.useLegacyPreviewLookup[site])
  );
}
