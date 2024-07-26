import Image from "next/image";
import { Inter } from "next/font/google";
import { Button, Col, Input, Layout, List, Row, Spin, Checkbox } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {
  InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { useEffect, useState } from "react";
import { aptos, moduleAddress } from "@/lib/aptos/config";
import { Task, TodoListRessource } from "@/lib/types";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  const fetchList = async () => {
    if (!account) return [];

    try {
      const todoListResource = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::todolist::TodoList`,
      });
      console.log("todoListResource : ", todoListResource);

      const tabHandle = (todoListResource as TodoListRessource).tasks.handle;
      const taskCounter = (todoListResource as TodoListRessource).task_counter;

      let tasks = [];
      let counter = 1;

      while (counter <= taskCounter) {
        const tableItem = {
          key_type: "u64",
          value_type: `${moduleAddress}::todolist::Task`,
          key: `${counter}`,
        };

        const task = await aptos.getTableItem<Task>({
          handle: tabHandle,
          data: tableItem,
        });

        tasks.push(task);
        counter++;
      }

      console.log("tasks : ", tasks);

      setTasks(tasks);

      setAccountHasList(true);
    } catch (e: any) {
      // console.log("error : ", e);
      setAccountHasList(false);
    }
  };

  const addNewList = async () => {
    if (!account) return [];
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_list`,
        functionArguments: [],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);

      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      setAccountHasList(true);
    } catch (error) {
      console.error("Error while creating new list : ", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onWriteTaskChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewTask(value);
  };

  const handleAddNewTask = async () => {
    if (!account) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_task`,
        functionArguments: [newTask],
      },
    };

    // hold the latest task.task_id from our local state
    const latestId =
      tasks.length > 0 ? parseInt(tasks[tasks.length - 1].task_id) + 1 : 1;

    // build a newTaskToPush object into our local state
    const newTaskToPush = {
      address: account.address,
      completed: false,
      content: newTask,
      task_id: latestId + "",
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });

      // Create a new array based on current state:
      let newTasks = [...tasks];

      // Add item to the tasks array
      newTasks.push(newTaskToPush);
      // Set state
      setTasks(newTasks);
      // clear input text
      setNewTask("");
    } catch (error: any) {
      console.error("error while adding new task", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const completeTask = async (event: CheckboxChangeEvent, taskId: string) => {
    if (!account) return;
    if (!event.target.checked) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::complete_task`,
        functionArguments: [taskId],
      },
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setTasks((prevState) => {
        const newState = prevState.map((obj) => {
          // if task_id equals the checked taskId, update completed property
          if (obj.task_id === taskId) {
            return { ...obj, completed: true };
          }

          // otherwise return object as is
          return obj;
        });

        return newState;
      });
    } catch (error: any) {
      console.log("error", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  useEffect(() => {
    console.log("account : ", account);
    fetchList();
  }, [account?.address]);

  return (
    <>
      <Layout className="h-screen">
        <Row align="middle" className="bg-white py-3">
          <Col span={10} offset={2}>
            <h1 className="text-2xl font-medium text-gray-600 ">
              Buoya Todo List
            </h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
        <Spin spinning={transactionInProgress}>
          {!accountHasList ? (
            <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
              <Col span={8} offset={8}>
                <Button
                  disabled={!account}
                  block
                  onClick={addNewList}
                  type="primary"
                  style={{ height: "40px", backgroundColor: "#3f67ff" }}
                >
                  Add new list
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
              <Col span={8} offset={8}>
                <Input.Group compact>
                  <Input
                    onChange={(event) => onWriteTaskChange(event)}
                    style={{ width: "calc(100% - 60px)" }}
                    placeholder="Add a Task"
                    size="large"
                  />
                  <Button
                    onClick={handleAddNewTask}
                    type="primary"
                    style={{ height: "40px", backgroundColor: "#3f67ff" }}
                  >
                    Add
                  </Button>
                </Input.Group>
              </Col>
              <Col span={8} offset={8}>
                {tasks && (
                  <List
                    size="small"
                    bordered
                    dataSource={tasks}
                    renderItem={(task: Task) => (
                      <List.Item
                        actions={[
                          <div key={task.task_id}>
                            {task.completed ? (
                              <Checkbox defaultChecked={true} disabled />
                            ) : (
                              <Checkbox
                                onChange={(event) =>
                                  completeTask(event, task.task_id)
                                }
                              />
                            )}
                          </div>,
                        ]}
                      >
                        <List.Item.Meta
                          title={task.content}
                          description={
                            <Link
                              href={`https://explorer.aptoslabs.com/account/${task.address}?network=devnet`}
                              target="_blank"
                            >{`${task.address.slice(
                              0,
                              6
                            )}...${task.address.slice(-5)}`}</Link>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Col>
            </Row>
          )}
        </Spin>
      </Layout>
    </>
  );
}
