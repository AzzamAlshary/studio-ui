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

import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { LegacyItem, SandboxItem } from '../../../models/Item';
import { getDependant, getSimpleDependencies } from '../../../services/dependencies';
import {
  useActiveSiteId,
  useOnUnmount,
  useSelection,
  useSpreadState,
  useStateResource
} from '../../../utils/hooks';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isAsset, isCode, isEditableAsset, isImage } from '../../../utils/content';
import StandardAction from '../../../models/StandardAction';
import makeStyles from '@material-ui/core/styles/makeStyles';
import createStyles from '@material-ui/core/styles/createStyles';
import { palette } from '../../../styles/theme';
import { Resource } from '../../../models/Resource';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import clsx from 'clsx';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVertRounded';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DialogHeader from '../../../components/Dialogs/DialogHeader';
import DialogBody from '../../../components/Dialogs/DialogBody';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { SuspenseWithEmptyState } from '../../../components/SystemStatus/Suspencified';
import DialogFooter from '../../../components/Dialogs/DialogFooter';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import EmbeddedLegacyEditors from '../../Preview/EmbeddedLegacyEditors';
import { ApiResponse } from '../../../models/ApiResponse';
import SingleItemSelector from '../Authoring/SingleItemSelector';
import { Dialog } from '@material-ui/core';

const assetsTypes = {
  'all-deps': {
    label: <FormattedMessage
      id="dependenciesDialog.allDeps" defaultMessage="Show all dependencies"
    />,
    filter: () => true
  },
  'content-items': {
    label: <FormattedMessage
      id="dependenciesDialog.contentItems" defaultMessage="Content items only"
    />,
    filter: (dependency: LegacyItem) => ((dependency.isComponent && !dependency.isAsset) || dependency.isPage)
  },
  'assets': {
    label: <FormattedMessage id="dependenciesDialog.assets" defaultMessage="Assets only" />,
    filter: (dependency: LegacyItem) => isAsset(dependency.uri)
  },
  'code': {
    label: <FormattedMessage id="dependenciesDialog.code" defaultMessage="Code only" />,
    filter: (dependency: LegacyItem) => isCode(dependency.uri)
  }
};

const translations = defineMessages({
  headerTitle: {
    id: 'dependenciesDialog.headerTitle',
    defaultMessage: 'Content Item Dependencies'
  }
});

const dependenciesDialogStyles = makeStyles((theme) => createStyles({
  titleRoot: {
    margin: 0,
    padding: '13px 20px 11px',
    background: palette.white
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10
  },
  subtitle: {
    fontSize: '14px',
    lineHeight: '18px',
    paddingRight: '35px'
  },
  selectionContent: {
    marginBottom: '15px',
    display: 'flex'
  },
  dialogFooter: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  formControl: {
    minWidth: 120,
    marginLeft: 'auto'
  },
  selectLabel: {
    position: 'relative',
    color: palette.gray.dark5,
    fontSize: '14px'
  },
  select: {
    fontSize: '16px',
    border: 'none',
    background: 'none'
  },
  selectedItem: {
    backgroundColor: palette.white,
    borderRadius: '5px',
    padding: '10px',
    height: '40px',
    fontSize: '16px',
    borderColor: palette.gray.light1
  },
  selectedItemLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 10px 0 0',
    '& .label': {
      fontWeight: '600',
      marginRight: '10px',
      color: palette.black,
      fontSize: '16px'
    },
    '& .item-icon': {
      color: palette.teal.main,
      marginRight: '10px',
      width: '20px',
      height: '20px'
    },
    '& .item-title': {
      marginRight: '25px'
    }
  },
  selectedItemEditIcon: {
    fontSize: '14px',
    color: palette.gray.medium5,
    width: '16px',
    height: '16px'
  },
  dependenciesList: {
    backgroundColor: palette.white,
    padding: 0,
    borderRadius: '5px 5px 0 0',
    overflowY: 'auto'
  },
  dependenciesListItem: {
    boxShadow: '0 1px 1px #EBEBF0',
    padding: 0,
    height: '70px'
  },
  dependenciesCompactListItem: {
    height: '43px'
  },
  listItemPreview: {
    width: '100px',
    height: '70px',
    borderRadius: 0
  },
  listItemContent: {
    paddingLeft: '15px'
  },
  compactViewAction: {
    marginRight: 'auto'
  },
  showTypesSelect: {
    '& > .MuiRadio-root': {
      display: 'none'
    }
  },
  showTypesMenu: {
    '& .MuiListItem-root': {
      padding: '0 10px',
      fontSize: '14px',
      '& > .MuiRadio-root': {
        padding: '6px',
        '& .MuiSvgIcon-root': {
          width: '16px',
          height: '16px'
        }
      }
    }
  },
  listEllipsis: {
    padding: '8px'
  },
  suspense: {
    height: '100%'
  },
  suspenseTitle: {
    fontSize: '18px',
    fontWeight: 600
  }
}));

