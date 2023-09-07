import { ConnectType, TaskType } from '@/d.ts';
import { IDataSourceModeConfig } from '../interface';
import MySQLColumnExtra from './MySQLColumnExtra';
import { haveOCP } from '@/util/env';

const tableConfig = {
  enableTableCharsetsAndCollations: true,
  enableConstraintOnUpdate: true,
  ColumnExtraComponent: MySQLColumnExtra,
  paritionNameCaseSensitivity: true,
  enableIndexesFullTextType: true,
  enableAutoIncrement: true,
  enableIndexScope: true,
  enableIndexVisible: true,
  type2ColumnType: {
    id: 'int',
    name: 'varchar',
    date: 'datetime',
    time: 'timestamp',
  },
};

const functionConfig: IDataSourceModeConfig['schema']['func'] = {
  params: ['paramName', 'dataType', 'dataLength'],
  defaultValue: {
    dataLength: 45,
  },
  dataNature: true,
  sqlSecurity: true,
  deterministic: true,
};

const procedureConfig: IDataSourceModeConfig['schema']['proc'] = {
  params: ['paramName', 'paramMode', 'dataType', 'dataLength'],
  defaultValue: {
    dataLength: 45,
  },
  dataNature: true,
  sqlSecurity: true,
  deterministic: true,
};

const items: Record<
  ConnectType.OB_MYSQL | ConnectType.CLOUD_OB_MYSQL | ConnectType.ODP_SHARDING_OB_MYSQL,
  IDataSourceModeConfig
> = {
  [ConnectType.OB_MYSQL]: {
    connection: {
      address: {
        items: ['ip', 'port', 'cluster', 'tenant'],
      },
      account: true,
      sys: true,
      ssl: true,
    },
    features: {
      task: Object.values(TaskType),
      obclient: true,
      recycleBin: true,
      sqlExplain: true,
      supportOBProxy: true,
    },
    schema: {
      table: tableConfig,
      func: functionConfig,
      proc: procedureConfig,
    },
    sql: {
      language: 'obmysql',
      escapeChar: '`',
    },
  },
  [ConnectType.CLOUD_OB_MYSQL]: {
    connection: {
      address: {
        items: ['ip', 'port'],
      },
      account: true,
      sys: true,
      ssl: true,
    },
    features: {
      task: Object.values(TaskType),
      obclient: true,
      recycleBin: true,
      sqlExplain: true,
      supportOBProxy: true,
    },
    schema: {
      table: tableConfig,
      func: functionConfig,
      proc: procedureConfig,
    },
    sql: {
      language: 'obmysql',
      escapeChar: '`',
    },
  },
  [ConnectType.ODP_SHARDING_OB_MYSQL]: {
    connection: {
      address: {
        items: ['ip', 'port'],
      },
      account: true,
      sys: false,
      ssl: true,
      defaultSchema: true,
    },
    features: {
      task: [TaskType.ASYNC, TaskType.SQL_PLAN, TaskType.EXPORT_RESULT_SET],
      obclient: false,
      recycleBin: false,
      sqlExplain: false,
      supportOBProxy: true,
    },
    schema: {
      table: tableConfig,
      func: functionConfig,
      proc: procedureConfig,
    },
    sql: {
      language: 'obmysql',
      escapeChar: '`',
    },
  },
};
if (haveOCP()) {
  delete items[ConnectType.ODP_SHARDING_OB_MYSQL];
  delete items[ConnectType.CLOUD_OB_MYSQL];
}

export default items;
