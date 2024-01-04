/*
 * Copyright 2023 OceanBase
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const pkg = require('../package.json');
const cpx = require('cpx').copySync;

const baseDir = path.join(__dirname, '..');

const localePath = path.join(baseDir, 'src/locales');

const outputPath = path.join(localePath, './must/strings');

const exclude = 'src/main';

const languages = ['en-US', 'zh-CN'];

function matchText(text, path) {
  const isConsoleLog = /^console\.log\(/gi.test(path?.parentPath?.toString());
  let isFormattedMessage = false;
  // 识别 <FormatMessage> 标签的文字层级
  try {
    isFormattedMessage = /^\<FormattedMessage/g.test(
      path.parentPath.parentPath.parentPath.parentPath.parentPath.toString(),
    );
  } catch (e) {}
  return /[\u{4E00}-\u{9FFF}]+(?![\u3000-\u303F\uFF01-\uFF5E])/gumi.test(text) && !isConsoleLog;
}
const commentContent = 
`/*
 * Copyright 2023 OceanBase
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */\n`;
const config = {
  name: pkg.name,
  entry: 'src',
  output: outputPath,
  sep: '.',
  exclude: (path) => {
    return (
      path.includes('src/.umi') ||
      path.includes('src/locales') ||
      (!!exclude && path.includes(exclude))
    ); // 不处理 .umi 下的文件
  },
  sourceLang: 'zh-CN',
  targetLang: 'en-US',
  matchFunc: matchText,
  injectContent: {
    import: "import { formatMessage } from '@/util/intl';\n",
    importPath: '@/util/intl',
    method: `formatMessage({id: '$key$' })`,
    headComment: {
      hasHeadComment: false,
      commentContent,
    }
  },
};

module.exports = config;
