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

import { errorSelectorApi1, get } from '../utils/ajax';
import { catchError, map, pluck } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { deserialize, fromString, getInnerHtml } from '../utils/xml';
import ContentType, { ContentTypeField } from '../models/ContentType';
import { createLookupTable, reversePluckProps } from '../utils/object';
import ContentInstance from '../models/ContentInstance';
import { VersionsResponse } from '../models/Version';
import { SidebarPanelConfigEntry, SiteNavConfigEntry } from '../models/UiConfig';
import { asArray } from '../utils/array';
import { previewMock } from '../assets/uiConfigMock';

type CrafterCMSModules = 'studio' | 'engine';

export function getRawConfiguration(
  site: string,
  configPath: string,
  module: CrafterCMSModules
): Observable<string> {
  return get(
    `/studio/api/2/configuration/get_configuration?siteId=${site}&module=${module}&path=${configPath}`
  ).pipe(pluck('response', 'content'));
}

export function getConfigurationDOM(
  site: string,
  configPath: string,
  module: CrafterCMSModules
): Observable<XMLDocument> {
  return getRawConfiguration(site, configPath, module).pipe(map(fromString));
}

// region AudiencesPanelConfig

const audienceTypesMap: any = {
  input: 'input',
  dropdown: 'dropdown',
  checkboxes: 'checkbox-group',
  datetime: 'date-time'
};

interface ActiveTargetingModel {
  id: string;

  [prop: string]: string;
}

export function getAudiencesPanelConfig(site: string): Observable<ContentType> {
  return getRawConfiguration(site, `/targeting/targeting-config.xml`, 'studio').pipe(
    map((content) => {
      try {
        return JSON.parse(content);
      } catch (e) {
        // Not JSON, assuming XML
        let audiencesPanelContentType: ContentType = {
          id: 'audiencesPanelConfig',
          name: 'Audiences Panel Config',
          type: 'unknown',
          quickCreate: null,
          quickCreatePath: null,
          displayTemplate: null,
          sections: null,
          fields: null,
          dataSources: null,
          mergeStrategy: null
        };

        const xml = fromString(content);
        const properties = Array.from(xml.querySelectorAll('property')).map((elem) => {
          const name = getInnerHtml(elem.querySelector('name')),
            label = getInnerHtml(elem.querySelector('label')),
            type = getInnerHtml(elem.querySelector('type')),
            hint = getInnerHtml(elem.querySelector('hint'));
          let defaultValue: any = getInnerHtml(elem.querySelector('default_value'));

          let possibleValues: ContentTypeField['values'];

          if (elem.querySelectorAll('value').length > 0) {
            possibleValues = Array.from(elem.querySelectorAll('value')).map((element) => {
              const value = getInnerHtml(element);
              return {
                label: element.getAttribute('label') ?? value,
                value: value
              };
            });
          } else {
            possibleValues = [];
          }

          if (type === 'checkboxes') {
            defaultValue = defaultValue ? defaultValue.split(',') : [];
          }

          return {
            id: name,
            name: label,
            type: audienceTypesMap[type] || type,
            sortable: null,
            validations: null,
            defaultValue,
            required: null,
            fields: null,
            values: possibleValues,
            helpText: hint
          };
        });

        audiencesPanelContentType.fields = createLookupTable(properties, 'id');

        return audiencesPanelContentType;
      }
    })
  );
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

export function getAudiencesPanelPayload(
  site: string
): Observable<{ contentType: ContentType; model: ContentInstance }> {
  return forkJoin({
    data: fetchActiveTargetingModel(site),
    contentType: getAudiencesPanelConfig(site)
  }).pipe(
    map(({ contentType, data }) => ({
      contentType,
      model: deserializeActiveTargetingModelData(data, contentType)
    }))
  );
}

function deserializeActiveTargetingModelData<T extends Object>(
  data: T,
  contentType: ContentType
): ContentInstance {
  const contentTypeFields = contentType.fields;

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

  Object.keys(model).forEach((key) => {
    if (Array.isArray(model[key])) {
      model[key] = model[key].join(',');
    }
  });

  const params = encodeURIComponent(
    Object.entries(model)
      .map(([key, val]) => `${key}=${val}`)
      .join('&')
  );

  return get(`/api/1/profile/set?${params}`).pipe(pluck('response'));
}

// endregion

// region SidebarConfig

export function getSiteUiConfig(site: string): Observable<any> {
  const widgetParser = (items): SidebarPanelConfigEntry[] => {
    let array = asArray(items.widget);
    return array.map((item) => ({
      id: item.id,
      ...(item.roles?.role && { roles: asArray(item.roles.role) }),
      ...(item.parameters && {
        parameters: {
          ...item.parameters,
          ...(item.parameters.excludes && { excludes: asArray(item.parameters.excludes.exclude) })
        }
      })
    }));
  };

  const panelsParser = (items): SidebarPanelConfigEntry[] => {
    let array = asArray(items.panel);
    return array.map((item) => ({
      id: item.id,
      ...(item.roles?.role && { roles: asArray(item.roles.role) }),
      ...(item.parameters && {
        parameters: {
          ...item.parameters,
          ...(item.parameters.widgets && { widgets: widgetParser(item.parameters.widgets) }),
          ...(item.parameters.devices && { devices: asArray(item.parameters.devices.device) })
        }
      })
    }));
  };

  const linksParser = (items): SiteNavConfigEntry[] => {
    let array = asArray(items.link);
    return array.map((item) => ({
      ...item,
      ...(item.roles?.role && { roles: asArray(item.roles.role) })
    }));
  };

  return getConfigurationDOM(site, '/ui.xml', 'studio').pipe(
    map((xml) => {
      if (xml) {
        const parsed = deserialize(xml).ui;
        return {
          preview: {
            sidebar: {
              panels: panelsParser(parsed.preview.sidebar.panels)
            },
            siteNav: {
              links: linksParser(parsed.preview.siteNav.links)
            }
          }
        };
      } else {
        return previewMock;
      }
    })
  );
}

// endregion

export function getGlobalMenuItems() {
  return get('/studio/api/2/ui/views/global_menu.json');
}

export function getProductLanguages(): Observable<{ id: string; label: string }[]> {
  return get('/studio/api/1/services/api/1/server/get-available-languages.json').pipe(
    pluck('response')
  );
}

export function getHistory(
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

const configuration = {
  getProductLanguages,
  getRawConfiguration,
  getConfigurationDOM,
  getGlobalMenuItems,
  getConfigurationHistory: getHistory
};

export default configuration;