interface DependenciesListProps {
  resource: Resource<LegacyItem[]>;
  compactView: boolean;
  showTypes: string;

  handleContextMenuClick(event: React.MouseEvent<HTMLButtonElement>, dependency: LegacyItem): void;
}

function DependenciesList(props: DependenciesListProps) {
  const {
    resource,
    compactView,
    showTypes,
    handleContextMenuClick
  } = props;
  const classes = dependenciesDialogStyles({});
  const dependencies: LegacyItem[] = resource.read();

  return (
    <List className={classes.dependenciesList}>
      {
        dependencies
          .filter(dependency => assetsTypes[showTypes].filter(dependency))
          .map(dependency =>
            <ListItem
              key={dependency.uri}
              className={clsx(classes.dependenciesListItem, { [classes.dependenciesCompactListItem]: compactView })}
            >
              {
                isImage(dependency.uri) && !compactView &&
                <ListItemAvatar>
                  <Avatar className={classes.listItemPreview} src={dependency.uri} />
                </ListItemAvatar>
              }
              <ListItemText
                className={classes.listItemContent}
                primary={dependency.internalName}
                secondary={(!compactView) ? dependency.uri : null}
              />

              <IconButton
                aria-haspopup="true"
                onClick={(e) => {
                  handleContextMenuClick(e, dependency);
                }}
                className={classes.listEllipsis}
              >
                <MoreVertIcon />
              </IconButton>
            </ListItem>
          )
      }
    </List>
  );
}

interface DependenciesDialogUIProps {
  resource: Resource<LegacyItem[]>
  item: SandboxItem;
  rootPath: string;
  setItem: Function;
  compactView: boolean;
  setCompactView: Function;
  showTypes: string;
  setShowTypes: Function;
  dependenciesShown: string;
  setDependenciesShown: Function;
  onDismiss(): any;
  isEditableItem: Function;
  editDialogConfig: any;
  setEditDialogConfig: Function;
  handleEditorDisplay: Function;
  contextMenu: any;

  handleContextMenuClick(event: React.MouseEvent<HTMLButtonElement>, dependency: LegacyItem): void;

  handleContextMenuClose(): void;
}

