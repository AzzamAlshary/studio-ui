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

import React, { useEffect, useRef, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { get, post } from '../utils/ajax';
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import Typography from '@material-ui/core/Typography';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from '@material-ui/icons/Search';
import Grid from '@material-ui/core/Grid';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import BlueprintCard from './BlueprintCard';
import Spinner from "./Spinner";
import InputBase from '@material-ui/core/InputBase';
import makeStyles from '@material-ui/core/styles/makeStyles';
import SwipeableViews from 'react-swipeable-views';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';
import DialogActions from '@material-ui/core/DialogActions';
import BluePrintForm from './BluePrintForm';
import BluePrintReview from "./BluePrintReview";
import CircularProgress from '@material-ui/core/CircularProgress';
import { Blueprint } from '../models/Blueprint';
import { Labels, Site, SiteState, Views } from '../models/Site';


const views: Views = {
  0: {
    title: 'Create Site',
    subtitle: 'Choose creation strategy: start from an existing git repo or create based on the blueprint to that suits you best.'
  },
  1: {
    title: 'Create Site',
    subtitle: 'Name and describe your blueprint site',
    btnText: 'Finish'
  },
  2: {
    title: 'Finish',
    subtitle: 'Review set up summary and crete your site',
    btnText: 'Create Site'
  }
};

const siteInitialState: SiteState = {
  blueprint: null,
  siteId: '',
  siteIdExist: false,
  description: '',
  push_site: false,
  use_remote: false,
  repo_url: '',
  repo_authentication: 'none',
  repo_remote_branch: '',
  repo_remote_name: '',
  repo_password: '',
  repo_username: '',
  repo_token: '',
  repo_key: '',
  submitted: false,
  selectedView: 0
};

const CustomTabs = withStyles({
  root: {
    borderBottom: 'none',
    minHeight: 'inherit'
  }
})(Tabs);

const dialogTitleStyles = () => ({
  root: {
    margin: 0,
    padding: '20px',
    paddingBottom: '20px',
    background: '#EBEBF0'
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

const useStyles = makeStyles((theme: any) => ({
  paperScrollPaper: {
    height: '100%',
    maxHeight: '700px'
  },
  search: {
    position: 'relative',
    width: 'calc(100% - 40px)',
    margin: 'auto',
    marginTop: '20px',
  },
  searchIcon: {
    width: theme.spacing(7),
    color: '#828282',
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  inputRoot: {
    color: 'inherit',
    width: '100%'
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    width: '100%',
    backgroundColor: '#EBEBF0',
    borderRadius: '5px',
    '&:focus': {
      backgroundColor: '#FFFFFF',
      boxShadow: '0px 0px 3px rgba(65, 69, 73, 0.15), 0px 4px 4px rgba(65, 69, 73, 0.15)'
    }
  },
  dialogContent: {
    padding: '0',
  },
  slide: {
    padding: 20,
    minHeight: '492px',
  },
  dialogActions: {
    background: '#EBEBF0',
    padding: '8px 20px'
  },
  backBtn: {
    marginRight: 'auto'
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    background: '#EBEBF0'
  },
  simpleTab: {
    minWidth: '80px',
    minHeight: '0',
    padding: '0 0 5px 0',
    marginRight: '20px',
    opacity: 1,
    '& span': {
      textTransform: 'none',
      color: '#2F2707'
    }
  },
  tabIcon: {
    color: '#000000',
    fontSize: '1.2rem',
    cursor: 'pointer',
    '&.selected': {
      color: '#007AFF'
    }
  },
  loading: {
    position: 'relative',
    padding: 16,
    flexGrow: 1
  },
  BtnSpinner: {
    color: 'white',
    marginLeft: '10px'
  },
  loadingBtn: {
    backgroundColor: '#586d82',
    pointerEvents: 'none'
  },
  creatingOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 10
  }
}));

// @ts-ignore
const DialogTitle = withStyles(dialogTitleStyles)((props: any) => {
  const {classes, onClose, selectedView} = props;
  // @ts-ignore
  const {title, subtitle} = views[selectedView];
  return (
    <MuiDialogTitle disableTypography className={classes.root}>
      <div className={classes.title}>
        <Typography variant="h6">{title}</Typography>
        {onClose ? (
          <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
            <CloseIcon/>
          </IconButton>
        ) : null}
      </div>
      <Typography variant="subtitle1">{subtitle}</Typography>
    </MuiDialogTitle>
  );
});

const labels: Labels = {
  buildIn: 'Build in',
  marketplace: 'Marketplace',
  back: 'Back'
};

function CreateSiteDialog(props: any) {
  const [blueprints, setBlueprints] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(props.open || false);
  const [searchSelected, setSearchSelected] = useState(false);
  const [creatingSite, setCreatingSite] = useState(false);
  const [site, setSite] = useState(siteInitialState);
  const classes = useStyles({});
  const swipeableViews = useRef(null);

  useEffect(() => {
      if (swipeableViews.current) {
        swipeableViews.current.updateHeight();
      }
      if (tab === 0 && blueprints === null) {
        fetchBlueprints();
      }
      if (tab === 1 && marketplace === null) {
        fetchMarketPlace();
      }
    },
    // eslint-disable-next-line
    [tab],
  );

  function handleClose() {
    setOpen(false);
  }

  function handleSearchClick() {
    setSearchSelected(!searchSelected);
  }

  function handleBlueprintSelected(blueprint: Blueprint, view: number) {
    const _reset = {...siteInitialState};
    _reset.blueprint = blueprint;
    _reset.selectedView = view;
    _reset.submitted = false;
    setSite(_reset);
  }

  function handleBack() {
    let back = site.selectedView - 1;
    setSite({...site, selectedView: back});
  }

  function handleChange(e: any, value: number) {
    setTab(value);
  }

  function handleGoTo(step: number) {
    setSite({...site, selectedView: step});
  }

  function handleFinish(e: any) {
    e && e.preventDefault();
    if (site.selectedView === 1) {
      setSite({...site, submitted: true});
    }
    if (validateForm()) {
      if (site.selectedView === 2) {
        const params = createParams();
        setCreatingSite(true);
        createSite(params);
      } else {
        setSite({...site, selectedView: 2});
      }
    }
  }

  function validateForm() {
    if (!site.siteId || site.siteIdExist) {
      return false;
    } else if (site.push_site) {
      if (!site.repo_url) return false;
      else if (!site.repo_remote_name) return false;
      else if (site.repo_authentication === 'basic' && (!site.repo_username || !site.repo_password)) return false;
      else if (site.repo_authentication === 'token' && (!site.repo_username || !site.repo_token)) return false;
      else return !(site.repo_authentication === 'key' && !site.repo_key);
    } else {
      return true;
    }
  }

  function createParams() {
    if (site.blueprint) {
      const params: Site = {
        site_id: site.siteId,
        description: site.description,
        single_branch: false,
        authentication_type: site.repo_authentication
      };
      if (site.blueprint.id !== 'GIT') {
        params.blueprint = site.blueprint.id;
        params.use_remote = site.push_site;
      } else {
        params.use_remote = true;
      }
      if (site.repo_remote_name) params.remote_name = site.repo_remote_name;
      if (site.repo_url) params.remote_url = site.repo_url;
      if (site.repo_remote_branch) {
        params.remote_branch = site.repo_remote_branch;
        params.sandbox_branch = site.repo_remote_branch;
      }
      if (site.repo_authentication === 'basic') {
        params.remote_username = site.repo_username;
        params.remote_password = site.repo_password;
      }
      if (site.repo_authentication === 'token') {
        params.remote_username = site.repo_username;
        params.remote_token = site.repo_token;
      }
      if (site.repo_authentication === 'key') params.remote_private_key = site.repo_username;
      params.create_option = site.push_site ? 'push' : 'clone';
      return params;
    }
  }

  function createSite(site: Site) {
    post('/studio/api/1/services/api/1/site/create.json', site, {
      'X-XSRF-TOKEN': '060f063c-7812-4426-abfa-a1169d1e300c',
      'Content-Type': 'application/json'
    })
      .subscribe(
        () => {
          setCreatingSite(false);
          handleClose();
        },
        (error: any) => {
          console.log(error.response.message);
          setCreatingSite(false);
        }
      )
  }

  function fetchMarketPlace() {
    get('/studio/api/2/marketplace/search?type=blueprint')
      .subscribe(
        ({response}) => {
          setMarketplace(response.plugins);
        },
        () => {
          console.log('error')
        }
      );
  }

  function fetchBlueprints() {
    get('/studio/api/2/sites/available_blueprints')
      .subscribe(
        ({response}) => {
          const _blueprints: [Blueprint] = [{
            id: 'GIT',
            name: 'Remote Git Repository',
            description: 'Create site from a existing remote git repository',
            media: {
              screenshots: [
                {
                  description: 'Git logo',
                  title: 'Remote Git Repository',
                  url: 'https://www.embarcados.com.br/wp-content/uploads/2015/02/imagem-de-destaque-39.png'
                }
              ]
            }
          }];
          response.blueprints.forEach((bp: any) => {
            _blueprints.push(bp.plugin);
          });
          setBlueprints(_blueprints);
        },
        () => {
          console.log('error')
        }
      );
  }

  function checkNameExist(e: any) {
    get(`/studio/api/1/services/api/1/site/exists.json?site=${e.target.value}`)
      .subscribe(
        ({response}) => {
          setSite({...site, siteIdExist: response.exists});
        },
        () => {
          console.log('error')
        }
      );
  }

  function renderBluePrints(list: [Blueprint]) {
    return list.map((item: Blueprint) => {
      return (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <BlueprintCard blueprint={item} onBlueprintSelected={handleBlueprintSelected} interval={5000}/>
        </Grid>
      );
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="create-site-dialog" disableBackdropClick={true}
            fullWidth={true} maxWidth={'md'} classes={{paperScrollPaper: classes.paperScrollPaper}}>
      {creatingSite && <div className={classes.creatingOverlay}/>}
      <DialogTitle id="create-site-dialog" onClose={handleClose} selectedView={site.selectedView}/>
      {
        (site.selectedView === 0) &&
        <div className={classes.tabs}>
          <CustomTabs value={tab} onChange={handleChange} aria-label="blueprint tabs">
              <Tab label={labels.buildIn} className={classes.simpleTab}/>
              <Tab label={labels.marketplace} className={classes.simpleTab}/>
          </CustomTabs>
          <SearchIcon className={clsx(classes.tabIcon, searchSelected && 'selected')} onClick={handleSearchClick}/>
      </div>
      }
      {
        ((tab === 0 && blueprints) || (tab === 1 && marketplace)) ?
        <DialogContent className={classes.dialogContent}>
          {
            (searchSelected && site.selectedView === 0) &&
            <div className={classes.search}>
                <div className={classes.searchIcon}>
                    <SearchIcon/>
                </div>
                <InputBase
                    placeholder="Search…"
                    autoFocus={true}
                    classes={{
                      root: classes.inputRoot,
                      input: classes.inputInput,
                    }}
                    inputProps={{'aria-label': 'search'}}
                />
            </div>
          }
          <SwipeableViews
            animateHeight
            ref={swipeableViews}
            index={site.selectedView}>
            <div className={classes.slide}>
              {
                (tab === 0) ?
                <div>
                  <Grid container spacing={3}>{renderBluePrints(blueprints)}</Grid>
                </div> :
                <div>
                  <Grid container spacing={3}>{renderBluePrints(marketplace)}</Grid>
                </div>
              }
            </div>
            <div className={classes.slide}>
              {
                site.blueprint &&
                <BluePrintForm swipeableViews={swipeableViews} inputs={site} setInputs={setSite}
                             onSubmit={handleFinish} onCheckNameExist={checkNameExist}
                             blueprint={site.blueprint}/>
              }
            </div>
            <div className={classes.slide}>
              {site.blueprint &&
              <BluePrintReview onGoTo={handleGoTo} inputs={site} blueprint={site.blueprint}/>}
            </div>
          </SwipeableViews>
        </DialogContent>
        :
        <div className={classes.loading}>
          <Spinner/>
        </div>
      }
      {
        (site.selectedView !== 0) &&
        <DialogActions className={classes.dialogActions}>
          <Button variant="contained" className={classes.backBtn} onClick={handleBack}>
              {labels.back}
          </Button>
          <Button variant="contained" color="primary" disableRipple={creatingSite}
                  className={creatingSite ? classes.loadingBtn : ''} onClick={handleFinish}>
            {views[site.selectedView].btnText}
            {creatingSite && <CircularProgress size={20} className={classes.BtnSpinner}/>}
          </Button>
        </DialogActions>
      }
    </Dialog>
  )
}

export default CreateSiteDialog;
