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

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

export const useDeleteDialogUIStyles = makeStyles((theme) =>
  createStyles({
    submissionCommentField: {
      '& .MuiTextField-root': {
        width: '100%'
      }
    },
    depsContainer: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`
    },
    confirmCheck: {
      margin: `${theme.spacing()} 0`
    }
  })
);
