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

import { ofType } from 'redux-observable';
import { ignoreElements, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { catchAjaxError } from '../../utils/ajax';
import { fetchItemsByPath, fetchItemWithChildrenByPath, getChildrenByPath } from '../../services/content';
import { getIndividualPaths } from '../../utils/path';
import { forkJoin } from 'rxjs';
import {
  pathNavigatorChangePage,
  pathNavigatorConditionallySetPath,
  pathNavigatorConditionallySetPathComplete,
  pathNavigatorConditionallySetPathFailed,
  pathNavigatorFetchParentItems,
  pathNavigatorFetchParentItemsComplete,
  pathNavigatorFetchPathComplete,
  pathNavigatorFetchPathFailed,
  pathNavigatorInit,
  pathNavigatorRefresh,
  pathNavigatorSetCollapsed,
  pathNavigatorSetCurrentPath,
  pathNavigatorSetKeyword,
  pathNavigatorUpdate
} from '../actions/pathNavigator';
import { getStoredPathNavigator, setStoredPathNavigator } from '../../utils/state';
import { CrafterCMSEpic } from '../store';
import { showErrorDialog } from '../reducers/dialogs/error';

export default [
  // region pathNavigatorInit
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorInit.type),
      withLatestFrom(state$),
      switchMap(([{ payload }, state]) => {
        const { id } = payload;
        const storedState = getStoredPathNavigator(state.sites.active, state.user.username, id);
        return [
          storedState ? pathNavigatorUpdate({ id, ...storedState }) : null,
          pathNavigatorFetchParentItems({
            id,
            path: storedState ? storedState.currentPath : payload.path,
            excludes: payload.excludes,
            limit: payload.limit
          })
        ].filter(Boolean);
      })
    ),
  // endregion
  // region pathNavigatorRefresh
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorRefresh.type),
      withLatestFrom(state$),
      mergeMap(([{ type, payload: { id } }, state]) =>
        fetchItemWithChildrenByPath(state.sites.active, state.pathNavigator[id].currentPath).pipe(
          map(({ item, children }) => pathNavigatorFetchPathComplete({ id, parent: item, children })),
          catchAjaxError(pathNavigatorFetchPathFailed)
        )
      )
    ),
  // endregion
  // region pathNavigatorConditionallySetPath
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorConditionallySetPath.type),
      withLatestFrom(state$),
      mergeMap(([{ type, payload: { id, path } }, state]) =>
        fetchItemWithChildrenByPath(state.sites.active, path).pipe(
          map(({ item, children }) => pathNavigatorConditionallySetPathComplete({ id, path, parent: item, children })),
          catchAjaxError(
            (error) => pathNavigatorConditionallySetPathFailed({ id, error }),
            (error) => showErrorDialog({ error: error.response ?? error })
          )
        )
      )
    ),
  // endregion
  // region pathNavigatorSetCurrentPath
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorSetCurrentPath.type),
      withLatestFrom(state$),
      mergeMap(([{ type, payload: { id, path } }, state]) =>
        fetchItemWithChildrenByPath(state.sites.active, path).pipe(
          map(({ item, children }) => pathNavigatorFetchPathComplete({ id, parent: item, children })),
          catchAjaxError(pathNavigatorFetchPathFailed)
        )
      )
    ),
  // endregion
  // region pathNavigatorSetKeyword
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorSetKeyword.type),
      withLatestFrom(state$),
      mergeMap(([{ type, payload: { id, keyword } }, state]) =>
        getChildrenByPath(state.sites.active, state.pathNavigator[id].currentPath, {
          keyword,
          limit: state.pathNavigator[id].limit
        }).pipe(
          map((children) => pathNavigatorFetchPathComplete({ id, children })),
          catchAjaxError(pathNavigatorFetchPathFailed)
        )
      )
    ),
  // endregion
  // region pathNavigatorChangePage
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorChangePage.type),
      withLatestFrom(state$),
      mergeMap(([{ type, payload: { id, offset } }, state]) =>
        getChildrenByPath(state.sites.active, state.pathNavigator[id].currentPath, {
          limit: state.pathNavigator[id].limit,
          offset
        }).pipe(
          map((children) => pathNavigatorFetchPathComplete({ id, children })),
          catchAjaxError(pathNavigatorFetchPathFailed)
        )
      )
    ),
  // endregion
  // region pathNavigatorFetchParentItems
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorFetchParentItems.type),
      withLatestFrom(state$),
      mergeMap(
        ([
          {
            type,
            payload: { id, path, excludes, limit }
          },
          state
        ]) => {
          const site = state.sites.active;
          const parentsPath = getIndividualPaths(path, state.pathNavigator[id].rootPath);
          if (parentsPath.length > 1) {
            return forkJoin([
              fetchItemsByPath(site, parentsPath),
              getChildrenByPath(site, path, {
                excludes,
                limit
              })
            ]).pipe(
              map(([items, children]) => pathNavigatorFetchParentItemsComplete({ id, items, children })),
              catchAjaxError(pathNavigatorFetchPathFailed)
            );
          } else {
            return fetchItemWithChildrenByPath(site, path, { excludes, limit }).pipe(
              map(({ item, children }) => pathNavigatorFetchPathComplete({ id, parent: item, children })),
              catchAjaxError(pathNavigatorFetchPathFailed)
            );
          }
        }
      )
    ),
  // endregion
  // region pathNavigatorFetchPathComplete, pathNavigatorConditionallySetPathComplete, pathNavigatorSetCollapsed
  (action$, state$) =>
    action$.pipe(
      ofType(
        pathNavigatorFetchPathComplete.type,
        pathNavigatorConditionallySetPathComplete.type,
        pathNavigatorSetCollapsed.type
      ),
      withLatestFrom(state$),
      tap(
        ([
          {
            type,
            payload: { id, children }
          },
          state
        ]) => {
          if (children?.length > 0 || type === pathNavigatorSetCollapsed.type) {
            setStoredPathNavigator(state.sites.active, state.user.username, id, {
              currentPath: state.pathNavigator[id].currentPath,
              collapsed: state.pathNavigator[id].collapsed
            });
          }
        }
      ),
      ignoreElements()
    )
  // endregion
] as CrafterCMSEpic[];
