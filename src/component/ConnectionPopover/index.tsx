import { ConnectTypeText } from '@/constant/label';
import { IConnection } from '@/d.ts';
import { ClusterStore } from '@/store/cluster';
import { haveOCP } from '@/util/env';
import { formatMessage } from '@/util/intl';
import Icon from '@ant-design/icons';
import { Space, Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';
import React from 'react';

import OBSvg from '@/svgr/source_ob.svg';

const ConnectionPopover: React.FC<{
  connection: Partial<IConnection>;
  showResourceGroups?: boolean;
  showType?: boolean;
  clusterStore?: ClusterStore;
}> = (props) => {
  const { connection, clusterStore, showResourceGroups = false, showType = true } = props;

  let clusterAndTenant = (
    <div>
      {
        formatMessage({
          id: 'odc.components.Header.ConnectionPopover.ClusterTenant',
        })

        /*集群/租户：*/
      }
      {connection?.clusterName || '- '}/{connection?.tenantName || ' -'}
    </div>
  );

  if (haveOCP()) {
    const isTenantInstance = !!clusterStore.tenantListMap?.[connection?.tenantName];
    if (isTenantInstance) {
      clusterAndTenant = (
        <div>
          {
            formatMessage({
              id: 'odc.component.ConnectionPopover.InstanceId',
            })

            /*实例 ID:*/
          }

          {connection?.tenantName}
        </div>
      );
    } else {
      clusterAndTenant = (
        <div>
          {
            formatMessage({
              id: 'odc.component.ConnectionPopover.InstanceIdTenantId',
            })

            /*实例ID/租户ID:*/
          }
          {connection?.clusterName}/{connection.tenantName}
        </div>
      );
    }
  }
  function renderConnectionMode() {
    const { type } = connection;
    return (
      <div>
        {
          formatMessage(
            {
              id: 'odc.component.ConnectionPopover.TypeConnecttypetexttype',
            },

            { ConnectTypeTextType: ConnectTypeText[type] },
          )

          /*类型：{ConnectTypeTextType}*/
        }
      </div>
    );
  }
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      style={{
        lineHeight: '20px',
        padding: 12,
      }}
    >
      <Space direction="vertical">
        <Tooltip title={connection.name}>
          <div
            style={{
              marginBottom: 4,
              fontFamily: 'PingFangSC-Semibold',
              color: 'var(--text-color-primary)',
              fontWeight: 'bold',
              maxWidth: '240px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon component={OBSvg} style={{ fontSize: 22, marginRight: 4 }} /> {connection.name}
            </div>
          </div>
        </Tooltip>
        {renderConnectionMode()}
        {haveOCP() ? null : (
          <div>
            {
              formatMessage({
                id: 'odc.components.Header.ConnectionPopover.HostnamePort',
              })

              /*主机名/端口：*/
            }
            {connection.host}:{connection.port}
          </div>
        )}
        {clusterAndTenant}
        <div>
          {
            formatMessage(
              {
                id: 'odc.components.Header.ConnectionPopover.DatabaseUsernameConnectiondbuser',
              },

              { connectionDbUser: connection.username ?? '-' },
            )

            /*数据库用户名：{connectionDbUser}*/
          }
        </div>
      </Space>
    </div>
  );
};

export default inject('clusterStore')(observer(ConnectionPopover));
