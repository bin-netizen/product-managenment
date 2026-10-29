// src/utils/todoList.ts
import type { Todo } from "../types/todo";

export class TodoList {
  private todos: Todo[] = [];

  add(todo: Todo) {
    this.todos.push(todo);
  }

  remove(id: number) {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  markCompleted(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = true;
  }

  getAll() {
    return this.todos;
  }
}
