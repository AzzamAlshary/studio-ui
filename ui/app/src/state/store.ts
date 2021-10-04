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

import { configureStore, EnhancedStore, Middleware } from '@reduxjs/toolkit';
import reducer from './reducers/root';
import GlobalState from '../models/GlobalState';
import { createEpicMiddleware, Epic } from 'redux-observable';
import { StandardAction } from '../models/StandardAction';
import epic from './epics/root';
import { BehaviorSubject, forkJoin, fromEvent, Observable, of } from 'rxjs';
import { filter, map, pluck, switchMap, take, tap } from 'rxjs/operators';
import { fetchGlobalProperties, me } from '../services/users';
import { exists, fetchAll } from '../services/sites';
import LookupTable from '../models/LookupTable';
import { getCurrentIntl } from '../utils/i18n';
import { IntlShape } from 'react-intl';
import { ObtainAuthTokenResponse } from '../services/auth';
import { getSiteCookie, removeSiteCookie, setJwt } from '../utils/auth';
import { storeInitialized } from './actions/system';
import User from '../models/User';
import { Site } from '../models/Site';
import {
  sharedWorkerConnect,
  sharedWorkerDisconnect,
  sharedWorkerToken,
  sharedWorkerUnauthenticated
} from './actions/auth';

export type EpicMiddlewareDependencies = { getIntl: () => IntlShape; worker: SharedWorker };

export type CrafterCMSStore = EnhancedStore<GlobalState, StandardAction>;

export type CrafterCMSEpic = Epic<StandardAction, StandardAction, GlobalState, EpicMiddlewareDependencies>;

let store$: BehaviorSubject<CrafterCMSStore>;

export function getStore(): Observable<CrafterCMSStore> {
  if (store$) {
    return store$.pipe(
      filter((store) => store !== null),
      take(1)
    );
  } else {
    store$ = new BehaviorSubject(null);
    return registerSharedWorker().pipe(
      tap(({ token }) => setJwt(token)),
      switchMap(({ worker, ...auth }) =>
        of(createStoreSync({ dependencies: { worker } })).pipe(
          switchMap((store) =>
            fetchStateInitialization().pipe(
              tap((requirements) => {
                worker.port.onmessage = (e) => {
                  if (e.data?.type) {
                    store.dispatch(e.data);
                  }
                };
                store.dispatch(storeInitialized({ auth, ...requirements }));
                store$.next(store);
              })
            )
          )
        )
      ),
      switchMap(() => store$.pipe(take(1)))
    );
  }
}

function registerSharedWorker(): Observable<ObtainAuthTokenResponse & { worker: SharedWorker }> {
  if ('SharedWorker' in window) {
    const worker = new SharedWorker(`${process.env.PUBLIC_URL}/shared-worker.js`, {
      name: 'authWorker',
      credentials: 'same-origin'
    });
    worker.port.start();
    worker.port.postMessage(sharedWorkerConnect());
    window.addEventListener('beforeunload', function () {
      worker.port.postMessage(sharedWorkerDisconnect());
    });
    return fromEvent<MessageEvent>(worker.port, 'message').pipe(
      tap((e) => {
        if (e.data?.type === sharedWorkerUnauthenticated.type) {
          window.location.reload();
          throw new Error('User not authenticated.');
        }
      }),
      filter((e) => e.data?.type === sharedWorkerToken.type),
      take(1),
      pluck('data', 'payload'),
      map((response) => ({ ...response, worker }))
    );
  } else {
    return new Observable((observer) => {
      observer.error(
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform)
          ? 'iOS is not supported as it lacks essential features. Please use Chrome or Firefox browsers on your desktop.'
          : 'Your browser is not supported as it lacks essential features. Please use Chrome or Firefox.'
      );
    });
  }
}

export function getStoreSync(): CrafterCMSStore {
  return store$?.value;
}

export function createStoreSync(args: { preloadedState?: any; dependencies?: any } = {}): CrafterCMSStore {
  const { preloadedState, dependencies } = args;
  const epicMiddleware = createEpicMiddleware<StandardAction, StandardAction, GlobalState, EpicMiddlewareDependencies>({
    dependencies: { getIntl: getCurrentIntl, ...dependencies }
  });
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(epicMiddleware as Middleware),
    preloadedState,
    devTools: { name: 'Studio Store' }
    // devTools: process.env.NODE_ENV === 'production' ? false : { name: 'Studio Store' }
  });
  epicMiddleware.run(epic);
  return store;
}

export function fetchStateInitialization(): Observable<{
  user: User;
  sites: Site[];
  properties: LookupTable<any>;
}> {
  const siteCookieValue = getSiteCookie();
  return forkJoin({
    user: me(),
    sites: fetchAll(),
    properties: fetchGlobalProperties(),
    activeSiteId:
      // A site cookie may be set but the site may have been deleted.
      // If there is a cookie with a site name, verify that it still exists.
      siteCookieValue
        ? exists(siteCookieValue).pipe(
            // If the site doesn't exist, delete the cookie so it doesn't cause further issues
            tap((siteExists) => !siteExists && removeSiteCookie()),
            map((siteExists) => (siteExists ? siteCookieValue : null))
          )
        : of(null)
  });
}

export default getStore;
