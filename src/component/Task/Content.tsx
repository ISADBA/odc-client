import type { ITableInstance, ITableLoadOptions } from '@/component/CommonTable/interface';
import type {
  IAlterScheduleTaskParams,
  IConnectionPartitionPlan,
  TaskRecordParameters,
  TaskStatus,
} from '@/d.ts';
import { IConnectionType, ICycleTaskRecord, TaskPageType, TaskRecord, TaskType } from '@/d.ts';
import type { UserStore } from '@/store/login';
import { ModalStore } from '@/store/modal';
import type { TaskStore } from '@/store/task';
import { getPreTime } from '@/util/utils';
import { inject, observer } from 'mobx-react';
import type { Moment } from 'moment';
import React from 'react';
import AlterDDLTaskCreateModal from './AlterDdlTask';
import AsyncTaskCreateModal from './AsyncTask';
import TaskTable from './component/TaskTable';
import DataArchiveTaskCreateModal from './DataArchiveTask';
import DataClearTaskCreateModal from './DataClearTask';
import DataMockerTaskCreateModal from './DataMockerTask';
import DetailModal from './DetailModal';
import ExportTaskCreateModal from './ExportTask';
import { isCycleTaskPage } from './helper';
import ImportTaskCreateModal from './ImportTask';
import PartitionTaskCreateModal from './PartitionTask';
import ShadowSyncTaskCreateModal from './ShadowSyncTask';
import SQLPlanTaskCreateModal from './SQLPlanTask';

import styles from './index.less';

interface IProps {
  taskStore?: TaskStore;
  userStore?: UserStore;
  modalStore?: ModalStore;
  tabHeight?: number;
  projectId?: number;
}

interface IState {
  detailId: number;
  detailType: TaskType;
  detailVisible: boolean;
  partitionPlan: IConnectionPartitionPlan;
  status: TaskStatus;
}

