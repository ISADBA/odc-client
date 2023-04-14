import { ConnectionMode, IColumnSizeMap } from '@/d.ts';
import connection from '@/store/connection';
import { formatMessage } from '@/util/intl';
import { Form, Select, Table } from 'antd';
import { FormInstance } from 'antd/es/form/Form';
import { ColumnProps } from 'antd/es/table';
import React, { useState } from 'react';
import RuleContent, { getDefaultValue } from './RuleContent';
import RuleSelect from './RuleSelect';
import { IMockFormColumn, IMockFormData } from './type';

const { Option } = Select;

interface IRuleConfigTableProps {
  value?: IMockFormColumn[];
  form?: FormInstance<IMockFormData>;
  columnSizeMap?: IColumnSizeMap;
  readonly?: boolean;
  dbMode?: ConnectionMode;
}

const RuleConfigTable: React.FC<IRuleConfigTableProps> = (props) => {
  const { value = [], form, columnSizeMap, readonly, dbMode } = props;
  const taskDbMode = dbMode || connection.connection.dbMode;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function initColumns(): ColumnProps<IMockFormColumn>[] {
    return [
      {
        title: formatMessage({
          id: 'odc.component.DataMockerDrawer.RuleConfigTable.FieldName',
        }), // 字段名称
        dataIndex: 'columnName',
        width: 200,
        ellipsis: true,
      },

      {
        title: formatMessage({
          id: 'odc.component.DataMockerDrawer.RuleConfigTable.FieldType',
        }), // 字段类型
        dataIndex: 'columnType',
        width: 120,
        render(columnType, t, index) {
          if (readonly) {
            return columnType;
          }
          const column = t.columnObj;
          switch (columnType) {
            case 'NUMBER': {
              if (column?.precision) {
                return `NUMBER(${column?.precision}, ${column?.scale})`;
              }
              return 'NUMBER';
            }
            case 'CHAR':
            case 'VARCHAR2':
            case 'VARCHAR': {
              return `${columnType}(${column?.width})`;
            }
            default: {
              return columnType;
            }
          }
        },
      },

      {
        title: formatMessage({
          id: 'odc.component.DataMockerDrawer.RuleConfigTable.Rules',
        }), // 规则
        dataIndex: 'rule',
        width: 120,
        render(_, t, index) {
          index = (currentPage - 1) * pageSize + index;
          return (
            <Form.Item
              style={{ marginBottom: 0 }}
              shouldUpdate
              name={['columns', index, 'rule']}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'odc.component.DataMockerDrawer.RuleConfigTable.SelectARule',
                  }), // 请选择规则
                },
              ]}
            >
              <RuleSelect
                dbMode={taskDbMode}
                readonly={readonly}
                onChange={(v) => {
                  const columns: IMockFormData['columns'] = [...form?.getFieldValue('columns')];
                  columns[index] = { ...columns[index] };
                  columns[index].rule = v as any;
                  columns[index].typeConfig = getDefaultValue(
                    taskDbMode,
                    t.columnType,
                    v,
                    columnSizeMap[t.columnName],
                  );

                  form?.setFieldsValue({ columns });
                }}
                columnType={t.columnType}
              />
            </Form.Item>
          );
        },
      },

      {
        title: formatMessage({
          id: 'odc.component.DataMockerDrawer.RuleConfigTable.Rules.1',
        }), // 细则
        dataIndex: 'typeConfig',
        render(_, t, index) {
          index = (currentPage - 1) * pageSize + index;
          return (
            <Form.Item
              style={{ marginBottom: 0 }}
              shouldUpdate
              name={['columns', index, 'typeConfig']}
            >
              <RuleContent
                readonly={readonly}
                ruleType={t.rule}
                columnName={t.columnName}
                columnType={t.columnType}
                dbMode={taskDbMode}
                columnSizeMap={columnSizeMap}
              />
            </Form.Item>
          );
        },
      },
    ];
  }
  return (
    <Table
      className={
        readonly
          ? 'o-mini-table o-mini-table--no-border'
          : 'o-middle-table o-middle-table--no-border'
      }
      columns={initColumns()}
      bordered
      rowClassName={(record, i) => {
        if (!readonly) {
          return;
        }
        return i % 2 === 0 ? 'o-min-table-even' : 'o-min-table-odd';
      }}
      dataSource={value}
      onChange={(page) => {
        setCurrentPage(page.current);
      }}
      pagination={{
        pageSize,
        current: currentPage,
        showSizeChanger: value.length >= 20 ? true : false,
        onShowSizeChange(current, size) {
          setPageSize(size);
        },
      }}
    />
  );
};

export default RuleConfigTable;
