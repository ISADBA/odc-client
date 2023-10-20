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

import { formatMessage } from '@/util/intl';
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  Input,
  message,
  Modal,
  Popover,
  Space,
  Spin,
  Tree,
  TreeDataNode,
} from 'antd';
import ResourceLayout from '../../Layout';

import { batchTest, deleteConnection } from '@/common/network/connection';
import { useUnmountedRef, useUpdate } from 'ahooks';
import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

import Action from '@/component/Action';
import ConnectionPopover from '@/component/ConnectionPopover';
import { IDatasource } from '@/d.ts/datasource';
import NewDatasourceDrawer from '@/page/Datasource/Datasource/NewDatasourceDrawer';
import ResourceTreeContext from '@/page/Workspace/context/ResourceTreeContext';
import login from '@/store/login';
import { toInteger, toNumber } from 'lodash';
import { ConnectType, IConnectionStatus } from '@/d.ts';
import { PlusOutlined } from '@ant-design/icons';
import StatusIcon from './StatusIcon';
import classNames from 'classnames';
import NewDatasourceButton from '@/page/Datasource/Datasource/NewDatasourceDrawer/NewButton';

interface IProps {
  filters: {
    envs: number[];
    connectTypes: ConnectType[];
  };
}

export default forwardRef(function DatasourceTree({ filters }: IProps, ref) {
  const [editDatasourceId, setEditDatasourceId] = useState(null);
  const [addDSVisiable, setAddDSVisiable] = useState(false);
  const [loopCount, setLoopCount] = useState<number>(0);
  const [searchKey, setSearchKey] = useState('');
  const loopStatusRef = useRef<any>(null);
  const update = useUpdate();
  const unmountRef = useUnmountedRef();

  const context = useContext(ResourceTreeContext);
  let { datasourceList } = context;

  datasourceList = datasourceList?.filter((item) => !item.temp);

  const selectKeys = [context.selectDatasourceId].filter(Boolean);
  function setSelectKeys(keys) {
    return context.setSelectDatasourceId(keys?.[0]);
  }

  async function loopStatus(count: number = loopCount) {
    if (loopStatusRef?.current) {
      console.log('clear');
      clearTimeout(loopStatusRef?.current);
      loopStatusRef.current = null;
    }
    loopStatusRef.current = setTimeout(async () => {
      if (unmountRef.current) {
        console.log('unmount');
        return;
      }
      const ids = datasourceList
        ?.map((item) => (item.status?.status === IConnectionStatus.TESTING ? item.id : null))
        .filter(Boolean);
      if (!ids?.length) {
        console.log('not found');
        return;
      }
      const map = await batchTest(ids);
      if (unmountRef.current) {
        return;
      }
      datasourceList?.forEach((item) => {
        const status = map[item.id];
        if (status) {
          item.status = status;
        }
      });
      setLoopCount(count + 1);
      update();
      loopStatus(count + 1);
    }, 2000);
  }

  useEffect(() => {
    /**
     * 获取数据源状态
     */
    if (datasourceList?.length && login.isPrivateSpace()) {
      loopStatus();
    }
  }, [datasourceList]);

  useImperativeHandle(
    ref,
    () => {
      return {
        async reload() {
          await context?.reloadDatasourceList();
        },
      };
    },
    [context],
  );

  const datasource: TreeDataNode[] = useMemo(() => {
    return datasourceList
      ?.map((item) => {
        if (searchKey && !item.name?.toLowerCase()?.includes(searchKey?.toLowerCase())) {
          return null;
        }
        if (filters?.envs?.length && !filters?.envs.includes(item.environmentId)) {
          /**
           * env filter
           */
          return null;
        }
        if (filters?.connectTypes?.length && !filters?.connectTypes.includes(item.type)) {
          /**
           * connectType filter
           */
          return null;
        }
        return {
          title: item.name,
          selectable: login.isPrivateSpace()
            ? item.status?.status === IConnectionStatus.ACTIVE
            : true,
          key: item.id,
          icon: <StatusIcon item={item} />,
        };
      })
      .filter(Boolean);
  }, [datasourceList, searchKey, loopCount, filters?.envs, filters?.connectTypes]);

  const datasourceMap = useMemo(() => {
    const map = new Map<number, IDatasource>();
    datasourceList?.forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [datasourceList]);

  function deleteDataSource(name: string, key: string) {
    Modal.confirm({
      title: formatMessage(
        {
          id: 'odc.ResourceTree.Datasource.AreYouSureYouWant',
        },
        { name: name },
      ), //`确认删除数据源 ${name}?`
      async onOk() {
        const isSuccess = await deleteConnection(key as any);
        if (isSuccess) {
          message.success(
            formatMessage({
              id: 'odc.ResourceTree.Datasource.DeletedSuccessfully',
            }), //删除成功
          );
          if (selectKeys.includes(toInteger(key))) {
            setSelectKeys([]);
          }
          context?.reloadDatasourceList();
        }
      },
    });
  }
  return (
    <ResourceLayout
      top={
        <div className={styles.container}>
          <div className={styles.search}>
            <Input.Search
              onSearch={(v) => {
                setSearchKey(v);
              }}
              allowClear
              placeholder={formatMessage({
                id: 'odc.ResourceTree.Datasource.SearchForDataSources',
              })} /*搜索数据源*/
              style={{ width: '100%', flexGrow: 1, flexShrink: 1 }}
              size="small"
            />
            {login.isPrivateSpace() ? (
              <NewDatasourceButton onSuccess={() => context?.reloadDatasourceList()}>
                <Button
                  size="small"
                  type="primary"
                  style={{
                    flexShrink: 0,
                    flexGrow: 0,
                    marginLeft: 4,
                  }}
                  icon={<PlusOutlined />}
                />
              </NewDatasourceButton>
            ) : null}
          </div>
          <div className={styles.list}>
            {datasource?.length ? (
              <Tree
                className={styles.tree}
                titleRender={(node) => {
                  const dataSource = datasourceList?.find((d) => d.id == node.key);
                  return (
                    <>
                      <Popover
                        showArrow={false}
                        overlayClassName={styles.connectionPopover}
                        placement="right"
                        content={
                          <ConnectionPopover connection={datasourceMap.get(toNumber(node.key))} />
                        }
                      >
                        <div
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Dropdown
                            trigger={login.isPrivateSpace() ? ['contextMenu'] : []}
                            menu={{
                              items: [
                                {
                                  label: formatMessage({
                                    id: 'odc.ResourceTree.Datasource.Edit',
                                  }), //编辑
                                  key: 'edit',
                                  onClick: (e) => {
                                    e.domEvent?.stopPropagation();
                                    setEditDatasourceId(node.key);
                                    setAddDSVisiable(true);
                                  },
                                },
                                {
                                  label: formatMessage({
                                    id: 'odc.ResourceTree.Datasource.Delete',
                                  }), //删除
                                  key: 'delete',
                                  onClick: (e) => {
                                    e.domEvent?.stopPropagation();
                                    const name = node.title;
                                    deleteDataSource(name as string, node.key as string);
                                  },
                                },
                              ],
                            }}
                          >
                            <span>{node.title}</span>
                          </Dropdown>
                          <div
                            className={classNames(styles.envTip, {
                              [styles.envTipPersonal]: login.isPrivateSpace(),
                            })}
                          >
                            <Badge color={dataSource?.environmentStyle?.toLowerCase()} />
                          </div>
                          {login.isPrivateSpace() && (
                            <div className={styles.actions}>
                              <Action.Group ellipsisIcon="vertical" size={0}>
                                <Action.Link
                                  onClick={() => {
                                    setEditDatasourceId(node.key);
                                    setAddDSVisiable(true);
                                  }}
                                  key={'edit'}
                                >
                                  {formatMessage({ id: 'odc.ResourceTree.Datasource.Edit' })}
                                </Action.Link>
                                <Action.Link
                                  onClick={() =>
                                    deleteDataSource(node.title as string, node.key as string)
                                  }
                                  key={'delete'}
                                >
                                  {formatMessage({ id: 'odc.ResourceTree.Datasource.Delete' })}
                                </Action.Link>
                              </Action.Group>
                            </div>
                          )}
                        </div>
                      </Popover>
                    </>
                  );
                }}
                selectedKeys={selectKeys}
                onSelect={(keys, info) => {
                  if (!info.selected) {
                    /**
                     * disable unselect
                     */
                    return;
                  }
                  setSelectKeys(keys);
                }}
                showIcon
                selectable
                multiple={false}
                treeData={datasource}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  login.isPrivateSpace() ? (
                    <NewDatasourceButton onSuccess={() => context?.reloadDatasourceList()} />
                  ) : null
                }
              />
            )}
          </div>
          <NewDatasourceDrawer
            isEdit={!!editDatasourceId}
            visible={addDSVisiable}
            id={editDatasourceId}
            close={() => {
              setEditDatasourceId(null);
              setAddDSVisiable(false);
            }}
            onSuccess={() => {
              context?.reloadDatasourceList();
            }}
          />
        </div>
      }
      bottomLoading={false}
      bottom={null}
    />
  );
});
