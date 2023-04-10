import React, { useEffect, useMemo, useRef, useState } from 'react';

import * as monaco from 'monaco-editor';

import appConfig from '@/constant/appConfig';
import { ConnectionStore } from '@/store/connection';
import { SettingStore } from '@/store/setting';
import editorUtils from '@/util/editor';
import { getUnWrapedSnippetBody } from '@/util/snippet';
import { inject, observer } from 'mobx-react';
import styles from './index.less';
import { apply as markerPluginApply } from './plugins/marker';
import { getModelService } from './plugins/ob-language/service';

export interface IEditor extends monaco.editor.IStandaloneCodeEditor {
  doFormat: () => void;
  getSelectionContent: () => string;
}

export interface IProps {
  settingStore?: SettingStore;
  connectionStore?: ConnectionStore;
  /**
   * 默认值
   */
  defaultValue?: string;
  /**
   *  双向绑定value
   */
  value?: string;
  /**
   * value 改变事件
   */
  onValueChange?: (v: string) => void;

  language?: string;

  theme?: string;

  readOnly?: boolean;

  onEditorCreated?: (editor: IEditor) => void;
}

const MonacoEditor: React.FC<IProps> = function ({
  defaultValue,
  language,
  value,
  theme,
  readOnly,
  settingStore,
  connectionStore,
  onValueChange,
  onEditorCreated,
}) {
  const [innerValue, _setInnerValue] = useState<string>(defaultValue);
  const settingTheme = settingStore.theme.editorTheme;
  function setInnerValue(v: string) {
    if (readOnly) {
      return;
    }
    _setInnerValue(v);
    if (onValueChange) {
      onValueChange(v);
    }
  }

  const domRef = useRef<HTMLDivElement>(null);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  const themeValue = useMemo(() => {
    if (!theme) {
      return settingTheme;
    }
    return theme;
  }, [theme, settingTheme]);

  useEffect(() => {
    if (typeof value === 'undefined' || value == innerValue) {
      return;
    }
    /**
     * value 与 innervalue 不匹配，需要更新到value，不过这个时候需要触发onchange，因为这是被动改动
     */
    editorRef.current.setValue(value);
    _setInnerValue(value);
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly,
        theme: themeValue,
      });
    }
  }, [readOnly, themeValue]);

  async function initPlugin() {
    const module = await import('./plugins/ob-language/index');
    const plugin = module.register();
    plugin.setModelOptions(
      editorRef.current.getModel().id,
      getModelService({
        modelId: editorRef.current.getModel().id,
        delimiter: connectionStore.delimiter,
      }),
    );
    markerPluginApply(editorRef.current.getModel());
  }

  async function initEditor() {
    editorRef.current = monaco.editor.create(domRef.current, {
      value: innerValue,
      language: language || 'sql',
      theme: themeValue,
      minimap: { enabled: false },
      unicodeHighlight: {
        invisibleCharacters: false,
        ambiguousCharacters: false,
      },
      readOnly: readOnly,
    });
    await initPlugin();
    monaco.editor.setModelLanguage(editorRef.current.getModel(), language || 'sql');
    editorRef.current.onDidChangeModelContent((e) => {
      /**
       * editor value change
       */
      const currentValue = editorRef.current.getValue();
      setInnerValue(currentValue);
    });
    domRef.current.addEventListener('paste', (e) => {
      const data = e.clipboardData.getData('text/html');
      const isODCSnippet = data.indexOf('!isODCSnippet_') > -1;
      if (isODCSnippet) {
        e.preventDefault();
      }
      const text = getUnWrapedSnippetBody(data);
      editorUtils.insertSnippetTemplate(editorRef.current, text);
    });
    onEditorCreated?.(
      Object.assign(editorRef.current, {
        doFormat() {
          const selection = editorRef.current
            .getModel()
            .getValueInRange(editorRef.current.getSelection());
          if (!selection) {
            editorRef.current.trigger('editor', 'editor.action.formatDocument', null);
          } else {
            editorRef.current.trigger('editor', 'editor.action.formatSelection', null);
          }
        },
        getSelectionContent() {
          return editorRef.current.getModel().getValueInRange(editorRef.current.getSelection());
        },
      }),
    );
  }

  useEffect(() => {
    if (domRef.current && !editorRef.current) {
      window.MonacoEnvironment = {
        getWorkerUrl(workerId: string, label: string) {
          if (!appConfig.worker.needOrigin) {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(
              `importScripts('${window.publicPath}editor.worker.js')`,
            )}`;
          } else {
            const url = new URL(`${window.publicPath}editor.worker.js`, location.origin);
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(
              `importScripts('${url.href}')`,
            )}`;
          }
        },
      };
      initEditor();
    }
  }, [domRef.current, initEditor]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={domRef} className={styles.editor}></div>
    </div>
  );
};

export default inject('settingStore', 'connectionStore')(observer(MonacoEditor));
