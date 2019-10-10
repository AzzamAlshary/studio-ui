/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import React, { ChangeEvent, useState } from "react";
import makeStyles from "@material-ui/styles/makeStyles/makeStyles";
import { defineMessages, useIntl } from "react-intl";
import SelectButton from "./ConfirmDropdown";
import Typography from "@material-ui/core/Typography";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { fetchPackage, cancelPackage } from "../services/publishing";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { setRequestForgeryToken } from "../utils/auth";

const useStyles = makeStyles((theme: Theme) => ({
  package: {
    padding: '20px 8px 20px 0',
    '& .name': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    '& .status': {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px'
    },
    '& .comment': {
      display: 'flex',
      '& p:first-child': {
        marginRight: '20px',
        marginBottom: '10px'
      },
      '& span': {
        color: theme.palette.text.secondary
      }
    },
    '& .files': {
      marginTop: '10px',
    },
  },
  checkbox: {
    marginRight: 'auto'
  },
  list: {
    '& li': {
      display: 'flex',
      justifyContent: 'space-between'
    },
    '& li:nth-child(odd)':{
      background: '#f9f9f9',
      borderBottom: '1px solid #dedede'
    }
  },
  spinner: {
    marginRight: '10px',
    color: theme.palette.text.secondary
  }
}));

const messages = defineMessages({
  cancel: {
    id: 'publishingQueue.cancel',
    defaultMessage: 'Cancel'
  },
  confirm: {
    id: 'publishingQueue.confirm',
    defaultMessage: 'Confirm'
  },
  confirmHelper: {
    id: 'publishingQueue.confirmHelper',
    defaultMessage: 'Set the state for the item to "Cancelled"'
  },
  fetchPackagesFiles: {
    id: 'publishingQueue.fetchPackagesFiles',
    defaultMessage: 'Fetch Packages Files'
  },
  scheduled: {
    id: 'publishingQueue.scheduled',
    defaultMessage: 'Scheduled for <b>{schedule, date, medium} {schedule, time, short}</b> by <b>{approver}</b>',
  },
  status: {
    id: 'publishingQueue.status',
    defaultMessage: 'Status is {state} for {environment} environment'
  },
  comment: {
    id: 'publishingQueue.comment',
    defaultMessage: 'Comment'
  },
  commentNotProvided: {
    id: 'publishingQueue.commentNotProvided',
    defaultMessage: '(submission comment not provided)'
  }
});

interface PublishingPackage {
  siteId: string;
  id: string;
  schedule: string;
  approver: string;
  state: string;
  environment: string;
  comment: string
  selected: any;
  setSelected(selected: any): any
}

export default function PublishingPackage(props: PublishingPackage) {
  const classes = useStyles({});
  const {formatMessage} = useIntl();
  const {id, approver, schedule, state, comment, environment, siteId, selected, setSelected} = props;
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(null);

  function onSelect(event: ChangeEvent, id: string, checked: boolean) {
    let list = [...selected];
    if(checked) {
      list = list.filter(item => item !== id);
    } else {
      list.push(id);
    }
    setSelected(list);
  }

  function handleCancel(packageId: string) {
    cancelPackage(siteId, [packageId])
      .subscribe(
        ({response}) => {
          console.log(response);
        },
        ({response}) => {
          console.log(response);
        }
      );
  }

  function onFetchPackages(packageId: string) {
    setLoading(true);
    fetchPackage(siteId, packageId)
      .subscribe(
        ({response}) => {
          setFiles(response.package.items);
        },
        ({response}) => {
          console.log(response);
        }
      );
  }

  function renderFiles() {
    return files.map((file:any, index:number) => {
      return (
        <ListItem key={index}>
          <Typography variant="body2">
            {file.path}
          </Typography>
          <Typography variant="body2">
            {file.contentTypeClass}
          </Typography>
        </ListItem>
      )
    })
  }

  setRequestForgeryToken();

  const checked = !!selected.find((item:string) => item === id);


  return (
    <div className={classes.package}>
      <div className={"name"}>
        <FormGroup className={classes.checkbox}>
          <FormControlLabel
            control={<Checkbox color="primary" checked={checked} onChange={(event) => onSelect(event, id, checked)}/>}
            label={<strong>{id}</strong>}
          />
        </FormGroup>
        <SelectButton
          text={formatMessage(messages.cancel)}
          cancelText={formatMessage(messages.cancel)}
          confirmText={formatMessage(messages.confirm)}
          confirmHelperText={formatMessage(messages.confirmHelper)}
          onConfirm={() => handleCancel(id)}
        />
      </div>
      <div className="status">
        <Typography variant="body2">
          {
            formatMessage(
              messages.scheduled,
              {
                schedule: new Date(schedule),
                approver: approver,
                b: (content) => <strong key={content}>{content}</strong>
              }
            )
          }
        </Typography>
        <Typography variant="body2">
          {
            formatMessage(
              messages.status,
              {
                state: <strong key={state}>{state}</strong>,
                environment: <strong key={environment}>{environment}</strong>,
              }
            )
          }
        </Typography>
      </div>
      <div className="comment">
        <Typography variant="body2">
          {formatMessage(messages.comment)}
        </Typography>
        <Typography variant="body2">
          {comment ? comment : <span>{formatMessage(messages.commentNotProvided)}</span>}
        </Typography>
      </div>
      <div className="files">
        {
          files &&
          <List aria-label="files list" className={classes.list}>
            {renderFiles()}
          </List>
        }
        {
          (files === null) &&
          <Button variant="outlined" onClick={() => onFetchPackages(id)} disabled={!!loading}>
            {
              loading &&
              <CircularProgress size={14} className={classes.spinner} color={"inherit"}/>
            }
            {formatMessage(messages.fetchPackagesFiles)}
          </Button>
        }
      </div>
    </div>
  )
}
