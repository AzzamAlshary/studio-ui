/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RecentlyPublishedWidgetUI from './RecentlyPublishedWidgetUI';
import ApiResponse from '../../models/ApiResponse';
import { LegacyDeploymentHistoryResponse, LegacyDeploymentHistoryType } from '../../models/Dashboard';
import { useActiveSiteId, useLocale, useLogicResource, useSpreadState } from '../../utils/hooks';
import { fetchLegacyDeploymentHistory } from '../../services/dashboard';
import Paper from '@material-ui/core/Paper';
import { SuspenseWithEmptyState } from '../SystemStatus/Suspencified';
import { FormattedMessage } from 'react-intl';
import SecondaryButton from '../SecondaryButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { DetailedItem } from '../../models/Item';
import { getNumOfMenuOptionsForItem, getSystemTypeFromPath, parseLegacyItemToDetailedItem } from '../../utils/content';
import LookupTable from '../../models/LookupTable';
import { MediaItem } from '../../models/Search';
import { completeDetailedItem } from '../../state/actions/content';
import { showItemMegaMenu } from '../../state/actions/dialogs';
import { useDispatch } from 'react-redux';
import Dashlet from '../Dashlet';

export interface RecentlyPublishedWidgetProps {}

export const useStyles = makeStyles((theme) =>
  createStyles({
    options: {
      marginLeft: 'auto',
      '& > button:first-child': {
        marginRight: '10px'
      }
    },
    filterSelectRoot: {
      padding: '8.5px 14px'
    },
    filterSelectInput: {
      fontSize: theme.typography.button.fontSize,
      fontWeight: theme.typography.button.fontWeight
    },
    paginationRoot: {
      marginLeft: 'auto',
      marginRight: '20px'
    },
    tableRoot: {
      tableLayout: 'fixed'
    }
  })
);

export default function RecentlyPublishedWidget(props: RecentlyPublishedWidgetProps) {
  const [expandedWidget, setExpandedWidget] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState<ApiResponse>();
  const [history, setHistory] = useState<LegacyDeploymentHistoryResponse>();
  const [itemsLookup, setItemsLookup] = useSpreadState<LookupTable<DetailedItem[]>>({});
  const [filterBy, setFilterBy] = useState<LegacyDeploymentHistoryType>('page');
  const [numItems, setNumItems] = useState(20);
  const [expandedItems, setExpandedItems] = useSpreadState({});
  const siteId = useActiveSiteId();
  const localeBranch = useLocale();
  const classes = useStyles();
  const dispatch = useDispatch();

  const toggleCollapseAllItems = useCallback(
    (documents, expanded) => {
      documents.forEach((document) => {
        setExpandedItems({
          [document.internalName]: expanded
        });
      });
    },
    [setExpandedItems]
  );

  const onOptionsButtonClick = (event: any, item: MediaItem) => {
    const path = item.path;
    dispatch(completeDetailedItem({ path }));
    dispatch(
      showItemMegaMenu({
        path,
        anchorReference: 'anchorPosition',
        anchorPosition: { top: event.clientY, left: event.clientX },
        numOfLoaderItems: getNumOfMenuOptionsForItem({
          path: item.path,
          systemType: getSystemTypeFromPath(item.path)
        } as DetailedItem)
      })
    );
  };

  const onFilterChange = (e) => {
    e.stopPropagation();
    setFilterBy(e.target.value);
  };

  const onCollapseAll = (e) => {
    e.stopPropagation();
    toggleCollapseAllItems(history.documents, false);
  };

  useEffect(() => {
    setFetchingHistory(true);
    fetchLegacyDeploymentHistory(siteId, 'eventDate', false, 30, numItems, filterBy).subscribe(
      (history) => {
        setHistory(history);
        toggleCollapseAllItems(history.documents, true);
        history.documents.forEach((document) => {
          const items = [];
          document.children.forEach((legacyItem) => {
            items.push(parseLegacyItemToDetailedItem(legacyItem));
          });
          setItemsLookup({
            [document.internalName]: items
          });
        });

        setFetchingHistory(false);
      },
      (e) => {
        setErrorHistory(e);
        setFetchingHistory(false);
      }
    );
  }, [siteId, filterBy, numItems, toggleCollapseAllItems, setItemsLookup]); // TODO: pagination pending

  const resource = useLogicResource<
    LegacyDeploymentHistoryResponse,
    { history: LegacyDeploymentHistoryResponse; error: ApiResponse; fetching: boolean }
  >(
    useMemo(() => ({ history, error: errorHistory, fetching: fetchingHistory }), [
      history,
      errorHistory,
      fetchingHistory
    ]),
    {
      shouldResolve: (source) => Boolean(source.history) && !fetchingHistory,
      shouldReject: ({ error }) => Boolean(error),
      shouldRenew: (source, resource) => fetchingHistory && resource.complete,
      resultSelector: (source) => source.history,
      errorSelector: () => errorHistory
    }
  );

  return (
    <Paper elevation={2}>
      <Dashlet
        title="Recently Published"
        onToggleExpanded={() => setExpandedWidget(!expandedWidget)}
        expanded={expandedWidget}
        headerRightSection={
          <>
            <SecondaryButton onClick={onCollapseAll}>
              <FormattedMessage id="recentlyPublished.collapseAll" defaultMessage="Collapse All" />
            </SecondaryButton>
            <Select
              value={filterBy}
              onChange={onFilterChange}
              classes={{
                root: classes.filterSelectRoot,
                select: classes.filterSelectInput
              }}
            >
              <MenuItem value={'page'}>Pages</MenuItem>
              <MenuItem value={'component'}>Components</MenuItem>
              <MenuItem value={'document'}>Documents</MenuItem>
              <MenuItem value={'all'}>All</MenuItem>
            </Select>
          </>
        }
      >
        <SuspenseWithEmptyState
          resource={resource}
          suspenseProps={{
            fallback: <></> // TODO: skeleton
          }}
        >
          <RecentlyPublishedWidgetUI
            resource={resource}
            itemsLookup={itemsLookup}
            localeBranch={localeBranch}
            expandedItems={expandedItems}
            setExpandedItems={setExpandedItems}
            onOptionsButtonClick={onOptionsButtonClick}
          />
        </SuspenseWithEmptyState>
      </Dashlet>
    </Paper>
  );
}
