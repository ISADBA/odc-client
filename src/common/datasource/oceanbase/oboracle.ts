import { ConnectType } from '@/d.ts';
import { IDataSourceModeConfig } from '../interface';
import OracleColumnExtra from './OracleColumnExtra';
import { TableForeignConstraintOnDeleteType } from '@/d.ts/table';
import { haveOCP } from '@/util/env';

const oracleTableConfig = {
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
  type2ColumnType: {
    id: 'NUMBER',
    name: 'VARCHAR',
    date: 'DATE',
    time: 'TIMESTAMP',
  },
};

const functionConfig: IDataSourceModeConfig['schema']['func'] = {
  params: ['paramName', 'paramMode', 'dataType', 'defaultValue'],
};

const items: Record<ConnectType.CLOUD_OB_ORACLE | ConnectType.OB_ORACLE, IDataSourceModeConfig> = {
  [ConnectType.OB_ORACLE]: {
    priority: 2,
    connection: {
      address: {
        items: ['ip', 'port', 'cluster', 'tenant'],
      },
      account: true,
      sys: true,
      ssl: true,
    },
    features: {
      task: [],
      allTask: true,
      obclient: true,
      recycleBin: true,
      sqlExplain: true,
      compile: true,
      plEdit: true,
      anonymousBlock: true,
    },
    schema: {
      table: oracleTableConfig,
      func: functionConfig,
      proc: functionConfig,
    },
    sql: {
      language: 'oboracle',
      escapeChar: '"',
      plParamMode: 'text',
    },
  },
  [ConnectType.CLOUD_OB_ORACLE]: {
    connection: {
      address: {
        items: ['ip', 'port'],
      },
      account: true,
      sys: true,
      ssl: true,
    },
    features: {
      task: [],
      allTask: true,
      obclient: true,
      recycleBin: true,
      sqlExplain: true,
      compile: true,
      plEdit: true,
      anonymousBlock: true,
    },
    schema: {
      table: oracleTableConfig,
      func: functionConfig,
      proc: functionConfig,
    },
    sql: {
      language: 'oboracle',
      escapeChar: '"',
      plParamMode: 'text',
    },
  },
};

if (haveOCP()) {
  delete items[ConnectType.CLOUD_OB_ORACLE];
}

export default items;