function DependenciesDialogUI(props: DependenciesDialogUIProps) {
  const {
    resource,
    item,
    rootPath,
    setItem,
    compactView,
    setCompactView,
    showTypes,
    setShowTypes,
    dependenciesShown,
    setDependenciesShown,
    onDismiss,
    isEditableItem,
    editDialogConfig,
    setEditDialogConfig,
    handleEditorDisplay,
    contextMenu,
    handleContextMenuClick,
    handleContextMenuClose
  } = props;
  const classes = dependenciesDialogStyles({});
  const { formatMessage } = useIntl();
  const [openSelector, setOpenSelector] = useState(false);

  return (
    <>
      <DialogHeader
        title={formatMessage(translations.headerTitle)}
        onDismiss={onDismiss}
      />
      <DialogBody>
        <div className={classes.selectionContent}>
          <SingleItemSelector
            label="Item"
            open={openSelector}
            onClose={() => setOpenSelector(false)}
            onDropdownClick={() => setOpenSelector(!openSelector)}
            rootPath={rootPath}
            selectedItem={item}
            onItemClicked={(item) => {
              setOpenSelector(false);
              setItem(item);
            }}
          />
          <FormControl className={classes.formControl}>
            <Select
              value={dependenciesShown ?? 'depends-on'}
              onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                setDependenciesShown(event.target.value);
              }}
              inputProps={{
                className: classes.select
              }}
            >
              <MenuItem value='depends-on'>
                <FormattedMessage
                  id="dependenciesDialog.dependsOn"
                  defaultMessage="Items that depend on selected item"
                />
              </MenuItem>
              <MenuItem value='depends-on-me'>
                <FormattedMessage
                  id="dependenciesDialog.dependsOnMe"
                  defaultMessage="Dependencies of selected item"
                />
              </MenuItem>
            </Select>
          </FormControl>
        </div>
        <SuspenseWithEmptyState
          resource={resource}
          withEmptyStateProps={{
            emptyStateProps: {
              title: (
                dependenciesShown === 'depends-on'
                  ? (
                    <FormattedMessage
                      id="dependenciesDialog.emptyDependantsMessage"
                      defaultMessage={'{itemName} has no dependencies'}
                      values={{ itemName: item?.['internalName'] }}
                    />
                  ) : (
                    <FormattedMessage
                      id="dependenciesDialog.emptyDependenciesMessage"
                      defaultMessage={'Nothing depends on {itemName}'}
                      values={{ itemName: item?.['internalName'] }}
                    />
                  )
              ),
              classes: {
                root: classes.suspense,
                title: classes.suspenseTitle
              }
            }
          }}
          loadingStateProps={{
            classes: {
              root: classes.suspense
            }
          }}
        >
          <DependenciesList
            resource={resource}
            compactView={compactView}
            showTypes={showTypes}
            handleContextMenuClick={handleContextMenuClick}
          />
          <Menu
            anchorEl={contextMenu.el}
            keepMounted
            open={Boolean(contextMenu.el)}
            onClose={handleContextMenuClose}
          >
            {
              contextMenu.dependency && isEditableItem(contextMenu.dependency.uri) &&
              <MenuItem
                onClick={() => {
                  handleEditorDisplay(contextMenu.dependency);
                  handleContextMenuClose();
                }}
              >
                <FormattedMessage
                  id="dependenciesDialog.edit"
                  defaultMessage="Edit"
                />
              </MenuItem>
            }
            {
              contextMenu.dependency &&
              <MenuItem
                onClick={() => {
                  setItem(contextMenu.dependency);
                  handleContextMenuClose();
                }}
              >
                <FormattedMessage
                  id="dependenciesDialog.dependencies"
                  defaultMessage="Dependencies"
                />
              </MenuItem>
            }
            <MenuItem
              onClick={handleContextMenuClose}
            >   {/* TODO: pending, waiting for new history dialog */}
              <FormattedMessage
                id="dependenciesDialog.history"
                defaultMessage="History"
              />
            </MenuItem>
          </Menu>
        </SuspenseWithEmptyState>
      </DialogBody>
      <DialogFooter
        classes={{
          root: classes.dialogFooter
        }}
      >
        <FormControlLabel
          className={classes.compactViewAction}
          control={
            <Checkbox
              checked={compactView}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setCompactView(event.target.checked);
              }}
              color="primary"
            />
          }
          label="Compact"
        />
        <FormControl className={classes.formControl}>
          <Select
            value={showTypes}
            onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
              setShowTypes(event.target.value);
            }}
            inputProps={{
              className: `${classes.select} ${classes.showTypesSelect}`
            }}
            MenuProps={{
              className: classes.showTypesMenu,
              transformOrigin: {
                vertical: 'bottom',
                horizontal: 'left'
              },
              getContentAnchorEl: null
            }}
          >
            {
              Object.keys(assetsTypes).map(typeId =>
                (
                  <MenuItem value={typeId} key={typeId}>
                    <Radio
                      checked={showTypes === typeId}
                      color="primary"
                    />
                    {assetsTypes[typeId].label}
                  </MenuItem>
                )
              )
            }
          </Select>
        </FormControl>
      </DialogFooter>
      <EmbeddedLegacyEditors
        showTabs={false}
        dialogConfig={editDialogConfig}
        setDialogConfig={setEditDialogConfig}
      />
    </>
  );
}

interface DependenciesDialogBaseProps {
  open: boolean;
  item?: SandboxItem;
  rootPath: string;
  dependenciesShown?: string;
}

export type DependenciesDialogProps = PropsWithChildren<DependenciesDialogBaseProps & {
  onClose(): any;
  onClosed(): any;
  onDismiss(): any;
}>;

export interface DependenciesDialogStateProps extends DependenciesDialogBaseProps {
  onClose?: StandardAction
  onClosed?: StandardAction
  onDismiss?: StandardAction
}

const dialogInitialState = {
  dependantItems: null,
  dependencies: null,
  compactView: false,
  showTypes: 'all-deps'
};

export default function DependenciesDialog(props: DependenciesDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth={true}
      maxWidth="md"
    >
      <DependenciesDialogWrapper {...props} />
    </Dialog>
  );
}