@inject('userStore', 'taskStore', 'modalStore')
@observer
class TaskManaerContent extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      detailId: props.taskStore?.defaultOpenTaskId,
      detailType: props.taskStore?.defauleOpenTaskType,
      detailVisible: !!props.taskStore?.defaultOpenTaskId,
      partitionPlan: null,
      status: null,
    };
  }

  private tableRef = React.createRef<ITableInstance>();

  public loadList = async (args: ITableLoadOptions, executeDate: [Moment, Moment]) => {
    const { taskPageType } = this.props.taskStore;
    if (isCycleTaskPage(taskPageType)) {
      await this.loadCycleTaskList(args, executeDate);
    } else {
      await this.loadTaskList(args, executeDate);
    }
  };

  public loadTaskList = async (args: ITableLoadOptions, executeDate: [Moment, Moment]) => {
    const { projectId, taskStore } = this.props;
    const { taskPageType } = taskStore;
    const { filters, sorter, pagination, pageSize } = args ?? {};
    const { status, executeTime, candidateApprovers, creator, connection, id } = filters ?? {};
    const { column, order } = sorter ?? {};
    const { current = 1 } = pagination ?? {};
    const connectionId = connection?.filter(
      (key) => ![IConnectionType.PRIVATE, IConnectionType.ORGANIZATION].includes(key),
    );
    const isAllScope = ![
      TaskPageType.CREATED_BY_CURRENT_USER,
      TaskPageType.APPROVE_BY_CURRENT_USER,
    ].includes(taskPageType);

    if (!pageSize) {
      return;
    }
    const params = {
      fuzzySearchKeyword: id ? id : undefined,
      taskType: isAllScope ? taskPageType : undefined,
      projectId,
      status,
      startTime: executeDate?.[0]?.valueOf() ?? getPreTime(7),
      endTime: executeDate?.[1]?.valueOf() ?? getPreTime(0),
      connectionId,
      candidateApprovers,
      creator,
      sort: column?.dataIndex,
      page: current,
      size: pageSize,
      createdByCurrentUser: isAllScope
        ? true
        : taskPageType === TaskPageType.CREATED_BY_CURRENT_USER,
      approveByCurrentUser: isAllScope
        ? true
        : taskPageType === TaskPageType.APPROVE_BY_CURRENT_USER,
    };

    if (executeTime !== 'custom' && typeof executeTime === 'number') {
      params.startTime = getPreTime(executeTime);
      params.endTime = getPreTime(0);
    }
    // sorter
    params.sort = column ? `${column.dataIndex},${order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    await this.props.taskStore.getTaskList(params);
  };

  public loadCycleTaskList = async (args: ITableLoadOptions, executeDate: [Moment, Moment]) => {
    const { projectId, taskStore } = this.props;
    const { taskPageType } = taskStore;
    const { filters, sorter, pagination, pageSize } = args ?? {};
    const { status, executeTime, candidateApprovers, creator, id } = filters ?? {};
    const { column, order } = sorter ?? {};
    const { current = 1 } = pagination ?? {};
    const isAllScope = ![
      TaskPageType.CREATED_BY_CURRENT_USER,
      TaskPageType.APPROVE_BY_CURRENT_USER,
    ].includes(taskPageType);

    if (!pageSize) {
      return;
    }
    const params = {
      id: id ? id : undefined,
      type: isAllScope ? taskPageType : undefined,
      projectId,
      status,
      candidateApprovers,
      creator,
      startTime: executeDate?.[0]?.valueOf() ?? getPreTime(7),
      endTime: executeDate?.[1]?.valueOf() ?? getPreTime(0),
      createdByCurrentUser: taskPageType === TaskPageType.CREATED_BY_CURRENT_USER,
      approveByCurrentUser: taskPageType === TaskPageType.APPROVE_BY_CURRENT_USER,
      sort: column?.dataIndex,
      page: current,
      size: pageSize,
    };

    if (executeTime !== 'custom' && typeof executeTime === 'number') {
      params.startTime = getPreTime(executeTime);
      params.endTime = getPreTime(0);
    }
    // sorter
    params.sort = column ? `${column.dataIndex},${order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    await this.props.taskStore.getCycleTaskList(params);
  };

  private handlePartitionPlanChange = (value: IConnectionPartitionPlan) => {
    this.setState({
      partitionPlan: value,
    });
  };

  private reloadList = () => {
    this.tableRef.current.reload();
  };

  private handleDetailVisible = (
    task: TaskRecord<TaskRecordParameters> | ICycleTaskRecord<any>,
    visible: boolean = false,
  ) => {
    const { id, type } = task ?? {};
    const detailId =
      type === TaskType.ALTER_SCHEDULE
        ? (task as TaskRecord<IAlterScheduleTaskParams>)?.parameters?.taskId
        : id;
    this.setState({
      detailId,
      detailType:
        (task as TaskRecord<TaskRecordParameters>)?.type ||
        (task as ICycleTaskRecord<any>)?.type ||
        TaskType.ASYNC,
      detailVisible: visible,
    });
  };

  private handleMenuClick = (type: TaskPageType) => {
    const { modalStore } = this.props;
    switch (type) {
      case TaskPageType.IMPORT:
        modalStore.changeImportModal(true);
        break;
      case TaskPageType.EXPORT:
        modalStore.changeExportModal();
        break;
      case TaskPageType.DATAMOCK:
        modalStore.changeDataMockerModal(true);
        break;
      case TaskPageType.ASYNC:
        modalStore.changeCreateAsyncTaskModal(true);
        break;
      case TaskPageType.PARTITION_PLAN:
        modalStore.changePartitionModal(true);
        break;
      case TaskPageType.SQL_PLAN:
        modalStore.changeCreateSQLPlanTaskModal(true);
        break;
      case TaskPageType.SHADOW:
        modalStore.changeShadowSyncVisible(true);
        break;
      case TaskPageType.DATA_ARCHIVE:
        modalStore.changeDataArchiveModal(true);
        break;
      case TaskPageType.DATA_DELETE:
        modalStore.changeDataClearModal(true);
        break;
      case TaskPageType.ONLINE_SCHEMA_CHANGE:
        modalStore.changeCreateDDLAlterTaskModal(true);
        break;
      default:
    }
  };

  private hasCreate = (key: string) => {
    const taskTypes = Object.values(TaskType);
    // return taskTypes.includes(key as TaskType);
  };

  render() {
    const { projectId } = this.props;
    const { detailId, detailType, detailVisible, partitionPlan } = this.state;
    return (
      <>
        <div className={styles.content}>
          <TaskTable
            tableRef={this.tableRef}
            getTaskList={this.loadList}
            onDetailVisible={this.handleDetailVisible}
            onReloadList={this.reloadList}
            onMenuClick={this.handleMenuClick}
          />
        </div>
        <DetailModal
          type={detailType}
          detailId={detailId}
          visible={detailVisible}
          partitionPlan={partitionPlan}
          onPartitionPlanChange={this.handlePartitionPlanChange}
          onDetailVisible={this.handleDetailVisible}
          onReloadList={this.reloadList}
        />
        <AsyncTaskCreateModal projectId={projectId} />
        <DataMockerTaskCreateModal projectId={projectId} />
        <ExportTaskCreateModal projectId={projectId} />
        <ImportTaskCreateModal projectId={projectId} />
        <PartitionTaskCreateModal projectId={projectId} />
        <SQLPlanTaskCreateModal projectId={projectId} />
        <ShadowSyncTaskCreateModal projectId={projectId} />
        <DataArchiveTaskCreateModal projectId={projectId} />
        <DataClearTaskCreateModal projectId={projectId} />
        <AlterDDLTaskCreateModal projectId={projectId} />
      </>
    );
  }
}

export default TaskManaerContent;
