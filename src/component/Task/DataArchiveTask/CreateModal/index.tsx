import { getTableListByDatabaseName } from '@/common/network/table';
import { createTask, getCycleTaskDetail } from '@/common/network/task';
import Crontab from '@/component/Crontab';
import { CrontabDateType, CrontabMode, ICrontab } from '@/component/Crontab/interface';
import DescriptionInput from '@/component/Task/component/DescriptionInput';
import {
  CreateTaskRecord,
  ICycleTaskTriggerConfig,
  IDataArchiveJobParameters,
  ITable,
  TaskExecStrategy,
  TaskOperationType,
  TaskPageScope,
  TaskPageType,
  TaskType,
} from '@/d.ts';
import { openTasksPage } from '@/store/helper/page';
import type { ModalStore } from '@/store/modal';
import { useDBSession } from '@/store/sessionManager/hooks';
import { isClient } from '@/util/env';
import { formatMessage } from '@/util/intl';
import { FieldTimeOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Drawer, Form, Modal, Radio, Space } from 'antd';
import { inject, observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import DatabaseSelect from '../../component/DatabaseSelect';
import ArchiveRange from './ArchiveRange';
import styles from './index.less';
import VariableConfig from './VariableConfig';

export enum IArchiveRange {
  PORTION = 'portion',
  ALL = 'all',
}

export const variable = {
  name: '',
  format: '',
  pattern: [null],
};

const defaultValue = {
  triggerStrategy: TaskExecStrategy.START_NOW,
  archiveRange: IArchiveRange.PORTION,
  variables: [variable],
  tables: [null],
};

interface IProps {
  modalStore?: ModalStore;
  projectId?: number;
}

const getVariables = (
  value: {
    name: string;
    format: string;
    pattern: {
      operator: string;
      step: number;
      unit: string;
    }[];
  }[],
) => {
  return value?.map(({ name, format, pattern }) => {
    let _pattern = null;
    try {
      _pattern = pattern
        ?.map((item) => {
          return `${item.operator}${item.step}${item.unit}`;
        })
        ?.join(' ');
    } catch (error) {}
    return {
      name,
      pattern: `${format}|${_pattern}`,
    };
  });
};

const CreateModal: React.FC<IProps> = (props) => {
  const { modalStore, projectId } = props;
  const [formData, setFormData] = useState(null);
  const [hasEdit, setHasEdit] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [crontab, setCrontab] = useState<ICrontab>(null);
  const [tables, setTables] = useState<ITable[]>();
  const [form] = Form.useForm();
  const databaseId = Form.useWatch('databaseId', form);
  const { session, database } = useDBSession(databaseId);
  const databaseName = database?.name;

  const loadTables = async () => {
    const tables = await getTableListByDatabaseName(session?.sessionId, databaseName);
    setTables(tables);
  };

  const crontabRef = useRef<{
    setValue: (value: ICrontab) => void;
    resetFields: () => void;
  }>();

  const { dataArchiveVisible, SQLPlanEditId } = modalStore;
  const isEdit = !!SQLPlanEditId;
  const loadEditData = async (editId: number) => {
    const data = await getCycleTaskDetail<IDataArchiveJobParameters>(editId);
    const {
      jobParameters,
      triggerConfig: { triggerStrategy, cronExpression, hours, days },
      ...rest
    } = data;
    const formData = {
      ...rest,
      ...jobParameters,
    };
    setFormData(formData);
    form.setFieldsValue(formData);
    crontabRef.current.setValue({
      mode: triggerStrategy === TaskExecStrategy.CRON ? CrontabMode.custom : CrontabMode.default,
      dateType: triggerStrategy as any,
      cronString: cronExpression,
      hour: hours,
      dayOfMonth: days,
      dayOfWeek: days,
    });
  };

  useEffect(() => {
    if (SQLPlanEditId) {
      loadEditData(SQLPlanEditId);
    }
  }, [SQLPlanEditId]);

  const setFormStatus = (fieldName: string, errorMessage: string) => {
    form.setFields([
      {
        name: [fieldName],
        errors: errorMessage ? [errorMessage] : [],
      },
    ]);
  };

  const handleCancel = (hasEdit: boolean) => {
    if (hasEdit) {
      Modal.confirm({
        title: formatMessage({ id: 'odc.DataArchiveTask.CreateModal.AreYouSureYouWant' }), //确认取消此 数据归档吗？
        centered: true,
        onOk: () => {
          props.modalStore.changeDataArchiveModal(false);
        },
      });
    } else {
      props.modalStore.changeDataArchiveModal(false);
    }
  };

  const handleCrontabChange = (crontab) => {
    setCrontab(crontab);
  };

  const handleCreate = async (data: Partial<CreateTaskRecord>) => {
    const res = await createTask(data);
    handleCancel(false);
    setConfirmLoading(false);
    if (res) {
      openTasksPage(TaskPageType.DATA_ARCHIVE, TaskPageScope.CREATED_BY_CURRENT_USER);
    }
  };

  const handleEditAndConfirm = async (data: Partial<CreateTaskRecord>) => {
    Modal.confirm({
      title: formatMessage({ id: 'odc.DataArchiveTask.CreateModal.AreYouSureYouWant.1' }), //确认要修改此 数据归档吗？
      content: (
        <>
          <div>
            {
              formatMessage({
                id: 'odc.DataArchiveTask.CreateModal.EditDataArchive',
              }) /*编辑数据归档*/
            }
          </div>
          <div>
            {
              formatMessage({
                id: 'odc.DataArchiveTask.CreateModal.TheTaskNeedsToBe',
              }) /*任务需要重新审批，审批通过后此任务将重新执行*/
            }
          </div>
        </>
      ),

      cancelText: formatMessage({ id: 'odc.DataArchiveTask.CreateModal.Cancel' }), //取消
      okText: formatMessage({ id: 'odc.DataArchiveTask.CreateModal.Ok' }), //确定
      centered: true,
      onOk: () => {
        handleCreate(data);
      },
      onCancel: () => {
        setConfirmLoading(false);
      },
    });
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        const {
          startAt,
          databaseId,
          targetDatabase,
          variables,
          tables: _tables,
          deleteAfterMigration,
          triggerStrategy,
          archiveRange,
          description,
        } = values;
        const parameters = {
          type: TaskType.MIGRATION,
          operationType: isEdit ? TaskOperationType.UPDATE : TaskOperationType.CREATE,
          taskId: SQLPlanEditId,
          scheduleTaskParameters: {
            sourceDatabaseId: databaseId,
            targetDataBaseId: targetDatabase,
            variables: getVariables(variables),
            tables:
              archiveRange === IArchiveRange.ALL
                ? tables?.map((item) => {
                    return {
                      tableName: item?.tableName,
                      conditionExpression: '',
                    };
                  })
                : _tables,
            deleteAfterMigration,
          },
          triggerConfig: {
            triggerStrategy,
          } as ICycleTaskTriggerConfig,
        };

        if (triggerStrategy === TaskExecStrategy.TIMER) {
          const { mode, dateType, cronString, hour, dayOfMonth, dayOfWeek } = crontab;
          parameters.triggerConfig = {
            triggerStrategy: (mode === 'custom' ? 'CRON' : dateType) as TaskExecStrategy,
            days: dateType === CrontabDateType.weekly ? dayOfWeek : dayOfMonth,
            hours: hour,
            cronExpression: cronString,
          };
        } else if (triggerStrategy === TaskExecStrategy.START_AT) {
          parameters.triggerConfig = {
            triggerStrategy: TaskExecStrategy.START_AT,
            startAt: startAt?.valueOf(),
          };
        }
        const data = {
          databaseId,
          taskType: TaskType.ALTER_SCHEDULE,
          parameters,
          description,
        };

        setConfirmLoading(true);
        if (!isEdit) {
          delete parameters.taskId;
        }
        if (isEdit) {
          handleEditAndConfirm(data);
        } else {
          handleCreate(data);
        }
      })
      .catch((errorInfo) => {
        console.error(JSON.stringify(errorInfo));
      });
  };

  const handleFieldsChange = () => {
    setHasEdit(true);
  };

  const handleReset = () => {
    setFormData(null);
    form?.resetFields();
    crontabRef.current?.resetFields();
  };

  useEffect(() => {
    if (!dataArchiveVisible) {
      handleReset();
    }
  }, [dataArchiveVisible]);

  useEffect(() => {
    if (database?.id) {
      loadTables();
      form.setFieldValue('tables', [null]);
    }
  }, [database?.id]);

  return (
    <Drawer
      destroyOnClose
      className={styles['data-archive']}
      width={760}
      title={
        isEdit
          ? formatMessage({ id: 'odc.DataArchiveTask.CreateModal.EditDataArchive' }) //编辑数据归档
          : formatMessage({ id: 'odc.DataArchiveTask.CreateModal.CreateADataArchive' }) //新建数据归档
      }
      footer={
        <Space>
          <Button
            onClick={() => {
              handleCancel(hasEdit);
            }}
          >
            {formatMessage({ id: 'odc.DataArchiveTask.CreateModal.Cancel' }) /*取消*/}
          </Button>
          <Button type="primary" loading={confirmLoading} onClick={handleSubmit}>
            {
              isEdit
                ? formatMessage({ id: 'odc.DataArchiveTask.CreateModal.Save' }) //保存
                : formatMessage({ id: 'odc.DataArchiveTask.CreateModal.Create' }) //新建
            }
          </Button>
        </Space>
      }
      visible={dataArchiveVisible}
      onClose={() => {
        handleCancel(hasEdit);
      }}
    >
      <Form
        form={form}
        name="basic"
        layout="vertical"
        requiredMark="optional"
        initialValues={defaultValue}
        onFieldsChange={handleFieldsChange}
      >
        <Space align="start">
          <DatabaseSelect
            label={formatMessage({ id: 'odc.DataArchiveTask.CreateModal.SourceDatabase' })}
            /*源端数据库*/ projectId={projectId}
          />

          <DatabaseSelect
            label={formatMessage({ id: 'odc.DataArchiveTask.CreateModal.TargetDatabase' })}
            /*目标数据库*/ name="targetDatabase"
            projectId={projectId}
          />
        </Space>
        <VariableConfig />
        <ArchiveRange tables={tables} />
        <Form.Item name="deleteAfterMigration" valuePropName="checked">
          <Checkbox>
            <Space>
              {
                formatMessage({
                  id: 'odc.DataArchiveTask.CreateModal.CleanUpArchivedDataFrom',
                }) /*清理源端已归档数据*/
              }

              <span className={styles.desc}>
                {
                  formatMessage({
                    id: 'odc.DataArchiveTask.CreateModal.IfYouCleanUpThe',
                  }) /*若您进行清理，默认立即清理且不做备份；清理任务完成后支持回滚*/
                }
              </span>
            </Space>
          </Checkbox>
        </Form.Item>
        <Form.Item
          label={formatMessage({ id: 'odc.DataArchiveTask.CreateModal.ExecutionMethod' })}
          /*执行方式*/ name="triggerStrategy"
          required
        >
          <Radio.Group>
            <Radio.Button value={TaskExecStrategy.START_NOW}>
              {formatMessage({ id: 'odc.DataArchiveTask.CreateModal.ExecuteNow' }) /*立即执行*/}
            </Radio.Button>
            {!isClient() ? (
              <Radio.Button value={TaskExecStrategy.START_AT}>
                {
                  formatMessage({
                    id: 'odc.DataArchiveTask.CreateModal.ScheduledExecution',
                  }) /*定时执行*/
                }
              </Radio.Button>
            ) : null}
            <Radio.Button value={TaskExecStrategy.TIMER}>
              {
                formatMessage({
                  id: 'odc.DataArchiveTask.CreateModal.PeriodicExecution',
                }) /*周期执行*/
              }
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item shouldUpdate noStyle>
          {({ getFieldValue }) => {
            const triggerStrategy = getFieldValue('triggerStrategy') || [];
            if (triggerStrategy === TaskExecStrategy.START_AT) {
              return (
                <Form.Item
                  name="startAt"
                  label={formatMessage({ id: 'odc.DataArchiveTask.CreateModal.ExecutionTime' })}
                  /*执行时间*/ required
                >
                  <DatePicker showTime suffixIcon={<FieldTimeOutlined />} />
                </Form.Item>
              );
            }
            if (triggerStrategy === TaskExecStrategy.TIMER) {
              return (
                <Form.Item>
                  <Crontab
                    ref={crontabRef}
                    initialValue={crontab}
                    onValueChange={handleCrontabChange}
                  />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>
        <DescriptionInput />
      </Form>
    </Drawer>
  );
};

export default inject('modalStore')(observer(CreateModal));
