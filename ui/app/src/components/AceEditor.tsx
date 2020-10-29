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

import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { useMount } from '../utils/hooks';
import { pluckProps } from '../utils/object';

// @see https://github.com/ajaxorg/ace/wiki/Configuring-Ace
interface AceOptions {
  // editor options
  selectionStyle: 'line' | 'text';
  highlightActiveLine: boolean;
  highlightSelectedWord: boolean;
  readOnly: boolean;
  cursorStyle: 'ace' | 'slim' | 'smooth' | 'wide';
  mergeUndoDeltas: false | true | 'always';
  behavioursEnabled: boolean;
  wrapBehavioursEnabled: boolean;
  // this is needed if editor is inside scrollable page
  autoScrollEditorIntoView: boolean; // (defaults to false)
  // copy/cut the full line if selection is empty, defaults to false
  copyWithEmptySelection: boolean;
  useSoftTabs: boolean; // (defaults to false)
  navigateWithinSoftTabs: boolean; // (defaults to false)
  enableMultiselect: boolean; // # on by default
  // renderer options
  hScrollBarAlwaysVisible: boolean;
  vScrollBarAlwaysVisible: boolean;
  highlightGutterLine: boolean;
  animatedScroll: boolean;
  showInvisibles: boolean;
  showPrintMargin: boolean;
  printMarginColumn: number; // (defaults to 80)
  // shortcut for showPrintMargin and printMarginColumn
  printMargin: false | number;
  fadeFoldWidgets: boolean;
  showFoldWidgets: boolean; // (defaults to true)
  showLineNumbers: boolean; // (defaults to true)
  showGutter: boolean; // (defaults to true)
  displayIndentGuides: boolean; // (defaults to true)
  fontSize: number | string; // number or css font-size string
  fontFamily: string; // css font-family value
  // resize editor based on the contents of the editor until the number of lines reaches maxLines
  maxLines: number;
  minLines: number;
  // number of page sizes to scroll after document end (typical values are 0, 0.5, and 1)
  scrollPastEnd: number | boolean;
  fixedWidthGutter: boolean; // (defaults to false)
  theme: string; // to a theme e.g "ace/theme/textmate"
  // mouseHandler options
  scrollSpeed: number;
  dragDelay: number;
  dragEnabled: boolean; // (defaults to true)
  focusTimout: number;
  tooltipFollowsMouse: boolean;
  // session options
  firstLineNumber: number; // defaults to 1
  overwrite: boolean;
  newLineMode: 'auto' | 'unix' | 'windows';
  useWorker: boolean;
  // useSoftTabs: boolean;
  tabSize: number;
  wrap: boolean | number;
  foldStyle: 'markbegin' | 'markbeginend' | 'manual';
  mode: string; // path to a mode e.g "ace/mode/text"
  // editor options defined by extensions
  // to use this options the corresponding extension file needs to be loaded in addition to the ace.js
  // following options require ext-language_tools.js
  enableBasicAutocompletion: boolean;
  enableLiveAutocompletion: boolean;
  enableSnippets: boolean;
  // the following option requires ext-emmet.js and the emmet library
  enableEmmet: boolean;
  // the following option requires ext-elastic_tabstops_lite.js
  useElasticTabstops: boolean;
}

interface AceEditorProps extends Partial<AceOptions> {
  value?: any;
  className?: string;
  autoFocus?: boolean;
}

declare global {
  interface Window {
    ace: any;
  }
}

const aceOptions: Array<keyof AceOptions> = [
  'selectionStyle',
  'highlightActiveLine',
  'highlightSelectedWord',
  'readOnly',
  'cursorStyle',
  'mergeUndoDeltas',
  'behavioursEnabled',
  'wrapBehavioursEnabled',
  'autoScrollEditorIntoView',
  'copyWithEmptySelection',
  'useSoftTabs',
  'navigateWithinSoftTabs',
  'enableMultiselect',
  'hScrollBarAlwaysVisible',
  'vScrollBarAlwaysVisible',
  'highlightGutterLine',
  'animatedScroll',
  'showInvisibles',
  'showPrintMargin',
  'printMarginColumn',
  'printMargin',
  'fadeFoldWidgets',
  'showFoldWidgets',
  'showLineNumbers',
  'showGutter',
  'displayIndentGuides',
  'fontSize',
  'fontFamily',
  'maxLines',
  'minLines',
  'scrollPastEnd',
  'fixedWidthGutter',
  'theme',
  'scrollSpeed',
  'dragDelay',
  'dragEnabled',
  'focusTimout',
  'tooltipFollowsMouse',
  'firstLineNumber',
  'overwrite',
  'newLineMode',
  'useWorker',
  'tabSize',
  'wrap',
  'foldStyle',
  'mode',
  'enableBasicAutocompletion',
  'enableLiveAutocompletion',
  'enableSnippets',
  'enableEmmet',
  'useElasticTabstops'
];

// const aceModes = [];
// const aceThemes = [];

const useStyles = makeStyles(() => ({
  base: {
    width: '100%',
    height: '100%'
  }
}));

export default React.forwardRef(function AceEditor(props: AceEditorProps, ref) {
  const { value = '', autoFocus = false } = props;
  const classes = useStyles();
  const elemRef = useRef(null);
  const aceRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const options = pluckProps(props as AceOptions, true, ...aceOptions);
  useMount(() => {
    let unmounted = false;
    let initialized = false;
    let aceEditor;
    const init = () => {
      if (!unmounted) {
        aceEditor = window.ace.edit(elemRef.current, options);
        aceEditor.setValue(value, -1);
        autoFocus && aceEditor.focus();
        aceRef.current = aceEditor;
        if (ref) {
          typeof ref === 'function' ? ref(aceEditor) : (ref.current = aceEditor);
        }
        setInitialized(initialized = true);
      }
    };
    if (!window.ace) {
      const script = document.createElement('script');
      script.src = '/studio/static-assets/libs/ace/ace.js';
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }
    return () => {
      unmounted = true;
      if (initialized) {
        aceEditor.destroy();
      }
    };
  });
  useEffect(
    () => {
      if (initialized) {
        aceRef.current.setOptions(options);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      initialized,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ...aceOptions.map((o) => options[o])
    ]
  );
  useEffect(() => {
    if (initialized) {
      aceRef.current.setValue(value, -1);
    }
  }, [initialized, value]);
  return <pre ref={elemRef} className={props.className ?? classes.base} />;
});
