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

import { fromEvent, merge, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  share,
  takeUntil,
  throttleTime,
  withLatestFrom
} from 'rxjs/operators';
import { ElementRecord } from '../models/InContextEditing';
import { SyntheticEvent } from 'react';
import { GuestStateObservable } from './models/GuestStore';

export const clearAndListen$ = new Subject();

export const escape$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  filter((e) => e.key === 'Escape')
);

let dragover$: Subject<{
  event: DragEvent | SyntheticEvent | JQueryMouseEventObject | Event;
  record: ElementRecord;
}>;
const getDragOver = () => dragover$;

let killSignal$: Subject<void>;
let scrolling$: Observable<Event>;
const getScrolling = () => scrolling$;

export { getDragOver as dragover$, getScrolling as scrolling$ };

export function initializeDragSubjects(state$: GuestStateObservable) {

  killSignal$ = new Subject();
  dragover$ = new Subject();
  scrolling$ = fromEvent(document, 'scroll').pipe(takeUntil(killSignal$), share());

  return merge(
    dragover$.pipe(
      throttleTime(100),
      map((payload) => ({ type: 'computed_dragover', payload }))
    ),
    scrolling$.pipe(
      throttleTime(200),
      withLatestFrom(state$),
      filter(([, state]) => !state.dragContext?.scrolling),
      map(() => ({ type: 'scrolling' }))
    ),
    // Scrolling ended
    scrolling$.pipe(
      // Emit values from scroll$ only after 200ms have
      // passed without another source emission should give
      // us the end of scrolling.
      debounceTime(200),
      map(() => ({ type: 'scrolling_stopped' }))
    )
  );

}

export function destroyDragSubjects() {
  // scrolling$ is terminated by killSignal$
  killSignal$.next();
  killSignal$.complete();
  killSignal$.unsubscribe();
  killSignal$ = null;

  dragover$.complete();
  dragover$.unsubscribe();
  dragover$ = null;

}
