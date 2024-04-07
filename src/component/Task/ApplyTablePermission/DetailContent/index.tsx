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

import DisplayTable from '@/component/DisplayTable';
import { SimpleTextItem } from '@/component/Task/component/SimpleTextItem';
import type { IApplyTablePermissionTaskParams, TaskDetail } from '@/d.ts';
import { getFormatDateTime } from '@/util/utils';
import { Descriptions, Divider } from 'antd';
import { getExpireTimeLabel, permissionOptionsMap } from '../';

const getConnectionColumns = () => {
  return [
    {
      dataIndex: 'databaseName',
      title: '数据库',
      ellipsis: true,
      width: 240,
    },
    {
      dataIndex: 'tableName',
      title: '表',
      ellipsis: true,
      width: 240,
    },
    {
      dataIndex: 'dataSourceName',
      title: '所属数据源',
      ellipsis: true,
    },
  ];
};

interface IProps {
  task: TaskDetail<IApplyTablePermissionTaskParams>;
}
const TaskContent: React.FC<IProps> = (props) => {
  const { task } = props;
  const parameters = task?.parameters;

  return (
    <>
      <Descriptions column={1}>
        <Descriptions.Item label="任务编号">{task?.id}</Descriptions.Item>
        <Descriptions.Item label="任务类型">申请表权限</Descriptions.Item>
      </Descriptions>
      <Divider
        style={{
          marginTop: 4,
        }}
      />
      <Descriptions column={1}>
        <Descriptions.Item label="项目">{parameters?.project?.name}</Descriptions.Item>
      </Descriptions>
      <SimpleTextItem
        label="表"
        content={
          <DisplayTable
            rowKey="tableId"
            columns={getConnectionColumns()}
            dataSource={parameters?.tables}
            scroll={null}
            showQuickJumper={false}
            showSizeChanger={false}
            pageSize={10}
          />
        }
        direction="column"
      />

      <Divider
        style={{
          marginTop: 4,
        }}
      />

      <Descriptions column={1}>
        <Descriptions.Item label="权限类型">
          {parameters?.types?.map((key) => permissionOptionsMap[key].text)?.join(', ')}
        </Descriptions.Item>
        <Descriptions.Item label="权限有效期">
          {getExpireTimeLabel(parameters?.expireTime)}
        </Descriptions.Item>
        <Descriptions.Item label="申请原因">{parameters?.applyReason}</Descriptions.Item>
      </Descriptions>
      <Divider
        style={{
          marginTop: 4,
        }}
      />
      <Descriptions column={1}>
        <Descriptions.Item label="创建人">{task?.creator?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {getFormatDateTime(task?.createTime)}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};
export default TaskContent;