function DependenciesDialogWrapper(props: DependenciesDialogProps) {
  const { item, dependenciesShown = 'depends-on', onDismiss, rootPath } = props;
  const [dialog, setDialog] = useSpreadState({
    ...dialogInitialState,
    item,
    dependenciesShown
  });
  useOnUnmount(props.onClosed);
  const [deps, setDeps] = useState(null);
  const [error, setError] = useState<ApiResponse>(null);
  const siteId = useActiveSiteId();
  const AUTHORING_BASE = useSelection<string>(state => state.env.AUTHORING_BASE);
  const defaultFormSrc = `${AUTHORING_BASE}/legacy/form`;
  const [editDialogConfig, setEditDialogConfig] = useSpreadState({
    open: false,
    src: defaultFormSrc,
    type: 'form',
    inProgress: false
  });
  const [contextMenu, setContextMenu] = useSpreadState({
    el: null,
    dependency: null
  });

  const handleEditorDisplay = item => {
    let type = 'controller';

    if ((item.isComponent && !item.isAsset) || item.isPage) {
      type = 'form';
    } else if (item.contentType === 'renderingTemplate') {
      type = 'template';
    }
    let src = `${defaultFormSrc}?site=${siteId}&path=${item.uri}&type=${type}`;

    setEditDialogConfig(
      {
        open: true,
        src,
        type: 'form'
      });
  };

  const depsSource = useMemo(() => {
    return { deps, error };
  }, [deps, error]);

  const resource = useStateResource<LegacyItem[], { deps: LegacyItem[], error: ApiResponse }>(
    depsSource,
    {
      shouldResolve: (source) => Boolean(source.deps),
      shouldReject: (source) => Boolean(source.error),
      shouldRenew: (source, resource) => resource.complete,
      resultSelector: (source) => source.deps,
      errorSelector: (source) => source.error
    }
  );

  const getDepsItems = useCallback((siteId: string, path: string, newItem?: boolean) => {
    if (dialog.dependenciesShown === 'depends-on') {
      if (dialog.dependantItems === null || newItem) {
        getDependant(siteId, path)
          .subscribe(dependantItems => {
              setDialog({
                dependantItems,
                ...(
                  newItem ? { dependencies: null } : {}
                )
              });
              setDeps(dependantItems);
            },
            (error) => setError(error));
      } else {
        setDeps(dialog.dependantItems);
      }
    } else {
      if (dialog.dependencies === null || newItem) {
        getSimpleDependencies(siteId, path)
          .subscribe(dependencies => {
              setDialog({
                dependencies,
                ...(
                  newItem ? { dependantItems: null } : {}
                )
              });
              setDeps(dependencies);
            },
            (error) => setError(error));
      } else {
        setDeps(dialog.dependencies);
      }
    }
    // eslint-disable-next-line
  }, [dialog.item, dialog.dependenciesShown, setDialog]);

  useEffect(() => {
    setDialog({ item });
  }, [item, setDialog]);

  useEffect(() => {
    setDialog({ dependenciesShown });
  }, [dependenciesShown, setDialog]);

  useEffect(() => {
    if (dialog.item) {
      getDepsItems(siteId, dialog.item.path, true);
    }
  }, [dialog.item, siteId, getDepsItems]);

  useEffect(() => {
    if (dialog.item) {
      getDepsItems(siteId, dialog.item.path);
    }
  }, [dialog.dependenciesShown, dialog.item, getDepsItems, siteId]);

  const setCompactView = (active: boolean) => {
    setDialog({ compactView: active });
  };

  const setShowTypes = (showTypes: string) => {
    setDialog({ showTypes });
  };

  const setItem = (item: SandboxItem) => {
    setDialog({ item });
  };

  const setDependenciesShow = (dependenciesShown: string) => {
    setDialog({ dependenciesShown });
  };

  const handleContextMenuClick = (event: React.MouseEvent<HTMLButtonElement>, dependency: LegacyItem) => {
    setContextMenu({
      el: event.currentTarget,
      dependency
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      el: null,
      dependency: null
    });
  };

  return (
    <DependenciesDialogUI
      resource={resource}
      item={dialog.item}
      rootPath={rootPath}
      setItem={setItem}
      compactView={dialog.compactView}
      setCompactView={setCompactView}
      showTypes={dialog.showTypes}
      setShowTypes={setShowTypes}
      dependenciesShown={dialog.dependenciesShown}
      setDependenciesShown={setDependenciesShow}
      onDismiss={onDismiss}
      isEditableItem={isEditableAsset}
      editDialogConfig={editDialogConfig}
      setEditDialogConfig={setEditDialogConfig}
      handleEditorDisplay={handleEditorDisplay}
      contextMenu={contextMenu}
      handleContextMenuClick={handleContextMenuClick}
      handleContextMenuClose={handleContextMenuClose}
    />
  );
}
