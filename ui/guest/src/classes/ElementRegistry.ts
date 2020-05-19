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

import iceRegistry from './ICERegistry';
import contentController from './ContentController';
import { take } from 'rxjs/operators';
import { ContentTypeHelper } from '../utils/ContentTypeHelper';
import { ModelHelper } from '../utils/ModelHelper';
import { DropZone, ElementRecord, HighlightData } from '../models/InContextEditing';
import { RegistryEntry } from '../models/Registry';
import { LookupTable } from '@craftercms/studio-ui/models/LookupTable';
import { isNullOrUndefined, notNullOrUndefined } from '../utils/object';
import { forEach } from '../utils/array';
import { getChildArrangement, sibling } from '../utils/dom';

let seq = 0;

const db = {};
const registry = {};

export function get(id: number): ElementRecord {
  const record = db[id];
  record && isNullOrUndefined(record.label) && setLabel(record);
  return record;
}

// TODO: Unknown field names go by ignored. Trace the registration point to warn...
// developers about field names that aren't found in the content type
export function setLabel(record: ElementRecord): void {
  const labels = [];
  const models = contentController.getCachedModels();
  record.iceIds.forEach((iceId) => {

    const iceRecord = iceRegistry.recordOf(iceId);
    const { model, field, fieldId, index, contentType } = iceRegistry.getReferentialEntries(iceRecord);

    if (notNullOrUndefined(field)) {
      if (field.type === 'node-selector') {
        if (notNullOrUndefined(index)) {

          let component;
          if (notNullOrUndefined(fieldId) && ContentTypeHelper.isGroupItem(contentType, fieldId)) {
            // Repeat groups with possibly nested node-selector/repeat
            let aux = ModelHelper.extractCollectionItem(model, fieldId, index);
            // TODO: Only works for nested node-selector (?)...
            // A nested repeat group would not be a component and `aux` would rather be
            // an object to read the last piece of the `fieldId`
            // @ts-ignore TODO: Fix type
            component = models[aux];
          } else {
            // Ok for mono-level node selectors
            const id = ModelHelper.value(model, field.id)[index];
            component = models[id];
          }

          if (component) {
            labels.push(`${field.name}: ${component.craftercms.label}`);
          } else {
            labels.push(`${field.name}`);
          }

        } else {
          labels.push(`${field.name}`);
        }
      } else {
        labels.push(field.name);
      }
    } else {
      labels.push(`${contentType.name}: ${model.craftercms.label}`);
    }

  });
  record.label = labels.join(', ');
}

export function register(payload): number {
  if (notNullOrUndefined(payload.id)) {
    throw new Error('Record already has id. Was it pre-registered? Please deregister first.');
  }

  const { element, modelId, index, label, fieldId } = payload;

  const id = seq++;
  const iceIds = [];
  const fieldIds = (fieldId == null) ? [] : (
    Array.isArray(fieldId)
      ? fieldId
      : fieldId.split(',').map(str => str.trim())
  );

  // Create/register the physical record
  db[id] = { id, element, modelId, index, label, fieldId: fieldIds, iceIds, complete: false };

  // If the relevant model is loaded, complete it's registration, otherwise,
  // request it and complete registration when it does load.
  if (contentController.hasCachedModel(modelId)) {
    completeDeferredRegistration(id);
  } else {
    contentController.getModel$(modelId).pipe(take(1)).subscribe(() => {
      completeDeferredRegistration(id);
    });
  }

  return id;

}

export function completeDeferredRegistration(id: number): void {

  const { element, modelId, index, label, fieldId: fieldIds, iceIds } = db[id];

  if (fieldIds.length > 0) {
    fieldIds.forEach((fieldId) => {
      const iceId = iceRegistry.register({ modelId, index, fieldId });
      registry[iceId] = { id, element, modelId, index, label, fieldId, iceId };
      iceIds.push(iceId);
    });
  } else {
    const iceId = iceRegistry.register({ modelId, index });
    registry[iceId] = { id, element, modelId, index, label, fieldId: undefined, iceId };
    iceIds.push(iceId);
  }

  db[id].complete = true;

}

export function deregister(id: string | number): ElementRecord {
  const record = db[id];
  if (notNullOrUndefined(record)) {
    const { iceIds } = record;
    iceIds.forEach((iceId) => {
      iceRegistry.deregister(iceId);
    });
    delete db[id];
  }
  return record;
}

export function getDraggable(id: number): string {
  const record = get(id);
  return forEach(
    record.iceIds,
    (iceId) => {
      if (iceRegistry.isMovable(iceId)) {
        return iceId;
      }
    },
    false
  );
}

export function getHoverData(id: number): HighlightData {
  const record = get(id);
  return {
    id,
    rect: record.element.getBoundingClientRect(),
    label: record.label,
    validations: {}
  };
}

export function getRect(id: number): DOMRect {
  return get(id).element.getBoundingClientRect();
}

export function fromICEId(iceId: number): RegistryEntry {
  return registry[iceId];
  // return Object.values(db).find(({ iceIds }) => {
  //   return iceIds.includes(iceId);
  // });
}

export function compileDropZone(iceId: number): DropZone {

  const physicalRecord = fromICEId(iceId);
  const physicalRecordId = physicalRecord.id;
  const element = physicalRecord.element;
  const children: Element[] = Array.from(element.children);
  const childrenRects = children.map((child: Element) => child.getBoundingClientRect());
  const rect = element.getBoundingClientRect();

  return {
    element,
    children,
    iceId,
    physicalRecordId,
    rect,
    arrangement: getChildArrangement(children, childrenRects, rect),
    childrenRects,
    validations: {}
  };

}

export function getSiblingRects(id: number): LookupTable<DOMRect> {
  let
    record = get(id),
    element = record.element,
    nextSibling,
    prevSibling,
    next,
    prev;

  nextSibling = sibling(element as HTMLElement, true);
  prevSibling = sibling(element as HTMLElement, false);

  forEach(
    Object.values(db),
    (record) => {
      if (record.element === nextSibling) {
        next = record.element.getBoundingClientRect();
      } else if (record.element === prevSibling) {
        prev = record.element.getBoundingClientRect();
      } else if (notNullOrUndefined(next) && notNullOrUndefined(prev)) {
        return 'break';
      }
    }
  );

  return { next, prev };

}

export function fromElement(element: Element): ElementRecord {
  return forEach(
    Object.values(db),
    (record) => {
      if (record.element === element) {
        return get(record.id);
      }
    }
  );
}

export function hasElement(element: Element): boolean {
  return forEach(
    Object.values(db),
    (record) => {
      if (record.element === element) {
        return true;
      }
    },
    false
  );
}

export default {
  get,
  setLabel,
  register,
  deregister,
  getDraggable,
  getHoverData,
  getRect,
  fromICEId,
  compileDropZone,
  getSiblingRects,
  fromElement,
  hasElement
};
