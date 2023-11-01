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

import FormItemPanel from '@/component/FormItemPanel';
import HelpDoc from '@/component/helpDoc';
import { formatMessage } from '@/util/intl';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import classNames from 'classnames';
import { variable } from './index';
import styles from './index.less';

const ENABLE_PATTERN_OPERATOR = false;

const timeFormatOptions = ['yyyy-MM-dd', 'HH:mm:ss', 'yyyyMMdd'].map((item) => ({
  label: item,
  value: item,
}));
const operatorOptions = ['+', '-'].map((item) => ({ label: item, value: item }));
const timeUnitOptions = [
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Points' }), //分
    value: 's',
  },
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Hours' }), //小时
    value: 'h',
  },
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Day' }), //日
    value: 'd',
  },
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Zhou' }), //周
    value: 'w',
  },
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Month' }), //月
    value: 'm',
  },
  {
    label: formatMessage({ id: 'odc.DataClearTask.CreateModal.VariableConfig.Year' }), //年
    value: 'y',
  },
];

interface IProps {}

const VariableConfig: React.FC<IProps> = (props) => {
  //
  return (
    <FormItemPanel
      keepExpand
      label={
        <Space>
          {
            formatMessage({
              id: 'odc.DataClearTask.CreateModal.VariableConfig.VariableConfiguration',
            }) /*变量配置*/
          }

          <span className={styles.desc}>
            <HelpDoc leftText isTip doc="dataClearVariablesDoc">
              变量可在清理范围的清理条件中引用 (可选)
            </HelpDoc>
          </span>
        </Space>
      }
    >
      <Space direction="vertical">
        <Space className={styles.infoLabel}>
          <div style={{ width: '194px' }}>
            {
              formatMessage({
                id: 'odc.DataClearTask.CreateModal.VariableConfig.VariableName',
              }) /*变量名*/
            }
          </div>
          <div style={{ width: '170px' }}>
            {
              formatMessage({
                id: 'odc.DataClearTask.CreateModal.VariableConfig.TimeFormat',
              }) /*时间格式*/
            }
          </div>
          <div style={{ width: '250px' }}>
            <HelpDoc leftText isTip doc="dataArchiveTimeDoc">
              {
                formatMessage({
                  id: 'odc.DataClearTask.CreateModal.VariableConfig.TimeOperation',
                }) /*时间运算*/
              }
            </HelpDoc>
          </div>
        </Space>
        <Form.List name="variables">
          {(fields, { add, remove }) => (
            <div className={styles.infoBlock}>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className={classNames(styles.variables, {
                    [styles.delete]: fields?.length > 1,
                  })}
                >
                  <Form.Item {...restField} style={{ width: '194px' }} name={[name, 'name']}>
                    <Input
                      placeholder={formatMessage({
                        id: 'odc.DataClearTask.CreateModal.VariableConfig.PleaseEnter',
                      })} /*请输入*/
                    />
                  </Form.Item>
                  <Form.Item {...restField} style={{ width: '170px' }} name={[name, 'format']}>
                    <Select
                      placeholder={formatMessage({
                        id: 'odc.DataClearTask.CreateModal.VariableConfig.PleaseSelect',
                      })}
                      /*请选择*/ options={timeFormatOptions}
                    />
                  </Form.Item>
                  <Form.List name={[name, 'pattern']}>
                    {(subFields, { add: _add, remove: _remove }) => {
                      const disabledAdd = subFields.length >= 3;
                      return (
                        <div className={styles.infoBlock}>
                          {subFields.map(({ key, name, ...restField }) => (
                            <div className={styles.pattern}>
                              <Form.Item {...restField} name={[name, 'operator']}>
                                <Select
                                  placeholder={formatMessage({
                                    id: 'odc.DataClearTask.CreateModal.VariableConfig.PleaseSelect',
                                  })} /*请选择*/
                                  options={operatorOptions}
                                />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'step']}>
                                <InputNumber
                                  placeholder={formatMessage({
                                    id: 'odc.DataClearTask.CreateModal.VariableConfig.PleaseEnter',
                                  })}
                                  /*请输入*/ min={1}
                                />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'unit']}>
                                <Select
                                  placeholder={formatMessage({
                                    id: 'odc.DataClearTask.CreateModal.VariableConfig.PleaseSelect',
                                  })} /*请选择*/
                                  options={timeUnitOptions}
                                />
                              </Form.Item>
                              {ENABLE_PATTERN_OPERATOR && (
                                <>
                                  <Button type="text" disabled={disabledAdd}>
                                    <PlusOutlined onClick={() => _add()} />
                                  </Button>
                                  <Button type="text">
                                    <MinusOutlined
                                      onClick={() => {
                                        if (subFields?.length > 1) _remove(name);
                                      }}
                                    />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  </Form.List>
                  {fields?.length > 1 && <DeleteOutlined onClick={() => remove(name)} />}
                </div>
              ))}
              <Form.Item style={{ marginBottom: 0, width: '100%' }}>
                <Button type="dashed" onClick={() => add(variable)} block icon={<PlusOutlined />}>
                  {
                    formatMessage({
                      id: 'odc.DataClearTask.CreateModal.VariableConfig.AddVariables',
                    }) /*添加变量*/
                  }
                </Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </Space>
    </FormItemPanel>
  );
};

export default VariableConfig;
