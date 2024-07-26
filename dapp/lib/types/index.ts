export type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

export type TaskRessource = {
  handle: string;
};

export type TodoListRessource = {
  task_counter: number;
  tasks: TaskRessource;
  set_task_event: any;
};
