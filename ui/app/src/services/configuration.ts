/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import { errorSelectorApi1, get, postJSON } from '../utils/ajax';
import { catchError, map, pluck } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { deserialize, fromString } from '../utils/xml';
import { ContentTypeField } from '../models/ContentType';
import { applyDeserializedXMLTransforms, deepCopy, reversePluckProps, toQueryString } from '../utils/object';
import ContentInstance from '../models/ContentInstance';
import { VersionsResponse } from '../models/Version';
import uiConfigDefaults from '../assets/uiConfigDefaults';
import LookupTable from '../models/LookupTable';
import GlobalState from '../models/GlobalState';

type CrafterCMSModules = 'studio' | 'engine';

export function fetchConfigurationXML(site: string, configPath: string, module: CrafterCMSModules): Observable<string> {
  return get(`/studio/api/2/configuration/get_configuration?siteId=${site}&module=${module}&path=${configPath}`).pipe(
    pluck('response', 'content')
  );
}

export function fetchConfigurationDOM(
  site: string,
  configPath: string,
  module: CrafterCMSModules
): Observable<XMLDocument> {
  return fetchConfigurationXML(site, configPath, module).pipe(map(fromString));
}

export function writeConfiguration(
  site: string,
  path: string,
  module: CrafterCMSModules,
  content: string
): Observable<any> {
  return postJSON('/studio/api/2/configuration/write_configuration', {
    siteId: site,
    module,
    path,
    content
  });
}

// region AudiencesPanelConfig

interface ActiveTargetingModel {
  id: string;

  [prop: string]: string;
}

// TODO: asses the location of profile methods.
export function fetchActiveTargetingModel(site?: string): Observable<ContentInstance> {
  return get(`/api/1/profile/get`).pipe(
    map((response) => {
      const data = reversePluckProps(response.response, 'id');
      const id = response.response.id ?? null;

      return {
        craftercms: {
          id,
          path: null,
          label: null,
          locale: null,
          dateCreated: null,
          dateModified: null,
          contentTypeId: null
        },
        ...data
      };
    })
  );
}

export function deserializeActiveTargetingModelData<T extends Object>(
  data: T,
  contentTypeFields: LookupTable<ContentTypeField>
): ContentInstance {
  Object.keys(data).forEach((modelKey) => {
    if (contentTypeFields[modelKey]) {
      // if checkbox-group (Array)
      if (contentTypeFields[modelKey].type === 'checkbox-group') {
        data[modelKey] = data[modelKey] ? data[modelKey].split(',') : [];
      }
    }
  });

  return {
    craftercms: {
      id: '',
      path: null,
      label: null,
      locale: null,
      dateCreated: null,
      dateModified: null,
      contentTypeId: null
    },
    ...data
  };
}

export function setActiveTargetingModel(data): Observable<ActiveTargetingModel> {
  const model = reversePluckProps(data, 'craftercms');
  const qs = toQueryString({ ...model, id: data.craftercms.id });
  return get(`/api/1/profile/set${qs}`).pipe(pluck('response'));
}

// endregion

export function fetchSiteUiConfig(
  site: string
): Observable<Omit<GlobalState['uiConfig'], 'error' | 'isFetching' | 'currentSite'>> {
  return fetchConfigurationDOM(site, '/ui.xml', 'studio').pipe(
    map((xml) => {
      const config = deepCopy(uiConfigDefaults);
      if (xml) {
        const arrays = ['widgets', 'roles', 'excludes', 'devices', 'values'];
        const renameTable = { permittedRoles: 'roles' };
        const toolsPanelPages = xml.querySelector('[id="craftercms.components.ToolsPanel"] > configuration > widgets');
        if (toolsPanelPages) {
          // When rendering widgets dynamically and changing pages on the tools panel, if there are duplicate react key
          // props across pages, react may no swap the components correctly, incurring in unexpected behaviours.
          // We need a unique key for each widget.
          toolsPanelPages.querySelectorAll('widget').forEach((e, index) => e.setAttribute('uiKey', String(index)));
          const lookupTables = ['fields'];
          config.preview.toolsPanel = applyDeserializedXMLTransforms(deserialize(toolsPanelPages), {
            arrays,
            lookupTables,
            renameTable
          });
        }
        const siteNavSection = xml.querySelector('[id="craftercms.components.LaunchpadSiteSection"] > configuration');
        if (siteNavSection) {
          siteNavSection.querySelectorAll('widget').forEach((e, index) => e.setAttribute('uiKey', String(index)));
          config.siteNav = applyDeserializedXMLTransforms(deserialize(siteNavSection), {
            arrays,
            renameTable
          }).configuration;
        }
      }
      return config;
    })
  );
}

export function fetchGlobalMenuItems(): Observable<{ id: string; icon: string; label: string }[]> {
  return get('/studio/api/2/ui/views/global_menu.json').pipe(pluck('response', 'menuItems'));
}

export function fetchProductLanguages(): Observable<{ id: string; label: string }[]> {
  return get('/studio/api/1/services/api/1/server/get-available-languages.json').pipe(pluck('response'));
}

export function fetchHistory(
  site: string,
  path: string,
  environment: string,
  module: string
): Observable<VersionsResponse> {
  const parsedPath = encodeURIComponent(path.replace('/config/studio', ''));

  return get(
    `/studio/api/2/configuration/get_configuration_history.json?siteId=${site}&path=${parsedPath}&environment=${environment}&module=${module}`
  ).pipe(pluck('response', 'history'));
}

export function fetchCannedMessage(site: string, locale: string, type: string): Observable<string> {
  return get(
    `/studio/api/1/services/api/1/site/get-canned-message.json?site=${site}&locale=${locale}&type=${type}`
  ).pipe(pluck('response'), catchError(errorSelectorApi1));
}
