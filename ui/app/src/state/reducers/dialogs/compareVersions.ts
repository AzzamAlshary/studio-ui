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

import { createReducer } from '@reduxjs/toolkit';
import GlobalState from '../../../models/GlobalState';
import {
  closeCompareVersionsDialog,
  compareVersionsDialogClosed,
  showCompareVersionsDialog,
  showHistoryDialog
} from '../../actions/dialogs';
import { CompareVersionsDialogStateProps } from '../../../components/CompareVersionsDialog/utils';

const initialState: CompareVersionsDialogStateProps = {
  open: false,
  isSubmitting: null,
  isMinimized: null,
  hasPendingChanges: null,
  isFetching: null,
  error: null
};

export default createReducer<GlobalState['dialogs']['compareVersions']>(initialState, {
  [showCompareVersionsDialog.type]: (state, { payload }) => ({
    ...state,
    onClose: closeCompareVersionsDialog(),
    onClosed: compareVersionsDialogClosed(),
    ...payload,
    open: true,
    isFetching: true
  }),
  [closeCompareVersionsDialog.type]: (state) => ({
    ...state,
    open: false
  }),
  [compareVersionsDialogClosed.type]: () => initialState,
  [showHistoryDialog.type]: (state) => ({
    ...state,
    open: false
  })
});
