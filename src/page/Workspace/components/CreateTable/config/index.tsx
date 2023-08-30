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

import { ConnectionMode } from '@/d.ts';
import { TableForeignConstraintOnDeleteType } from '@/d.ts/table';
import { TableColumn } from '../interface';
import MySQLColumnExtra from './MySQLColumnExtra';
import OracleColumnExtra from './OracleColumnExtra';

export type columnExtraComponent = React.FC<{
  column: TableColumn;
  originColumns: TableColumn[];
  onChange: (newColumn: TableColumn) => void;
  dialectType?: ConnectionMode;
}>;

interface ICreateConfig {
  /**
   * 是否开启表的编码
   */
  enableTableCharsetsAndCollations?: boolean;
  /**
   * 约束是否可开启关闭
   */
  constraintEnableConfigurable?: boolean;
  /**
   * 约束是否可配置延迟状态
   */
  constraintDeferConfigurable?: boolean;
  /**
   * 是否有检查约束
   */
  enableCheckConstraint?: boolean;
  /**
   * 是否有级联更新
   */
  enableConstraintOnUpdate?: boolean;
  /**
   * 外键约束级联删除的选项，默认为全部
   */
  constraintForeignOnDeleteConfig?: TableForeignConstraintOnDeleteType[];
  /**
   * column 配置 extra 信息
   */
  ColumnExtraComponent?: columnExtraComponent;
  /**
   * parition相关配置
   */
  disableRangeColumnsPartition?: boolean;
  disableListColumnsPartition?: boolean;
  disableKeyPartition?: boolean;
  disableLinearHashPartition?: boolean;
  /**
   * 分区名大小写敏感
   */
  paritionNameCaseSensitivity?: boolean;
  /**
   * 是否有fulltext的索引方法
   */
  enableIndexesFullTextType?: boolean;
}

const SQLCreateTableConfig: Partial<Record<ConnectionMode, ICreateConfig>> = {
  [ConnectionMode.OB_MYSQL]: {
    enableTableCharsetsAndCollations: true,
    enableConstraintOnUpdate: true,
    ColumnExtraComponent: MySQLColumnExtra,
    paritionNameCaseSensitivity: true,
    enableIndexesFullTextType: true,
  },
  [ConnectionMode.OB_ORACLE]: {
    constraintEnableConfigurable: true,
    constraintDeferConfigurable: true,
    enableCheckConstraint: true,
    ColumnExtraComponent: OracleColumnExtra,
    constraintForeignOnDeleteConfig: [
      TableForeignConstraintOnDeleteType.CASCADE,
      TableForeignConstraintOnDeleteType.NO_ACTION,
      TableForeignConstraintOnDeleteType.SET_NULL,
    ],
    disableRangeColumnsPartition: true,
    disableListColumnsPartition: true,
    disableKeyPartition: true,
    disableLinearHashPartition: true,
  },
};
SQLCreateTableConfig[ConnectionMode.MYSQL] = SQLCreateTableConfig[ConnectionMode.OB_MYSQL];

export function useTableConfig(dialectType: ConnectionMode) {
  return SQLCreateTableConfig[dialectType] || {};
}
export default SQLCreateTableConfig;
